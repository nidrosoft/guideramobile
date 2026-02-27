/**
 * Search Engine
 * Main orchestrator for the Search & Comparison Engine
 * Integrates with Provider Manager for multi-provider search
 */

import { supabase } from '@/lib/supabase/client';
import { providerManagerService } from '@/services/provider-manager.service';
import { queryProcessor } from './query-processor';
import { resultProcessor } from './result-processor';
import { sessionManager } from './session-manager';
import type {
  UnifiedSearchRequest,
  UnifiedSearchResponse,
  SearchCategory,
  EnrichedQuery,
  ExecutionResult,
  UnifiedResult,
  AutocompleteResult,
  DestinationIntelligence,
  FilterDefinition,
  SortOption,
} from '@/types/search';
import type { FlightSearchParams, HotelSearchParams, CarSearchParams, ExperienceSearchParams } from '@/types/unified';

/**
 * Execute search for a single category via Provider Manager
 */
async function executeProviderSearch(
  category: SearchCategory,
  query: EnrichedQuery
): Promise<ExecutionResult> {
  const startTime = Date.now();

  try {
    let searchResult: { results: unknown[]; source: string };

    if (category === 'flights') {
      const flightParams = {
        tripType: query.dates.endDate ? 'round_trip' : 'one_way',
        segments: [
          {
            origin: query.resolvedOrigin?.code || query.origin?.code || '',
            destination: query.resolvedDestination?.code || query.destination.code || '',
            departureDate: query.dates.startDate || '',
          },
          ...(query.dates.endDate ? [{
            origin: query.resolvedDestination?.code || query.destination.code || '',
            destination: query.resolvedOrigin?.code || query.origin?.code || '',
            departureDate: query.dates.endDate,
          }] : []),
        ],
        travelers: {
          adults: query.travelers.adults,
          children: query.travelers.children,
          infants: query.travelers.infants,
        },
        cabinClass: query.travelers.cabinClass,
      } as FlightSearchParams;
      const result = await providerManagerService.searchFlights(flightParams);
      searchResult = { results: result.results, source: result.source };

    } else if (category === 'hotels') {
      const hotelParams = {
        destination: {
          type: 'city',
          value: query.resolvedDestination?.name || query.destination.value,
        },
        checkInDate: query.dates.startDate || '',
        checkOutDate: query.dates.endDate || query.dates.startDate || '',
        rooms: [{ adults: query.travelers.adults, children: query.travelers.children }],
        guests: {
          adults: query.travelers.adults,
          children: query.travelers.children,
        },
      } as HotelSearchParams;
      const result = await providerManagerService.searchHotels(hotelParams);
      searchResult = { results: result.results, source: result.source };

    } else if (category === 'cars') {
      const carParams = {
        pickupLocation: {
          type: 'airport',
          value: query.resolvedDestination?.code || query.destination.code || '',
        },
        dropoffLocation: {
          type: 'airport',
          value: query.resolvedDestination?.code || query.destination.code || '',
        },
        pickupDateTime: `${query.dates.startDate || ''}T10:00:00`,
        dropoffDateTime: `${query.dates.endDate || query.dates.startDate || ''}T10:00:00`,
        driverAge: 30,
      } as unknown as CarSearchParams;
      const result = await providerManagerService.searchCars(carParams);
      searchResult = { results: result.results, source: result.source };

    } else if (category === 'experiences') {
      const expParams = {
        destination: {
          type: 'city',
          value: query.resolvedDestination?.name || query.destination.value,
        },
        dates: {
          startDate: query.dates.startDate || '',
          endDate: query.dates.endDate,
        },
        participants: {
          adults: query.travelers.adults,
          children: query.travelers.children,
        },
      } as ExperienceSearchParams;
      const result = await providerManagerService.searchExperiences(expParams);
      searchResult = { results: result.results, source: result.source };

    } else {
      throw new Error(`Unsupported category: ${category}`);
    }

    // Transform results to UnifiedResult format
    const results: UnifiedResult[] = (searchResult.results || []).map((item: unknown) => {
      const data = item as Record<string, unknown>;
      return {
        id: data.id as string,
        type: category.slice(0, -1) as UnifiedResult['type'],
        provider: data.provider as { code: string; name: string },
        price: data.price as { amount: number; currency: string; formatted: string },
        ...data,
      };
    });

    return {
      provider: 'multi',
      category,
      success: true,
      results,
      responseTime: Date.now() - startTime,
      fromCache: searchResult.source === 'cache',
    };
  } catch (error) {
    return {
      provider: 'multi',
      category,
      success: false,
      results: [],
      error: error as Error,
      responseTime: Date.now() - startTime,
      fromCache: false,
    };
  }
}

/**
 * Execute parallel search across multiple categories
 */
async function executeParallelSearch(
  categories: SearchCategory[],
  query: EnrichedQuery
): Promise<Map<SearchCategory, ExecutionResult[]>> {
  const results = new Map<SearchCategory, ExecutionResult[]>();

  // Execute all categories in parallel
  const promises = categories.map(async category => {
    const result = await executeProviderSearch(category, query);
    return { category, result };
  });

  const settled = await Promise.allSettled(promises);

  for (const outcome of settled) {
    if (outcome.status === 'fulfilled') {
      const { category, result } = outcome.value;
      results.set(category, [result]);
    }
  }

  return results;
}

/**
 * Get destination autocomplete suggestions
 */
export async function getAutocompleteSuggestions(
  query: string,
  type?: 'destination' | 'airport' | 'all'
): Promise<AutocompleteResult[]> {
  if (query.length < 2) return [];

  const searchQuery = query.toLowerCase().trim();

  // Search destination_intelligence table
  const { data: destinations } = await supabase
    .from('destination_intelligence')
    .select('*')
    .or(`destination_name.ilike.%${searchQuery}%,destination_code.ilike.${searchQuery}%`)
    .order('popularity_score', { ascending: false })
    .limit(10);

  const results: AutocompleteResult[] = (destinations || []).map(dest => ({
    type: dest.destination_type as AutocompleteResult['type'],
    code: dest.destination_code,
    name: dest.destination_name,
    fullName: `${dest.destination_name}, ${dest.country_code}`,
    emoji: dest.emoji,
    subtitle: dest.tagline,
  }));

  // Sort by relevance
  results.sort((a, b) => {
    if (a.code.toLowerCase() === searchQuery) return -1;
    if (b.code.toLowerCase() === searchQuery) return 1;
    if (a.name.toLowerCase().startsWith(searchQuery)) return -1;
    if (b.name.toLowerCase().startsWith(searchQuery)) return 1;
    return 0;
  });

  return results.slice(0, 8);
}

/**
 * Get trending destinations
 */
export async function getTrendingDestinations(limit: number = 10): Promise<DestinationIntelligence[]> {
  const { data } = await supabase
    .from('destination_intelligence')
    .select('*')
    .order('popularity_score', { ascending: false })
    .limit(limit);

  return (data || []).map(dest => ({
    code: dest.destination_code,
    name: dest.destination_name,
    type: dest.destination_type,
    countryCode: dest.country_code,
    tagline: dest.tagline,
    emoji: dest.emoji,
    heroImageUrl: dest.hero_image_url,
    bestMonths: dest.best_months,
    avgFlightPriceFromUs: dest.avg_flight_price_from_us,
    avgHotelPricePerNight: dest.avg_hotel_price_per_night,
    budgetLevel: dest.budget_level,
    goodFor: dest.good_for,
    popularityScore: dest.popularity_score,
  }));
}

/**
 * Main Search Engine class
 */
export class SearchEngine {
  /**
   * Execute a unified search
   */
  async search(request: UnifiedSearchRequest): Promise<UnifiedSearchResponse> {
    const startTime = Date.now();

    try {
      // 1. Parse query
      const parsed = queryProcessor.parse(request);

      // 2. Enrich with context
      const enriched = await queryProcessor.enrich(parsed, request.userId);

      // 3. Create session
      const session = await sessionManager.createSession(enriched, request.userId);

      // 4. Execute parallel search
      const executionResults = await executeParallelSearch(enriched.categories, enriched);

      // 5. Process and store results
      for (const [category, results] of executionResults) {
        await sessionManager.updateSessionResults(session.token, category, results);
      }

      // 6. Get final session state
      const finalSession = await sessionManager.getSession(session.token);
      if (!finalSession) {
        throw new Error('Failed to retrieve session');
      }

      // 7. Build response
      const filters: Record<string, FilterDefinition[]> = {};
      const sorts: Record<string, SortOption[]> = {};

      for (const category of enriched.categories) {
        filters[category] = resultProcessor.getFilters(category);
        sorts[category] = resultProcessor.getSorts(category);
      }

      // Calculate meta
      const providers: { code: string; responseTime: number; resultCount: number }[] = [];
      let cacheHits = 0;
      let liveResults = 0;

      for (const categoryResults of Object.values(finalSession.results)) {
        for (const provider of categoryResults.providers) {
          providers.push({
            code: provider.code,
            responseTime: provider.responseTime,
            resultCount: provider.resultCount,
          });
          if (provider.fromCache) cacheHits++;
          else liveResults++;
        }
      }

      return {
        success: true,
        data: {
          sessionToken: session.token,
          results: finalSession.results,
          query: {
            destination: enriched.resolvedDestination!,
            origin: enriched.resolvedOrigin,
            dates: enriched.dates,
            travelers: enriched.travelers,
          },
          filters,
          sorts,
          suggestions: enriched.intent.recommendations,
          destinationInfo: enriched.destinationIntelligence,
          meta: {
            searchDuration: Date.now() - startTime,
            providers,
            cacheHits,
            resultSources: { cached: cacheHits, live: liveResults },
          },
        },
      };
    } catch (error) {
      const err = error as Error;
      return {
        success: false,
        error: {
          code: 'SEARCH_ERROR',
          message: err.message || 'An error occurred during search',
        },
      };
    }
  }

  /**
   * Continue an existing session (filter, sort, paginate)
   */
  async continueSession(
    sessionToken: string,
    action: 'filter' | 'sort' | 'paginate',
    category: SearchCategory,
    params: Record<string, unknown>
  ): Promise<UnifiedSearchResponse> {
    try {
      const session = await sessionManager.getSession(sessionToken);
      if (!session) {
        return {
          success: false,
          error: { code: 'SESSION_NOT_FOUND', message: 'Session not found' },
        };
      }

      let updatedResults = session.results;

      if (action === 'filter') {
        const filterResult = await sessionManager.applySessionFilters(
          sessionToken,
          category,
          params.filters as Record<string, unknown>
        );
        updatedResults = {
          ...session.results,
          [category]: {
            ...session.results[category],
            items: filterResult.filteredResults,
            totalCount: filterResult.totalCount,
          },
        };
      } else if (action === 'sort') {
        const sortedResults = await sessionManager.applySessionSort(
          sessionToken,
          category,
          params.sortBy as SortOption
        );
        updatedResults = {
          ...session.results,
          [category]: {
            ...session.results[category],
            items: sortedResults,
          },
        };
      } else if (action === 'paginate') {
        const pageResult = await sessionManager.getPaginatedResults(
          sessionToken,
          category,
          params.page as number,
          params.pageSize as number
        );
        updatedResults = {
          ...session.results,
          [category]: {
            ...session.results[category],
            items: pageResult.items,
            pageInfo: pageResult.pageInfo,
          },
        };
      }

      return {
        success: true,
        data: {
          sessionToken,
          results: updatedResults,
          query: {
            destination: session.query.resolvedDestination!,
            origin: session.query.resolvedOrigin,
            dates: session.query.dates,
            travelers: session.query.travelers,
          },
          filters: {},
          sorts: {},
          suggestions: [],
          meta: {
            searchDuration: 0,
            providers: [],
            cacheHits: 0,
            resultSources: { cached: 0, live: 0 },
          },
        },
      };
    } catch (error) {
      const err = error as Error;
      return {
        success: false,
        error: {
          code: 'SESSION_ERROR',
          message: err.message || 'An error occurred',
        },
      };
    }
  }

  /**
   * Get autocomplete suggestions
   */
  async autocomplete(query: string): Promise<AutocompleteResult[]> {
    return getAutocompleteSuggestions(query);
  }

  /**
   * Get trending destinations
   */
  async getTrending(limit?: number): Promise<DestinationIntelligence[]> {
    return getTrendingDestinations(limit);
  }

  /**
   * Track offer click
   */
  async trackClick(sessionToken: string, offerId: string): Promise<void> {
    await sessionManager.trackOfferClick(sessionToken, offerId);
  }
}

export const searchEngine = new SearchEngine();
