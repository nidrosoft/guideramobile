/**
 * TRIP STORE
 * Zustand store for trip state management
 */

import { create } from 'zustand';
import { Trip, TripState, CreateTripData, UpdateTripData } from '../types/trip.types';
import { canTransitionTo } from '../config/trip-states.config';
import { mockTrip } from './mockTripData';

interface TripStore {
  // State
  trips: Trip[];
  currentTrip: Trip | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchTrips: () => Promise<void>;
  createTrip: (data: CreateTripData) => Promise<Trip>;
  updateTrip: (id: string, data: UpdateTripData) => Promise<void>;
  deleteTrip: (id: string) => Promise<void>;
  setCurrentTrip: (trip: Trip | null) => void;
  
  // State transitions
  publishTrip: (id: string) => Promise<void>;
  startTrip: (id: string) => Promise<void>;
  completeTrip: (id: string) => Promise<void>;
  cancelTrip: (id: string) => Promise<void>;
  
  // Filters
  filterByState: (state: TripState) => Trip[];
  searchTrips: (query: string) => Trip[];
  
  // Utilities
  clearError: () => void;
  reset: () => void;
}

export const useTripStore = create<TripStore>((set, get) => ({
  // Initial state
  trips: [],
  currentTrip: null,
  isLoading: false,
  error: null,
  
  // Fetch all trips
  fetchTrips: async () => {
    set({ isLoading: true, error: null });
    try {
      // TODO: Replace with actual API call
      // Using mock data for demonstration
      set({ trips: [mockTrip], isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch trips',
        isLoading: false 
      });
    }
  },
  
  // Create new trip
  createTrip: async (data: CreateTripData) => {
    set({ isLoading: true, error: null });
    try {
      // TODO: Replace with actual API call
      const newTrip: Trip = {
        id: Date.now().toString(),
        userId: 'current-user-id', // TODO: Get from auth
        state: TripState.DRAFT,
        destination: data.destination,
        startDate: data.startDate,
        endDate: data.endDate,
        title: data.title,
        coverImage: data.coverImage || '',
        budget: data.budget,
        travelers: [],
        bookings: [],
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          isShared: false,
          shareCount: 0,
          tags: [],
        },
      };
      
      set(state => ({
        trips: [...state.trips, newTrip],
        isLoading: false,
      }));
      
      return newTrip;
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },
  
  // Update trip
  updateTrip: async (id: string, data: UpdateTripData) => {
    set({ isLoading: true, error: null });
    try {
      // TODO: Replace with actual API call
      set(state => ({
        trips: state.trips.map(trip =>
          trip.id === id
            ? { ...trip, ...data, metadata: { ...trip.metadata, updatedAt: new Date() } }
            : trip
        ),
        isLoading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },
  
  // Delete trip
  deleteTrip: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      // TODO: Replace with actual API call
      set(state => ({
        trips: state.trips.filter(trip => trip.id !== id),
        currentTrip: state.currentTrip?.id === id ? null : state.currentTrip,
        isLoading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },
  
  // Set current trip
  setCurrentTrip: (trip: Trip | null) => {
    set({ currentTrip: trip });
  },
  
  // Publish trip (DRAFT → UPCOMING)
  publishTrip: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      // TODO: Replace with actual API call
      set(state => ({
        trips: state.trips.map(trip =>
          trip.id === id
            ? { ...trip, state: TripState.UPCOMING, metadata: { ...trip.metadata, updatedAt: new Date() } }
            : trip
        ),
        isLoading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },
  
  // Start trip (UPCOMING → ONGOING)
  startTrip: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      // TODO: Replace with actual API call
      set(state => ({
        trips: state.trips.map(trip =>
          trip.id === id
            ? { ...trip, state: TripState.ONGOING, metadata: { ...trip.metadata, updatedAt: new Date() } }
            : trip
        ),
        isLoading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },
  
  // Complete trip (ONGOING → PAST)
  completeTrip: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      // TODO: Replace with actual API call
      set(state => ({
        trips: state.trips.map(trip =>
          trip.id === id
            ? { ...trip, state: TripState.PAST, metadata: { ...trip.metadata, updatedAt: new Date() } }
            : trip
        ),
        isLoading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },
  
  // Cancel trip
  cancelTrip: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      // TODO: Replace with actual API call
      set(state => ({
        trips: state.trips.map(trip =>
          trip.id === id
            ? { ...trip, state: TripState.CANCELLED, metadata: { ...trip.metadata, updatedAt: new Date() } }
            : trip
        ),
        isLoading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },
  
  // Filter trips by state
  filterByState: (state: TripState) => {
    return get().trips.filter(trip => trip.state === state);
  },
  
  // Search trips
  searchTrips: (query: string) => {
    const lowerQuery = query.toLowerCase();
    return get().trips.filter(trip =>
      trip.title.toLowerCase().includes(lowerQuery) ||
      trip.destination.name.toLowerCase().includes(lowerQuery) ||
      trip.destination.city.toLowerCase().includes(lowerQuery) ||
      trip.destination.country.toLowerCase().includes(lowerQuery)
    );
  },
  
  // Clear error
  clearError: () => {
    set({ error: null });
  },
  
  // Reset store
  reset: () => {
    set({
      trips: [],
      currentTrip: null,
      isLoading: false,
      error: null,
    });
  },
}));
