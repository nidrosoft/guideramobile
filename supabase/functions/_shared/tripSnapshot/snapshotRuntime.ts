import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2';
import {
  buildSnapshotRateLimitKeys,
  normalizeSnapshotCacheInput,
  SnapshotCacheInput,
} from './snapshotScale.ts';

export interface SnapshotCacheRecord<T> {
  response: T;
  cachedAt: string;
  expiresAt: string;
}

export interface SnapshotRateLimitResult {
  allowed: boolean;
  retryAfterSec?: number;
  blockedKey?: string;
}

export interface SnapshotLockResult {
  acquired: boolean;
  ownerId: string;
}

const SNAPSHOT_RESPONSE_TTL_SECONDS = 3 * 60 * 60;

function getServiceClient(): SupabaseClient | null {
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) return null;
  return createClient(url, key);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function deferSnapshotWork(work: Promise<unknown>): void {
  const edgeRuntime = (globalThis as { EdgeRuntime?: { waitUntil?: (promise: Promise<unknown>) => void } }).EdgeRuntime;
  if (edgeRuntime?.waitUntil) {
    edgeRuntime.waitUntil(work);
    return;
  }
  work.catch((error) => console.warn('Deferred snapshot work failed:', error));
}

function decodeJwtSubject(authHeader: string | null): string | null {
  const token = authHeader?.replace(/^Bearer\s+/i, '').trim();
  if (!token || token.split('.').length < 2) return null;
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = payload.padEnd(Math.ceil(payload.length / 4) * 4, '=');
    const parsed = JSON.parse(atob(padded));
    return typeof parsed.sub === 'string' ? parsed.sub : null;
  } catch {
    return null;
  }
}

export function snapshotRequesterKey(req: Request): string {
  return (
    decodeJwtSubject(req.headers.get('authorization')) ||
    req.headers.get('x-guidera-client-id')?.trim() ||
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'anonymous'
  );
}

export async function getSnapshotResponseCache<T>(cacheKey: string): Promise<SnapshotCacheRecord<T> | null> {
  const supabase = getServiceClient();
  if (!supabase) return null;

  const { data } = await supabase
    .from('snapshot_response_cache')
    .select('response, created_at, expires_at')
    .eq('cache_key', cacheKey)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  if (!data?.response) return null;

  return {
    response: data.response as T,
    cachedAt: data.created_at,
    expiresAt: data.expires_at,
  };
}

export async function setSnapshotResponseCache<T>(
  cacheKey: string,
  input: SnapshotCacheInput,
  response: T,
  providerSummary: Record<string, unknown>,
  buildDurationMs: number,
): Promise<void> {
  const supabase = getServiceClient();
  if (!supabase) return;

  const normalized = normalizeSnapshotCacheInput(input);
  await supabase.from('snapshot_response_cache').upsert(
    {
      cache_key: cacheKey,
      destination: normalized.destination,
      country: normalized.country || null,
      origin: normalized.originAirport || normalized.originCity || null,
      start_date: normalized.startDate,
      end_date: normalized.endDate,
      currency: normalized.currency.toUpperCase(),
      nationality: normalized.nationality || null,
      traveler_count: normalized.adults + normalized.children + normalized.infants,
      response,
      provider_summary: providerSummary,
      build_duration_ms: buildDurationMs,
      expires_at: new Date(Date.now() + SNAPSHOT_RESPONSE_TTL_SECONDS * 1000).toISOString(),
      updated_at: new Date().toISOString(),
      last_accessed_at: new Date().toISOString(),
      access_count: 0,
    },
    { onConflict: 'cache_key' },
  );
}

export async function checkSnapshotRateLimit(
  input: SnapshotCacheInput,
  requesterKey: string,
): Promise<SnapshotRateLimitResult> {
  const supabase = getServiceClient();
  if (!supabase) return { allowed: false, retryAfterSec: 5, blockedKey: 'snapshot:rate-limiter-unavailable' };

  for (const limitKey of buildSnapshotRateLimitKeys({ ...input, userId: requesterKey })) {
    const { data, error } = await supabase.rpc('snapshot_consume_rate_limit', {
      p_bucket_key: limitKey.key,
      p_window_seconds: limitKey.windowSeconds,
      p_max_requests: limitKey.maxRequests,
    });

    if (error) {
      console.error('Snapshot rate limit error:', error.message);
      return { allowed: false, retryAfterSec: 5, blockedKey: limitKey.key };
    }

    if (data?.allowed === false) {
      return {
        allowed: false,
        retryAfterSec: Number(data.retryAfterSec || 5),
        blockedKey: limitKey.key,
      };
    }
  }

  return { allowed: true };
}

export async function tryAcquireSnapshotLock(cacheKey: string, ttlSeconds = 18): Promise<SnapshotLockResult> {
  const supabase = getServiceClient();
  const ownerId = crypto.randomUUID();
  if (!supabase) return { acquired: false, ownerId };

  const { data, error } = await supabase.rpc('snapshot_try_acquire_lock', {
    p_cache_key: cacheKey,
    p_owner_id: ownerId,
    p_ttl_seconds: ttlSeconds,
  });

  if (error) {
    console.error('Snapshot lock error:', error.message);
    return { acquired: false, ownerId };
  }

  return { acquired: data?.acquired === true, ownerId };
}

export async function releaseSnapshotLock(cacheKey: string, ownerId: string, status: 'completed' | 'failed'): Promise<void> {
  const supabase = getServiceClient();
  if (!supabase) return;
  await supabase.rpc('snapshot_release_lock', {
    p_cache_key: cacheKey,
    p_owner_id: ownerId,
    p_status: status,
  });
}

export async function waitForSnapshotResponseCache<T>(
  cacheKey: string,
  timeoutMs = 20000,
  intervalMs = 600,
): Promise<SnapshotCacheRecord<T> | null> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    await sleep(intervalMs);
    const cached = await getSnapshotResponseCache<T>(cacheKey);
    if (cached) return cached;
  }
  return null;
}

export async function recordSnapshotMetric(params: {
  requestId?: string;
  cacheKey?: string;
  phase: 'data' | 'brief' | 'full';
  destination?: string;
  country?: string;
  cacheStatus: string;
  statusCode: number;
  durationMs: number;
  providerSummary?: Record<string, unknown>;
  errorMessage?: string;
}): Promise<void> {
  const supabase = getServiceClient();
  if (!supabase) return;

  await supabase.from('snapshot_request_metrics').insert({
    request_id: params.requestId || null,
    cache_key: params.cacheKey || null,
    phase: params.phase,
    destination: params.destination || null,
    country: params.country || null,
    cache_status: params.cacheStatus,
    status_code: params.statusCode,
    duration_ms: params.durationMs,
    provider_summary: params.providerSummary || {},
    error_message: params.errorMessage || null,
  }).then(({ error }) => {
    if (error) console.warn('Snapshot metric insert failed:', error.message);
  });
}
