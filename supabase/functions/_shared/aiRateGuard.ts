/**
 * Lightweight abuse/cost guard for AI & paid-provider edge functions.
 *
 * Rate-limits by authenticated user when the caller forwards a Clerk token,
 * otherwise falls back to client IP. FAILS OPEN on any limiter error so a
 * transient DB issue never blocks a legitimate request. Optionally requires
 * auth (used for the orphaned ai-generation endpoint, which must never be
 * callable anonymously).
 *
 * Backed by the same `edge_consume_rate_limit` RPC the rest of the app uses.
 */
import { getRequestAuthTokens, getUserIdFromRequest } from './auth.ts';

export interface AiLimitConfig {
  namespace: string;
  windowSeconds: number;
  maxRequests: number;
}

/** Sensible per-hour caps — generous for real users, tight enough to stop loops. */
export const AI_LIMITS: Record<string, AiLimitConfig> = {
  aiGenerationLegacy: { namespace: 'ai-generation', windowSeconds: 3600, maxRequests: 20 },
  chat: { namespace: 'chat-assistant', windowSeconds: 3600, maxRequests: 60 },
  generate: { namespace: 'ai-generate', windowSeconds: 3600, maxRequests: 40 },
  journeysChat: { namespace: 'journeys-chat', windowSeconds: 3600, maxRequests: 40 },
  journeysRecommend: { namespace: 'journeys-recommend', windowSeconds: 3600, maxRequests: 30 },
  ocr: { namespace: 'ocr-scan', windowSeconds: 3600, maxRequests: 30 },
  search: { namespace: 'provider-search', windowSeconds: 3600, maxRequests: 80 },
};

function clientIp(req: Request): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('cf-connecting-ip') ||
    'unknown'
  );
}

interface GuardArgs {
  req: Request;
  body: Record<string, any>;
  supabase: { rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }> };
  config: AiLimitConfig;
  corsHeaders: Record<string, string>;
  supabaseUrl: string;
  serviceRoleKey: string;
  anonKey: string;
  /** when true, reject anonymous callers with 401 (orphaned/internal endpoints) */
  requireAuth?: boolean;
}

/**
 * Returns a Response (401 or 429) if the request should be rejected, or null to
 * proceed. Never throws.
 */
export async function guardAiRequest(args: GuardArgs): Promise<Response | null> {
  const { req, body, supabase, config, corsHeaders } = args;

  // Resolve the user only when a real (non-anon) token is forwarded — avoids a
  // wasted RPC round-trip for token-less callers.
  let userId: string | null = null;
  try {
    const { clerkToken } = getRequestAuthTokens(req.headers);
    if (clerkToken && clerkToken !== args.anonKey) {
      userId = await getUserIdFromRequest(
        req, body, args.supabaseUrl, args.serviceRoleKey, args.anonKey
      );
    }
  } catch {
    /* fall through to IP-based limiting */
  }

  if (args.requireAuth && !userId) {
    return new Response(
      JSON.stringify({ error: 'Authentication required' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const actorKey = userId ? `user:${userId}` : `ip:${clientIp(req)}`;

  try {
    const { data, error } = await supabase.rpc('edge_consume_rate_limit', {
      p_namespace: config.namespace,
      p_bucket_key: actorKey,
      p_window_seconds: config.windowSeconds,
      p_max_requests: config.maxRequests,
    });
    if (error) return null; // FAIL OPEN — never block a real user on limiter error
    const row = (Array.isArray(data) ? data[0] : data) as
      | { allowed?: boolean; remaining?: number; reset_at?: string }
      | null;
    if (row && row.allowed === false) {
      const resetAt = row.reset_at || new Date(Date.now() + config.windowSeconds * 1000).toISOString();
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again shortly.', resetAt }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'Retry-After': String(config.windowSeconds),
            'X-RateLimit-Remaining': String(row.remaining ?? 0),
            'X-RateLimit-Reset': resetAt,
          },
        }
      );
    }
    return null; // allowed
  } catch {
    return null; // FAIL OPEN
  }
}
