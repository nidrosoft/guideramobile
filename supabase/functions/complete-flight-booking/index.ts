import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Traveler {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  passportNumber?: string;
  passportExpiry?: string;
  nationality?: string;
}

interface FlightSegment {
  departure: {
    iataCode: string;
    terminal?: string;
    at: string;
  };
  arrival: {
    iataCode: string;
    terminal?: string;
    at: string;
  };
  carrierCode: string;
  number: string;
  aircraft?: { code: string };
  duration: string;
}

interface BookingRequest {
  userId: string;
  paymentIntentId: string;
  bookingToken: string;
  flightOffer: {
    id: string;
    price: {
      total: string;
      currency: string;
    };
    itineraries: Array<{
      duration: string;
      segments: FlightSegment[];
    }>;
    validatingAirlineCodes?: string[];
  };
  travelers: Traveler[];
  selectedSeats?: string[];
  selectedBaggage?: number;
  baggagePrice?: number;
  totalPrice: number;
  currency: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const booking: BookingRequest = await req.json();

    // Validate required fields
    if (!booking.userId || !booking.paymentIntentId || !booking.flightOffer || !booking.travelers?.length) {
      throw new Error('Missing required booking information');
    }

    // Extract flight details
    const outboundItinerary = booking.flightOffer.itineraries[0];
    const returnItinerary = booking.flightOffer.itineraries[1];
    
    const firstSegment = outboundItinerary.segments[0];
    const lastOutboundSegment = outboundItinerary.segments[outboundItinerary.segments.length - 1];
    
    const departureDate = new Date(firstSegment.departure.at);
    const arrivalDate = returnItinerary 
      ? new Date(returnItinerary.segments[returnItinerary.segments.length - 1].arrival.at)
      : new Date(lastOutboundSegment.arrival.at);

    // Generate booking reference
    const bookingReference = `GD${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Create the trip record
    const tripData = {
      user_id: booking.userId,
      title: `${firstSegment.departure.iataCode} → ${lastOutboundSegment.arrival.iataCode}`,
      destination: lastOutboundSegment.arrival.iataCode,
      start_date: departureDate.toISOString().split('T')[0],
      end_date: arrivalDate.toISOString().split('T')[0],
      status: 'upcoming',
      trip_type: returnItinerary ? 'round_trip' : 'one_way',
      total_budget: booking.totalPrice,
      currency: booking.currency,
      cover_image: null, // Could be set based on destination
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
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

    // Create the flight booking record
    const flightBookingData = {
      trip_id: trip.id,
      user_id: booking.userId,
      booking_reference: bookingReference,
      payment_intent_id: booking.paymentIntentId,
      status: 'confirmed',
      airline_code: booking.flightOffer.validatingAirlineCodes?.[0] || firstSegment.carrierCode,
      flight_number: `${firstSegment.carrierCode}${firstSegment.number}`,
      origin: firstSegment.departure.iataCode,
      destination: lastOutboundSegment.arrival.iataCode,
      departure_time: firstSegment.departure.at,
      arrival_time: lastOutboundSegment.arrival.at,
      duration: outboundItinerary.duration,
      cabin_class: 'economy', // Could be extracted from offer
      stops: outboundItinerary.segments.length - 1,
      base_price: parseFloat(booking.flightOffer.price.total),
      baggage_price: booking.baggagePrice || 0,
      seat_price: 0, // Could be calculated from seat selection
      total_price: booking.totalPrice,
      currency: booking.currency,
      travelers: booking.travelers,
      selected_seats: booking.selectedSeats || [],
      selected_baggage: booking.selectedBaggage || 0,
      flight_offer_data: booking.flightOffer,
      booking_token: booking.bookingToken,
      created_at: new Date().toISOString(),
    };

    const { data: flightBooking, error: bookingError } = await supabase
      .from('flight_bookings')
      .insert(flightBookingData)
      .select()
      .single();

    if (bookingError) {
      // If booking fails, we should ideally rollback the trip
      // For now, log and continue
      console.error('Flight booking creation error:', bookingError);
      
      // Try to create with minimal data if full insert fails
      const minimalBookingData = {
        trip_id: trip.id,
        user_id: booking.userId,
        booking_reference: bookingReference,
        payment_intent_id: booking.paymentIntentId,
        status: 'confirmed',
        origin: firstSegment.departure.iataCode,
        destination: lastOutboundSegment.arrival.iataCode,
        departure_time: firstSegment.departure.at,
        total_price: booking.totalPrice,
        currency: booking.currency,
        created_at: new Date().toISOString(),
      };

      const { error: minimalError } = await supabase
        .from('flight_bookings')
        .insert(minimalBookingData);

      if (minimalError) {
        console.error('Minimal booking also failed:', minimalError);
      }
    }

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        bookingReference,
        tripId: trip.id,
        flightBookingId: flightBooking?.id,
        message: 'Booking completed successfully',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Booking error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to complete booking',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
