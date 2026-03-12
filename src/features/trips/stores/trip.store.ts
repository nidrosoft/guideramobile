/**
 * TRIP STORE
 * Zustand store for trip state management
 */

import { create } from 'zustand';
import { Trip, TripState, CreateTripData, UpdateTripData } from '../types/trip.types';
import { canTransitionTo } from '../config/trip-states.config';
import { mockTrip, colombiaTrip } from './mockTripData';
import { supabase } from '@/lib/supabase/client';

/**
 * Map DB state/status to TripState enum based on dates
 */
function computeTripState(dbTrip: any): TripState {
  // Explicit states from DB
  if (dbTrip.state === 'cancelled' || dbTrip.status === 'cancelled') return TripState.CANCELLED;
  if (dbTrip.state === 'draft' && dbTrip.status !== 'planning') return TripState.DRAFT;

  // Date-based state computation
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startDate = dbTrip.start_date ? new Date(dbTrip.start_date) : null;
  const endDate = dbTrip.end_date ? new Date(dbTrip.end_date) : null;

  if (!startDate) return TripState.DRAFT;

  // Past: end_date + 2 days has passed
  if (endDate) {
    const pastThreshold = new Date(endDate);
    pastThreshold.setDate(pastThreshold.getDate() + 2);
    if (today > pastThreshold) return TripState.PAST;
  }

  // Ongoing: between start_date and end_date + 2 days
  if (startDate <= today && endDate && today <= new Date(endDate.getTime() + 2 * 86400000)) {
    return TripState.ONGOING;
  }

  // Upcoming: start_date is in the future
  if (startDate > today) return TripState.UPCOMING;

  // Default to draft for planning trips
  if (dbTrip.state === 'draft' || dbTrip.status === 'planning') return TripState.UPCOMING;

  return TripState.DRAFT;
}

/**
 * Convert a Supabase DB trip row into the Trip interface
 */
function dbTripToTrip(dbTrip: any): Trip {
  const computedState = computeTripState(dbTrip);
  const dest = dbTrip.destination || {};

  return {
    id: dbTrip.id,
    userId: dbTrip.user_id,
    state: computedState,
    destination: {
      id: dbTrip.id,
      name: dest.name || dbTrip.primary_destination_name || 'Unknown',
      city: dest.city || dbTrip.primary_destination_name || '',
      country: dest.country || dbTrip.primary_destination_country || '',
      coordinates: dest.latitude && dest.longitude
        ? { latitude: dest.latitude, longitude: dest.longitude }
        : undefined,
    },
    startDate: dbTrip.start_date ? new Date(dbTrip.start_date) : new Date(),
    endDate: dbTrip.end_date ? new Date(dbTrip.end_date) : new Date(),
    title: dbTrip.title || 'Untitled Trip',
    coverImage: dbTrip.cover_image_url || '',
    budget: dbTrip.budget_total
      ? { amount: Number(dbTrip.budget_total), currency: dbTrip.budget_currency || 'USD' }
      : undefined,
    travelers: [],
    bookings: [],
    metadata: {
      createdAt: new Date(dbTrip.created_at),
      updatedAt: new Date(dbTrip.updated_at || dbTrip.created_at),
      isShared: dbTrip.is_shared || false,
      shareCount: 0,
      tags: dbTrip.tags || [],
    },
    // Extended DB fields for the card UI
    _db: {
      flightCount: dbTrip.flight_count || 0,
      hotelCount: dbTrip.hotel_count || 0,
      carCount: dbTrip.car_count || 0,
      experienceCount: dbTrip.experience_count || 0,
      bookingCount: dbTrip.booking_count || 0,
      totalBookedAmount: dbTrip.total_booked_amount || 0,
      createdVia: dbTrip.created_via,
      primaryDestinationName: dbTrip.primary_destination_name,
      primaryDestinationCountry: dbTrip.primary_destination_country,
      travelerCount: dbTrip.traveler_count || 1,
      airlineName: dbTrip.airline_name,
      cabinClass: dbTrip.cabin_class,
      route: dbTrip.route,
      flightNumber: dbTrip.flight_number,
      seatNumber: dbTrip.seat_number,
      modulesGenerated: dbTrip.modules_generated || false,
    },
  };
}

interface TripStore {
  // State
  trips: Trip[];
  currentTrip: Trip | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchTrips: (userId?: string) => Promise<void>;
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
  
  // Fetch all trips — queries Supabase, falls back to mock data
  fetchTrips: async (userId?: string) => {
    set({ isLoading: true, error: null });
    try {
      // Query real trips from Supabase
      let query = supabase
        .from('trips')
        .select('*')
        .is('deleted_at', null)
        .order('start_date', { ascending: false });

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data: dbTrips, error: dbError } = await query;

      if (dbError) {
        console.warn('Failed to fetch trips from DB, using mock data:', dbError.message);
        set({ trips: [colombiaTrip, mockTrip], isLoading: false });
        return;
      }

      // Convert DB trips to Trip objects
      const realTrips = (dbTrips || []).map(dbTripToTrip);

      // Merge: real trips first, then mock data for demo
      const allTrips = realTrips.length > 0
        ? [...realTrips, colombiaTrip, mockTrip]
        : [colombiaTrip, mockTrip];

      set({ trips: allTrips, isLoading: false });
    } catch (error) {
      console.warn('fetchTrips error, using mock data:', error);
      set({ trips: [colombiaTrip, mockTrip], isLoading: false });
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
