/**
 * SHARED RATE LIMITER
 *
 * Backward-compatible wrapper around the durable edge scale rate limiter.
 */

interface RateLimitConfig {
  maxRequests: number; // Max requests allowed
  windowMinutes: number; // Time window in minutes
  identifier: string; // Function name for tracking
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: string;
}

interface RpcClient {
  rpc: (
    fn: string,
    args: Record<string, unknown>
  ) => Promise<{ data: unknown; error: { message?: string } | null }>;
  from?: (table: string) => unknown;
}

function normalizeKey(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLowerCase().slice(0, 500);
}

function parseRpcResult(data: unknown, fallbackResetAt: string): RateLimitResult {
  const row = Array.isArray(data) ? data[0] : data;
  if (!row || typeof row !== 'object') {
    return { allowed: false, remaining: 0, resetAt: fallbackResetAt };
  }

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
  };
}

/**
 * Check rate limit for a user on a specific function using edge_rate_limit_buckets.
 */
export async function checkRateLimit(
  supabase: RpcClient,
  userId: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const windowSeconds = config.windowMinutes * 60;
  const fallbackResetAt = new Date(Date.now() + windowSeconds * 1000).toISOString();
  const { data, error } = await supabase.rpc('edge_consume_rate_limit', {
    p_namespace: normalizeKey(config.identifier),
    p_bucket_key: normalizeKey(`user:${userId}`),
    p_window_seconds: windowSeconds,
    p_max_requests: config.maxRequests,
  });

  if (error) {
    console.error(
      `[RateLimiter] Error checking edge rate limit (denying request): ${error.message || 'unknown error'}`
    );
    return { allowed: false, remaining: 0, resetAt: fallbackResetAt };
  }

  return parseRpcResult(data, fallbackResetAt);
}

/**
 * Record a rate-limited request.
 */
export async function recordRequest(
  supabase: RpcClient,
  userId: string,
  functionName: string,
  metadata?: Record<string, any>
): Promise<void> {
  if (!metadata) return;
  const edgeMetric = metadata.edgeMetric as
    | ((input: {
        namespace: string;
        userId: string;
        metadata: Record<string, any>;
      }) => Promise<void>)
    | undefined;

  if (edgeMetric) {
    await edgeMetric({ namespace: functionName, userId, metadata });
  }
}

/**
 * Pre-configured rate limits for different function categories.
 */
export const RATE_LIMITS = {
  // AI Generation (expensive — Gemini/Claude calls)
  aiGeneration: {
    maxRequests: 30,
    windowMinutes: 60,
    identifier: 'ai-generation',
  } as RateLimitConfig,

  // Smart Plan (very expensive — generates 6 modules)
  smartPlan: {
    maxRequests: 10,
    windowMinutes: 1440, // 24 hours
    identifier: 'smart-plan',
  } as RateLimitConfig,

  // Flight/Hotel Search
  search: {
    maxRequests: 60,
    windowMinutes: 60,
    identifier: 'search',
  } as RateLimitConfig,

  // Google API Proxy (Vision, Translation)
  googleProxy: {
    maxRequests: 100,
    windowMinutes: 60,
    identifier: 'google-proxy',
  } as RateLimitConfig,

  // Chat Assistant
  chatAssistant: {
    maxRequests: 50,
    windowMinutes: 60,
    identifier: 'chat-assistant',
  } as RateLimitConfig,

  // Crash Reports (prevent spam)
  crashReport: {
    maxRequests: 10,
    windowMinutes: 60,
    identifier: 'crash-report',
  } as RateLimitConfig,
};

/**
 * Helper to create a 429 Too Many Requests response.
 */
export function rateLimitResponse(
  result: RateLimitResult,
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
