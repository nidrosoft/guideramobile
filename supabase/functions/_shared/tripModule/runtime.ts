export const TRIP_MODULE_NAMESPACE = 'trip_module';
export const TRIP_MODULE_LOCK_TTL_SECONDS = 120;
export const SMART_PLAN_LOCK_TTL_SECONDS = 240;
export const SMART_PLAN_MODULE_KEYS = [
  'itinerary',
  'dos_donts',
  'documents',
  'packing',
  'safety',
  'language',
];

type TripModuleKey = string;
export type SmartPlanStatus = 'ready' | 'generating' | 'failed';

interface SmartPlanModuleResult {
  key: TripModuleKey;
  success: boolean;
  error?: string;
}

interface TripModuleCacheKeyInput {
  moduleKey: TripModuleKey;
  city: string;
  country?: string | null;
  nationality?: string | null;
  startDate?: string | null;
  composition?: string | null;
}

interface TripModuleCachePolicy {
  cacheTier: 'destination_base' | 'context_specific' | 'personal';
  shareable: boolean;
  ttlDays: number;
}

interface TripModuleCacheRowInput extends TripModuleCacheKeyInput {
  tripType?: string | null;
}

interface TripModuleRateLimitInput {
  userId: string;
  tripId: string;
  moduleKey: TripModuleKey;
  isPrivilegedTester?: boolean;
}

interface SupabaseRpcClient {
  rpc: (
    fn: string,
    args: Record<string, unknown>
  ) => Promise<{ data: unknown; error: { message?: string } | null }>;
}

interface SupabaseTableClient {
  from: (table: string) => any;
}

interface TripModuleLockResult {
  acquired: boolean;
  ownerId: string;
}

export function normalizeTripModuleKey(value: string): string {
  return value.trim().replace(/\s+/g, '_').toLowerCase().slice(0, 120);
}

function normalizeCachePart(value: string | null | undefined, fallback = 'unknown'): string {
  const normalized = String(value || fallback)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return (normalized || fallback).slice(0, 80);
}

function destinationSlug(city: string, country?: string | null): string {
  const parts = [city, country].map((part) => normalizeCachePart(part, '')).filter(Boolean);
  return parts.join('-') || 'unknown';
}

function seasonFromDate(dateValue?: string | null): string {
  if (!dateValue) return 'unknown';
  const month = new Date(dateValue).getMonth();
  if (Number.isNaN(month)) return 'unknown';
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  if (month >= 8 && month <= 10) return 'autumn';
  return 'winter';
}

export function getTripModuleCachePolicy(moduleKey: TripModuleKey): TripModuleCachePolicy {
  const key = normalizeTripModuleKey(moduleKey);
  if (key === 'language') {
    return { cacheTier: 'destination_base', shareable: true, ttlDays: 90 };
  }
  if (['dos_donts', 'documents', 'safety'].includes(key)) {
    return { cacheTier: 'context_specific', shareable: true, ttlDays: 30 };
  }
  return { cacheTier: 'personal', shareable: false, ttlDays: 0 };
}

export function buildTripModuleCacheKey(input: TripModuleCacheKeyInput): string {
  const moduleKey = normalizeTripModuleKey(input.moduleKey);
  const policy = getTripModuleCachePolicy(moduleKey);
  const parts = ['v1', TRIP_MODULE_NAMESPACE, moduleKey, destinationSlug(input.city, input.country)];

  if (policy.cacheTier === 'context_specific') {
    parts.push(normalizeCachePart(input.nationality, 'unknown'));
    parts.push(normalizeCachePart(input.composition, 'traveler'));
    parts.push(seasonFromDate(input.startDate));
  }

  return parts.join(':').slice(0, 500);
}

export function buildTripModuleCacheRow<T>(
  input: TripModuleCacheRowInput,
  content: T,
  now = new Date()
) {
  const moduleKey = normalizeTripModuleKey(input.moduleKey);
  const policy = getTripModuleCachePolicy(moduleKey);
  const cacheKey = buildTripModuleCacheKey({ ...input, moduleKey });
  const destinationCode = destinationSlug(input.city, input.country);
  const expiresAt = new Date(now.getTime() + Math.max(1, policy.ttlDays) * 86400000);

  return {
    cache_key: cacheKey,
    module_type: moduleKey,
    cache_tier: policy.cacheTier,
    context_hash: cacheKey,
    content,
    destination_code: destinationCode,
    trip_type: input.tripType || null,
    composition: input.composition || null,
    nationality: input.nationality || null,
    season: seasonFromDate(input.startDate),
    ttl_days: policy.ttlDays,
    expires_at: expiresAt.toISOString(),
    last_accessed_at: now.toISOString(),
    access_count: 1,
  };
}

export async function getTripModuleCachedContent<T>(
  supabase: SupabaseTableClient,
  input: TripModuleCacheKeyInput
): Promise<{ content: T; cacheKey: string; createdAt: string | null } | null> {
  const policy = getTripModuleCachePolicy(input.moduleKey);
  if (!policy.shareable) return null;

  const cacheKey = buildTripModuleCacheKey(input);
  const { data, error } = await supabase
    .from('ai_module_cache')
    .select('content, created_at, access_count')
    .eq('cache_key', cacheKey)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  if (error || !data?.content) return null;

  try {
    await supabase
      .from('ai_module_cache')
      .update({
        last_accessed_at: new Date().toISOString(),
        access_count: Number(data.access_count || 0) + 1,
      })
      .eq('cache_key', cacheKey);
  } catch {
    // Cache accounting should never block a valid hit.
  }

  return {
    content: data.content as T,
    cacheKey,
    createdAt: typeof data.created_at === 'string' ? data.created_at : null,
  };
}

export async function setTripModuleCachedContent<T>(
  supabase: SupabaseTableClient,
  input: TripModuleCacheRowInput,
  content: T
): Promise<void> {
  const policy = getTripModuleCachePolicy(input.moduleKey);
  if (!policy.shareable) return;

  const { error } = await supabase
    .from('ai_module_cache')
    .upsert(buildTripModuleCacheRow(input, content), { onConflict: 'cache_key' });
  if (error) {
    console.warn(
      `[trip-module] Failed to set cache for ${input.moduleKey}: ${error.message || 'unknown'}`
    );
  }
}

export async function recordTripModuleMetric(
  supabase: SupabaseTableClient,
  params: {
    moduleKey: TripModuleKey;
    cacheStatus: 'hit' | 'miss' | 'coalesced' | 'rate_limited' | 'error' | 'skipped';
    statusCode: number;
    durationMs: number;
    model?: string | null;
    tokens?: number | null;
    errorMessage?: string | null;
    providerSummary?: Record<string, unknown>;
  }
): Promise<void> {
  try {
    await supabase.from('edge_request_metrics').insert({
      namespace: TRIP_MODULE_NAMESPACE,
      phase: `module:${normalizeTripModuleKey(params.moduleKey)}`,
      cache_status: params.cacheStatus,
      status_code: params.statusCode,
      duration_ms: params.durationMs,
      provider_summary: {
        ...(params.providerSummary || {}),
        moduleKey: normalizeTripModuleKey(params.moduleKey),
        model: params.model || null,
        tokens: params.tokens || null,
      },
      error_message: params.errorMessage || null,
    });
  } catch (error) {
    console.warn('[trip-module] Failed to record module metric:', error);
  }
}

export function buildTripModuleLockKey(tripId: string, moduleKey: TripModuleKey): string {
  return `${normalizeTripModuleKey(tripId)}:${normalizeTripModuleKey(moduleKey)}`;
}

export function buildTripModuleResourceKey(resourceType: string, resourceId?: string): string {
  const normalizedType = normalizeTripModuleKey(resourceType);
  if (!resourceId) return normalizedType;
  return `${normalizedType}:${normalizeTripModuleKey(resourceId)}`;
}

export function buildSmartPlanLockKey(tripId: string): string {
  return buildTripModuleLockKey(tripId, 'smart_plan');
}

export function shouldSkipReadyModule(
  generationStatus: Record<string, unknown> | null | undefined,
  moduleKey: TripModuleKey,
  forceRefresh = false
): boolean {
  if (forceRefresh) return false;
  return generationStatus?.[normalizeTripModuleKey(moduleKey)] === 'ready';
}

export function isSmartPlanReady(
  generationStatus: Record<string, unknown> | null | undefined
): boolean {
  return generationStatus?.smart_plan === 'ready';
}

export function buildTripModuleFunctionInvokeHeaders(env: {
  serviceRoleKey: string;
  anonKey?: string | null;
}): Record<string, string> {
  const gatewayKey = env.anonKey || env.serviceRoleKey;
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${gatewayKey}`,
    apikey: gatewayKey,
  };
}

export function buildSmartPlanInitialModuleStatus(
  generationStatus: Record<string, unknown> | null | undefined,
  forceRefresh = false,
  moduleKeys: TripModuleKey[] = SMART_PLAN_MODULE_KEYS
): Record<string, 'waiting' | 'ready'> {
  return moduleKeys.reduce<Record<string, 'waiting' | 'ready'>>((status, moduleKey) => {
    const key = normalizeTripModuleKey(moduleKey);
    status[key] = !forceRefresh && generationStatus?.[key] === 'ready' ? 'ready' : 'waiting';
    return status;
  }, {});
}

export function buildTripModuleRateLimitConfigs(input: TripModuleRateLimitInput) {
  const moduleKey = normalizeTripModuleKey(input.moduleKey);
  if (moduleKey === 'smart_plan') {
    if (input.isPrivilegedTester) {
      return [
        {
          namespace: TRIP_MODULE_NAMESPACE,
          bucketKey: `user:${input.userId}`,
          windowSeconds: 3600,
          maxRequests: 100,
        },
        {
          namespace: TRIP_MODULE_NAMESPACE,
          bucketKey: `trip:${input.tripId}`,
          windowSeconds: 600,
          maxRequests: 25,
        },
        {
          namespace: TRIP_MODULE_NAMESPACE,
          bucketKey: `module:${moduleKey}`,
          windowSeconds: 60,
          maxRequests: 120,
        },
        {
          namespace: TRIP_MODULE_NAMESPACE,
          bucketKey: 'global',
          windowSeconds: 60,
          maxRequests: 300,
        },
      ];
    }

    return [
      {
        namespace: TRIP_MODULE_NAMESPACE,
        bucketKey: `user:${input.userId}`,
        windowSeconds: 3600,
        maxRequests: 5,
      },
      {
        namespace: TRIP_MODULE_NAMESPACE,
        bucketKey: `trip:${input.tripId}`,
        windowSeconds: 600,
        maxRequests: 2,
      },
      {
        namespace: TRIP_MODULE_NAMESPACE,
        bucketKey: `module:${moduleKey}`,
        windowSeconds: 60,
        maxRequests: 10,
      },
      {
        namespace: TRIP_MODULE_NAMESPACE,
        bucketKey: 'global',
        windowSeconds: 60,
        maxRequests: 30,
      },
    ];
  }

  return [
    {
      namespace: TRIP_MODULE_NAMESPACE,
      bucketKey: `user:${input.userId}`,
      windowSeconds: 3600,
      maxRequests: 20,
    },
    {
      namespace: TRIP_MODULE_NAMESPACE,
      bucketKey: `trip:${input.tripId}`,
      windowSeconds: 600,
      maxRequests: 6,
    },
    {
      namespace: TRIP_MODULE_NAMESPACE,
      bucketKey: `module:${normalizeTripModuleKey(input.moduleKey)}`,
      windowSeconds: 60,
      maxRequests: 30,
    },
    {
      namespace: TRIP_MODULE_NAMESPACE,
      bucketKey: 'global',
      windowSeconds: 60,
      maxRequests: 120,
    },
  ];
}

export function evaluateSmartPlanCompletion(
  results: SmartPlanModuleResult[],
  moduleKeys: TripModuleKey[] = SMART_PLAN_MODULE_KEYS
) {
  const expectedKeys = moduleKeys.map(normalizeTripModuleKey);
  const normalizedResults = results.map((result) => ({
    ...result,
    key: normalizeTripModuleKey(result.key),
  }));
  const successful = normalizedResults.filter((result) => result.success);
  const failedModules = normalizedResults
    .filter((result) => !result.success)
    .map((result) => result.key);
  const attemptedKeys = new Set(normalizedResults.map((result) => result.key));
  const missingModules = expectedKeys.filter((key) => !attemptedKeys.has(key));
  const modulesReady = successful.length;
  const allReady = modulesReady === expectedKeys.length && failedModules.length === 0;
  const status: SmartPlanStatus = allReady ? 'ready' : 'generating';

  return {
    status,
    modulesReady,
    modulesTotal: expectedKeys.length,
    modulesGenerated: allReady,
    failedModules,
    missingModules,
  };
}

export async function consumeTripModuleRateLimits(
  supabase: SupabaseRpcClient,
  input: TripModuleRateLimitInput
) {
  for (const config of buildTripModuleRateLimitConfigs(input)) {
    const fallbackResetAt = new Date(Date.now() + config.windowSeconds * 1000).toISOString();
    const { data, error } = await supabase.rpc('edge_consume_rate_limit', {
      p_namespace: config.namespace,
      p_bucket_key: config.bucketKey,
      p_window_seconds: config.windowSeconds,
      p_max_requests: config.maxRequests,
    });

    if (error) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: fallbackResetAt,
        blockedKey: `${config.namespace}:${config.bucketKey}`,
      };
    }

    const row = Array.isArray(data) ? data[0] : data;
    const value = row && typeof row === 'object' ? (row as Record<string, unknown>) : {};
    const result = {
      allowed: Boolean(value.allowed),
      remaining: Number(value.remaining || 0),
      resetAt:
        typeof value.reset_at === 'string'
          ? value.reset_at
          : typeof value.resetAt === 'string'
            ? value.resetAt
            : fallbackResetAt,
      blockedKey:
        typeof value.blocked_key === 'string'
          ? value.blocked_key
          : typeof value.blockedKey === 'string'
            ? value.blockedKey
            : null,
    };
    if (!result.allowed) return result;
  }
  return { allowed: true, remaining: 1, resetAt: new Date().toISOString(), blockedKey: null };
}

async function acquireLock(
  supabase: SupabaseRpcClient,
  lockKey: string,
  ttlSeconds: number
): Promise<TripModuleLockResult> {
  const ownerId = crypto.randomUUID();
  const { data, error } = await supabase.rpc('edge_try_acquire_lock', {
    p_namespace: TRIP_MODULE_NAMESPACE,
    p_lock_key: lockKey,
    p_owner_id: ownerId,
    p_ttl_seconds: ttlSeconds,
  });

  if (error) return { acquired: false, ownerId };

  const row = Array.isArray(data) ? data[0] : data;
  const value = row && typeof row === 'object' ? (row as Record<string, unknown>) : {};
  return {
    acquired: Boolean(value.acquired),
    ownerId:
      typeof value.owner_id === 'string'
        ? value.owner_id
        : typeof value.ownerId === 'string'
          ? value.ownerId
          : ownerId,
  };
}

async function releaseLock(
  supabase: SupabaseRpcClient,
  lockKey: string,
  ownerId: string,
  status: 'completed' | 'failed'
): Promise<void> {
  await supabase.rpc('edge_release_lock', {
    p_namespace: TRIP_MODULE_NAMESPACE,
    p_lock_key: lockKey,
    p_owner_id: ownerId,
    p_status: status,
  });
}

export async function acquireSmartPlanLock(supabase: SupabaseRpcClient, tripId: string) {
  return acquireLock(supabase, buildSmartPlanLockKey(tripId), SMART_PLAN_LOCK_TTL_SECONDS);
}

export async function releaseSmartPlanLock(
  supabase: SupabaseRpcClient,
  tripId: string,
  ownerId: string,
  status: 'completed' | 'failed'
) {
  await releaseLock(supabase, buildSmartPlanLockKey(tripId), ownerId, status);
}

export async function acquireTripModuleLock(
  supabase: SupabaseRpcClient,
  tripId: string,
  moduleKey: TripModuleKey
) {
  return acquireLock(
    supabase,
    buildTripModuleLockKey(tripId, moduleKey),
    TRIP_MODULE_LOCK_TTL_SECONDS
  );
}

export async function releaseTripModuleLock(
  supabase: SupabaseRpcClient,
  tripId: string,
  moduleKey: TripModuleKey,
  ownerId: string,
  status: 'completed' | 'failed'
) {
  await releaseLock(supabase, buildTripModuleLockKey(tripId, moduleKey), ownerId, status);
}
