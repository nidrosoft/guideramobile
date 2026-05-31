/**
 * Concurrency + dedupe guard for trip snapshot edge functions.
 * In-memory per isolate — Supabase scales isolates horizontally under load.
 */

const recentRequests = new Map<string, number>();
const RATE_LIMIT_WINDOW_MS = 15_000;
const MAX_CONCURRENT = 25;
let activeConcurrent = 0;

export interface GuardResult {
  allowed: boolean;
  status?: number;
  error?: string;
  retryAfterSec?: number;
}

export function cleanupRateLimit(): void {
  const now = Date.now();
  for (const [key, ts] of recentRequests) {
    if (now - ts > RATE_LIMIT_WINDOW_MS) recentRequests.delete(key);
  }
}

export function acquireSnapshotSlot(
  rateKey: string,
  skipRateLimit = false,
): GuardResult {
  cleanupRateLimit();

  if (!skipRateLimit) {
    const lastRequest = recentRequests.get(rateKey);
    if (lastRequest && Date.now() - lastRequest < RATE_LIMIT_WINDOW_MS) {
      const retryAfterSec = Math.ceil((RATE_LIMIT_WINDOW_MS - (Date.now() - lastRequest)) / 1000);
      return {
        allowed: false,
        status: 429,
        error: `Please wait ${retryAfterSec} seconds before searching this destination again.`,
        retryAfterSec,
      };
    }
  }

  if (activeConcurrent >= MAX_CONCURRENT) {
    return {
      allowed: false,
      status: 503,
      error: 'High demand right now. Please try again in a few seconds.',
      retryAfterSec: 5,
    };
  }

  activeConcurrent++;
  if (!skipRateLimit) recentRequests.set(rateKey, Date.now());
  return { allowed: true };
}

export function releaseSnapshotSlot(): void {
  activeConcurrent = Math.max(0, activeConcurrent - 1);
}

export function guardHeaders(retryAfterSec?: number): Record<string, string> {
  if (!retryAfterSec) return {};
  return { 'Retry-After': String(retryAfterSec) };
}
