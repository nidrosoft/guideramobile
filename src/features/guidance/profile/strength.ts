/**
 * Profile Strength = 0.7 × preferences completeness + 0.3 × identity completeness.
 *
 * The preferences score reuses the existing, battle-tested
 * preferencesService.calculateCompleteness() and adds the new logistics fields.
 * Identity completeness is a light score over profile-level fields.
 */
import { preferencesService, type TravelPreferences } from '@/services/preferences.service';
import type { Profile } from '@/types/auth.types';

const nonEmpty = (v: unknown) =>
  Array.isArray(v) ? v.length > 0 : v !== null && v !== undefined && v !== '';

/** 0-100 over travel_preferences, including the new logistics fields. */
export function preferencesCompleteness(prefs: TravelPreferences | null): number {
  if (!prefs) return 0;
  // Base (existing weights total 100), then fold in the 3 logistics fields by
  // taking a weighted blend so the maximum stays 100.
  const base = preferencesService.calculateCompleteness(prefs); // 0-100
  const logisticsFilled =
    (nonEmpty(prefs.homeAirport) ? 1 : 0) +
    (nonEmpty(prefs.originCity) ? 1 : 0) +
    (nonEmpty(prefs.passportCountry) ? 1 : 0);
  const logistics = (logisticsFilled / 3) * 100; // 0-100
  // 85% existing prefs, 15% logistics — keeps prior behavior dominant.
  return Math.round(base * 0.85 + logistics * 0.15);
}

/** 0-100 over identity fields on the profile. */
export function identityCompleteness(profile: Profile | null): number {
  if (!profile) return 0;
  const checks: boolean[] = [
    nonEmpty(profile.avatar_url),
    nonEmpty(profile.bio),
    nonEmpty((profile as any).languages),
    nonEmpty(profile.country) || nonEmpty((profile as any).location_name),
    nonEmpty((profile as any).emergency_contact?.phone),
    nonEmpty(profile.date_of_birth),
    nonEmpty((profile as any).nationality) || nonEmpty(profile.country),
  ];
  const filled = checks.filter(Boolean).length;
  return Math.round((filled / checks.length) * 100);
}

export function profileStrength(prefs: TravelPreferences | null, profile: Profile | null): number {
  return Math.min(
    100,
    Math.round(preferencesCompleteness(prefs) * 0.7 + identityCompleteness(profile) * 0.3)
  );
}

export function strengthTier(
  strength: number
): 'getting_started' | 'looking_good' | 'travel_ready' {
  if (strength >= 80) return 'travel_ready';
  if (strength >= 40) return 'looking_good';
  return 'getting_started';
}

/** Proactive inline prompts stop at 80%. */
export const PROACTIVE_PROMPT_CEILING = 80;
