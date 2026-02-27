/**
 * UNIFIED DATA MODEL - COMMON TYPES
 * 
 * Shared types used across all entity types.
 */

import { Alliance, LocationType, PenaltyType, PaymentType } from './enums';

// ============================================
// PRICE TYPES
// ============================================

export interface UnifiedPrice {
  /** Amount in currency's smallest unit precision */
  amount: number;
  
  /** Currency code (ISO 4217) */
  currency: string;
  
  /** Formatted string for display */
  formatted: string;
  
  /** Price breakdown (if available) */
  breakdown?: PriceBreakdown;
  
  /** Original price (if discounted) */
  originalPrice?: number;
  
  /** Discount percentage */
  discountPercent?: number;
}

export interface PriceBreakdown {
  /** Base fare/rate */
  base: number;
  
  /** Taxes */
  taxes: number;
  
  /** Fees */
  fees: number;
  
  /** Service charge */
  serviceCharge?: number;
  
  /** Individual tax items */
  taxItems?: {
    name: string;
    amount: number;
  }[];
  
  /** Individual fee items */
  feeItems?: {
    name: string;
    amount: number;
    included: boolean;
  }[];
}

export interface TravelerPrice {
  /** Traveler type */
  travelerType: 'adult' | 'child' | 'infant' | 'senior';
  
  /** Number of travelers */
  count: number;
  
  /** Price per traveler */
  pricePerTraveler: UnifiedPrice;
  
  /** Total for this traveler type */
  totalPrice: UnifiedPrice;
}

// ============================================
// LOCATION TYPES
// ============================================

export interface Address {
  /** Street address line 1 */
  line1: string;
  
  /** Street address line 2 */
  line2?: string;
  
  /** City */
  city: string;
  
  /** State/Province */
  stateProvince?: string;
  
  /** Postal code */
  postalCode?: string;
  
  /** Country */
  country: string;
  
  /** Country code (ISO 3166-1 alpha-2) */
  countryCode: string;
  
  /** Full formatted address */
  formatted: string;
}

export interface Coordinates {
  /** Latitude */
  latitude: number;
  
  /** Longitude */
  longitude: number;
}

export interface Location {
  /** Location name */
  name: string;
  
  /** Location type */
  type: LocationType;
  
  /** City name */
  city?: string;
  
  /** Country */
  country: string;
  
  /** Country code */
  countryCode: string;
  
  /** Coordinates */
  coordinates?: Coordinates;
  
  /** Airport code (if airport) */
  airportCode?: string;
  
  /** Timezone */
  timezone?: string;
}

export interface Airport {
  /** IATA code */
  code: string;
  
  /** Airport name */
  name: string;
  
  /** City */
  city: string;
  
  /** Country */
  country: string;
  
  /** Country code */
  countryCode: string;
  
  /** Terminal (if known) */
  terminal?: string;
  
  /** Coordinates */
  coordinates?: Coordinates;
  
  /** Timezone */
  timezone: string;
}

export interface NearbyPOI {
  /** POI name */
  name: string;
  
  /** Type */
  type: 'attraction' | 'transport' | 'shopping' | 'dining' | 'beach' | 'park';
  
  /** Distance */
  distance: {
    value: number;
    unit: 'km' | 'mi' | 'm';
  };
  
  /** Walk time in minutes */
  walkTimeMinutes?: number;
}

// ============================================
// TRAVEL ENTITY TYPES
// ============================================

export interface Airline {
  /** IATA code */
  code: string;
  
  /** Airline name */
  name: string;
  
  /** Logo URL */
  logoUrl?: string;
  
  /** Alliance */
  alliance?: Alliance;
}

export interface Aircraft {
  /** IATA code */
  code: string;
  
  /** Name */
  name: string;
  
  /** Is wide body? */
  isWidebody?: boolean;
}

export interface BedConfig {
  /** Bed type */
  type: 'king' | 'queen' | 'double' | 'twin' | 'single' | 'sofa_bed' | 'bunk';
  
  /** Count */
  count: number;
}

// ============================================
// PROVIDER TYPES
// ============================================

export interface ProviderMeta {
  /** Provider code */
  code: string;
  
  /** Provider name */
  name: string;
  
  /** Provider logo */
  logoUrl?: string;
  
  /** Response time for this request */
  responseTimeMs?: number;
  
  /** Confidence in data freshness (0-100) */
  freshnessScore?: number;
  
  /** When was this data retrieved? */
  retrievedAt: string;
}

// ============================================
// PAYMENT TYPES
// ============================================

export interface PaymentTerms {
  /** Payment type */
  type: PaymentType;
  
  /** Deposit required? */
  depositRequired?: boolean;
  
  /** Deposit amount */
  depositAmount?: UnifiedPrice;
  
  /** Deposit deadline */
  depositDeadline?: string;
  
  /** Balance due date */
  balanceDueDate?: string;
  
  /** Accepted payment methods */
  acceptedMethods?: string[];
}

// ============================================
// IMAGE TYPES
// ============================================

export interface HotelImage {
  /** Image URL */
  url: string;
  
  /** Thumbnail URL */
  thumbnailUrl?: string;
  
  /** Caption */
  caption?: string;
  
  /** Category */
  category?: 'room' | 'bathroom' | 'lobby' | 'pool' | 'restaurant' | 'exterior' | 'view' | 'other';
  
  /** Is primary image? */
  isPrimary?: boolean;
}

export interface ExperienceImage {
  /** Image URL */
  url: string;
  
  /** Caption */
  caption?: string;
  
  /** Is primary? */
  isPrimary?: boolean;
}

// ============================================
// AMENITY TYPES
// ============================================

export interface HotelAmenity {
  /** Amenity ID */
  id: string;
  
  /** Amenity name */
  name: string;
  
  /** Category */
  category?: 'general' | 'room' | 'bathroom' | 'media' | 'food' | 'services' | 'outdoor' | 'wellness';
  
  /** Icon name */
  icon?: string;
  
  /** Is free? */
  isFree?: boolean;
}

export interface SegmentAmenity {
  /** Amenity type */
  type: 'wifi' | 'power' | 'entertainment' | 'food' | 'seat';
  
  /** Name */
  name: string;
  
  /** Is chargeable? */
  isChargeable?: boolean;
}

// ============================================
// CANCELLATION TYPES
// ============================================

export interface CancellationRule {
  /** From this datetime */
  from?: string;
  
  /** To this datetime */
  to?: string;
  
  /** Penalty type */
  penaltyType: PenaltyType;
  
  /** Penalty value */
  penaltyValue: number;
  
  /** Or fixed amount */
  penaltyAmount?: UnifiedPrice;
}

// ============================================
// DISTANCE TYPES
// ============================================

export interface Distance {
  value: number;
  unit: 'km' | 'mi';
}

// ============================================
// RATING TYPES
// ============================================

export interface Rating {
  score: number;
  maxScore: number;
  reviewCount: number;
  sentiment?: 'excellent' | 'very_good' | 'good' | 'fair' | 'poor';
}

export interface CategoryRatings {
  cleanliness?: number;
  location?: number;
  service?: number;
  value?: number;
  amenities?: number;
}
