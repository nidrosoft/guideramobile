/**
 * UNIFIED DATA MODEL - FLIGHT TYPES
 * 
 * Complete flight offer representation.
 */

import { CabinClass, TripType } from './enums';
import { 
  UnifiedPrice, 
  TravelerPrice, 
  ProviderMeta, 
  Airport, 
  Airline, 
  Aircraft,
  SegmentAmenity 
} from './common.types';

// ============================================
// MAIN FLIGHT TYPE
// ============================================

export interface UnifiedFlight {
  // ═══════════════════════════════════════════════════════════════════
  // IDENTIFICATION
  // ═══════════════════════════════════════════════════════════════════
  
  /** Unique identifier for this offer */
  id: string;
  
  /** Provider-specific offer ID (needed for booking) */
  providerOfferId: string;
  
  /** Which provider this came from */
  provider: ProviderMeta;
  
  /** Type of entity */
  type: 'flight';
  
  // ═══════════════════════════════════════════════════════════════════
  // TRIP STRUCTURE
  // ═══════════════════════════════════════════════════════════════════
  
  /** Type of journey */
  tripType: TripType;
  
  /** All segments/slices of the journey */
  slices: FlightSlice[];
  
  /** Total number of stops across all slices */
  totalStops: number;
  
  /** Total journey duration in minutes */
  totalDurationMinutes: number;
  
  // ═══════════════════════════════════════════════════════════════════
  // PRICING
  // ═══════════════════════════════════════════════════════════════════
  
  /** Complete pricing information */
  price: UnifiedPrice;
  
  /** Price per traveler breakdown */
  pricePerTraveler: TravelerPrice[];
  
  /** Fare type/brand if available */
  fareType?: string;
  
  /** Fare brand name (e.g., "Basic Economy", "Premium") */
  fareBrand?: string;
  
  // ═══════════════════════════════════════════════════════════════════
  // BAGGAGE
  // ═══════════════════════════════════════════════════════════════════
  
  /** Baggage allowance summary */
  baggage: BaggageAllowance;
  
  // ═══════════════════════════════════════════════════════════════════
  // POLICIES
  // ═══════════════════════════════════════════════════════════════════
  
  /** Change/cancellation policies */
  policies: FlightPolicies;
  
  /** Is this refundable? */
  isRefundable: boolean;
  
  /** Is this changeable? */
  isChangeable: boolean;
  
  // ═══════════════════════════════════════════════════════════════════
  // BOOKING INFO
  // ═══════════════════════════════════════════════════════════════════
  
  /** Seats remaining (if known) */
  seatsRemaining?: number;
  
  /** Is this a live price or cached? */
  isLivePrice: boolean;
  
  /** When does this offer expire? */
  expiresAt?: string;
  
  /** Booking class codes */
  bookingClasses?: string[];
  
  // ═══════════════════════════════════════════════════════════════════
  // METADATA
  // ═══════════════════════════════════════════════════════════════════
  
  /** When was this offer retrieved? */
  retrievedAt: string;
  
  /** Search session this belongs to */
  sessionId?: string;
  
  /** Ranking/sorting metadata */
  ranking?: {
    score: number;
    priceRank: number;
    durationRank: number;
    departureTimeRank: number;
  };
  
  /** Deep link to provider (if affiliate fallback needed) */
  deepLink?: string;
}

// ============================================
// FLIGHT SLICE
// ============================================

export interface FlightSlice {
  /** Unique ID for this slice */
  id: string;
  
  /** Origin airport */
  origin: Airport;
  
  /** Destination airport */
  destination: Airport;
  
  /** Departure datetime (ISO 8601 with timezone) */
  departureAt: string;
  
  /** Arrival datetime (ISO 8601 with timezone) */
  arrivalAt: string;
  
  /** Total duration in minutes */
  durationMinutes: number;
  
  /** Number of stops */
  stops: number;
  
  /** Individual flight segments */
  segments: FlightSegment[];
  
  /** Layover information */
  layovers?: Layover[];
}

// ============================================
// FLIGHT SEGMENT
// ============================================

export interface FlightSegment {
  /** Segment ID */
  id: string;
  
  /** Marketing carrier (airline selling the ticket) */
  marketingCarrier: Airline;
  
  /** Operating carrier (airline flying the plane) */
  operatingCarrier?: Airline;
  
  /** Flight number (e.g., "UA1234") */
  flightNumber: string;
  
  /** Aircraft type */
  aircraft?: Aircraft;
  
  /** Origin airport */
  origin: Airport;
  
  /** Destination airport */
  destination: Airport;
  
  /** Departure datetime */
  departureAt: string;
  
  /** Arrival datetime */
  arrivalAt: string;
  
  /** Duration in minutes */
  durationMinutes: number;
  
  /** Cabin class */
  cabinClass: CabinClass;
  
  /** Booking class code (e.g., "Y", "J") */
  bookingClass?: string;
  
  /** Seat pitch (legroom) in inches if known */
  seatPitch?: number;
  
  /** Amenities on this segment */
  amenities?: SegmentAmenity[];
}

// ============================================
// LAYOVER
// ============================================

export interface Layover {
  /** Airport where layover occurs */
  airport: Airport;
  
  /** Duration in minutes */
  durationMinutes: number;
  
  /** Is this an overnight layover? */
  isOvernight: boolean;
  
  /** Does this require terminal change? */
  terminalChange: boolean;
  
  /** Is this a self-transfer (separate tickets)? */
  isSelfTransfer: boolean;
}

// ============================================
// BAGGAGE
// ============================================

export interface BaggageAllowance {
  /** Cabin baggage */
  cabin: {
    included: boolean;
    quantity?: number;
    weightKg?: number;
    dimensions?: string;
  };
  
  /** Checked baggage */
  checked: {
    included: boolean;
    quantity: number;
    weightKg?: number;
    dimensions?: string;
    /** Cost to add if not included */
    addOnPrice?: UnifiedPrice;
  };
}

// ============================================
// FLIGHT POLICIES
// ============================================

export interface FlightPolicies {
  /** Cancellation policy */
  cancellation: {
    allowed: boolean;
    penalty?: UnifiedPrice;
    deadline?: string;
    refundType?: 'full' | 'partial' | 'credit' | 'none';
  };
  
  /** Change/modification policy */
  change: {
    allowed: boolean;
    penalty?: UnifiedPrice;
    deadline?: string;
  };
  
  /** No-show policy */
  noShow?: {
    penalty?: UnifiedPrice;
    refundable: boolean;
  };
  
  /** Full fare rules text (if available) */
  fareRulesText?: string;
}
