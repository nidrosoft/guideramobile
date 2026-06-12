/**
 * Guidance System — public API.
 *
 * Surfaces import from here only. See GUIDERA_GUIDANCE_SYSTEM_SPEC.md.
 */

// Provider + hook
export { GuidanceProvider, useGuidance } from './GuidanceProvider';

// Tour anchoring + imperative action registration (for preActions)
export { TourAnchor } from './tour/TourAnchor';
export { registerActionHandler } from './tour/anchorRegistry';

// Profile capture detectors (call these at capture points)
export {
  captureFlightSearch,
  captureHotelSearch,
  captureExperienceInterest,
  captureTripCreated,
  captureTripSnapshot,
  captureJourneyBriefing,
  captureExpenseCurrency,
  captureAiVisionFood,
  captureLanguageUse,
  captureWeakInterest,
} from './profile/detectors';

// Strength
export { ProfileStrengthRing } from './profile/ProfileStrengthRing';
export { TravelProfileHomeCard } from './profile/TravelProfileHomeCard';
export {
  profileStrength,
  preferencesCompleteness,
  identityCompleteness,
  strengthTier,
} from './profile/strength';

// Store (for the hub screen)
export { useGuidanceStore } from './store/useGuidanceStore';
export { FIELD_META } from './profile/fieldMeta';

export type { TourId, TipId, ProfileField, PendingFact } from './types';
