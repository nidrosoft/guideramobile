/**
 * SAFETY DATA HELPERS
 *
 * Pure helpers for the safety-alerts hardening:
 * - Resolve a stable 2-letter country code from a destination payload.
 * - Decide whether to serve fresh provider data, stale cached data, or a
 *   generated fallback when external providers are slow or failing.
 */

export interface SafetyDestinationInput {
  country?: string;
  countryCode?: string;
}

export function resolveSafetyCountryCode(
  destination: SafetyDestinationInput | undefined | null
): string | null {
  if (!destination) return null;

  const code = (destination.countryCode || '').trim().toUpperCase();
  if (code.length >= 2) return code.slice(0, 2);

  const country = (destination.country || '').trim();
  if (country.length >= 2) return country.slice(0, 2).toUpperCase();

  return null;
}

export type SafetyResultSource = 'fresh' | 'stale' | 'fallback';

export interface SafetyResultChoice<T> {
  payload: T;
  source: SafetyResultSource;
  servedStale: boolean;
}

export function chooseSafetyResult<T>(input: {
  fresh: T | null;
  stale: T | null;
  fallback: T;
}): SafetyResultChoice<T> {
  if (input.fresh) {
    return { payload: input.fresh, source: 'fresh', servedStale: false };
  }
  if (input.stale) {
    return { payload: input.stale, source: 'stale', servedStale: true };
  }
  return { payload: input.fallback, source: 'fallback', servedStale: false };
}
