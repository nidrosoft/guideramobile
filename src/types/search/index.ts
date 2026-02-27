/**
 * Search & Comparison Engine Types
 * Document 9 Implementation
 */

// Search Modes
export type SearchMode = 'unified' | 'flight' | 'hotel' | 'car' | 'experience' | 'package' | 'plan';
export type SearchCategory = 'flights' | 'hotels' | 'cars' | 'experiences';
export type SortOption = 
  | 'recommended'
  | 'price_low'
  | 'price_high'
  | 'duration_short'
  | 'duration_long'
  | 'departure_early'
  | 'departure_late'
  | 'rating_high'
  | 'distance_near'
  | 'popularity';

export type SessionStatus = 'pending' | 'searching' | 'completed' | 'partial' | 'failed';
export type IntentType = 'explore' | 'book' | 'compare' | 'plan';

// Location Types
export interface LocationQuery {
  type: 'city' | 'airport' | 'coordinates' | 'nearby' | 'region';
  value: string;
  code?: string;
  coordinates?: { latitude: number; longitude: number };
  radius?: number;
}

export interface ResolvedLocation {
  code: string;
  name: string;
  fullName: string;
  type: 'city' | 'airport' | 'region' | 'country';
  countryCode: string;
  coordinates?: { latitude: number; longitude: number };
  timezone?: string;
}

// Date Types
export interface DateQuery {
  type: 'exact' | 'flexible' | 'weekend' | 'month';
  startDate?: string;
  endDate?: string;
  flexDays?: number;
  preferredDays?: ('fri' | 'sat' | 'sun')[];
  month?: number;
  year?: number;
}

// Traveler Types
export interface TravelerQuery {
  adults: number;
  children: number;
  childrenAges?: number[];
  infants: number;
  rooms?: number;
  cabinClass?: 'economy' | 'premium_economy' | 'business' | 'first';
}

// Intent Detection
export interface IntentSignal {
  signal: string;
  source: string;
  weight: number;
}

export interface SearchIntent {
  primaryIntent: IntentType;
  confidence: number;
  signals: IntentSignal[];
  recommendations: SearchRecommendation[];
}

export interface SearchRecommendation {
  type: 'filter' | 'sort' | 'alternative' | 'deal';
  title: string;
  description: string;
  action: Record<string, unknown>;
  impact?: string;
}

// Parsed Query
export interface ParsedQuery {
  mode: SearchMode;
  categories: SearchCategory[];
  origin?: LocationQuery;
  destination: LocationQuery;
  dates: DateQuery;
  travelers: TravelerQuery;
  filters: SearchFilters;
  sortBy?: SortOption;
  page: number;
  limit: number;
  options: SearchOptions;
}

// Enriched Query
export interface EnrichedQuery extends ParsedQuery {
  userPreferences?: UserPreferences;
  userHistory?: SearchHistoryItem[];
  resolvedOrigin?: ResolvedLocation;
  resolvedDestination?: ResolvedLocation;
  searchTime: Date;
  currency: string;
  destinationIntelligence?: DestinationIntelligence;
  intent: SearchIntent;
}

// Search Options
export interface SearchOptions {
  currency?: string;
  language?: string;
  limit?: number;
  strategy?: 'fast' | 'comprehensive';
  includeAlternatives?: boolean;
}

// Filters
export interface SearchFilters {
  maxPrice?: number;
  minRating?: number;
  stops?: number[];
  airlines?: string[];
  departureTime?: string[];
  duration?: { min?: number; max?: number };
  starRating?: number[];
  amenities?: string[];
  propertyTypes?: string[];
  freeCancellation?: boolean;
  refundable?: boolean;
  [key: string]: unknown;
}

export interface FilterDefinition {
  id: string;
  type: 'range' | 'multi_select' | 'single_select' | 'boolean' | 'time_range';
  label: string;
  field: string;
  options?: FilterOption[];
  range?: { min: number; max: number; step: number };
  format?: string;
}

export interface FilterOption {
  value: string | number | boolean;
  label: string;
  count: number;
  disabled?: boolean;
}

export interface AppliedFilters {
  [filterId: string]: unknown;
}

export interface FilterResult {
  filteredResults: UnifiedResult[];
  availableFilters: FilterDefinition[];
  appliedFilters: AppliedFilters;
  filterStats: {
    totalBefore: number;
    totalAfter: number;
    removedCount: number;
  };
}

// User Context
export interface UserPreferences {
  budgetLevel?: 'budget' | 'mid_range' | 'luxury';
  preferredAirlines?: string[];
  preferredHotelChains?: string[];
  requiredAmenities?: string[];
  travelStyle?: string[];
  interests?: string[];
}

export interface SearchHistoryItem {
  destinationCode: string;
  searchedAt: Date;
  category: SearchCategory;
}

// Destination Intelligence
export interface DestinationIntelligence {
  code: string;
  name: string;
  type: 'city' | 'region' | 'country';
  countryCode: string;
  tagline?: string;
  emoji?: string;
  heroImageUrl?: string;
  bestMonths?: number[];
  currency?: string;
  language?: string;
  avgFlightPriceFromUs?: number;
  avgHotelPricePerNight?: number;
  budgetLevel?: 'budget' | 'moderate' | 'expensive';
  goodFor?: string[];
  similarDestinations?: string[];
  nearbyDestinations?: string[];
  popularityScore?: number;
}

// Unified Result (base for all result types)
export interface UnifiedResult {
  id: string;
  type: 'flight' | 'hotel' | 'car' | 'experience';
  provider: { code: string; name: string };
  price: { amount: number; currency: string; formatted: string };
  ranking?: ResultRanking;
  alternatives?: AlternativeOffer[];
}

export interface AlternativeOffer {
  provider: { code: string; name: string };
  price: { amount: number; currency: string; formatted: string };
  offerId: string;
}

export interface ResultRanking {
  priceScore: number;
  qualityScore: number;
  relevanceScore: number;
  personalizationScore: number;
  freshnessScore: number;
  totalScore: number;
  rank: number;
}

// Session Types
export interface SearchSession {
  id: string;
  token: string;
  userId?: string;
  anonymousId?: string;
  query: EnrichedQuery;
  results: CategoryResults;
  appliedFilters: AppliedFilters;
  sortBy: SortOption;
  status: SessionStatus;
  lastActivity: Date;
  priceSnapshots: PriceSnapshot[];
  analytics: SessionAnalytics;
}

export interface CategoryResults {
  [category: string]: {
    items: UnifiedResult[];
    totalCount: number;
    pageInfo: PageInfo;
    providers: ProviderMeta[];
  };
}

export interface PageInfo {
  page: number;
  pageSize: number;
  totalPages: number;
  hasMore: boolean;
}

export interface ProviderMeta {
  code: string;
  responseTime: number;
  fromCache: boolean;
  resultCount: number;
}

export interface PriceSnapshot {
  timestamp: Date;
  category: SearchCategory;
  lowestPrice?: { amount: number; currency: string };
  avgPrice?: number;
}

export interface SessionAnalytics {
  searchStarted: Date;
  searchCompleted?: Date;
  resultsViewed: number;
  filtersApplied: number;
  sortsApplied: number;
  offersClicked: string[];
  offersSaved: string[];
  timeSpentSeconds: number;
  deviceType: string;
}

// Search Request/Response
export interface UnifiedSearchRequest {
  mode: SearchMode;
  destination: {
    query?: string;
    code?: string;
    type?: 'city' | 'airport' | 'nearby';
    coordinates?: { latitude: number; longitude: number };
  };
  origin?: {
    query?: string;
    code?: string;
    type?: 'city' | 'airport';
  };
  dates: {
    startDate: string;
    endDate?: string;
    flexible?: boolean;
    flexDays?: number;
  };
  travelers: {
    adults: number;
    children: number;
    childrenAges?: number[];
    infants: number;
  };
  rooms?: number;
  cabinClass?: 'economy' | 'premium_economy' | 'business' | 'first';
  tripType?: 'one_way' | 'round_trip' | 'multi_city';
  filters?: SearchFilters;
  sortBy?: SortOption;
  options?: SearchOptions;
  sessionToken?: string;
  userId?: string;
}

export interface UnifiedSearchResponse {
  success: boolean;
  data?: {
    sessionToken: string;
    results: CategoryResults;
    query: {
      destination: ResolvedLocation;
      origin?: ResolvedLocation;
      dates: DateQuery;
      travelers: TravelerQuery;
    };
    filters: { [category: string]: FilterDefinition[] };
    sorts: { [category: string]: SortOption[] };
    suggestions: SearchRecommendation[];
    destinationInfo?: DestinationIntelligence;
    priceInsights?: PriceInsights;
    meta: SearchMeta;
  };
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface PriceInsights {
  avgPrice: number;
  priceRange: { min: number; max: number };
  priceHistory?: { date: string; price: number }[];
  bestTimeToBook?: string;
}

export interface SearchMeta {
  searchDuration: number;
  providers: { code: string; responseTime: number; resultCount: number }[];
  cacheHits: number;
  resultSources: { cached: number; live: number };
}

// Deduplication
export interface DeduplicationResult {
  uniqueResults: UnifiedResult[];
  duplicateGroups: DuplicateGroup[];
  stats: {
    totalInput: number;
    uniqueOutput: number;
    duplicatesFound: number;
    duplicateRate: number;
  };
}

export interface DuplicateGroup {
  primaryResult: UnifiedResult;
  duplicates: {
    result: UnifiedResult;
    similarityScore: number;
    priceDifference: number;
  }[];
}

// Autocomplete
export interface AutocompleteResult {
  type: 'city' | 'airport' | 'region' | 'country' | 'poi';
  code: string;
  name: string;
  fullName: string;
  emoji?: string;
  subtitle?: string;
  airports?: { code: string; name: string }[];
}

// Price Alerts
export interface PriceAlert {
  id: string;
  userId: string;
  category: SearchCategory;
  searchParams: UnifiedSearchRequest;
  targetPrice: number;
  currentBestPrice?: number;
  currency: string;
  isActive: boolean;
  triggered: boolean;
  triggeredAt?: Date;
  expiresAt: Date;
  createdAt: Date;
}

// Execution Types
export interface ExecutionResult {
  provider: string;
  category: SearchCategory;
  success: boolean;
  results: UnifiedResult[];
  error?: Error;
  responseTime: number;
  fromCache: boolean;
}

export interface ExecutionPlan {
  strategy: 'parallel' | 'sequential' | 'hybrid';
  phases: ExecutionPhase[];
  totalTimeout: number;
  minResultsRequired: number;
}

export interface ExecutionPhase {
  phase: number;
  providers: string[];
  category: SearchCategory;
  timeout: number;
  waitForAll: boolean;
}
