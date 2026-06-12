/**
 * Per-field metadata for Profile Intelligence: scoring weight (= impact when
 * choosing which fact to prompt), how a confirmed value maps to a
 * preferences.service payload, and whether the current preferences already
 * hold a value (so we never prompt for something already set).
 */
import type {
  TravelPreferences,
  UpdateTravelPreferencesPayload,
} from '@/services/preferences.service';
import type { ProfileField } from '../types';

export interface FieldMeta {
  field: ProfileField;
  /** relative impact 0-100, used to pick the highest-value fact to prompt */
  impact: number;
  /** i18n key suffix for the prompt copy (guidance.prompts.<key>.{fact,benefit}) */
  copyKey: string;
  /** build the preferences payload that persists a confirmed value */
  toPayload: (value: any) => UpdateTravelPreferencesPayload;
  /** is this field already populated in the user's preferences? */
  isSet: (p: TravelPreferences | null) => boolean;
}

const nonEmpty = (v: unknown) =>
  Array.isArray(v) ? v.length > 0 : v !== null && v !== undefined && v !== '';

export const FIELD_META: Record<ProfileField, FieldMeta> = {
  home_airport: {
    field: 'home_airport',
    impact: 90,
    copyKey: 'home_airport',
    toPayload: (v) => ({ homeAirport: String(v).toUpperCase().slice(0, 3) }),
    isSet: (p) => nonEmpty(p?.homeAirport),
  },
  origin_city: {
    field: 'origin_city',
    impact: 70,
    copyKey: 'origin_city',
    toPayload: (v) => ({ originCity: String(v) }),
    isSet: (p) => nonEmpty(p?.originCity),
  },
  passport_country: {
    field: 'passport_country',
    impact: 60,
    copyKey: 'passport_country',
    toPayload: (v) => ({ passportCountry: String(v) }),
    isSet: (p) => nonEmpty(p?.passportCountry),
  },
  defaultCompanionType: {
    field: 'defaultCompanionType',
    impact: 85,
    copyKey: 'defaultCompanionType',
    toPayload: (v) => ({ defaultCompanionType: v }),
    isSet: (p) => nonEmpty(p?.defaultCompanionType),
  },
  spendingStyle: {
    field: 'spendingStyle',
    impact: 85,
    copyKey: 'spendingStyle',
    toPayload: (v) => ({ spendingStyle: v }),
    // 'midrange' is the default, so treat it as "not really set"
    isSet: (p) => !!p?.spendingStyle && p.spendingStyle !== 'midrange',
  },
  flightClass: {
    field: 'flightClass',
    impact: 75,
    copyKey: 'flightClass',
    toPayload: (v) => ({ flightClass: v }),
    isSet: (p) => !!p?.flightClass && p.flightClass !== 'economy',
  },
  flightStops: {
    field: 'flightStops',
    impact: 50,
    copyKey: 'flightStops',
    toPayload: (v) => ({ flightStops: v }),
    isSet: (p) => !!p?.flightStops && p.flightStops !== 'any',
  },
  defaultCurrency: {
    field: 'defaultCurrency',
    impact: 65,
    copyKey: 'defaultCurrency',
    toPayload: (v) => ({ defaultCurrency: v }),
    isSet: (p) => !!p?.defaultCurrency && p.defaultCurrency !== 'USD',
  },
  preferredTripStyles: {
    field: 'preferredTripStyles',
    impact: 80,
    copyKey: 'preferredTripStyles',
    toPayload: (v) => ({ preferredTripStyles: Array.isArray(v) ? v : [v] }),
    isSet: (p) => nonEmpty(p?.preferredTripStyles),
  },
  interests: {
    field: 'interests',
    impact: 80,
    copyKey: 'interests',
    toPayload: (v) => ({ interests: Array.isArray(v) ? v : [v] }),
    isSet: (p) => nonEmpty(p?.interests),
  },
  accommodationType: {
    field: 'accommodationType',
    impact: 55,
    copyKey: 'accommodationType',
    toPayload: (v) => ({ accommodationType: v }),
    isSet: (p) => !!p?.accommodationType && p.accommodationType !== 'hotel',
  },
  minStarRating: {
    field: 'minStarRating',
    impact: 45,
    copyKey: 'minStarRating',
    toPayload: (v) => ({ minStarRating: Number(v) }),
    isSet: (p) => !!p?.minStarRating && p.minStarRating > 0,
  },
  dietaryRestrictions: {
    field: 'dietaryRestrictions',
    impact: 70,
    copyKey: 'dietaryRestrictions',
    toPayload: (v) => ({ dietaryRestrictions: Array.isArray(v) ? v : [v] }),
    isSet: (p) => nonEmpty(p?.dietaryRestrictions),
  },
  cuisinePreferences: {
    field: 'cuisinePreferences',
    impact: 40,
    copyKey: 'cuisinePreferences',
    toPayload: (v) => ({ cuisinePreferences: Array.isArray(v) ? v : [v] }),
    isSet: (p) => nonEmpty(p?.cuisinePreferences),
  },
  spiceTolerance: {
    field: 'spiceTolerance',
    impact: 35,
    copyKey: 'spiceTolerance',
    toPayload: (v) => ({ spiceTolerance: v }),
    isSet: (p) => !!p?.spiceTolerance && p.spiceTolerance !== 'medium',
  },
  medicalConditions: {
    field: 'medicalConditions',
    impact: 60,
    copyKey: 'medicalConditions',
    toPayload: (v) => ({ medicalConditions: Array.isArray(v) ? v : [v] }),
    isSet: (p) => nonEmpty(p?.medicalConditions),
  },
  preferredAmenities: {
    field: 'preferredAmenities',
    impact: 45,
    copyKey: 'preferredAmenities',
    toPayload: (v) => ({ preferredAmenities: Array.isArray(v) ? v : [v] }),
    isSet: (p) => (p?.preferredAmenities?.length ?? 0) > 1,
  },
  languages: {
    field: 'languages',
    impact: 50,
    copyKey: 'languages',
    // languages live on the profile, not travel_preferences; handled separately
    toPayload: () => ({}),
    isSet: () => false,
  },
};

export function fieldImpact(field: ProfileField): number {
  return FIELD_META[field]?.impact ?? 0;
}
