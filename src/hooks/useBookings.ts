/**
 * USE BOOKINGS HOOK
 * 
 * React hook for managing user bookings.
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  BookingWithItems,
  BookingStatus,
  getUserBookings,
  getBookingWithItems,
  getBookingByReference,
  updateBookingStatus,
  syncBookingWithProvider,
  acknowledgeScheduleChange,
  getAvailableActions,
} from '@/services/booking';
import {
  requestCancellation,
  confirmAndProcessCancellation,
  calculateCancellationRefund,
  CancellationResult,
} from '@/services/booking/cancellation.service';
import { RefundCalculation } from '@/services/booking/booking.types';

interface UseBookingsState {
  bookings: BookingWithItems[];
  selectedBooking: BookingWithItems | null;
  total: number;
  isLoading: boolean;
  error: string | null;
}

interface UseBookingsActions {
  loadBookings: (options?: { status?: BookingStatus[]; limit?: number; offset?: number }) => Promise<void>;
  loadBooking: (bookingId: string) => Promise<void>;
  loadBookingByReference: (reference: string) => Promise<void>;
  syncBooking: (bookingId: string) => Promise<{ success: boolean; changes: any[] }>;
  acknowledgeChange: (bookingId: string, itemId: string, accepted: boolean) => Promise<boolean>;
  requestCancel: (bookingId: string, reason: string, itemIds?: string[]) => Promise<CancellationResult>;
  confirmCancel: (cancellationId: string) => Promise<CancellationResult>;
  getRefundPreview: (bookingId: string, itemIds?: string[]) => Promise<RefundCalculation | null>;
  getActions: (booking: BookingWithItems) => string[];
  refresh: () => Promise<void>;
  clearSelection: () => void;
}

export function useBookings(): UseBookingsState & UseBookingsActions {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<BookingWithItems[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<BookingWithItems | null>(null);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastOptions, setLastOptions] = useState<any>(null);

  // Load bookings
  const loadBookings = useCallback(
    async (options?: { status?: BookingStatus[]; limit?: number; offset?: number }) => {
      if (!user?.id) return;

      setIsLoading(true);
      setError(null);
      setLastOptions(options);

      try {
        const result = await getUserBookings(user.id, options);
        setBookings(result.bookings);
        setTotal(result.total);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    },
    [user?.id]
  );

  // Load single booking
  const loadBooking = useCallback(async (bookingId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const booking = await getBookingWithItems(bookingId);
      if (booking) {
        setSelectedBooking(booking);
      } else {
        setError('Booking not found');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load booking by reference
  const loadBookingByReference = useCallback(async (reference: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const booking = await getBookingByReference(reference);
      if (booking) {
        setSelectedBooking(booking);
      } else {
        setError('Booking not found');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Sync booking with provider
  const syncBooking = useCallback(
    async (bookingId: string): Promise<{ success: boolean; changes: any[] }> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await syncBookingWithProvider(bookingId);

        // Refresh booking if it's selected
        if (selectedBooking?.id === bookingId) {
          const updated = await getBookingWithItems(bookingId);
          if (updated) setSelectedBooking(updated);
        }

        return { success: result.success, changes: result.changes };
      } catch (err: any) {
        setError(err.message);
        return { success: false, changes: [] };
      } finally {
        setIsLoading(false);
      }
    },
    [selectedBooking]
  );

  // Acknowledge schedule change
  const acknowledgeChange = useCallback(
    async (bookingId: string, itemId: string, accepted: boolean): Promise<boolean> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await acknowledgeScheduleChange(bookingId, itemId, accepted);

        if (result.success && selectedBooking?.id === bookingId) {
          const updated = await getBookingWithItems(bookingId);
          if (updated) setSelectedBooking(updated);
        }

        return result.success;
      } catch (err: any) {
        setError(err.message);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [selectedBooking]
  );

  // Request cancellation
  const requestCancel = useCallback(
    async (bookingId: string, reason: string, itemIds?: string[]): Promise<CancellationResult> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await requestCancellation({
          bookingId,
          requestedBy: 'user',
          reason,
          itemsToCancel: itemIds,
        });

        return result;
      } catch (err: any) {
        setError(err.message);
        return { success: false, error: err.message };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Confirm cancellation
  const confirmCancel = useCallback(
    async (cancellationId: string): Promise<CancellationResult> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await confirmAndProcessCancellation(cancellationId);

        // Refresh bookings
        if (lastOptions) {
          await loadBookings(lastOptions);
        }

        return result;
      } catch (err: any) {
        setError(err.message);
        return { success: false, error: err.message };
      } finally {
        setIsLoading(false);
      }
    },
    [lastOptions, loadBookings]
  );

  // Get refund preview
  const getRefundPreview = useCallback(
    async (bookingId: string, itemIds?: string[]): Promise<RefundCalculation | null> => {
      try {
        const booking = await getBookingWithItems(bookingId);
        if (!booking) return null;

        return await calculateCancellationRefund(booking, itemIds);
      } catch (err: any) {
        setError(err.message);
        return null;
      }
    },
    []
  );

  // Get available actions
  const getActions = useCallback((booking: BookingWithItems): string[] => {
    return getAvailableActions(booking);
  }, []);

  // Refresh bookings
  const refresh = useCallback(async () => {
    if (lastOptions) {
      await loadBookings(lastOptions);
    }
    if (selectedBooking) {
      const updated = await getBookingWithItems(selectedBooking.id);
      if (updated) setSelectedBooking(updated);
    }
  }, [lastOptions, loadBookings, selectedBooking]);

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedBooking(null);
  }, []);

  // Load bookings on mount
  useEffect(() => {
    if (user?.id) {
      loadBookings({ limit: 10 });
    }
  }, [user?.id, loadBookings]);

  return {
    bookings,
    selectedBooking,
    total,
    isLoading,
    error,
    loadBookings,
    loadBooking,
    loadBookingByReference,
    syncBooking,
    acknowledgeChange,
    requestCancel,
    confirmCancel,
    getRefundPreview,
    getActions,
    refresh,
    clearSelection,
  };
}
