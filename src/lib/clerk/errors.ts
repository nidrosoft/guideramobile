/**
 * Centralized Clerk error parsing.
 * Clerk returns errors with a specific shape — we normalize them so every
 * auth screen can handle common cases (rate limits, missing fields, already
 * signed in) consistently.
 */

export interface ParsedClerkError {
  /** Friendly, user-facing message */
  message: string;
  /** Clerk error code, if known */
  code: string | null;
  /** True if this is a rate-limit error. */
  isRateLimit: boolean;
  /** Seconds until the user can retry, if provided by Clerk. */
  retryAfterSeconds: number | null;
  /** True if Clerk says a session already exists. */
  isAlreadySignedIn: boolean;
  /** True if the sign-up is pending with missing required fields. */
  isMissingRequirements: boolean;
}

const RATE_LIMIT_CODES = new Set([
  'client_rate_limit_exceeded',
  'too_many_requests',
  'form_identifier_verification_failed', // sometimes returned after too many tries
]);

const ALREADY_SIGNED_IN_CODES = new Set([
  'session_exists',
  'client_not_found',
]);

export function parseClerkError(err: unknown): ParsedClerkError {
  const anyErr = err as any;
  const first = anyErr?.errors?.[0];
  const code: string | null = first?.code ?? null;
  const rawMessage: string =
    first?.longMessage ||
    first?.message ||
    anyErr?.message ||
    'Something went wrong. Please try again.';

  const isRateLimit = !!(code && RATE_LIMIT_CODES.has(code));
  const isAlreadySignedIn = !!(code && ALREADY_SIGNED_IN_CODES.has(code));
  const isMissingRequirements = code === 'form_param_missing' || rawMessage.toLowerCase().includes('missing');

  // Clerk typically surfaces retry info via meta.retry_after (seconds) or as an
  // HTTP 429 Retry-After header. Check both.
  let retryAfterSeconds: number | null = null;
  const metaRetry = first?.meta?.retry_after ?? first?.meta?.retryAfter;
  if (typeof metaRetry === 'number' && metaRetry > 0) {
    retryAfterSeconds = Math.ceil(metaRetry);
  } else if (typeof anyErr?.retryAfter === 'number') {
    retryAfterSeconds = Math.ceil(anyErr.retryAfter);
  }

  let message = rawMessage;
  if (isRateLimit) {
    const wait = retryAfterSeconds ?? 60;
    message = `Too many attempts. Please try again in ${wait} seconds.`;
  } else if (isAlreadySignedIn) {
    message = "You're already signed in. Tap 'Start Over' to sign out and try again.";
  }

  return {
    message,
    code,
    isRateLimit,
    retryAfterSeconds,
    isAlreadySignedIn,
    isMissingRequirements,
  };
}
