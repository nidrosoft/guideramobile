/**
 * RETRY WITH BACKOFF UTILITY
 * 
 * Standardized retry mechanism for all edge function calls.
 * Two tiers: 'fast' for AI generation (5s/15s/30s) and 'slow' for imports/OCR (10s/30s/60s).
 * Only retries on network/timeout errors — validation errors fail immediately.
 */

export type RetryTier = 'fast' | 'slow';

const BACKOFF_SCHEDULES: Record<RetryTier, number[]> = {
  fast: [5000, 15000, 30000],   // AI generation, search, chat — typically 5-30s calls
  slow: [10000, 30000, 60000],  // Import, OCR, email parsing — longer running calls
};

function isRetryableError(error: any): boolean {
  const msg = (error?.message || error?.toString() || '').toLowerCase();
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
    msg.includes('429') ||
    msg.includes('rate limit') ||
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
  label?: string,
): Promise<T> {
  const schedule = BACKOFF_SCHEDULES[tier];
  let lastError: any = null;

  for (let attempt = 0; attempt <= schedule.length; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;

      // Don't retry non-retryable errors (validation, auth, 4xx)
      if (!isRetryableError(err)) {
        throw err;
      }

      // Don't retry if we've exhausted all attempts
      if (attempt >= schedule.length) {
        break;
      }

      const delay = schedule[attempt];
      if (__DEV__) {
        console.log(`[Retry] ${label || 'fn'} attempt ${attempt + 1}/${schedule.length} failed, retrying in ${delay / 1000}s: ${err.message || err}`);
      }

      await new Promise(resolve => setTimeout(resolve, delay));
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
): Promise<any> {
  return retryWithBackoff(
    async () => {
      const { data, error } = await supabase.functions.invoke(functionName, { body });

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
    functionName,
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
): Promise<{ data: any; error: any }> {
  try {
    const data = await retryWithBackoff(
      async () => {
        const result = await supabase.functions.invoke(functionName, { body });
        if (result.error) {
          throw new Error(result.error.message || String(result.error));
        }
        return result.data;
      },
      tier,
      functionName,
    );
    return { data, error: null };
  } catch (err: any) {
    return { data: null, error: err };
  }
}
