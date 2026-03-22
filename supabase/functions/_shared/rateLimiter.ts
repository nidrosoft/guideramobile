/**
 * SHARED RATE LIMITER
 * 
 * Simple in-memory rate limiter for edge functions.
 * Uses a sliding window approach with configurable limits per user.
 * 
 * Since edge functions are stateless, this uses Supabase DB to persist
 * rate limit counters across invocations.
 */

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface RateLimitConfig {
  maxRequests: number;    // Max requests allowed
  windowMinutes: number;  // Time window in minutes
  identifier: string;     // Function name for tracking
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: string;
}

/**
 * Check rate limit for a user on a specific function.
 * Uses the alerts table with a special rate_limit category to track usage.
 */
export async function checkRateLimit(
  supabase: SupabaseClient,
  userId: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const windowStart = new Date(Date.now() - config.windowMinutes * 60 * 1000).toISOString();
  const resetAt = new Date(Date.now() + config.windowMinutes * 60 * 1000).toISOString();

  // Count recent requests for this user + function
  const { count, error } = await supabase
    .from('ai_generation_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('function_name', config.identifier)
    .gte('created_at', windowStart);

  if (error) {
    // Fail closed — deny the request when rate limiter can't verify the limit.
    // This prevents abuse during database issues or attack conditions.
    console.error(`[RateLimiter] Error checking rate limit (denying request): ${error.message}`);
    return { allowed: false, remaining: 0, resetAt };
  }

  const used = count || 0;
  const remaining = Math.max(0, config.maxRequests - used);
  const allowed = used < config.maxRequests;

  return { allowed, remaining, resetAt };
}

/**
 * Record a rate-limited request.
 */
export async function recordRequest(
  supabase: SupabaseClient,
  userId: string,
  functionName: string,
  metadata?: Record<string, any>
): Promise<void> {
  await supabase.from('ai_generation_logs').insert({
    user_id: userId,
    function_name: functionName,
    status: 'completed',
    metadata: metadata || {},
  }).then(({ error }) => {
    if (error) console.warn(`[RateLimiter] Error recording request: ${error.message}`);
  });
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
export function rateLimitResponse(result: RateLimitResult, corsHeaders: Record<string, string>): Response {
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
