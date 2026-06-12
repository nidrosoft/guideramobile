/**
 * Typed capture helpers (spec §4.3). Each builds a ProfileSignal and emits it
 * fire-and-forget, so wiring a capture point is a single call. Pass only the
 * values you actually have — undefined facts are dropped.
 */
import { emitProfileSignal } from '../events/guidanceEvents';
import type { DetectedFact, ProfileField, SignalConfidence, SignalSource } from '../types';

function fact(field: ProfileField, value: any, confidence: SignalConfidence): DetectedFact | null {
  if (value === undefined || value === null || value === '') return null;
  return { field, value, confidence };
}

function emit(source: SignalSource, surface: string, facts: (DetectedFact | null)[]) {
  const clean = facts.filter(Boolean) as DetectedFact[];
  if (clean.length === 0) return;
  emitProfileSignal({ source, surface, facts: clean });
}

// S1 — flight search
export function captureFlightSearch(p: {
  originCode?: string;
  cabinClass?: string;
  stops?: string;
  currency?: string;
}) {
  emit('flight_search', 'search', [
    fact('home_airport', p.originCode, 'explicit'),
    fact('flightClass', p.cabinClass, 'behavioral'),
    fact('flightStops', p.stops, 'behavioral'),
    fact('defaultCurrency', p.currency, 'behavioral'),
  ]);
}

// S2 — hotel search
export function captureHotelSearch(p: { minStars?: number; amenities?: string[] }) {
  emit('hotel_search', 'search', [
    fact('minStarRating', p.minStars, 'behavioral'),
    fact('preferredAmenities', p.amenities, 'behavioral'),
  ]);
}

// S3 — experience search / category engagement
export function captureExperienceInterest(interest: string) {
  emit('experience_search', 'search', [fact('interests', interest, 'behavioral')]);
}

// S4 — trip created
export function captureTripCreated(p: {
  companionType?: string;
  spendingStyle?: string;
  currency?: string;
  tripStyles?: string[];
}) {
  emit('trip_created', 'trips', [
    fact('defaultCompanionType', p.companionType, 'explicit'),
    fact('spendingStyle', p.spendingStyle, 'explicit'),
    fact('defaultCurrency', p.currency, 'behavioral'),
    fact('preferredTripStyles', p.tripStyles, 'explicit'),
  ]);
}

// S5 — trip snapshot search
export function captureTripSnapshot(p: {
  originCity?: string;
  homeAirport?: string;
  passportCountry?: string;
  interests?: string[];
  accommodationType?: string;
}) {
  emit('trip_snapshot', 'search', [
    fact('origin_city', p.originCity, 'explicit'),
    fact('home_airport', p.homeAirport, 'explicit'),
    fact('passport_country', p.passportCountry, 'explicit'),
    fact('interests', p.interests, 'behavioral'),
    fact('accommodationType', p.accommodationType, 'behavioral'),
  ]);
}

// S6 — journeys briefing inputs
export function captureJourneyBriefing(p: {
  companionType?: string;
  interests?: string[];
  dietary?: string[];
  medical?: string[];
}) {
  emit('journey_briefing', 'journeys', [
    fact('defaultCompanionType', p.companionType, 'explicit'),
    fact('interests', p.interests, 'behavioral'),
    fact('dietaryRestrictions', p.dietary, 'explicit'),
    fact('medicalConditions', p.medical, 'explicit'),
  ]);
}

// S7 — expense currency
export function captureExpenseCurrency(currency: string) {
  emit('expense', 'expenses', [fact('defaultCurrency', currency, 'behavioral')]);
}

// S8 — AI Vision menu signals
export function captureAiVisionFood(p: { dietary?: string[]; cuisine?: string[]; spice?: string }) {
  emit('ai_vision', 'aivision', [
    fact('dietaryRestrictions', p.dietary, 'behavioral'),
    fact('cuisinePreferences', p.cuisine, 'behavioral'),
    fact('spiceTolerance', p.spice, 'behavioral'),
  ]);
}

// S9 — language tool usage
export function captureLanguageUse(language: string) {
  emit('language_tool', 'language', [fact('languages', language, 'weak')]);
}

// S10/S11/S12 — weak engagement signals (hub only)
export function captureWeakInterest(interest: string, source: SignalSource = 'saved_item') {
  emit(source, 'home', [fact('interests', interest, 'weak')]);
}
