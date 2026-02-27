/**
 * USE TRIPS HOOK
 * React hooks for trip management
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import {
  Trip,
  TripWithDetails,
  TripTraveler,
  TripActivity,
  TripItinerary,
  TripFilters,
  CreateTripInput,
  UpdateTripInput,
  CreateActivityInput,
  UpdateActivityInput,
  GetTripOptions,
  TripStatus,
} from '@/services/trip/trip.types';
import {
  TripCoreService,
  TripLifecycleService,
  TripCollaborationService,
} from '@/services/trip';

// ============================================
// USE TRIPS (List)
// ============================================

interface UseTripsState {
  trips: Trip[];
  isLoading: boolean;
  error: Error | null;
  hasMore: boolean;
  total: number;
}

interface UseTripsActions {
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
  createTrip: (input: CreateTripInput) => Promise<Trip>;
  deleteTrip: (tripId: string) => Promise<void>;
}

export function useTrips(
  userId: string | undefined,
  filters?: TripFilters
): [UseTripsState, UseTripsActions] {
  const [state, setState] = useState<UseTripsState>({
    trips: [],
    isLoading: true,
    error: null,
    hasMore: false,
    total: 0,
  });

  const [offset, setOffset] = useState(0);
  const limit = filters?.limit || 20;

  const fetchTrips = useCallback(async (reset = false) => {
    if (!userId) {
      setState(prev => ({ ...prev, isLoading: false }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const currentOffset = reset ? 0 : offset;
      const result = await TripCoreService.getUserTrips(userId, {
        ...filters,
        limit,
        offset: currentOffset,
      });

      setState(prev => ({
        trips: reset ? result.trips : [...prev.trips, ...result.trips],
        isLoading: false,
        error: null,
        hasMore: result.hasMore,
        total: result.total,
      }));

      if (reset) setOffset(limit);
      else setOffset(currentOffset + limit);
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error as Error,
      }));
    }
  }, [userId, filters, offset, limit]);

  useEffect(() => {
    fetchTrips(true);
  }, [userId, JSON.stringify(filters)]);

  const refresh = useCallback(() => fetchTrips(true), [fetchTrips]);
  const loadMore = useCallback(() => fetchTrips(false), [fetchTrips]);

  const createTrip = useCallback(async (input: CreateTripInput): Promise<Trip> => {
    const trip = await TripCoreService.createTrip(input);
    setState(prev => ({
      ...prev,
      trips: [trip, ...prev.trips],
      total: prev.total + 1,
    }));
    return trip;
  }, []);

  const deleteTrip = useCallback(async (tripId: string): Promise<void> => {
    if (!userId) return;
    await TripCoreService.deleteTrip(tripId, userId);
    setState(prev => ({
      ...prev,
      trips: prev.trips.filter(t => t.id !== tripId),
      total: prev.total - 1,
    }));
  }, [userId]);

  return [state, { refresh, loadMore, createTrip, deleteTrip }];
}

// ============================================
// USE TRIP (Single)
// ============================================

interface UseTripState {
  trip: TripWithDetails | null;
  isLoading: boolean;
  error: Error | null;
}

interface UseTripActions {
  refresh: () => Promise<void>;
  update: (updates: UpdateTripInput) => Promise<Trip>;
  confirm: () => Promise<Trip>;
  cancel: (reason?: string) => Promise<Trip>;
  archive: () => Promise<Trip>;
  addActivity: (activity: CreateActivityInput) => Promise<TripActivity>;
  updateActivity: (activityId: string, updates: UpdateActivityInput) => Promise<TripActivity>;
  deleteActivity: (activityId: string) => Promise<void>;
  inviteTraveler: (invitation: { email?: string; name?: string; role?: string; message?: string }) => Promise<void>;
  removeTraveler: (travelerId: string) => Promise<void>;
  enableShareLink: (options?: { permission?: 'view' | 'edit'; expiresInDays?: number }) => Promise<{ token: string; url: string }>;
  disableShareLink: () => Promise<void>;
}

export function useTrip(
  tripId: string | undefined,
  userId: string | undefined,
  options: GetTripOptions = {}
): [UseTripState, UseTripActions] {
  const [state, setState] = useState<UseTripState>({
    trip: null,
    isLoading: true,
    error: null,
  });

  const fetchTrip = useCallback(async () => {
    if (!tripId || !userId) {
      setState(prev => ({ ...prev, isLoading: false }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const trip = await TripCoreService.getTrip(tripId, userId, {
        includeTravelers: true,
        includeBookings: true,
        includeActivities: true,
        ...options,
      });

      setState({ trip, isLoading: false, error: null });
    } catch (error) {
      setState({ trip: null, isLoading: false, error: error as Error });
    }
  }, [tripId, userId, JSON.stringify(options)]);

  useEffect(() => {
    fetchTrip();
  }, [fetchTrip]);

  const refresh = useCallback(() => fetchTrip(), [fetchTrip]);

  const update = useCallback(async (updates: UpdateTripInput): Promise<Trip> => {
    if (!tripId || !userId) throw new Error('Trip or user not available');
    const updated = await TripCoreService.updateTrip(tripId, userId, updates);
    setState(prev => prev.trip ? { ...prev, trip: { ...prev.trip, ...updated } } : prev);
    return updated;
  }, [tripId, userId]);

  const confirm = useCallback(async (): Promise<Trip> => {
    if (!tripId || !userId) throw new Error('Trip or user not available');
    const updated = await TripLifecycleService.confirmTrip(tripId, userId);
    setState(prev => prev.trip ? { ...prev, trip: { ...prev.trip, ...updated } } : prev);
    return updated;
  }, [tripId, userId]);

  const cancel = useCallback(async (reason?: string): Promise<Trip> => {
    if (!tripId || !userId) throw new Error('Trip or user not available');
    const updated = await TripLifecycleService.cancelTrip(tripId, userId, reason);
    setState(prev => prev.trip ? { ...prev, trip: { ...prev.trip, ...updated } } : prev);
    return updated;
  }, [tripId, userId]);

  const archive = useCallback(async (): Promise<Trip> => {
    if (!tripId || !userId) throw new Error('Trip or user not available');
    const updated = await TripLifecycleService.archiveTrip(tripId, userId);
    setState(prev => prev.trip ? { ...prev, trip: { ...prev.trip, ...updated } } : prev);
    return updated;
  }, [tripId, userId]);

  const addActivity = useCallback(async (activity: CreateActivityInput): Promise<TripActivity> => {
    if (!tripId || !userId) throw new Error('Trip or user not available');
    const created = await TripCoreService.addActivity(tripId, userId, activity);
    setState(prev => {
      if (!prev.trip) return prev;
      return {
        ...prev,
        trip: {
          ...prev.trip,
          activities: [...(prev.trip.activities || []), created],
        },
      };
    });
    return created;
  }, [tripId, userId]);

  const updateActivity = useCallback(async (activityId: string, updates: UpdateActivityInput): Promise<TripActivity> => {
    if (!tripId || !userId) throw new Error('Trip or user not available');
    const updated = await TripCoreService.updateActivity(tripId, activityId, userId, updates);
    setState(prev => {
      if (!prev.trip) return prev;
      return {
        ...prev,
        trip: {
          ...prev.trip,
          activities: prev.trip.activities?.map(a => a.id === activityId ? updated : a),
        },
      };
    });
    return updated;
  }, [tripId, userId]);

  const deleteActivity = useCallback(async (activityId: string): Promise<void> => {
    if (!tripId || !userId) throw new Error('Trip or user not available');
    await TripCoreService.deleteActivity(tripId, activityId, userId);
    setState(prev => {
      if (!prev.trip) return prev;
      return {
        ...prev,
        trip: {
          ...prev.trip,
          activities: prev.trip.activities?.filter(a => a.id !== activityId),
        },
      };
    });
  }, [tripId, userId]);

  const inviteTraveler = useCallback(async (invitation: { email?: string; name?: string; role?: string; message?: string }): Promise<void> => {
    if (!tripId || !userId) throw new Error('Trip or user not available');
    await TripCollaborationService.inviteTraveler(tripId, userId, invitation as any);
    await fetchTrip();
  }, [tripId, userId, fetchTrip]);

  const removeTraveler = useCallback(async (travelerId: string): Promise<void> => {
    if (!tripId || !userId) throw new Error('Trip or user not available');
    await TripCollaborationService.removeTraveler(tripId, travelerId, userId);
    setState(prev => {
      if (!prev.trip) return prev;
      return {
        ...prev,
        trip: {
          ...prev.trip,
          travelers: prev.trip.travelers?.filter(t => t.id !== travelerId),
        },
      };
    });
  }, [tripId, userId]);

  const enableShareLink = useCallback(async (options?: { permission?: 'view' | 'edit'; expiresInDays?: number }): Promise<{ token: string; url: string }> => {
    if (!tripId || !userId) throw new Error('Trip or user not available');
    const result = await TripCoreService.enableShareLink(tripId, userId, options);
    await fetchTrip();
    return result;
  }, [tripId, userId, fetchTrip]);

  const disableShareLink = useCallback(async (): Promise<void> => {
    if (!tripId || !userId) throw new Error('Trip or user not available');
    await TripCoreService.disableShareLink(tripId, userId);
    await fetchTrip();
  }, [tripId, userId, fetchTrip]);

  return [
    state,
    {
      refresh,
      update,
      confirm,
      cancel,
      archive,
      addActivity,
      updateActivity,
      deleteActivity,
      inviteTraveler,
      removeTraveler,
      enableShareLink,
      disableShareLink,
    },
  ];
}

// ============================================
// USE ITINERARY
// ============================================

interface UseItineraryState {
  itinerary: TripItinerary | null;
  isLoading: boolean;
  error: Error | null;
}

export function useItinerary(tripId: string | undefined): [UseItineraryState, { refresh: () => Promise<void> }] {
  const [state, setState] = useState<UseItineraryState>({
    itinerary: null,
    isLoading: true,
    error: null,
  });

  const fetchItinerary = useCallback(async () => {
    if (!tripId) {
      setState(prev => ({ ...prev, isLoading: false }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const itinerary = await TripCoreService.buildItinerary(tripId);
      setState({ itinerary, isLoading: false, error: null });
    } catch (error) {
      setState({ itinerary: null, isLoading: false, error: error as Error });
    }
  }, [tripId]);

  useEffect(() => {
    fetchItinerary();
  }, [fetchItinerary]);

  return [state, { refresh: fetchItinerary }];
}

// ============================================
// USE TRIP INVITATIONS
// ============================================

interface UseInvitationsState {
  invitations: any[];
  isLoading: boolean;
  error: Error | null;
}

export function useTripInvitations(userId: string | undefined): [UseInvitationsState, { refresh: () => Promise<void>; accept: (token: string) => Promise<void>; decline: (token: string, reason?: string) => Promise<void> }] {
  const [state, setState] = useState<UseInvitationsState>({
    invitations: [],
    isLoading: true,
    error: null,
  });

  const fetchInvitations = useCallback(async () => {
    if (!userId) {
      setState(prev => ({ ...prev, isLoading: false }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const invitations = await TripCollaborationService.getUserPendingInvitations(userId);
      setState({ invitations, isLoading: false, error: null });
    } catch (error) {
      setState({ invitations: [], isLoading: false, error: error as Error });
    }
  }, [userId]);

  useEffect(() => {
    fetchInvitations();
  }, [fetchInvitations]);

  const accept = useCallback(async (token: string): Promise<void> => {
    if (!userId) return;
    await TripCollaborationService.acceptInvitation(token, userId);
    await fetchInvitations();
  }, [userId, fetchInvitations]);

  const decline = useCallback(async (token: string, reason?: string): Promise<void> => {
    await TripCollaborationService.declineInvitation(token, reason);
    await fetchInvitations();
  }, [fetchInvitations]);

  return [state, { refresh: fetchInvitations, accept, decline }];
}

// ============================================
// USE TRIP IMPORT
// ============================================

import { TripImportService } from '@/services/trip';

interface UseImportState {
  importEmail: string;
  linkedAccounts: any[];
  pendingImports: any[];
  isLoading: boolean;
  error: Error | null;
}

export function useTripImport(userId: string | undefined): [UseImportState, {
  refresh: () => Promise<void>;
  submitManualEntry: (data: any) => Promise<void>;
  connectAccount: (provider: string) => Promise<{ authUrl: string }>;
  disconnectAccount: (accountId: string) => Promise<void>;
  submitCorrections: (importId: string, corrections: any) => Promise<void>;
}] {
  const [state, setState] = useState<UseImportState>({
    importEmail: '',
    linkedAccounts: [],
    pendingImports: [],
    isLoading: true,
    error: null,
  });

  const fetchData = useCallback(async () => {
    if (!userId) {
      setState(prev => ({ ...prev, isLoading: false }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const [importEmail, linkedAccounts, pendingImports] = await Promise.all([
        TripImportService.getImportEmail(userId),
        TripImportService.getLinkedAccounts(userId),
        TripImportService.getUserImports(userId, { status: 'needs_review' }),
      ]);

      setState({
        importEmail,
        linkedAccounts,
        pendingImports,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error as Error,
      }));
    }
  }, [userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const submitManualEntry = useCallback(async (data: any): Promise<void> => {
    if (!userId) return;
    await TripImportService.submitManualEntry(userId, data);
    await fetchData();
  }, [userId, fetchData]);

  const connectAccount = useCallback(async (provider: string): Promise<{ authUrl: string }> => {
    if (!userId) throw new Error('User not available');
    return TripImportService.initiateOAuthConnection(userId, provider);
  }, [userId]);

  const disconnectAccount = useCallback(async (accountId: string): Promise<void> => {
    if (!userId) return;
    await TripImportService.disconnectLinkedAccount(userId, accountId);
    await fetchData();
  }, [userId, fetchData]);

  const submitCorrections = useCallback(async (importId: string, corrections: any): Promise<void> => {
    if (!userId) return;
    await TripImportService.submitImportCorrections(userId, importId, corrections);
    await fetchData();
  }, [userId, fetchData]);

  return [
    state,
    {
      refresh: fetchData,
      submitManualEntry,
      connectAccount,
      disconnectAccount,
      submitCorrections,
    },
  ];
}
