/**
 * FLIGHT SEARCH STATE
 * 
 * Shared state for flight search results between loading screen and results screen.
 * This allows the loading screen to perform the search and the results screen to display it
 * without duplicating the search or losing state between component mounts.
 */

import { create } from 'zustand';

interface FlightSearchState {
  results: any[];
  totalCount: number;
  isLoading: boolean;
  error: string | null;
  source: 'live' | 'cache' | 'mixed' | null;
  
  // Actions
  setResults: (results: any[], totalCount: number, source: 'live' | 'cache' | 'mixed') => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useFlightSearchState = create<FlightSearchState>((set) => ({
  results: [],
  totalCount: 0,
  isLoading: false,
  error: null,
  source: null,
  
  setResults: (results, totalCount, source) => set({ 
    results, 
    totalCount, 
    source,
    isLoading: false,
    error: null,
  }),
  
  setLoading: (isLoading) => set({ isLoading }),
  
  setError: (error) => set({ error, isLoading: false }),
  
  reset: () => set({
    results: [],
    totalCount: 0,
    isLoading: false,
    error: null,
    source: null,
  }),
}));
