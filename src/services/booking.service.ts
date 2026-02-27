/**
 * BOOKING SERVICE
 * 
 * Service for managing bookings, payment methods, and transactions.
 */

import { supabase } from '@/lib/supabase/client';

export type BookingType = 'flight' | 'hotel' | 'car' | 'experience' | 'package';
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'refunded';
export type PaymentMethodType = 'card' | 'paypal' | 'apple_pay' | 'google_pay' | 'bank';
export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled';

export interface Booking {
  id: string;
  user_id: string;
  trip_id?: string;
  type: BookingType;
  status: BookingStatus;
  reference_number: string;
  provider?: string;
  provider_booking_id?: string;
  currency: string;
  subtotal: number;
  taxes: number;
  fees: number;
  discount: number;
  total: number;
  payment_status: string;
  booked_at: string;
  cancelled_at?: string;
  cancellation_reason?: string;
  refund_amount?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  flight_booking?: FlightBooking;
  hotel_booking?: HotelBooking;
  car_booking?: CarBooking;
  experience_booking?: ExperienceBooking;
}

export interface FlightBooking {
  id: string;
  booking_id: string;
  trip_type: 'one-way' | 'round-trip' | 'multi-city';
  cabin_class: string;
  outbound_flight: any;
  return_flight?: any;
  passengers: any[];
  seat_selections?: any;
  extras?: any;
  contact_info: any;
}

export interface HotelBooking {
  id: string;
  booking_id: string;
  hotel: any;
  room: any;
  room_count: number;
  check_in_date: string;
  check_out_date: string;
  guests: any[];
  special_requests?: string;
}

export interface CarBooking {
  id: string;
  booking_id: string;
  car: any;
  pickup_location: any;
  dropoff_location: any;
  pickup_datetime: string;
  dropoff_datetime: string;
  driver_info: any;
  extras?: any;
  insurance?: any;
}

export interface ExperienceBooking {
  id: string;
  booking_id: string;
  experience: any;
  date: string;
  time_slot?: string;
  participants: any[];
  meeting_point?: any;
}

export interface PaymentMethod {
  id: string;
  user_id: string;
  type: PaymentMethodType;
  stripe_payment_method_id?: string;
  last_four?: string;
  brand?: string;
  expiry_month?: number;
  expiry_year?: number;
  is_default: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  booking_id?: string;
  payment_method_id?: string;
  type: 'payment' | 'refund' | 'payout';
  status: TransactionStatus;
  amount: number;
  currency: string;
  description?: string;
  stripe_payment_intent_id?: string;
  stripe_charge_id?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
  // Joined data
  booking?: Booking;
  payment_method?: PaymentMethod;
}

export const bookingService = {
  // ============ BOOKINGS ============

  /**
   * Get all bookings for a user
   */
  async getBookings(userId: string, status?: BookingStatus): Promise<{ data: Booking[] | null; error: Error | null }> {
    try {
      let query = supabase
        .from('bookings')
        .select(`
          *,
          flight_booking:flight_bookings(*),
          hotel_booking:hotel_bookings(*),
          car_booking:car_bookings(*),
          experience_booking:experience_bookings(*)
        `)
        .eq('user_id', userId)
        .order('booked_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching bookings:', error);
        return { data: null, error: error as Error };
      }

      // Flatten the nested arrays (Supabase returns arrays for one-to-one joins)
      const bookings = data?.map(booking => ({
        ...booking,
        flight_booking: booking.flight_booking?.[0] || null,
        hotel_booking: booking.hotel_booking?.[0] || null,
        car_booking: booking.car_booking?.[0] || null,
        experience_booking: booking.experience_booking?.[0] || null,
      }));

      return { data: bookings, error: null };
    } catch (error) {
      console.error('Error in getBookings:', error);
      return { data: null, error: error as Error };
    }
  },

  /**
   * Get a single booking by ID
   */
  async getBookingById(bookingId: string): Promise<{ data: Booking | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          flight_booking:flight_bookings(*),
          hotel_booking:hotel_bookings(*),
          car_booking:car_bookings(*),
          experience_booking:experience_bookings(*)
        `)
        .eq('id', bookingId)
        .single();

      if (error) {
        console.error('Error fetching booking:', error);
        return { data: null, error: error as Error };
      }

      const booking = {
        ...data,
        flight_booking: data.flight_booking?.[0] || null,
        hotel_booking: data.hotel_booking?.[0] || null,
        car_booking: data.car_booking?.[0] || null,
        experience_booking: data.experience_booking?.[0] || null,
      };

      return { data: booking, error: null };
    } catch (error) {
      console.error('Error in getBookingById:', error);
      return { data: null, error: error as Error };
    }
  },

  /**
   * Get upcoming bookings (confirmed, not yet completed)
   */
  async getUpcomingBookings(userId: string): Promise<{ data: Booking[] | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          flight_booking:flight_bookings(*),
          hotel_booking:hotel_bookings(*),
          car_booking:car_bookings(*),
          experience_booking:experience_bookings(*)
        `)
        .eq('user_id', userId)
        .in('status', ['pending', 'confirmed'])
        .order('booked_at', { ascending: true });

      if (error) {
        console.error('Error fetching upcoming bookings:', error);
        return { data: null, error: error as Error };
      }

      const bookings = data?.map(booking => ({
        ...booking,
        flight_booking: booking.flight_booking?.[0] || null,
        hotel_booking: booking.hotel_booking?.[0] || null,
        car_booking: booking.car_booking?.[0] || null,
        experience_booking: booking.experience_booking?.[0] || null,
      }));

      return { data: bookings, error: null };
    } catch (error) {
      console.error('Error in getUpcomingBookings:', error);
      return { data: null, error: error as Error };
    }
  },

  /**
   * Get past bookings (completed or cancelled)
   */
  async getPastBookings(userId: string): Promise<{ data: Booking[] | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          flight_booking:flight_bookings(*),
          hotel_booking:hotel_bookings(*),
          car_booking:car_bookings(*),
          experience_booking:experience_bookings(*)
        `)
        .eq('user_id', userId)
        .in('status', ['completed', 'cancelled', 'refunded'])
        .order('booked_at', { ascending: false });

      if (error) {
        console.error('Error fetching past bookings:', error);
        return { data: null, error: error as Error };
      }

      const bookings = data?.map(booking => ({
        ...booking,
        flight_booking: booking.flight_booking?.[0] || null,
        hotel_booking: booking.hotel_booking?.[0] || null,
        car_booking: booking.car_booking?.[0] || null,
        experience_booking: booking.experience_booking?.[0] || null,
      }));

      return { data: bookings, error: null };
    } catch (error) {
      console.error('Error in getPastBookings:', error);
      return { data: null, error: error as Error };
    }
  },

  /**
   * Get booking counts by status
   */
  async getBookingCounts(userId: string): Promise<{ total: number; byStatus: Record<BookingStatus, number> }> {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('status')
        .eq('user_id', userId);

      if (error || !data) {
        return { total: 0, byStatus: {} as Record<BookingStatus, number> };
      }

      const byStatus = data.reduce((acc, booking) => {
        acc[booking.status as BookingStatus] = (acc[booking.status as BookingStatus] || 0) + 1;
        return acc;
      }, {} as Record<BookingStatus, number>);

      return { total: data.length, byStatus };
    } catch {
      return { total: 0, byStatus: {} as Record<BookingStatus, number> };
    }
  },

  // ============ PAYMENT METHODS ============

  /**
   * Get all payment methods for a user
   */
  async getPaymentMethods(userId: string): Promise<{ data: PaymentMethod[] | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('user_id', userId)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching payment methods:', error);
        return { data: null, error: error as Error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error in getPaymentMethods:', error);
      return { data: null, error: error as Error };
    }
  },

  /**
   * Add a new payment method
   */
  async addPaymentMethod(userId: string, method: Partial<PaymentMethod>): Promise<{ data: PaymentMethod | null; error: Error | null }> {
    try {
      // If this is set as default, unset other defaults first
      if (method.is_default) {
        await supabase
          .from('payment_methods')
          .update({ is_default: false })
          .eq('user_id', userId);
      }

      const { data, error } = await supabase
        .from('payment_methods')
        .insert({
          user_id: userId,
          ...method,
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding payment method:', error);
        return { data: null, error: error as Error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error in addPaymentMethod:', error);
      return { data: null, error: error as Error };
    }
  },

  /**
   * Set a payment method as default
   */
  async setDefaultPaymentMethod(userId: string, methodId: string): Promise<{ error: Error | null }> {
    try {
      // Unset all defaults
      await supabase
        .from('payment_methods')
        .update({ is_default: false })
        .eq('user_id', userId);

      // Set new default
      const { error } = await supabase
        .from('payment_methods')
        .update({ is_default: true })
        .eq('id', methodId);

      if (error) {
        console.error('Error setting default payment method:', error);
        return { error: error as Error };
      }

      return { error: null };
    } catch (error) {
      console.error('Error in setDefaultPaymentMethod:', error);
      return { error: error as Error };
    }
  },

  /**
   * Delete a payment method
   */
  async deletePaymentMethod(methodId: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase
        .from('payment_methods')
        .delete()
        .eq('id', methodId);

      if (error) {
        console.error('Error deleting payment method:', error);
        return { error: error as Error };
      }

      return { error: null };
    } catch (error) {
      console.error('Error in deletePaymentMethod:', error);
      return { error: error as Error };
    }
  },

  // ============ TRANSACTIONS ============

  /**
   * Get all transactions for a user
   */
  async getTransactions(userId: string, limit?: number): Promise<{ data: Transaction[] | null; error: Error | null }> {
    try {
      let query = supabase
        .from('transactions')
        .select(`
          *,
          booking:bookings(id, type, reference_number, status),
          payment_method:payment_methods(id, type, last_four, brand)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching transactions:', error);
        return { data: null, error: error as Error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error in getTransactions:', error);
      return { data: null, error: error as Error };
    }
  },

  /**
   * Get transactions for a specific booking
   */
  async getTransactionsByBooking(bookingId: string): Promise<{ data: Transaction[] | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('booking_id', bookingId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching transactions by booking:', error);
        return { data: null, error: error as Error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error in getTransactionsByBooking:', error);
      return { data: null, error: error as Error };
    }
  },

  /**
   * Get transaction summary (total spent, refunds, etc.)
   */
  async getTransactionSummary(userId: string): Promise<{
    totalSpent: number;
    totalRefunded: number;
    transactionCount: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('type, amount, status')
        .eq('user_id', userId)
        .eq('status', 'completed');

      if (error || !data) {
        return { totalSpent: 0, totalRefunded: 0, transactionCount: 0 };
      }

      const totalSpent = data
        .filter(t => t.type === 'payment')
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      const totalRefunded = data
        .filter(t => t.type === 'refund')
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      return {
        totalSpent,
        totalRefunded,
        transactionCount: data.length,
      };
    } catch {
      return { totalSpent: 0, totalRefunded: 0, transactionCount: 0 };
    }
  },

  // ============ CREATE FLIGHT BOOKING ============

  /**
   * Create a complete flight booking with trip
   */
  async createFlightBooking(params: {
    userId: string;
    paymentIntentId: string;
    flightOffer: any;
    travelers: any[];
    selectedSeats?: string[];
    selectedBaggage?: number;
    baggagePrice?: number;
    totalPrice: number;
    currency: string;
  }): Promise<{ 
    data: { tripId: string; bookingId: string; bookingReference: string } | null; 
    error: Error | null 
  }> {
    try {
      const { userId, paymentIntentId, flightOffer, travelers, selectedSeats, selectedBaggage, baggagePrice, totalPrice, currency } = params;

      // Extract flight details
      const outboundItinerary = flightOffer.itineraries?.[0];
      const returnItinerary = flightOffer.itineraries?.[1];
      
      if (!outboundItinerary?.segments?.length) {
        throw new Error('Invalid flight offer: missing itinerary data');
      }

      const firstSegment = outboundItinerary.segments[0];
      const lastOutboundSegment = outboundItinerary.segments[outboundItinerary.segments.length - 1];
      
      const departureDate = new Date(firstSegment.departure.at);
      const arrivalDate = returnItinerary 
        ? new Date(returnItinerary.segments[returnItinerary.segments.length - 1].arrival.at)
        : new Date(lastOutboundSegment.arrival.at);

      // Generate booking reference
      const bookingReference = `GD${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      // 1. Create the trip
      const tripData = {
        user_id: userId,
        title: `${firstSegment.departure.iataCode} → ${lastOutboundSegment.arrival.iataCode}`,
        primary_destination_code: lastOutboundSegment.arrival.iataCode,
        primary_destination_name: lastOutboundSegment.arrival.iataCode,
        start_date: departureDate.toISOString().split('T')[0],
        end_date: arrivalDate.toISOString().split('T')[0],
        status: 'upcoming',
        trip_type: returnItinerary ? 'round_trip' : 'one_way',
        budget_total: totalPrice,
        budget_currency: currency,
        has_flights: true,
        flight_count: 1,
        booking_count: 1,
        total_booked_amount: totalPrice,
        traveler_count: travelers.length,
        created_via: 'app',
      };

      const { data: trip, error: tripError } = await supabase
        .from('trips')
        .insert(tripData)
        .select()
        .single();

      if (tripError) {
        console.error('Trip creation error:', tripError);
        throw new Error(`Failed to create trip: ${tripError.message}`);
      }

      // 2. Create the booking record
      const bookingData = {
        user_id: userId,
        trip_id: trip.id,
        type: 'flight',
        status: 'confirmed',
        payment_status: 'paid',
        booking_reference: bookingReference,
        payment_intent_id: paymentIntentId,
        provider: 'amadeus',
        total_amount: totalPrice,
        currency: currency,
        travelers: travelers,
        travel_start_date: departureDate.toISOString().split('T')[0],
        travel_end_date: arrivalDate.toISOString().split('T')[0],
        confirmed_at: new Date().toISOString(),
      };

      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert(bookingData)
        .select()
        .single();

      if (bookingError) {
        console.error('Booking creation error:', bookingError);
        throw new Error(`Failed to create booking: ${bookingError.message}`);
      }

      // 3. Create the flight booking details
      const flightBookingData = {
        booking_id: booking.id,
        trip_type: returnItinerary ? 'round-trip' : 'one-way',
        cabin_class: 'economy',
        outbound_flight: {
          segments: outboundItinerary.segments,
          duration: outboundItinerary.duration,
          origin: firstSegment.departure.iataCode,
          destination: lastOutboundSegment.arrival.iataCode,
          departureTime: firstSegment.departure.at,
          arrivalTime: lastOutboundSegment.arrival.at,
        },
        return_flight: returnItinerary ? {
          segments: returnItinerary.segments,
          duration: returnItinerary.duration,
        } : null,
        passengers: travelers,
        seat_selections: selectedSeats || [],
        extras: {
          baggage: selectedBaggage || 0,
          baggagePrice: baggagePrice || 0,
        },
        contact_info: {
          email: travelers[0]?.email,
          phone: travelers[0]?.phone,
        },
      };

      const { error: flightError } = await supabase
        .from('flight_bookings')
        .insert(flightBookingData);

      if (flightError) {
        console.error('Flight booking details error:', flightError);
        // Don't throw - the main booking is created
      }

      return {
        data: {
          tripId: trip.id,
          bookingId: booking.id,
          bookingReference,
        },
        error: null,
      };
    } catch (error) {
      console.error('Error in createFlightBooking:', error);
      return { data: null, error: error as Error };
    }
  },
};
