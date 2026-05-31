import {
  chooseSafetyResult,
  resolveSafetyCountryCode,
} from '../../../supabase/functions/_shared/safety/safetyData';

describe('resolveSafetyCountryCode', () => {
  it('prefers an explicit country code and normalizes it', () => {
    expect(resolveSafetyCountryCode({ country: 'France', countryCode: 'fr' })).toBe('FR');
    expect(resolveSafetyCountryCode({ country: 'United States', countryCode: 'USA' })).toBe('US');
  });

  it('falls back to the first two letters of the country name', () => {
    expect(resolveSafetyCountryCode({ country: 'Japan' })).toBe('JA');
  });

  it('returns null when there is nothing usable', () => {
    expect(resolveSafetyCountryCode(undefined)).toBeNull();
    expect(resolveSafetyCountryCode({ country: '' })).toBeNull();
  });
});

describe('chooseSafetyResult', () => {
  it('serves fresh provider data when available', () => {
    expect(
      chooseSafetyResult({ fresh: { v: 'fresh' }, stale: { v: 'stale' }, fallback: { v: 'fallback' } })
    ).toEqual({ payload: { v: 'fresh' }, source: 'fresh', servedStale: false });
  });

  it('serves stale cache when the provider fetch failed', () => {
    expect(
      chooseSafetyResult({ fresh: null, stale: { v: 'stale' }, fallback: { v: 'fallback' } })
    ).toEqual({ payload: { v: 'stale' }, source: 'stale', servedStale: true });
  });

  it('serves generated fallback when there is no fresh or stale data', () => {
    expect(
      chooseSafetyResult({ fresh: null, stale: null, fallback: { v: 'fallback' } })
    ).toEqual({ payload: { v: 'fallback' }, source: 'fallback', servedStale: false });
  });
});
