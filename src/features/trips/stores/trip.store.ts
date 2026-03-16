/**
 * TRIP STORE
 * Zustand store for trip state management
 */

import { create } from 'zustand';
import { Trip, TripState, CreateTripData, UpdateTripData } from '../types/trip.types';
import { canTransitionTo } from '../config/trip-states.config';
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
  hasMore: boolean;
  
  // Actions
  fetchTrips: (userId: string) => Promise<void>;
  loadMoreTrips: (userId: string) => Promise<void>;
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
  hasMore: false,
  
  // Fetch trips from Supabase (owned + shared via trip_members) — paginated
  fetchTrips: async (userId: string) => {
    const PAGE_SIZE = 50;
    if (!userId) {
      console.error('[TripStore] fetchTrips called without userId — aborting to prevent data leak');
      set({ trips: [], isLoading: false });
      return;
    }
    set({ isLoading: true, error: null });
    try {
      // 1. Fetch owned trips — ALWAYS filtered by user_id
      const ownedQuery = supabase
        .from('trips')
        .select('*')
        .eq('user_id', userId)
        .is('deleted_at', null)
        .order('start_date', { ascending: false })
        .limit(PAGE_SIZE);

      const { data: ownedTrips, error: ownedError } = await ownedQuery;

      if (ownedError) {
        if (__DEV__) console.warn('Failed to fetch owned trips:', ownedError.message);
        set({ trips: [], isLoading: false, error: ownedError.message });
        return;
      }

      // 2. Fetch shared trips via trip_members
      let sharedTrips: any[] = [];
      if (userId) {
        const { data: memberRows } = await supabase
          .from('trip_members')
          .select('trip_id')
          .eq('user_id', userId)
          .limit(50);

        if (memberRows && memberRows.length > 0) {
          const memberTripIds = memberRows.map(r => r.trip_id);
          const ownedIds = new Set((ownedTrips || []).map(t => t.id));
          const newIds = memberTripIds.filter(id => !ownedIds.has(id));

          if (newIds.length > 0) {
            const { data: shared } = await supabase
              .from('trips')
              .select('*')
              .in('id', newIds)
              .is('deleted_at', null)
              .order('start_date', { ascending: false });
            sharedTrips = shared || [];
          }
        }
      }

      // 3. Combine and deduplicate
      const allDbTrips = [...(ownedTrips || []), ...sharedTrips];
      const realTrips = allDbTrips.map(dbTripToTrip);
      const hasMore = (ownedTrips || []).length >= PAGE_SIZE;
      set({ trips: realTrips, isLoading: false, hasMore });
    } catch (error) {
      if (__DEV__) console.warn('fetchTrips error:', error);
      set({ trips: [], error: (error as Error).message, isLoading: false });
    }
  },

  // Load more trips (pagination)
  loadMoreTrips: async (userId: string) => {
    const PAGE_SIZE = 50;
    const { trips, isLoading, hasMore } = get();
    if (isLoading || !hasMore || !userId) return;

    set({ isLoading: true });
    try {
      const query = supabase
        .from('trips')
        .select('*')
        .eq('user_id', userId)
        .is('deleted_at', null)
        .order('start_date', { ascending: false })
        .range(trips.length, trips.length + PAGE_SIZE - 1);

      const { data: moreTrips, error } = await query;
      if (error) {
        set({ isLoading: false });
        return;
      }

      const newTrips = (moreTrips || []).map(dbTripToTrip);
      const existingIds = new Set(trips.map(t => t.id));
      const deduped = newTrips.filter(t => !existingIds.has(t.id));
      
      set({
        trips: [...trips, ...deduped],
        isLoading: false,
        hasMore: (moreTrips || []).length >= PAGE_SIZE,
      });
    } catch (error) {
      set({ isLoading: false });
    }
  },
  
  // Create new trip
  createTrip: async (data: CreateTripData) => {
    set({ isLoading: true, error: null });
    try {
      const insertPayload: Record<string, any> = {
        user_id: data.userId,
        title: data.title,
        destination: {
          name: data.destination.name,
          city: data.destination.city,
          country: data.destination.country,
          ...(data.destination.coordinates ? {
            latitude: data.destination.coordinates.latitude,
            longitude: data.destination.coordinates.longitude,
          } : {}),
        },
        primary_destination_name: data.destination.city || data.destination.name,
        primary_destination_country: data.destination.country,
        start_date: data.startDate instanceof Date ? data.startDate.toISOString().split('T')[0] : data.startDate,
        end_date: data.endDate instanceof Date ? data.endDate.toISOString().split('T')[0] : data.endDate,
        state: 'draft',
        cover_image_url: data.coverImage || null,
      };

      if (data.budget) {
        insertPayload.budget_total = data.budget.amount;
        insertPayload.budget_currency = data.budget.currency;
        insertPayload.budget = { amount: data.budget.amount, currency: data.budget.currency };
      }

      const { data: dbTrip, error: dbError } = await supabase
        .from('trips')
        .insert(insertPayload)
        .select()
        .single();

      if (dbError) throw new Error(dbError.message);

      const newTrip = dbTripToTrip(dbTrip);

      set(state => ({
        trips: [newTrip, ...state.trips],
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
      const updatePayload: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };

      if (data.title !== undefined) updatePayload.title = data.title;
      if (data.description !== undefined) updatePayload.description = data.description;
      if (data.coverImage !== undefined) updatePayload.cover_image_url = data.coverImage;
      if (data.startDate !== undefined) {
        updatePayload.start_date = data.startDate instanceof Date ? data.startDate.toISOString().split('T')[0] : data.startDate;
      }
      if (data.endDate !== undefined) {
        updatePayload.end_date = data.endDate instanceof Date ? data.endDate.toISOString().split('T')[0] : data.endDate;
      }
      if (data.destination) {
        updatePayload.destination = {
          name: data.destination.name,
          city: data.destination.city,
          country: data.destination.country,
          ...(data.destination.coordinates ? {
            latitude: data.destination.coordinates.latitude,
            longitude: data.destination.coordinates.longitude,
          } : {}),
        };
        updatePayload.primary_destination_name = data.destination.city || data.destination.name;
        updatePayload.primary_destination_country = data.destination.country;
      }
      if (data.budget) {
        updatePayload.budget_total = data.budget.amount;
        updatePayload.budget_currency = data.budget.currency;
        updatePayload.budget = { amount: data.budget.amount, currency: data.budget.currency };
      }

      const { data: dbTrip, error: dbError } = await supabase
        .from('trips')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single();

      if (dbError) throw new Error(dbError.message);

      const updatedTrip = dbTripToTrip(dbTrip);

      set(state => ({
        trips: state.trips.map(trip => trip.id === id ? updatedTrip : trip),
        isLoading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },
  
  // Delete trip (soft delete)
  deleteTrip: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const { error: dbError } = await supabase
        .from('trips')
        .update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('id', id);

      if (dbError) throw new Error(dbError.message);

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
      const { data: dbTrip, error: dbError } = await supabase
        .from('trips')
        .update({
          state: 'upcoming',
          published_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (dbError) throw new Error(dbError.message);

      const updatedTrip = dbTripToTrip(dbTrip);
      set(state => ({
        trips: state.trips.map(trip => trip.id === id ? updatedTrip : trip),
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
      const { data: dbTrip, error: dbError } = await supabase
        .from('trips')
        .update({
          state: 'ongoing',
          started_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (dbError) throw new Error(dbError.message);

      const updatedTrip = dbTripToTrip(dbTrip);
      set(state => ({
        trips: state.trips.map(trip => trip.id === id ? updatedTrip : trip),
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
      const { data: dbTrip, error: dbError } = await supabase
        .from('trips')
        .update({
          state: 'past',
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (dbError) throw new Error(dbError.message);

      const updatedTrip = dbTripToTrip(dbTrip);
      set(state => ({
        trips: state.trips.map(trip => trip.id === id ? updatedTrip : trip),
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
      const { data: dbTrip, error: dbError } = await supabase
        .from('trips')
        .update({
          state: 'cancelled',
          cancelled_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (dbError) throw new Error(dbError.message);

      const updatedTrip = dbTripToTrip(dbTrip);
      set(state => ({
        trips: state.trips.map(trip => trip.id === id ? updatedTrip : trip),
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
