/**
 * USE PROVIDER SEARCH HOOK
 * 
 * React hooks for searching travel products through the Provider Manager.
 */

import { useState, useCallback } from 'react';
import {
  providerManagerService,
  SearchResult,
  SearchOptions,
  UserSearchPreferences,
  ProviderManagerError,
} from '@/services/provider-manager.service';
import {
  UnifiedFlight,
  UnifiedHotel,
  UnifiedCarRental,
  UnifiedExperience,
  UnifiedPackage,
  FlightSearchParams,
  HotelSearchParams,
  CarSearchParams,
  ExperienceSearchParams,
  PackageSearchParams,
  ProviderMeta,
} from '@/types/unified';

// ============================================
// TYPES
// ============================================

export interface UseSearchState<T> {
  results: T[];
  totalCount: number;
  providers: ProviderMeta[];
  sessionId: string | null;
  isLoading: boolean;
  error: string | null;
  source: 'live' | 'cache' | 'mixed' | null;
  durationMs: number | null;
}

export interface UseSearchActions<P> {
  search: (params: P, options?: SearchOptions, preferences?: UserSearchPreferences) => Promise<void>;
  reset: () => void;
  refresh: () => Promise<void>;
}

// ============================================
// GENERIC SEARCH HOOK
// ============================================

function useSearch<T, P>(
  searchFn: (params: P, options?: SearchOptions, preferences?: UserSearchPreferences) => Promise<SearchResult<T>>
): [UseSearchState<T>, UseSearchActions<P>] {
  const [state, setState] = useState<UseSearchState<T>>({
    results: [],
    totalCount: 0,
    providers: [],
    sessionId: null,
    isLoading: false,
    error: null,
    source: null,
    durationMs: null,
  });

  const [lastParams, setLastParams] = useState<P | null>(null);
  const [lastOptions, setLastOptions] = useState<SearchOptions | undefined>(undefined);
  const [lastPreferences, setLastPreferences] = useState<UserSearchPreferences | undefined>(undefined);

  const search = useCallback(async (
    params: P,
    options?: SearchOptions,
    preferences?: UserSearchPreferences
  ) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    setLastParams(params);
    setLastOptions(options);
    setLastPreferences(preferences);

    try {
      const result = await searchFn(params, options, preferences);

      setState({
        results: result.results,
        totalCount: result.totalCount,
        providers: result.providers,
        sessionId: result.sessionId,
        isLoading: false,
        error: null,
        source: result.source,
        durationMs: result.durationMs,
      });
    } catch (error) {
      const message = error instanceof ProviderManagerError
        ? error.message
        : error instanceof Error
          ? error.message
          : 'Search failed';

      setState(prev => ({
        ...prev,
        isLoading: false,
        error: message,
      }));
    }
  }, [searchFn]);

  const reset = useCallback(() => {
    setState({
      results: [],
      totalCount: 0,
      providers: [],
      sessionId: null,
      isLoading: false,
      error: null,
      source: null,
      durationMs: null,
    });
    setLastParams(null);
  }, []);

  const refresh = useCallback(async () => {
    if (!lastParams) return;

    await search(lastParams, { ...lastOptions, refresh: true }, lastPreferences);
  }, [lastParams, lastOptions, lastPreferences, search]);

  return [state, { search, reset, refresh }];
}

// ============================================
// FLIGHT SEARCH HOOK
// ============================================

export function useFlightSearch(): [UseSearchState<UnifiedFlight>, UseSearchActions<FlightSearchParams>] {
  return useSearch<UnifiedFlight, FlightSearchParams>(
    providerManagerService.searchFlights.bind(providerManagerService)
  );
}

// ============================================
// HOTEL SEARCH HOOK
// ============================================

export function useHotelSearch(): [UseSearchState<UnifiedHotel>, UseSearchActions<HotelSearchParams>] {
  return useSearch<UnifiedHotel, HotelSearchParams>(
    providerManagerService.searchHotels.bind(providerManagerService)
  );
}

// ============================================
// CAR SEARCH HOOK
// ============================================

export function useCarSearch(): [UseSearchState<UnifiedCarRental>, UseSearchActions<CarSearchParams>] {
  return useSearch<UnifiedCarRental, CarSearchParams>(
    providerManagerService.searchCars.bind(providerManagerService)
  );
}

// ============================================
// EXPERIENCE SEARCH HOOK
// ============================================

export function useExperienceSearch(): [UseSearchState<UnifiedExperience>, UseSearchActions<ExperienceSearchParams>] {
  return useSearch<UnifiedExperience, ExperienceSearchParams>(
    providerManagerService.searchExperiences.bind(providerManagerService)
  );
}

// ============================================
// PACKAGE SEARCH HOOK
// ============================================

export function usePackageSearch(): [UseSearchState<UnifiedPackage>, UseSearchActions<PackageSearchParams>] {
  return useSearch<UnifiedPackage, PackageSearchParams>(
    providerManagerService.searchPackages.bind(providerManagerService)
  );
}

// ============================================
// OFFER DETAILS HOOK
// ============================================

export function useOfferDetails() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getDetails = useCallback(async (
    offerId: string,
    providerCode: string,
    category: 'flights' | 'hotels' | 'cars' | 'experiences'
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await providerManagerService.getOfferDetails(offerId, providerCode, category);
      setIsLoading(false);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get offer details';
      setError(message);
      setIsLoading(false);
      throw err;
    }
  }, []);

  return { getDetails, isLoading, error };
}

// ============================================
// PRICE VERIFICATION HOOK
// ============================================

export function usePriceVerification() {
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const verify = useCallback(async (
    offerId: string,
    providerCode: string,
    category: 'flights' | 'hotels' | 'cars' | 'experiences'
  ) => {
    setIsVerifying(true);
    setError(null);

    try {
      const result = await providerManagerService.verifyPrice(offerId, providerCode, category);
      setIsVerifying(false);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Price verification failed';
      setError(message);
      setIsVerifying(false);
      throw err;
    }
  }, []);

  return { verify, isVerifying, error };
}
