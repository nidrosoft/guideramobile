/**
 * FLIGHT OFFER PRICE SERVICE
 * 
 * Frontend service for confirming flight prices and retrieving
 * detailed checkout information (baggage, fare rules, seat map).
 * 
 * Called when user selects a flight from search results.
 */

import { supabase } from '@/lib/supabase/client';

// ============================================
// TYPES
// ============================================

export interface FlightOffer {
  id: string;
  provider?: { code: string; name: string };
  price?: { amount: number; currency: string };
  outbound?: any;
  inbound?: any;
  refundable?: boolean;
  changeable?: boolean;
  bookingToken?: string;
  providerOfferId?: string;
  [key: string]: any;
}

export interface TravelerCount {
  adults: number;
  children?: number;
  infants?: number;
}

export interface BaggageInfo {
  cabin: {
    included: boolean;
    quantity: number;
    weightKg?: number;
    dimensions?: string;
  };
  checked: {
    included: boolean;
    quantity: number;
    weightKg?: number;
    addOnOptions?: Array<{
      quantity: number;
      weightKg: number;
      price: number;
      currency: string;
    }>;
  };
}

export interface FareRules {
  refundable: boolean;
  changeable: boolean;
  cancellation: {
    allowed: boolean;
    penalty?: number;
    penaltyCurrency?: string;
    deadline?: string;
  };
  change: {
    allowed: boolean;
    penalty?: number;
    penaltyCurrency?: string;
  };
  fareRulesText?: string[];
}

export interface SeatInfo {
  number: string;
  available: boolean;
  price?: number;
  currency?: string;
  characteristics?: string[];
}

export interface SeatRow {
  number: string;
  seats: SeatInfo[];
}

export interface SeatDeck {
  deckType: string;
  rows: SeatRow[];
}

export interface SeatMap {
  available: boolean;
  decks?: SeatDeck[];
}

export interface TravelerRequirements {
  documentRequired: boolean;
  documentTypes: string[];
  fields: string[];
}

export interface PriceConfirmationResult {
  // Price confirmation
  priceConfirmed: boolean;
  originalPrice: number;
  confirmedPrice: number;
  priceChanged: boolean;
  currency: string;
  
  // Baggage
  baggage: BaggageInfo;
  
  // Fare rules
  fareRules: FareRules;
  
  // Seat map (Amadeus only)
  seatMap?: SeatMap;
  
  // Traveler requirements
  travelerRequirements: TravelerRequirements;
  
  // Offer expiry
  expiresAt?: string;
  
  // Booking token for final booking
  bookingToken: string;
}

// ============================================
// SERVICE
// ============================================

const EDGE_FUNCTION_URL = 'https://pkydmdygctojtfzbqcud.supabase.co/functions/v1/flight-offer-price';

/**
 * Confirm flight price and get detailed checkout information
 */
export async function confirmFlightPrice(
  flightOffer: FlightOffer,
  travelers: TravelerCount,
  options?: {
    includeSeatMap?: boolean;
  }
): Promise<PriceConfirmationResult> {
  // Determine provider from the offer
  const provider = getProviderFromOffer(flightOffer);
  
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;

    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken && { 'Authorization': `Bearer ${accessToken}` }),
      },
      body: JSON.stringify({
        flightOffer,
        provider,
        travelers,
        includeSeatMap: options?.includeSeatMap ?? true,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `Price confirmation failed: ${response.status}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error?.message || 'Price confirmation failed');
    }

    return result.data;
  } catch (error) {
    console.error('Flight price confirmation error:', error);
    
    // Return fallback data so checkout can still proceed
    return createFallbackResult(flightOffer, provider);
  }
}

/**
 * Get seat map for a flight (Amadeus only)
 */
export async function getSeatMap(
  flightOffer: FlightOffer,
  travelers: TravelerCount
): Promise<SeatMap> {
  const result = await confirmFlightPrice(flightOffer, travelers, { includeSeatMap: true });
  return result.seatMap || { available: false };
}

/**
 * Check if price has changed since search
 */
export async function checkPriceChange(
  flightOffer: FlightOffer,
  travelers: TravelerCount
): Promise<{
  changed: boolean;
  originalPrice: number;
  newPrice: number;
  difference: number;
}> {
  const result = await confirmFlightPrice(flightOffer, travelers, { includeSeatMap: false });
  
  return {
    changed: result.priceChanged,
    originalPrice: result.originalPrice,
    newPrice: result.confirmedPrice,
    difference: result.confirmedPrice - result.originalPrice,
  };
}

// ============================================
// HELPERS
// ============================================

function getProviderFromOffer(offer: FlightOffer): 'amadeus' | 'kiwi' {
  // Check provider object
  if (offer.provider?.code) {
    const code = offer.provider.code.toLowerCase();
    if (code === 'amadeus') return 'amadeus';
    if (code === 'kiwi') return 'kiwi';
  }
  
  // Check ID prefix
  if (offer.id?.startsWith('amadeus-')) return 'amadeus';
  if (offer.id?.startsWith('kiwi-')) return 'kiwi';
  
  // Default to Amadeus
  return 'amadeus';
}

function createFallbackResult(offer: FlightOffer, provider: string): PriceConfirmationResult {
  const price = offer.price?.amount || 0;
  const currency = offer.price?.currency || 'USD';

  return {
    priceConfirmed: false,
    originalPrice: price,
    confirmedPrice: price,
    priceChanged: false,
    currency,
    baggage: {
      cabin: {
        included: true,
        quantity: 1,
        weightKg: 7,
        dimensions: '55x40x23 cm',
      },
      checked: {
        included: false,
        quantity: 0,
        addOnOptions: [
          { quantity: 1, weightKg: 23, price: 35, currency: 'USD' },
          { quantity: 2, weightKg: 23, price: 65, currency: 'USD' },
        ],
      },
    },
    fareRules: {
      refundable: offer.refundable || false,
      changeable: offer.changeable ?? true,
      cancellation: {
        allowed: offer.refundable || false,
      },
      change: {
        allowed: true,
      },
    },
    seatMap: {
      available: provider === 'amadeus',
    },
    travelerRequirements: {
      documentRequired: true,
      documentTypes: ['passport', 'id_card'],
      fields: ['firstName', 'lastName', 'dateOfBirth', 'gender', 'email', 'phone'],
    },
    expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    bookingToken: offer.id || '',
  };
}

// ============================================
// REACT HOOK
// ============================================

import { useState, useCallback } from 'react';

export interface UseFlightPriceState {
  loading: boolean;
  error: string | null;
  data: PriceConfirmationResult | null;
}

export interface UseFlightPriceReturn extends UseFlightPriceState {
  confirmPrice: (offer: FlightOffer, travelers: TravelerCount) => Promise<PriceConfirmationResult | null>;
  reset: () => void;
}

/**
 * React hook for flight price confirmation
 */
export function useFlightPrice(): UseFlightPriceReturn {
  const [state, setState] = useState<UseFlightPriceState>({
    loading: false,
    error: null,
    data: null,
  });

  const confirmPrice = useCallback(async (
    offer: FlightOffer,
    travelers: TravelerCount
  ): Promise<PriceConfirmationResult | null> => {
    setState({ loading: true, error: null, data: null });

    try {
      const result = await confirmFlightPrice(offer, travelers);
      setState({ loading: false, error: null, data: result });
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Price confirmation failed';
      setState({ loading: false, error: message, data: null });
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ loading: false, error: null, data: null });
  }, []);

  return {
    ...state,
    confirmPrice,
    reset,
  };
}

// ============================================
// CHECKOUT DATA BUILDER
// ============================================

export interface CheckoutData {
  flight: FlightOffer;
  priceConfirmation: PriceConfirmationResult;
  selectedBaggage: {
    checked: number;
    totalPrice: number;
  };
  selectedSeats: Array<{
    segmentId: string;
    seatNumber: string;
    price: number;
  }>;
  travelers: Array<{
    type: 'adult' | 'child' | 'infant';
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: 'male' | 'female';
    email?: string;
    phone?: string;
    document?: {
      type: 'passport' | 'id_card';
      number: string;
      expiryDate?: string;
      nationality?: string;
      issuingCountry?: string;
    };
  }>;
  contact: {
    email: string;
    phone: string;
  };
  pricingSummary: {
    baseFare: number;
    taxes: number;
    baggageFees: number;
    seatFees: number;
    serviceFee: number;
    total: number;
    currency: string;
  };
}

/**
 * Build checkout data from flight offer and price confirmation
 */
export function buildCheckoutData(
  flight: FlightOffer,
  priceConfirmation: PriceConfirmationResult,
  travelerCount: TravelerCount
): Partial<CheckoutData> {
  const baseFare = priceConfirmation.confirmedPrice;
  const currency = priceConfirmation.currency;

  // Initialize travelers array based on count
  const travelers: CheckoutData['travelers'] = [];
  
  for (let i = 0; i < travelerCount.adults; i++) {
    travelers.push({
      type: 'adult',
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      gender: 'male',
    });
  }
  
  for (let i = 0; i < (travelerCount.children || 0); i++) {
    travelers.push({
      type: 'child',
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      gender: 'male',
    });
  }
  
  for (let i = 0; i < (travelerCount.infants || 0); i++) {
    travelers.push({
      type: 'infant',
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      gender: 'male',
    });
  }

  return {
    flight,
    priceConfirmation,
    selectedBaggage: {
      checked: 0,
      totalPrice: 0,
    },
    selectedSeats: [],
    travelers,
    contact: {
      email: '',
      phone: '',
    },
    pricingSummary: {
      baseFare,
      taxes: 0, // Included in base fare from Amadeus
      baggageFees: 0,
      seatFees: 0,
      serviceFee: 0,
      total: baseFare,
      currency,
    },
  };
}

/**
 * Calculate total price with extras
 */
export function calculateTotalPrice(
  baseFare: number,
  selectedBaggage: { checked: number; pricePerBag: number },
  selectedSeats: Array<{ price: number }>,
  serviceFee: number = 0
): number {
  const baggageFees = selectedBaggage.checked * selectedBaggage.pricePerBag;
  const seatFees = selectedSeats.reduce((sum, seat) => sum + seat.price, 0);
  
  return baseFare + baggageFees + seatFees + serviceFee;
}
