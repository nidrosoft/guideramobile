/**
 * Result Processor
 * Handles deduplication, ranking, filtering, and sorting of search results
 */

import type {
  UnifiedResult,
  SearchCategory,
  EnrichedQuery,
  DeduplicationResult,
  DuplicateGroup,
  ResultRanking,
  FilterDefinition,
  FilterOption,
  AppliedFilters,
  FilterResult,
  SortOption,
  UserPreferences,
} from '@/types/search';

// Similarity thresholds per category
const SIMILARITY_THRESHOLDS: Record<SearchCategory, number> = {
  flights: 0.85,
  hotels: 0.80,
  cars: 0.75,
  experiences: 0.70,
};

// Ranking weights
const RANKING_WEIGHTS = {
  price: 0.30,
  quality: 0.25,
  relevance: 0.20,
  personalization: 0.15,
  freshness: 0.10,
};

// Flight filter definitions
const FLIGHT_FILTERS: FilterDefinition[] = [
  {
    id: 'stops',
    type: 'multi_select',
    label: 'Stops',
    field: 'totalStops',
    options: [
      { value: 0, label: 'Nonstop', count: 0 },
      { value: 1, label: '1 stop', count: 0 },
      { value: 2, label: '2+ stops', count: 0 },
    ],
  },
  {
    id: 'price',
    type: 'range',
    label: 'Price',
    field: 'price.amount',
    range: { min: 0, max: 5000, step: 50 },
  },
  {
    id: 'airlines',
    type: 'multi_select',
    label: 'Airlines',
    field: 'airlines',
    options: [],
  },
  {
    id: 'refundable',
    type: 'boolean',
    label: 'Refundable',
    field: 'isRefundable',
  },
];

// Hotel filter definitions
const HOTEL_FILTERS: FilterDefinition[] = [
  {
    id: 'price_per_night',
    type: 'range',
    label: 'Price per Night',
    field: 'price.amount',
    range: { min: 0, max: 1000, step: 25 },
  },
  {
    id: 'star_rating',
    type: 'multi_select',
    label: 'Star Rating',
    field: 'starRating',
    options: [
      { value: 5, label: '5 Stars', count: 0 },
      { value: 4, label: '4 Stars', count: 0 },
      { value: 3, label: '3 Stars', count: 0 },
      { value: 2, label: '2 Stars', count: 0 },
    ],
  },
  {
    id: 'guest_rating',
    type: 'range',
    label: 'Guest Rating',
    field: 'guestRating',
    range: { min: 0, max: 10, step: 0.5 },
  },
  {
    id: 'amenities',
    type: 'multi_select',
    label: 'Amenities',
    field: 'amenities',
    options: [
      { value: 'wifi', label: 'Free WiFi', count: 0 },
      { value: 'pool', label: 'Pool', count: 0 },
      { value: 'gym', label: 'Gym', count: 0 },
      { value: 'parking', label: 'Parking', count: 0 },
    ],
  },
  {
    id: 'free_cancellation',
    type: 'boolean',
    label: 'Free Cancellation',
    field: 'freeCancellation',
  },
];

// Car filter definitions
const CAR_FILTERS: FilterDefinition[] = [
  {
    id: 'price',
    type: 'range',
    label: 'Price per Day',
    field: 'price.amount',
    range: { min: 0, max: 500, step: 25 },
  },
  {
    id: 'vehicle_type',
    type: 'multi_select',
    label: 'Vehicle Type',
    field: 'vehicleType',
    options: [
      { value: 'economy', label: 'Economy', count: 0 },
      { value: 'compact', label: 'Compact', count: 0 },
      { value: 'midsize', label: 'Midsize', count: 0 },
      { value: 'suv', label: 'SUV', count: 0 },
      { value: 'luxury', label: 'Luxury', count: 0 },
    ],
  },
  {
    id: 'transmission',
    type: 'single_select',
    label: 'Transmission',
    field: 'transmission',
    options: [
      { value: 'automatic', label: 'Automatic', count: 0 },
      { value: 'manual', label: 'Manual', count: 0 },
    ],
  },
];

// Experience filter definitions
const EXPERIENCE_FILTERS: FilterDefinition[] = [
  {
    id: 'price',
    type: 'range',
    label: 'Price',
    field: 'price.amount',
    range: { min: 0, max: 500, step: 25 },
  },
  {
    id: 'duration',
    type: 'range',
    label: 'Duration (hours)',
    field: 'duration',
    range: { min: 0, max: 12, step: 1 },
  },
  {
    id: 'rating',
    type: 'range',
    label: 'Rating',
    field: 'rating',
    range: { min: 0, max: 5, step: 0.5 },
  },
  {
    id: 'category',
    type: 'multi_select',
    label: 'Category',
    field: 'category',
    options: [
      { value: 'tours', label: 'Tours', count: 0 },
      { value: 'activities', label: 'Activities', count: 0 },
      { value: 'food', label: 'Food & Drink', count: 0 },
      { value: 'culture', label: 'Culture', count: 0 },
    ],
  },
];

// Get filter definitions by category
function getFilterDefinitions(category: SearchCategory): FilterDefinition[] {
  switch (category) {
    case 'flights': return FLIGHT_FILTERS;
    case 'hotels': return HOTEL_FILTERS;
    case 'cars': return CAR_FILTERS;
    case 'experiences': return EXPERIENCE_FILTERS;
    default: return [];
  }
}

// Get nested value from object using dot notation
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce((current: unknown, key) => {
    if (current && typeof current === 'object') {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

// Calculate similarity between two results
function calculateSimilarity(a: UnifiedResult, b: UnifiedResult, category: SearchCategory): number {
  let score = 0;
  const maxScore = 100;

  // Same provider offer = definitely same
  if (a.provider.code === b.provider.code) {
    return 0; // Different providers only
  }

  // Price similarity (within 5% = high similarity)
  const priceDiff = Math.abs(a.price.amount - b.price.amount);
  const avgPrice = (a.price.amount + b.price.amount) / 2;
  if (priceDiff / avgPrice < 0.05) {
    score += 40;
  } else if (priceDiff / avgPrice < 0.10) {
    score += 20;
  }

  // Type-specific similarity
  const aData = a as Record<string, unknown>;
  const bData = b as Record<string, unknown>;

  if (category === 'flights') {
    // Same flight numbers
    const aFlights = aData.flightNumbers as string[] | undefined;
    const bFlights = bData.flightNumbers as string[] | undefined;
    if (aFlights && bFlights && JSON.stringify(aFlights.sort()) === JSON.stringify(bFlights.sort())) {
      score += 50;
    }
  } else if (category === 'hotels') {
    // Same name (fuzzy)
    const aName = (aData.name as string || '').toLowerCase();
    const bName = (bData.name as string || '').toLowerCase();
    if (aName === bName) {
      score += 50;
    } else if (aName.includes(bName) || bName.includes(aName)) {
      score += 30;
    }
  }

  return score / maxScore;
}

/**
 * Deduplicate results from multiple providers
 */
export function deduplicateResults(
  results: UnifiedResult[],
  category: SearchCategory
): DeduplicationResult {
  const threshold = SIMILARITY_THRESHOLDS[category];
  const uniqueResults: UnifiedResult[] = [];
  const duplicateGroups: DuplicateGroup[] = [];
  const processed = new Set<string>();

  // Sort by price (keep cheapest as primary)
  const sorted = [...results].sort((a, b) => a.price.amount - b.price.amount);

  for (const result of sorted) {
    if (processed.has(result.id)) continue;

    const duplicates: DuplicateGroup['duplicates'] = [];

    for (const other of sorted) {
      if (processed.has(other.id) || result.id === other.id) continue;

      const similarity = calculateSimilarity(result, other, category);
      if (similarity >= threshold) {
        duplicates.push({
          result: other,
          similarityScore: similarity,
          priceDifference: other.price.amount - result.price.amount,
        });
        processed.add(other.id);
      }
    }

    processed.add(result.id);

    if (duplicates.length > 0) {
      // Add alternatives to primary result
      const enrichedResult: UnifiedResult = {
        ...result,
        alternatives: duplicates.map(d => ({
          provider: d.result.provider,
          price: d.result.price,
          offerId: d.result.id,
        })),
      };
      uniqueResults.push(enrichedResult);
      duplicateGroups.push({ primaryResult: result, duplicates });
    } else {
      uniqueResults.push(result);
    }
  }

  return {
    uniqueResults,
    duplicateGroups,
    stats: {
      totalInput: results.length,
      uniqueOutput: uniqueResults.length,
      duplicatesFound: results.length - uniqueResults.length,
      duplicateRate: results.length > 0 
        ? (results.length - uniqueResults.length) / results.length 
        : 0,
    },
  };
}

// Calculate price score (lower = better)
function calculatePriceScore(result: UnifiedResult, allResults: UnifiedResult[]): number {
  if (allResults.length === 0) return 50;

  const prices = allResults.map(r => r.price.amount);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const range = maxPrice - minPrice;

  if (range === 0) return 50;

  const normalized = (result.price.amount - minPrice) / range;
  return (1 - normalized) * 100;
}

// Calculate quality score
function calculateQualityScore(result: UnifiedResult): number {
  let score = 50;
  const data = result as Record<string, unknown>;

  // Star rating (hotels)
  if (typeof data.starRating === 'number') {
    score = (data.starRating / 5) * 40 + 20;
  }

  // Guest rating
  if (typeof data.guestRating === 'number') {
    score = score * 0.6 + (data.guestRating / 10) * 100 * 0.4;
  }

  // Experience rating
  if (typeof data.rating === 'number') {
    score = (data.rating / 5) * 100;
  }

  return Math.min(100, score);
}

// Calculate relevance score
function calculateRelevanceScore(result: UnifiedResult, query: EnrichedQuery): number {
  let score = 50;
  const data = result as Record<string, unknown>;

  // Flight relevance
  if (result.type === 'flight') {
    const stops = data.totalStops as number | undefined;
    if (stops === 0) score += 20;
    else if (stops === 1) score += 10;
    else if (stops && stops > 1) score -= stops * 5;
  }

  // Hotel relevance - distance
  if (result.type === 'hotel') {
    const distance = data.distanceFromCenter as number | undefined;
    if (distance !== undefined) {
      if (distance < 1) score += 20;
      else if (distance < 3) score += 10;
      else if (distance > 10) score -= 10;
    }
  }

  return Math.max(0, Math.min(100, score));
}

// Calculate personalization score
function calculatePersonalizationScore(
  result: UnifiedResult,
  preferences?: UserPreferences
): number {
  if (!preferences) return 50;

  let score = 50;
  const data = result as Record<string, unknown>;

  // Budget alignment
  if (preferences.budgetLevel) {
    const priceAmount = result.price.amount;
    if (preferences.budgetLevel === 'budget' && priceAmount < 200) score += 15;
    else if (preferences.budgetLevel === 'mid_range' && priceAmount >= 200 && priceAmount < 500) score += 15;
    else if (preferences.budgetLevel === 'luxury' && priceAmount >= 500) score += 15;
  }

  // Airline preferences
  if (preferences.preferredAirlines && result.type === 'flight') {
    const airlines = data.airlines as string[] | undefined;
    if (airlines?.some(a => preferences.preferredAirlines?.includes(a))) {
      score += 15;
    }
  }

  return Math.max(0, Math.min(100, score));
}

// Calculate freshness score (how recent the data is)
function calculateFreshnessScore(result: UnifiedResult): number {
  const data = result as Record<string, unknown>;
  const retrievedAt = data.retrievedAt as string | undefined;

  if (!retrievedAt) return 50;

  const age = Date.now() - new Date(retrievedAt).getTime();
  const maxAge = 5 * 60 * 1000; // 5 minutes

  if (age < maxAge) {
    return 100 - (age / maxAge) * 50;
  }
  return 50;
}

/**
 * Rank results using multi-factor scoring
 */
export function rankResults(
  results: UnifiedResult[],
  query: EnrichedQuery
): UnifiedResult[] {
  const scored = results.map(result => {
    const priceScore = calculatePriceScore(result, results);
    const qualityScore = calculateQualityScore(result);
    const relevanceScore = calculateRelevanceScore(result, query);
    const personalizationScore = calculatePersonalizationScore(result, query.userPreferences);
    const freshnessScore = calculateFreshnessScore(result);

    const totalScore =
      priceScore * RANKING_WEIGHTS.price +
      qualityScore * RANKING_WEIGHTS.quality +
      relevanceScore * RANKING_WEIGHTS.relevance +
      personalizationScore * RANKING_WEIGHTS.personalization +
      freshnessScore * RANKING_WEIGHTS.freshness;

    const ranking: ResultRanking = {
      priceScore,
      qualityScore,
      relevanceScore,
      personalizationScore,
      freshnessScore,
      totalScore,
      rank: 0,
    };

    return { ...result, ranking };
  });

  // Sort by total score
  scored.sort((a, b) => (b.ranking?.totalScore || 0) - (a.ranking?.totalScore || 0));

  // Assign ranks
  scored.forEach((result, index) => {
    if (result.ranking) {
      result.ranking.rank = index + 1;
    }
  });

  return scored;
}

// Check if result matches filter
function matchesFilter(
  value: unknown,
  filterValue: unknown,
  filterType: FilterDefinition['type']
): boolean {
  if (filterValue === null || filterValue === undefined) return true;

  switch (filterType) {
    case 'boolean':
      return value === filterValue;

    case 'range':
      if (typeof value !== 'number') return true;
      const range = filterValue as { min?: number; max?: number };
      if (range.min !== undefined && value < range.min) return false;
      if (range.max !== undefined && value > range.max) return false;
      return true;

    case 'multi_select':
      if (!Array.isArray(filterValue)) return true;
      if (filterValue.length === 0) return true;
      if (Array.isArray(value)) {
        return value.some(v => filterValue.includes(v));
      }
      return filterValue.includes(value);

    case 'single_select':
      return value === filterValue;

    default:
      return true;
  }
}

// Count results matching a filter option
function countMatchingResults(
  results: UnifiedResult[],
  field: string,
  value: unknown
): number {
  return results.filter(r => {
    const fieldValue = getNestedValue(r as unknown as Record<string, unknown>, field);
    if (Array.isArray(fieldValue)) {
      return fieldValue.includes(value);
    }
    return fieldValue === value;
  }).length;
}

/**
 * Apply filters to results
 */
export function applyFilters(
  results: UnifiedResult[],
  category: SearchCategory,
  filters: AppliedFilters
): FilterResult {
  const definitions = getFilterDefinitions(category);
  const totalBefore = results.length;

  let filtered = [...results];

  for (const [filterId, filterValue] of Object.entries(filters)) {
    if (filterValue === null || filterValue === undefined) continue;

    const definition = definitions.find(d => d.id === filterId);
    if (!definition) continue;

    filtered = filtered.filter(result => {
      const fieldValue = getNestedValue(result as unknown as Record<string, unknown>, definition.field);
      return matchesFilter(fieldValue, filterValue, definition.type);
    });
  }

  // Update filter counts
  const updatedFilters = definitions.map(def => {
    if (def.options) {
      const updatedOptions: FilterOption[] = def.options.map(opt => ({
        ...opt,
        count: countMatchingResults(filtered, def.field, opt.value),
      }));
      return { ...def, options: updatedOptions };
    }
    return def;
  });

  return {
    filteredResults: filtered,
    availableFilters: updatedFilters,
    appliedFilters: filters,
    filterStats: {
      totalBefore,
      totalAfter: filtered.length,
      removedCount: totalBefore - filtered.length,
    },
  };
}

// Sort configuration
const SORT_CONFIGS: { option: SortOption; field: string; direction: 'asc' | 'desc' }[] = [
  { option: 'recommended', field: 'ranking.totalScore', direction: 'desc' },
  { option: 'price_low', field: 'price.amount', direction: 'asc' },
  { option: 'price_high', field: 'price.amount', direction: 'desc' },
  { option: 'duration_short', field: 'totalDurationMinutes', direction: 'asc' },
  { option: 'rating_high', field: 'guestRating', direction: 'desc' },
  { option: 'distance_near', field: 'distanceFromCenter', direction: 'asc' },
];

/**
 * Sort results by specified option
 */
export function sortResults(results: UnifiedResult[], sortBy: SortOption): UnifiedResult[] {
  const config = SORT_CONFIGS.find(c => c.option === sortBy);
  if (!config) return results;

  return [...results].sort((a, b) => {
    const aValue = getNestedValue(a as unknown as Record<string, unknown>, config.field);
    const bValue = getNestedValue(b as unknown as Record<string, unknown>, config.field);

    if (aValue === undefined || aValue === null) return 1;
    if (bValue === undefined || bValue === null) return -1;

    const aNum = typeof aValue === 'number' ? aValue : 0;
    const bNum = typeof bValue === 'number' ? bValue : 0;

    return config.direction === 'asc' ? aNum - bNum : bNum - aNum;
  });
}

/**
 * Get available sort options for a category
 */
export function getAvailableSorts(category: SearchCategory): SortOption[] {
  const common: SortOption[] = ['recommended', 'price_low', 'price_high'];

  switch (category) {
    case 'flights':
      return [...common, 'duration_short', 'departure_early', 'departure_late'];
    case 'hotels':
      return [...common, 'rating_high', 'distance_near'];
    case 'experiences':
      return [...common, 'rating_high', 'popularity'];
    default:
      return common;
  }
}

/**
 * Result Processor class
 */
export class ResultProcessor {
  deduplicate(results: UnifiedResult[], category: SearchCategory): DeduplicationResult {
    return deduplicateResults(results, category);
  }

  rank(results: UnifiedResult[], query: EnrichedQuery): UnifiedResult[] {
    return rankResults(results, query);
  }

  filter(results: UnifiedResult[], category: SearchCategory, filters: AppliedFilters): FilterResult {
    return applyFilters(results, category, filters);
  }

  sort(results: UnifiedResult[], sortBy: SortOption): UnifiedResult[] {
    return sortResults(results, sortBy);
  }

  getFilters(category: SearchCategory): FilterDefinition[] {
    return getFilterDefinitions(category);
  }

  getSorts(category: SearchCategory): SortOption[] {
    return getAvailableSorts(category);
  }
}

export const resultProcessor = new ResultProcessor();
