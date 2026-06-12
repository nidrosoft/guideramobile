/**
 * Guidance System — shared types.
 *
 * One foundation, three consumers: Tours (walkthroughs), Profile Intelligence
 * (progressive capture), and Smart Tips (one-off hints). See
 * GUIDERA_GUIDANCE_SYSTEM_SPEC.md.
 */

// ─── Tours ──────────────────────────────────────────────────────────────────

export type TourId =
  | 'hero'
  | 'trips'
  | 'tripDetail'
  | 'connect'
  | 'journeys'
  | 'search'
  | 'detail'
  | 'snapshot';

export type TourStatus = 'unseen' | 'completed' | 'skipped';

export type PreAction =
  | { type: 'switchTab'; tab: 'index' | 'trips' | 'community' | 'account' }
  | { type: 'scrollHomeToSection'; sectionId: string }
  | { type: 'scrollHomeToTop' }
  | { type: 'scrollToAnchor'; anchorId: string }
  | { type: 'openLauncher' }
  | { type: 'closeLauncher' }
  | { type: 'delay'; ms: number };

export interface TourStep {
  id: string;
  /** anchorId that must be registered via <TourAnchor id="..."> */
  anchorId: string;
  titleKey: string;
  bodyKey: string;
  placement?: 'auto' | 'top' | 'bottom';
  /** runs before measuring the anchor (switch tab, scroll, open a sheet) */
  preAction?: PreAction;
  /** when true, taps inside the cutout reach the target and advance the tour */
  tapTargetToAdvance?: boolean;
  /** overrides the default "Next"/"Finish" label */
  ctaLabelKey?: string;
  /** final-step deep link target */
  ctaRoute?: string;
}

export interface Tour {
  id: TourId;
  steps: TourStep[];
}

// ─── Smart Tips ───────────────────────────────────────────────────────────────

export type TipId =
  | 'tip.savedItems'
  | 'tip.inbox'
  | 'tip.tripReminder'
  | 'tip.categoryPills'
  | 'tip.sos'
  | 'tip.checkin'
  | 'tip.rewards'
  | 'tip.aiVisionLive'
  | 'tip.dmGuides'
  | 'tip.expenseScan'
  | 'tip.becomeGuide'
  | 'tip.aiAssistant'
  | 'tip.flightForm'
  | 'tip.hotelForm'
  | 'tip.carForm'
  | 'tip.packingModule'
  | 'tip.expensesModule'
  | 'tip.journalModule'
  | 'tip.tripsEmpty'
  | 'tip.savedEmpty';

export type TipStatus = 'unseen' | 'shown' | 'dismissed';

export interface SmartTip {
  id: TipId;
  anchorId: string;
  titleKey: string;
  bodyKey: string;
  placement?: 'auto' | 'top' | 'bottom';
}

// ─── Profile Intelligence ─────────────────────────────────────────────────────

/**
 * Profile fields the capture system can detect and prompt for. Keys map to
 * either travel_preferences (camelCase via preferences.service) or a virtual
 * field handled by the signal engine.
 */
export type ProfileField =
  | 'home_airport'
  | 'origin_city'
  | 'passport_country'
  | 'defaultCompanionType'
  | 'spendingStyle'
  | 'flightClass'
  | 'flightStops'
  | 'defaultCurrency'
  | 'preferredTripStyles'
  | 'interests'
  | 'accommodationType'
  | 'minStarRating'
  | 'dietaryRestrictions'
  | 'cuisinePreferences'
  | 'spiceTolerance'
  | 'medicalConditions'
  | 'preferredAmenities'
  | 'languages';

export type SignalConfidence = 'explicit' | 'behavioral' | 'weak';

export type SignalSource =
  | 'flight_search'
  | 'hotel_search'
  | 'experience_search'
  | 'trip_created'
  | 'trip_snapshot'
  | 'journey_briefing'
  | 'expense'
  | 'ai_vision'
  | 'language_tool'
  | 'deal_engagement'
  | 'saved_item'
  | 'community_join';

export interface DetectedFact {
  field: ProfileField;
  value: any;
  confidence: SignalConfidence;
}

export interface ProfileSignal {
  source: SignalSource;
  /** surface identifier for the session cap (e.g. "search", "trips") */
  surface: string;
  facts: DetectedFact[];
}

/** A fact awaiting batch review in the Profile Strength hub. */
export interface PendingFact {
  field: ProfileField;
  value: any;
  source: SignalSource;
  confidence: SignalConfidence;
  sightings: number;
  firstSeenAt: string;
}

/** A queued inline prompt ready to render. */
export interface QueuedPrompt {
  field: ProfileField;
  value: any;
  source: SignalSource;
  surface: string;
}

// ─── Persisted state ──────────────────────────────────────────────────────────

export interface PromptFieldRecord {
  timesShown: number;
  lastShownAt?: string;
  declinedAt?: string;
  suppressed: boolean;
}

export interface GuidancePersistedState {
  tours: Record<string, { status: TourStatus; lastStep: number; completedAt?: string }>;
  tips: Record<string, { status: TipStatus }>;
  prompts: {
    perField: Record<string, PromptFieldRecord>;
    shownToday: number;
    shownTodayDate?: string; // local YYYY-MM-DD for daily reset
    lastShownAt?: string;
  };
  pendingFacts: PendingFact[];
  /** profile-strength milestones already celebrated (e.g. [50, 80]) */
  celebratedMilestones: number[];
}

export const EMPTY_GUIDANCE_STATE: GuidancePersistedState = {
  tours: {},
  tips: {},
  prompts: { perField: {}, shownToday: 0 },
  pendingFacts: [],
  celebratedMilestones: [],
};

/** Profile-strength thresholds that trigger a celebration. */
export const STRENGTH_MILESTONES = [50, 80, 100];
