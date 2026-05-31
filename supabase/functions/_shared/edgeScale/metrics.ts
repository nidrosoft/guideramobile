import { normalizeEdgeScaleKey } from './rateLimit.ts';

interface TableClient {
  from: (table: string) => {
    insert: (values: Record<string, unknown>) => Promise<{ error: { message?: string } | null }>;
  };
}

export interface EdgeRequestMetric {
  namespace: string;
  phase?: string;
  cacheStatus?: 'hit' | 'miss' | 'coalesced' | 'rate_limited' | 'error' | 'skipped';
  statusCode?: number;
  durationMs?: number;
  providerSummary?: Record<string, unknown>;
  errorMessage?: string | null;
}

export function deferEdgeWork(work: Promise<unknown>): void {
  const edgeRuntime = (
    globalThis as { EdgeRuntime?: { waitUntil?: (promise: Promise<unknown>) => void } }
  ).EdgeRuntime;
  if (edgeRuntime?.waitUntil) {
    edgeRuntime.waitUntil(work);
    return;
  }
  work.catch((error) => console.warn('[edgeScale] Deferred work failed:', error));
}

export async function recordEdgeMetric(
  supabase: TableClient,
  metric: EdgeRequestMetric
): Promise<void> {
  const { error } = await supabase.from('edge_request_metrics').insert({
    namespace: normalizeEdgeScaleKey(metric.namespace),
    phase: metric.phase || null,
    cache_status: metric.cacheStatus || null,
    status_code: metric.statusCode || null,
    duration_ms: metric.durationMs || null,
    provider_summary: metric.providerSummary || {},
    error_message: metric.errorMessage || null,
  });

  if (error) {
    console.warn(
      `[edgeScale] Failed to record metric for ${metric.namespace}: ${error.message || 'unknown error'}`
    );
  }
}
