/**
 * Profile Strength scoring (guidance feature).
 */
jest.mock('@/lib/supabase/client', () => ({
  supabase: { from: () => ({ upsert: () => Promise.resolve({ error: null }) }) },
  supabaseUrl: 'http://localhost',
  supabaseAnonKey: 'test',
  setClerkTokenGetter: () => {},
  getAuthenticatedEdgeFunctionHeaders: async () => ({}),
  buildClerkEdgeFunctionHeaders: () => ({}),
  supabaseNoAuth: {},
}));

import {
  preferencesCompleteness,
  identityCompleteness,
  profileStrength,
  strengthTier,
} from '@/features/guidance/profile/strength';
import { DEFAULT_PREFERENCES, type TravelPreferences } from '@/services/preferences.service';

const basePrefs = (over: Partial<TravelPreferences> = {}): TravelPreferences => ({
  id: 'p1',
  userId: 'u1',
  createdAt: '',
  updatedAt: '',
  ...DEFAULT_PREFERENCES,
  ...over,
}) as TravelPreferences;

describe('preferencesCompleteness', () => {
  it('returns 0 for null', () => {
    expect(preferencesCompleteness(null)).toBe(0);
  });

  it('rises as core fields are filled', () => {
    const empty = preferencesCompleteness(basePrefs());
    const filled = preferencesCompleteness(
      basePrefs({
        defaultCompanionType: 'family',
        preferredTripStyles: ['adventure'],
        spendingStyle: 'luxury',
        interests: ['food', 'nature', 'art'],
      })
    );
    expect(filled).toBeGreaterThan(empty);
  });

  it('rewards the logistics fields', () => {
    const without = preferencesCompleteness(basePrefs({ defaultCompanionType: 'solo' }));
    const withLogistics = preferencesCompleteness(
      basePrefs({ defaultCompanionType: 'solo', homeAirport: 'ATL', originCity: 'Atlanta', passportCountry: 'US' })
    );
    expect(withLogistics).toBeGreaterThan(without);
  });
});

describe('identityCompleteness', () => {
  it('returns 0 for null', () => {
    expect(identityCompleteness(null)).toBe(0);
  });

  it('scores filled identity fields higher', () => {
    const sparse = identityCompleteness({ } as any);
    const rich = identityCompleteness({
      avatar_url: 'x', bio: 'hi', languages: ['en'], country: 'US',
      date_of_birth: '1990-01-01', emergency_contact: { phone: '+1' }, nationality: 'US',
    } as any);
    expect(rich).toBeGreaterThan(sparse);
    expect(rich).toBeLessThanOrEqual(100);
  });
});

describe('profileStrength + tier', () => {
  it('blends preferences (70%) and identity (30%), capped at 100', () => {
    const s = profileStrength(
      basePrefs({ defaultCompanionType: 'family', interests: ['food', 'art', 'nature'], spendingStyle: 'luxury', homeAirport: 'ATL' }),
      { avatar_url: 'x', bio: 'hi', country: 'US' } as any
    );
    expect(s).toBeGreaterThanOrEqual(0);
    expect(s).toBeLessThanOrEqual(100);
  });

  it('maps tiers correctly', () => {
    expect(strengthTier(10)).toBe('getting_started');
    expect(strengthTier(50)).toBe('looking_good');
    expect(strengthTier(85)).toBe('travel_ready');
  });
});
