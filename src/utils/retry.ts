/**
 * RETRY WITH BACKOFF UTILITY
 *
 * Standardized retry mechanism for all edge function calls.
 * Two tiers: 'fast' for AI generation (5s/15s/30s) and 'slow' for imports/OCR (10s/30s/60s).
 * Only retries on network/timeout errors — validation errors fail immediately.
 */

import { getAuthenticatedEdgeFunctionHeaders } from '@/lib/supabase/client';

export type RetryTier = 'none' | 'fast' | 'slow';

export interface EdgeFunctionInvokeOptions {
  headers?: Record<string, string>;
}

/**
 * Merge the caller's headers with the Clerk session token so edge functions can
 * resolve the authenticated user (used for per-user rate limiting / auth).
 * Best-effort: if no token is available (signed out), falls back to whatever the
 * caller passed — functions then rate-limit by IP.
 */
async function withAuthHeaders(
  options: EdgeFunctionInvokeOptions
): Promise<Record<string, string> | undefined> {
  try {
    const clerk = await getAuthenticatedEdgeFunctionHeaders();
    const merged = { ...(options.headers || {}), ...clerk };
    return Object.keys(merged).length > 0 ? merged : undefined;
  } catch {
    return options.headers;
  }
}

const BACKOFF_SCHEDULES: Record<RetryTier, number[]> = {
  none: [],
  fast: [5000, 15000, 30000], // AI generation, search, chat — typically 5-30s calls
  slow: [10000, 30000, 60000], // Import, OCR, email parsing — longer running calls
};

function getEdgeFunctionStatus(error: any): number | null {
  const status =
    error?.status ||
    error?.context?.status ||
    error?.context?.statusCode ||
    error?.response?.status;

  return typeof status === 'number' ? status : null;
}

async function readEdgeFunctionErrorBody(error: any): Promise<any | null> {
  const context = error?.context;

  if (context && typeof context.json === 'function') {
    try {
      return await context.json();
    } catch {
      return null;
    }
  }

  return null;
}

async function buildEdgeFunctionError(functionName: string, error: any): Promise<Error> {
  const status = getEdgeFunctionStatus(error);
  const body = await readEdgeFunctionErrorBody(error);
  const bodyMessage =
    typeof body?.error === 'string'
      ? body.error
      : typeof body?.message === 'string'
        ? body.message
        : null;
  const message = bodyMessage || error?.message || String(error);
  const wrapped = new Error(
    status ? `${functionName} failed: ${status} ${message}` : `${functionName} failed: ${message}`
  );
  (wrapped as any).status = status;
  (wrapped as any).context = error?.context;
  if (body) {
    (wrapped as any).body = body;
  }
  return wrapped;
}

export function isRetryableEdgeFunctionError(error: any): boolean {
  const status = getEdgeFunctionStatus(error);
  if (status && status >= 400 && status < 500) return false;
  if (status && status >= 500) return true;

  const msg = (error?.message || error?.toString() || '').toLowerCase();

  // Never retry client errors (4xx) — they won't succeed on retry
  if (
    msg.includes('404') ||
    msg.includes('401') ||
    msg.includes('403') ||
    msg.includes('400') ||
    msg.includes('422') ||
    msg.includes('429') ||
    msg.includes('rate limit') ||
    msg.includes('too many requests')
  ) {
    return false;
  }

  return (
    msg.includes('network') ||
    msg.includes('fetch') ||
    msg.includes('timeout') ||
    msg.includes('non-2xx') ||
    msg.includes('aborted') ||
    msg.includes('econnreset') ||
    msg.includes('socket') ||
    msg.includes('503') ||
    msg.includes('502') ||
    msg.includes('500') ||
    msg.includes('unavailable') ||
    msg.includes('failed to fetch')
  );
}

/**
 * Wraps an async function with retry logic and exponential backoff.
 *
 * @param fn - The async function to retry
 * @param tier - 'fast' (5s/15s/30s) or 'slow' (10s/30s/60s) backoff schedule
 * @param label - Optional label for debug logging (e.g., 'generate-itinerary')
 * @returns The result of the function on success
 * @throws The last error after all retries are exhausted
 *
 * @example
 * const data = await retryWithBackoff(
 *   () => supabase.functions.invoke('generate-itinerary', { body: { tripId } }),
 *   'fast',
 *   'generate-itinerary'
 * );
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  tier: RetryTier = 'fast',
  label?: string
): Promise<T> {
  const schedule = BACKOFF_SCHEDULES[tier];
  let lastError: any = null;

  for (let attempt = 0; attempt <= schedule.length; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;

      // Don't retry non-retryable errors (validation, auth, 4xx)
      if (!isRetryableEdgeFunctionError(err)) {
        throw err;
      }

      // Don't retry if we've exhausted all attempts
      if (attempt >= schedule.length) {
        break;
      }

      const delay = schedule[attempt];
      if (__DEV__) {
        console.log(
          `[Retry] ${label || 'fn'} attempt ${attempt + 1}/${schedule.length} failed, retrying in ${delay / 1000}s: ${err.message || err}`
        );
      }

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Wraps a supabase.functions.invoke call with retry logic.
 * Throws on error (both Supabase error and data.error patterns).
 *
 * @example
 * const data = await invokeWithRetry(supabase, 'generate-itinerary', { tripId }, 'fast');
 */
export async function invokeWithRetry(
  supabase: any,
  functionName: string,
  body: Record<string, any>,
  tier: RetryTier = 'fast',
  options: EdgeFunctionInvokeOptions = {}
): Promise<any> {
  return retryWithBackoff(
    async () => {
      const headers = await withAuthHeaders(options);
      const { data, error } = await supabase.functions.invoke(functionName, {
        body,
        ...(headers ? { headers } : {}),
      });

      if (error) {
        const errMsg = error.message || String(error);
        throw new Error(`${functionName} failed: ${errMsg}`);
      }

      if (data?.error) {
        throw new Error(typeof data.error === 'string' ? data.error : JSON.stringify(data.error));
      }

      return data;
    },
    tier,
    functionName
  );
}

/**
 * Drop-in replacement for supabase.functions.invoke that adds retry.
 * Returns { data, error } just like the original — no code changes needed downstream.
 *
 * @example
 * // Before:
 * const { data, error } = await supabase.functions.invoke('my-fn', { body: { tripId } });
 *
 * // After:
 * const { data, error } = await invokeEdgeFn(supabase, 'my-fn', { tripId }, 'fast');
 */
export async function invokeEdgeFn(
  supabase: any,
  functionName: string,
  body: Record<string, any>,
  tier: RetryTier = 'fast',
  options: EdgeFunctionInvokeOptions = {}
): Promise<{ data: any; error: any }> {
  try {
    const data = await retryWithBackoff(
      async () => {
        const headers = await withAuthHeaders(options);
        const result = await supabase.functions.invoke(functionName, {
          body,
          ...(headers ? { headers } : {}),
        });
        if (result.error) {
          throw await buildEdgeFunctionError(functionName, result.error);
        }
        return result.data;
      },
      tier,
      functionName
    );
    return { data, error: null };
  } catch (err: any) {
    return { data: null, error: err };
  }
}
