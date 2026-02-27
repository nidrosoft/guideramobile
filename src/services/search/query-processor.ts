/**
 * Query Processor
 * Parses, validates, enriches, and optimizes search queries
 */

import { supabase } from '@/lib/supabase/client';
import type {
  ParsedQuery,
  EnrichedQuery,
  SearchMode,
  SearchCategory,
  LocationQuery,
  DateQuery,
  TravelerQuery,
  SearchFilters,
  SearchOptions,
  ResolvedLocation,
  DestinationIntelligence,
  SearchIntent,
  IntentSignal,
  UserPreferences,
  UnifiedSearchRequest,
} from '@/types/search';

// Determine categories based on search mode
function determineCategories(mode: SearchMode, hasOrigin: boolean): SearchCategory[] {
  switch (mode) {
    case 'unified':
      return hasOrigin ? ['flights', 'hotels', 'experiences'] : ['hotels', 'experiences'];
    case 'flight':
      return ['flights'];
    case 'hotel':
      return ['hotels'];
    case 'car':
      return ['cars'];
    case 'experience':
      return ['experiences'];
    case 'package':
      return ['flights', 'hotels', 'cars', 'experiences'];
    default:
      return ['flights', 'hotels'];
  }
}

// Parse location from request
function parseLocation(input: UnifiedSearchRequest['destination']): LocationQuery {
  if (!input) {
    throw new Error('Destination is required');
  }

  return {
    type: input.type || 'city',
    value: input.query || input.code || '',
    code: input.code,
    coordinates: input.coordinates,
  };
}

// Parse dates from request
function parseDates(input: UnifiedSearchRequest['dates']): DateQuery {
  return {
    type: input.flexible ? 'flexible' : 'exact',
    startDate: input.startDate,
    endDate: input.endDate,
    flexDays: input.flexDays,
  };
}

// Parse travelers from request
function parseTravelers(input: UnifiedSearchRequest['travelers'], cabinClass?: string): TravelerQuery {
  return {
    adults: input.adults || 1,
    children: input.children || 0,
    childrenAges: input.childrenAges,
    infants: input.infants || 0,
    cabinClass: cabinClass as TravelerQuery['cabinClass'],
  };
}

// Calculate days between two dates
function daysBetween(date1: Date, date2: Date): number {
  const diff = Math.abs(date2.getTime() - date1.getTime());
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// Detect user intent from query signals
function detectIntent(query: ParsedQuery, userHistory?: unknown[]): SearchIntent {
  const signals: IntentSignal[] = [];

  // Analyze date specificity
  if (query.dates.type === 'exact' && query.dates.startDate) {
    signals.push({ signal: 'specific_dates', source: 'date_query', weight: 0.8 });
  }

  // Analyze traveler details
  if (query.travelers.adults > 0 && query.travelers.cabinClass) {
    signals.push({ signal: 'detailed_travelers', source: 'traveler_query', weight: 0.7 });
  }

  // Check proximity to travel date
  if (query.dates.startDate) {
    const daysUntil = daysBetween(new Date(), new Date(query.dates.startDate));
    if (daysUntil < 14) {
      signals.push({ signal: 'urgent_travel', source: 'date_proximity', weight: 0.9 });
    } else if (daysUntil < 30) {
      signals.push({ signal: 'near_travel', source: 'date_proximity', weight: 0.6 });
    }
  }

  // Check if repeat search
  if (userHistory && userHistory.length > 0) {
    signals.push({ signal: 'repeat_search', source: 'user_history', weight: 0.6 });
  }

  // Calculate primary intent
  const totalWeight = signals.reduce((sum, s) => sum + s.weight, 0) || 1;
  const bookingSignals = signals.filter(s =>
    ['specific_dates', 'detailed_travelers', 'urgent_travel'].includes(s.signal)
  );
  const bookingWeight = bookingSignals.reduce((sum, s) => sum + s.weight, 0);

  let primaryIntent: SearchIntent['primaryIntent'];
  if (bookingWeight / totalWeight > 0.6) {
    primaryIntent = 'book';
  } else if (query.mode === 'plan') {
    primaryIntent = 'plan';
  } else if (signals.some(s => s.signal === 'repeat_search')) {
    primaryIntent = 'compare';
  } else {
    primaryIntent = 'explore';
  }

  return {
    primaryIntent,
    confidence: totalWeight > 0 ? bookingWeight / totalWeight : 0.5,
    signals,
    recommendations: [],
  };
}

// Resolve location to full details
async function resolveLocation(location: LocationQuery): Promise<ResolvedLocation | undefined> {
  if (!location.value && !location.code) return undefined;

  const searchValue = location.code || location.value;

  // Try to find in destination_intelligence
  const { data } = await supabase
    .from('destination_intelligence')
    .select('*')
    .or(`destination_code.ilike.${searchValue},destination_name.ilike.%${searchValue}%`)
    .limit(1)
    .single();

  if (data) {
    return {
      code: data.destination_code,
      name: data.destination_name,
      fullName: `${data.destination_name}, ${data.country_code}`,
      type: data.destination_type as ResolvedLocation['type'],
      countryCode: data.country_code,
      coordinates: data.latitude && data.longitude
        ? { latitude: data.latitude, longitude: data.longitude }
        : undefined,
      timezone: data.timezone,
    };
  }

  // Fallback to basic resolution
  return {
    code: location.code || location.value.substring(0, 3).toUpperCase(),
    name: location.value,
    fullName: location.value,
    type: location.type === 'airport' ? 'airport' : 'city',
    countryCode: 'XX',
  };
}

// Get destination intelligence
async function getDestinationIntelligence(code: string): Promise<DestinationIntelligence | undefined> {
  const { data } = await supabase
    .from('destination_intelligence')
    .select('*')
    .eq('destination_code', code)
    .single();

  if (!data) return undefined;

  return {
    code: data.destination_code,
    name: data.destination_name,
    type: data.destination_type,
    countryCode: data.country_code,
    tagline: data.tagline,
    emoji: data.emoji,
    heroImageUrl: data.hero_image_url,
    bestMonths: data.best_months,
    currency: data.currency,
    language: data.language,
    avgFlightPriceFromUs: data.avg_flight_price_from_us,
    avgHotelPricePerNight: data.avg_hotel_price_per_night,
    budgetLevel: data.budget_level,
    goodFor: data.good_for,
    similarDestinations: data.similar_destinations,
    nearbyDestinations: data.nearby_destinations,
    popularityScore: data.popularity_score,
  };
}

// Get user preferences
async function getUserPreferences(userId: string): Promise<UserPreferences | undefined> {
  const { data } = await supabase
    .from('travel_preferences')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (!data) return undefined;

  return {
    budgetLevel: data.budget_priority,
    preferredAirlines: data.preferred_airlines,
    travelStyle: data.trip_styles,
    interests: data.interests,
  };
}

/**
 * Parse raw search request into structured query
 */
export function parseSearchQuery(input: UnifiedSearchRequest): ParsedQuery {
  if (!input.destination) {
    throw new Error('Destination is required');
  }

  const mode = input.mode || 'unified';
  const hasOrigin = !!input.origin;
  const categories = determineCategories(mode, hasOrigin);

  const destination = parseLocation(input.destination);
  const origin = input.origin ? parseLocation(input.origin) : undefined;
  const dates = parseDates(input.dates);
  const travelers = parseTravelers(input.travelers, input.cabinClass);

  return {
    mode,
    categories,
    origin,
    destination,
    dates,
    travelers,
    filters: input.filters || {},
    sortBy: input.sortBy || 'recommended',
    page: 1,
    limit: input.options?.limit || 50,
    options: input.options || {},
  };
}

/**
 * Enrich query with user context and resolved locations
 */
export async function enrichQuery(
  query: ParsedQuery,
  userId?: string
): Promise<EnrichedQuery> {
  // Parallel enrichment
  const [
    resolvedDestination,
    resolvedOrigin,
    userPreferences,
    destinationIntel,
  ] = await Promise.all([
    resolveLocation(query.destination),
    query.origin ? resolveLocation(query.origin) : Promise.resolve(undefined),
    userId ? getUserPreferences(userId) : Promise.resolve(undefined),
    query.destination.code
      ? getDestinationIntelligence(query.destination.code)
      : Promise.resolve(undefined),
  ]);

  // Detect intent
  const intent = detectIntent(query);

  return {
    ...query,
    userPreferences,
    resolvedOrigin,
    resolvedDestination,
    searchTime: new Date(),
    currency: query.options.currency || 'USD',
    destinationIntelligence: destinationIntel,
    intent,
  };
}

/**
 * Main query processor class
 */
export class QueryProcessor {
  parse(input: UnifiedSearchRequest): ParsedQuery {
    return parseSearchQuery(input);
  }

  async enrich(query: ParsedQuery, userId?: string): Promise<EnrichedQuery> {
    return enrichQuery(query, userId);
  }

  optimize(query: EnrichedQuery): EnrichedQuery {
    // For now, return as-is. Optimization can be added later
    // (e.g., adjusting provider-specific parameters)
    return query;
  }
}

export const queryProcessor = new QueryProcessor();
