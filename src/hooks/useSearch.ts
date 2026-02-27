/**
 * useSearch Hook
 * React hook for the Search & Comparison Engine
 */

import { useState, useCallback, useRef } from 'react';
import { searchEngine } from '@/services/search/search-engine';
import type {
  UnifiedSearchRequest,
  UnifiedSearchResponse,
  SearchCategory,
  UnifiedResult,
  CategoryResults,
  FilterDefinition,
  SortOption,
  AutocompleteResult,
  DestinationIntelligence,
} from '@/types/search';

// Search State
interface SearchState {
  isLoading: boolean;
  isSearching: boolean;
  error: Error | null;
  sessionToken: string | null;
  results: CategoryResults;
  filters: Record<string, FilterDefinition[]>;
  sorts: Record<string, SortOption[]>;
  destinationInfo: DestinationIntelligence | null;
  searchDuration: number;
}

const initialState: SearchState = {
  isLoading: false,
  isSearching: false,
  error: null,
  sessionToken: null,
  results: {},
  filters: {},
  sorts: {},
  destinationInfo: null,
  searchDuration: 0,
};

// Search Actions
interface SearchActions {
  search: (params: UnifiedSearchRequest) => Promise<UnifiedSearchResponse>;
  applyFilters: (category: SearchCategory, filters: Record<string, unknown>) => Promise<void>;
  applySort: (category: SearchCategory, sortBy: SortOption) => Promise<void>;
  loadMore: (category: SearchCategory) => Promise<void>;
  trackClick: (offerId: string) => Promise<void>;
  reset: () => void;
}

/**
 * Main search hook
 */
export function useSearch(): [SearchState, SearchActions] {
  const [state, setState] = useState<SearchState>(initialState);
  const currentPageRef = useRef<Record<string, number>>({});

  const search = useCallback(async (params: UnifiedSearchRequest): Promise<UnifiedSearchResponse> => {
    setState(prev => ({ ...prev, isLoading: true, isSearching: true, error: null }));

    try {
      const response = await searchEngine.search(params);

      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          isSearching: false,
          sessionToken: response.data!.sessionToken,
          results: response.data!.results,
          filters: response.data!.filters,
          sorts: response.data!.sorts,
          destinationInfo: response.data!.destinationInfo || null,
          searchDuration: response.data!.meta.searchDuration,
        }));

        // Reset page counters
        currentPageRef.current = {};
        Object.keys(response.data.results).forEach(cat => {
          currentPageRef.current[cat] = 1;
        });
      } else {
        throw new Error(response.error?.message || 'Search failed');
      }

      return response;
    } catch (error) {
      const err = error as Error;
      setState(prev => ({
        ...prev,
        isLoading: false,
        isSearching: false,
        error: err,
      }));
      throw error;
    }
  }, []);

  const applyFilters = useCallback(async (
    category: SearchCategory,
    filters: Record<string, unknown>
  ): Promise<void> => {
    if (!state.sessionToken) return;

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const response = await searchEngine.continueSession(
        state.sessionToken,
        'filter',
        category,
        { filters }
      );

      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          results: response.data!.results,
        }));
      }
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false, error: error as Error }));
    }
  }, [state.sessionToken]);

  const applySort = useCallback(async (
    category: SearchCategory,
    sortBy: SortOption
  ): Promise<void> => {
    if (!state.sessionToken) return;

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const response = await searchEngine.continueSession(
        state.sessionToken,
        'sort',
        category,
        { sortBy }
      );

      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          results: response.data!.results,
        }));
      }
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false, error: error as Error }));
    }
  }, [state.sessionToken]);

  const loadMore = useCallback(async (category: SearchCategory): Promise<void> => {
    if (!state.sessionToken) return;

    const currentPage = currentPageRef.current[category] || 1;
    const nextPage = currentPage + 1;

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const response = await searchEngine.continueSession(
        state.sessionToken,
        'paginate',
        category,
        { page: nextPage, pageSize: 50 }
      );

      if (response.success && response.data) {
        currentPageRef.current[category] = nextPage;

        setState(prev => ({
          ...prev,
          isLoading: false,
          results: {
            ...prev.results,
            [category]: {
              ...prev.results[category],
              items: [
                ...prev.results[category].items,
                ...response.data!.results[category].items,
              ],
              pageInfo: response.data!.results[category].pageInfo,
            },
          },
        }));
      }
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false, error: error as Error }));
    }
  }, [state.sessionToken, state.results]);

  const trackClick = useCallback(async (offerId: string): Promise<void> => {
    if (!state.sessionToken) return;
    await searchEngine.trackClick(state.sessionToken, offerId);
  }, [state.sessionToken]);

  const reset = useCallback(() => {
    setState(initialState);
    currentPageRef.current = {};
  }, []);

  return [
    state,
    { search, applyFilters, applySort, loadMore, trackClick, reset },
  ];
}

// Autocomplete State
interface AutocompleteState {
  isLoading: boolean;
  results: AutocompleteResult[];
}

/**
 * Autocomplete hook for destination search
 */
export function useAutocomplete() {
  const [state, setState] = useState<AutocompleteState>({
    isLoading: false,
    results: [],
  });
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback((query: string) => {
    // Clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (query.length < 2) {
      setState({ isLoading: false, results: [] });
      return;
    }

    setState(prev => ({ ...prev, isLoading: true }));

    // Debounce 300ms
    debounceRef.current = setTimeout(async () => {
      try {
        const results = await searchEngine.autocomplete(query);
        setState({ isLoading: false, results });
      } catch {
        setState({ isLoading: false, results: [] });
      }
    }, 300);
  }, []);

  const clear = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    setState({ isLoading: false, results: [] });
  }, []);

  return {
    ...state,
    search,
    clear,
  };
}

/**
 * Trending destinations hook
 */
export function useTrendingDestinations(limit: number = 10) {
  const [isLoading, setIsLoading] = useState(false);
  const [destinations, setDestinations] = useState<DestinationIntelligence[]>([]);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const results = await searchEngine.getTrending(limit);
      setDestinations(results);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  return {
    isLoading,
    destinations,
    error,
    fetch,
  };
}

/**
 * Category-specific search hook
 */
export function useCategorySearch(category: SearchCategory) {
  const [state, actions] = useSearch();

  const categoryResults = state.results[category];
  const categoryFilters = state.filters[category] || [];
  const categorySorts = state.sorts[category] || [];

  const searchCategory = useCallback(async (params: Omit<UnifiedSearchRequest, 'mode'>) => {
    return actions.search({
      ...params,
      mode: category.slice(0, -1) as UnifiedSearchRequest['mode'], // 'flights' -> 'flight'
    });
  }, [actions, category]);

  return {
    isLoading: state.isLoading,
    error: state.error,
    results: categoryResults?.items || [],
    totalCount: categoryResults?.totalCount || 0,
    pageInfo: categoryResults?.pageInfo,
    filters: categoryFilters,
    sorts: categorySorts,
    search: searchCategory,
    applyFilters: (filters: Record<string, unknown>) => actions.applyFilters(category, filters),
    applySort: (sortBy: SortOption) => actions.applySort(category, sortBy),
    loadMore: () => actions.loadMore(category),
    trackClick: actions.trackClick,
    reset: actions.reset,
  };
}

// Convenience hooks for each category
export const useFlightSearch = () => useCategorySearch('flights');
export const useHotelSearch = () => useCategorySearch('hotels');
export const useCarSearch = () => useCategorySearch('cars');
export const useExperienceSearch = () => useCategorySearch('experiences');
