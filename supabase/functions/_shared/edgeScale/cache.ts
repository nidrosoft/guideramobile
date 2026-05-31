import { normalizeEdgeScaleKey } from './rateLimit.ts';

interface QueryBuilder<T = unknown> {
  select: (columns: string) => QueryBuilder<T>;
  eq: (column: string, value: unknown) => QueryBuilder<T>;
  gt: (column: string, value: unknown) => QueryBuilder<T>;
  update: (values: Record<string, unknown>) => QueryBuilder<T>;
  upsert: (
    values: Record<string, unknown>,
    options?: Record<string, unknown>
  ) => Promise<{ error: { message?: string } | null }>;
  maybeSingle: () => Promise<{ data: T | null; error: { message?: string } | null }>;
}

interface TableClient {
  from: (table: string) => QueryBuilder;
}

export interface EdgeCacheHit<T> {
  response: T;
  providerSummary: Record<string, unknown>;
}

export function buildEdgeCacheKey(namespace: string, key: string): string {
  return `${normalizeEdgeScaleKey(namespace)}:${normalizeEdgeScaleKey(key)}`.slice(0, 500);
}

export async function getEdgeResponseCache<T>(
  supabase: TableClient,
  namespace: string,
  cacheKey: string
): Promise<EdgeCacheHit<T> | null> {
  const { data, error } = await supabase
    .from('edge_response_cache')
    .select('response, provider_summary')
    .eq('namespace', normalizeEdgeScaleKey(namespace))
    .eq('cache_key', normalizeEdgeScaleKey(cacheKey))
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  if (error || !data || typeof data !== 'object') return null;

  const row = data as Record<string, unknown>;
  try {
    await (supabase as any)
      .from('edge_response_cache')
      .update({ last_accessed_at: new Date().toISOString() })
      .eq('namespace', normalizeEdgeScaleKey(namespace))
      .eq('cache_key', normalizeEdgeScaleKey(cacheKey));
  } catch {
    // Cache access accounting should never block a valid cached response.
  }

  return {
    response: row.response as T,
    providerSummary: (row.provider_summary as Record<string, unknown>) || {},
  };
}

export async function getStaleEdgeCache<T>(
  supabase: TableClient,
  namespace: string,
  cacheKey: string
): Promise<{ response: T; expiresAt: string | null } | null> {
  const { data, error } = await supabase
    .from('edge_response_cache')
    .select('response, expires_at')
    .eq('namespace', normalizeEdgeScaleKey(namespace))
    .eq('cache_key', normalizeEdgeScaleKey(cacheKey))
    .maybeSingle();

  if (error || !data || typeof data !== 'object') return null;

  const row = data as Record<string, unknown>;
  if (row.response === undefined || row.response === null) return null;

  return {
    response: row.response as T,
    expiresAt: typeof row.expires_at === 'string' ? row.expires_at : null,
  };
}

export async function setEdgeResponseCache<T>(
  supabase: TableClient,
  namespace: string,
  cacheKey: string,
  response: T,
  ttlSeconds: number,
  providerSummary: Record<string, unknown> = {}
): Promise<void> {
  const expiresAt = new Date(Date.now() + Math.max(1, ttlSeconds) * 1000).toISOString();
  const { error } = await supabase.from('edge_response_cache').upsert(
    {
      namespace: normalizeEdgeScaleKey(namespace),
      cache_key: normalizeEdgeScaleKey(cacheKey),
      response,
      provider_summary: providerSummary,
      expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'namespace,cache_key' }
  );

  if (error) {
    console.warn(
      `[edgeScale] Failed to set cache ${namespace}:${cacheKey}: ${error.message || 'unknown error'}`
    );
  }
}
