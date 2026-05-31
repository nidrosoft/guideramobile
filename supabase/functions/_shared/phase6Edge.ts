export type Phase6Action =
  | 'places_autocomplete'
  | 'places_details'
  | 'places_nearby'
  | 'places_search'
  | 'places_photo'
  | 'google_vision'
  | 'google_translate'
  | 'google_tts'
  | 'google_directions'
  | 'ai_vision'
  | 'tts_generate'
  | 'gemini_live_token'
  | 'translation_translate'
  | 'translation_detect'
  | 'safety_destination';

export interface Phase6ActionPolicy {
  namespace: 'phase6_google' | 'phase6_ai' | 'phase6_safety';
  windowSeconds: number;
  maxRequests: number;
  cacheTtlSeconds?: number;
  maxTextChars?: number;
  maxBase64Bytes?: number;
}

interface RpcClient {
  rpc: (
    fn: string,
    args: Record<string, unknown>
  ) => Promise<{ data: unknown; error: { message?: string } | null }>;
}

interface TableClient {
  from: (table: string) => {
    insert: (values: Record<string, unknown>) => Promise<{ error: { message?: string } | null }>;
  };
}

export interface Phase6RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: string;
  blockedKey: string | null;
}

export interface Phase6Metric {
  action: Phase6Action;
  provider: string;
  statusCode?: number;
  durationMs?: number;
  cacheStatus?: 'hit' | 'miss' | 'rate_limited' | 'error' | 'skipped';
  errorMessage?: string | null;
  providerSummary?: Record<string, unknown>;
}

export function deferPhase6Work(work: Promise<unknown>): void {
  const edgeRuntime = (
    globalThis as { EdgeRuntime?: { waitUntil?: (promise: Promise<unknown>) => void } }
  ).EdgeRuntime;
  if (edgeRuntime?.waitUntil) {
    edgeRuntime.waitUntil(work);
    return;
  }
  work.catch((error) => console.warn('[phase6Edge] Deferred work failed:', error));
}

export function normalizePhase6Key(value: string): string {
  return value
    .trim()
    .replace(/\s*:\s*/g, ':')
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .slice(0, 500);
}

export async function recordPhase6Metric(supabase: TableClient, metric: Phase6Metric): Promise<void> {
  const policy = getPhase6ActionPolicy(metric.action);
  const { error } = await supabase.from('edge_request_metrics').insert({
    namespace: `${normalizePhase6Key(policy.namespace)}:${normalizePhase6Key(metric.action)}`,
    phase: normalizePhase6Key(metric.provider),
    cache_status: metric.cacheStatus || null,
    status_code: metric.statusCode || null,
    duration_ms: metric.durationMs || null,
    provider_summary: metric.providerSummary || {},
    error_message: metric.errorMessage || null,
  });

  if (error) {
    console.warn(
      `[phase6Edge] Failed to record metric for ${metric.action}: ${error.message || 'unknown'}`
    );
  }
}

function buildRateBucketKey(namespace: string, bucketKey: string): string {
  return `${normalizePhase6Key(namespace)}:${normalizePhase6Key(bucketKey)}`.slice(0, 500);
}

function estimateBase64DecodedBytes(value: string): number {
  const normalized = String(value || '').replace(/^data:[^,]+,/, '').replace(/\s+/g, '');
  if (!normalized) return 0;
  const padding = normalized.endsWith('==') ? 2 : normalized.endsWith('=') ? 1 : 0;
  return Math.max(0, Math.floor((normalized.length * 3) / 4) - padding);
}

function parseRateLimitResult(data: unknown, fallbackResetAt: string): Phase6RateLimitResult | null {
  const row = Array.isArray(data) ? data[0] : data;
  if (!row || typeof row !== 'object') return null;
  const value = row as Record<string, unknown>;

  return {
    allowed: Boolean(value.allowed),
    remaining: typeof value.remaining === 'number' ? value.remaining : Number(value.remaining || 0),
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
}

export function getPhase6ActionPolicy(action: Phase6Action): Phase6ActionPolicy {
  const policies: Record<Phase6Action, Phase6ActionPolicy> = {
    places_autocomplete: {
      namespace: 'phase6_google',
      windowSeconds: 60,
      maxRequests: 60,
      cacheTtlSeconds: 10 * 60,
      maxTextChars: 120,
    },
    places_details: {
      namespace: 'phase6_google',
      windowSeconds: 60,
      maxRequests: 60,
      cacheTtlSeconds: 24 * 60 * 60,
      maxTextChars: 256,
    },
    places_nearby: {
      namespace: 'phase6_google',
      windowSeconds: 60,
      maxRequests: 40,
      cacheTtlSeconds: 10 * 60,
      maxTextChars: 256,
    },
    places_search: {
      namespace: 'phase6_google',
      windowSeconds: 60,
      maxRequests: 40,
      cacheTtlSeconds: 10 * 60,
      maxTextChars: 256,
    },
    places_photo: {
      namespace: 'phase6_google',
      windowSeconds: 60,
      maxRequests: 120,
      cacheTtlSeconds: 24 * 60 * 60,
      maxTextChars: 512,
    },
    google_vision: {
      namespace: 'phase6_google',
      windowSeconds: 60,
      maxRequests: 20,
      maxBase64Bytes: 4 * 1024 * 1024,
    },
    google_translate: {
      namespace: 'phase6_google',
      windowSeconds: 60,
      maxRequests: 60,
      cacheTtlSeconds: 24 * 60 * 60,
      maxTextChars: 6000,
    },
    google_tts: {
      namespace: 'phase6_google',
      windowSeconds: 60,
      maxRequests: 40,
      cacheTtlSeconds: 24 * 60 * 60,
      maxTextChars: 2000,
    },
    google_directions: {
      namespace: 'phase6_google',
      windowSeconds: 60,
      maxRequests: 60,
      cacheTtlSeconds: 10 * 60,
      maxTextChars: 512,
    },
    ai_vision: {
      namespace: 'phase6_ai',
      windowSeconds: 60,
      maxRequests: 20,
      maxBase64Bytes: 4 * 1024 * 1024,
      maxTextChars: 3000,
    },
    tts_generate: {
      namespace: 'phase6_ai',
      windowSeconds: 60,
      maxRequests: 30,
      cacheTtlSeconds: 24 * 60 * 60,
      maxTextChars: 2000,
    },
    gemini_live_token: {
      namespace: 'phase6_ai',
      windowSeconds: 60 * 60,
      // A live session reconnects on GoAway (~every 10 min) + on transient drops,
      // each needing a single-use token. 120/hr gives comfortable headroom for
      // normal use and dev testing without enabling abuse.
      maxRequests: 120,
    },
    translation_translate: {
      namespace: 'phase6_ai',
      windowSeconds: 60,
      maxRequests: 60,
      cacheTtlSeconds: 24 * 60 * 60,
      maxTextChars: 6000,
    },
    translation_detect: {
      namespace: 'phase6_ai',
      windowSeconds: 60,
      maxRequests: 60,
      cacheTtlSeconds: 24 * 60 * 60,
      maxTextChars: 2000,
    },
    safety_destination: {
      namespace: 'phase6_safety',
      windowSeconds: 60,
      maxRequests: 60,
      cacheTtlSeconds: 6 * 60 * 60,
      maxTextChars: 256,
    },
  };

  return policies[action];
}

export function buildPhase6CacheKey(
  action: Phase6Action,
  params: Record<string, unknown>
): string {
  const parts = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${normalizePhase6Key(key)}=${normalizePhase6Key(String(value))}`);

  return `${normalizePhase6Key(action)}:${parts.join(':')}`.slice(0, 500);
}

function assertTextLimit(action: Phase6Action, value: unknown, maxChars: number): void {
  const text =
    typeof value === 'string'
      ? value
      : Array.isArray(value) && value.every((item) => typeof item === 'string')
        ? value.join('\n')
        : null;
  if (text === null) return;
  if (text.length > maxChars) {
    throw new Error(`text exceeds the ${maxChars} character limit for ${action}`);
  }
}

function assertBase64Limit(action: Phase6Action, fieldName: string, value: unknown, maxBytes: number): void {
  if (typeof value !== 'string') return;
  const decodedBytes = estimateBase64DecodedBytes(value);
  if (decodedBytes > maxBytes) {
    throw new Error(`${fieldName} exceeds the ${maxBytes} byte limit for ${action}`);
  }
}

export function assertPhase6PayloadSize(action: Phase6Action, body: Record<string, unknown>): void {
  const policy = getPhase6ActionPolicy(action);
  if (policy.maxTextChars) {
    assertTextLimit(action, body.text, policy.maxTextChars);
    assertTextLimit(action, body.query, policy.maxTextChars);
    assertTextLimit(action, body.input, policy.maxTextChars);
    assertTextLimit(action, body.message, policy.maxTextChars);
    assertTextLimit(action, body.question, policy.maxTextChars);
    assertTextLimit(action, body.placeId, policy.maxTextChars);
    assertTextLimit(action, body.origin, policy.maxTextChars);
    assertTextLimit(action, body.destination, policy.maxTextChars);
    assertTextLimit(action, body.keyword, policy.maxTextChars);
    assertTextLimit(action, body.photoReference, policy.maxTextChars);
  }

  if (policy.maxBase64Bytes) {
    assertBase64Limit(action, 'image', body.image, policy.maxBase64Bytes);
    assertBase64Limit(action, 'base64Image', body.base64Image, policy.maxBase64Bytes);
  }
}

export async function consumePhase6RateLimit(
  supabase: RpcClient,
  input: { action: Phase6Action; actorKey: string }
): Promise<Phase6RateLimitResult> {
  const policy = getPhase6ActionPolicy(input.action);
  const namespace = normalizePhase6Key(policy.namespace);
  const bucketKey = normalizePhase6Key(`${input.action}:${input.actorKey}`);
  const fallbackResetAt = new Date(Date.now() + policy.windowSeconds * 1000).toISOString();
  const { data, error } = await supabase.rpc('edge_consume_rate_limit', {
    p_namespace: namespace,
    p_bucket_key: bucketKey,
    p_window_seconds: policy.windowSeconds,
    p_max_requests: policy.maxRequests,
  });

  if (error) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: fallbackResetAt,
      blockedKey: buildRateBucketKey(namespace, bucketKey),
    };
  }

  return (
    parseRateLimitResult(data, fallbackResetAt) || {
      allowed: false,
      remaining: 0,
      resetAt: fallbackResetAt,
      blockedKey: buildRateBucketKey(namespace, bucketKey),
    }
  );
}
