export interface EdgeRateLimitConfig {
  namespace: string;
  bucketKey: string;
  windowSeconds: number;
  maxRequests: number;
}

export interface EdgeRateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: string;
  blockedKey: string | null;
}

interface RpcClient {
  rpc: (
    fn: string,
    args: Record<string, unknown>
  ) => Promise<{ data: unknown; error: { message?: string } | null }>;
}

export function normalizeEdgeScaleKey(value: string): string {
  return value
    .trim()
    .replace(/\s*:\s*/g, ':')
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .slice(0, 500);
}

export function buildEdgeBucketKey(namespace: string, bucketKey: string): string {
  return `${normalizeEdgeScaleKey(namespace)}:${normalizeEdgeScaleKey(bucketKey)}`.slice(0, 500);
}

function parseRateLimitResult(data: unknown, fallbackResetAt: string): EdgeRateLimitResult | null {
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

export async function consumeEdgeRateLimit(
  supabase: RpcClient,
  config: EdgeRateLimitConfig
): Promise<EdgeRateLimitResult> {
  const namespace = normalizeEdgeScaleKey(config.namespace);
  const bucketKey = normalizeEdgeScaleKey(config.bucketKey);
  const windowSeconds = Math.max(1, Math.floor(config.windowSeconds));
  const maxRequests = Math.max(1, Math.floor(config.maxRequests));
  const fallbackResetAt = new Date(Date.now() + windowSeconds * 1000).toISOString();

  const { data, error } = await supabase.rpc('edge_consume_rate_limit', {
    p_namespace: namespace,
    p_bucket_key: bucketKey,
    p_window_seconds: windowSeconds,
    p_max_requests: maxRequests,
  });

  if (error) {
    console.error(
      `[edgeScale] Rate limit check failed for ${namespace}:${bucketKey}: ${error.message || 'unknown error'}`
    );
    return {
      allowed: false,
      remaining: 0,
      resetAt: fallbackResetAt,
      blockedKey: buildEdgeBucketKey(namespace, bucketKey),
    };
  }

  return (
    parseRateLimitResult(data, fallbackResetAt) || {
      allowed: false,
      remaining: 0,
      resetAt: fallbackResetAt,
      blockedKey: buildEdgeBucketKey(namespace, bucketKey),
    }
  );
}

export function edgeRateLimitResponse(
  result: EdgeRateLimitResult,
  corsHeaders: Record<string, string>
): Response {
  return new Response(
    JSON.stringify({
      error: 'Rate limit exceeded',
      remaining: result.remaining,
      resetAt: result.resetAt,
    }),
    {
      status: 429,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'X-RateLimit-Remaining': String(result.remaining),
        'X-RateLimit-Reset': result.resetAt,
        'Retry-After': '60',
      },
    }
  );
}
