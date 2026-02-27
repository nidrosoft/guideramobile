/**
 * UNIFIED DATA MODEL - HOTEL TYPES
 * 
 * Complete hotel property and room offer representation.
 */

import { PropertyType, RoomType, BoardType } from './enums';
import { 
  UnifiedPrice, 
  ProviderMeta, 
  Address, 
  Coordinates,
  HotelImage,
  HotelAmenity,
  BedConfig,
  PaymentTerms,
  CancellationRule,
  NearbyPOI,
  Rating,
  CategoryRatings,
  Distance
} from './common.types';

// ============================================
// MAIN HOTEL TYPE
// ============================================

export interface UnifiedHotel {
  // ═══════════════════════════════════════════════════════════════════
  // IDENTIFICATION
  // ═══════════════════════════════════════════════════════════════════
  
  /** Unique identifier for this property */
  id: string;
  
  /** Provider-specific property ID */
  providerPropertyId: string;
  
  /** Which provider this came from */
  provider: ProviderMeta;
  
  /** Type of entity */
  type: 'hotel';
  
  // ═══════════════════════════════════════════════════════════════════
  // PROPERTY INFORMATION
  // ═══════════════════════════════════════════════════════════════════
  
  /** Property name */
  name: string;
  
  /** Property description */
  description?: string;
  
  /** Short description (1-2 sentences) */
  shortDescription?: string;
  
  /** Property type */
  propertyType: PropertyType;
  
  /** Star rating (1-5) */
  starRating?: number;
  
  /** Brand/chain */
  brand?: string;
  
  /** Chain code */
  chainCode?: string;
  
  // ═══════════════════════════════════════════════════════════════════
  // LOCATION
  // ═══════════════════════════════════════════════════════════════════
  
  /** Full location details */
  location: HotelLocation;
  
  /** Distance from search point (if location search) */
  distanceFromSearch?: Distance;
  
  // ═══════════════════════════════════════════════════════════════════
  // MEDIA
  // ═══════════════════════════════════════════════════════════════════
  
  /** Images */
  images: HotelImage[];
  
  /** Main/hero image URL */
  heroImage?: string;
  
  // ═══════════════════════════════════════════════════════════════════
  // RATINGS & REVIEWS
  // ═══════════════════════════════════════════════════════════════════
  
  /** Guest rating */
  guestRating?: Rating;
  
  /** Category ratings */
  categoryRatings?: CategoryRatings;
  
  // ═══════════════════════════════════════════════════════════════════
  // AMENITIES
  // ═══════════════════════════════════════════════════════════════════
  
  /** Property amenities */
  amenities: HotelAmenity[];
  
  /** Key amenities for quick display */
  keyAmenities: string[];
  
  // ═══════════════════════════════════════════════════════════════════
  // ROOM OFFERS
  // ═══════════════════════════════════════════════════════════════════
  
  /** Available room offers */
  rooms: RoomOffer[];
  
  /** Lowest price across all rooms */
  lowestPrice: UnifiedPrice;
  
  // ═══════════════════════════════════════════════════════════════════
  // POLICIES
  // ═══════════════════════════════════════════════════════════════════
  
  /** Check-in time */
  checkInTime?: string;
  
  /** Check-out time */
  checkOutTime?: string;
  
  /** General policies */
  policies?: HotelPolicies;
  
  // ═══════════════════════════════════════════════════════════════════
  // METADATA
  // ═══════════════════════════════════════════════════════════════════
  
  /** When was this retrieved? */
  retrievedAt: string;
  
  /** Session ID */
  sessionId?: string;
  
  /** Deep link */
  deepLink?: string;
}

// ============================================
// ROOM OFFER
// ============================================

export interface RoomOffer {
  /** Offer ID */
  id: string;
  
  /** Provider offer ID (needed for booking) */
  providerOfferId: string;
  
  /** Room name */
  name: string;
  
  /** Room description */
  description?: string;
  
  /** Room type */
  roomType: RoomType;
  
  /** Bed configuration */
  bedConfiguration: BedConfig[];
  
  /** Room size */
  size?: {
    value: number;
    unit: 'sqft' | 'sqm';
  };
  
  /** Max occupancy */
  maxOccupancy: {
    adults: number;
    children: number;
    total: number;
  };
  
  /** Room amenities */
  amenities: string[];
  
  /** Room images */
  images?: HotelImage[];
  
  /** Pricing */
  price: UnifiedPrice;
  
  /** Price per night */
  pricePerNight: UnifiedPrice;
  
  /** What's included */
  inclusions: string[];
  
  /** Board type */
  boardType: BoardType;
  
  /** Cancellation policy */
  cancellationPolicy: HotelCancellationPolicy;
  
  /** Is this refundable? */
  isRefundable: boolean;
  
  /** Payment terms */
  paymentTerms: PaymentTerms;
  
  /** Rooms remaining */
  roomsRemaining?: number;
  
  /** Is this a special offer? */
  isPromotion?: boolean;
  
  /** Promotion name */
  promotionName?: string;
}

// ============================================
// HOTEL LOCATION
// ============================================

export interface HotelLocation {
  /** Full address */
  address: Address;
  
  /** Coordinates */
  coordinates: Coordinates;
  
  /** Neighborhood/area */
  neighborhood?: string;
  
  /** City */
  city: string;
  
  /** Country */
  country: string;
  
  /** Country code */
  countryCode: string;
  
  /** Timezone */
  timezone?: string;
  
  /** Nearby points of interest */
  nearbyPOIs?: NearbyPOI[];
}

// ============================================
// HOTEL CANCELLATION POLICY
// ============================================

export interface HotelCancellationPolicy {
  /** Is free cancellation available? */
  freeCancellation: boolean;
  
  /** Free cancellation deadline */
  freeCancellationDeadline?: string;
  
  /** Cancellation rules */
  rules: CancellationRule[];
  
  /** Policy summary text */
  summary: string;
}

// ============================================
// HOTEL POLICIES
// ============================================

export interface HotelPolicies {
  /** Check-in policy */
  checkIn: {
    time: string;
    instructions?: string;
    minAge?: number;
  };
  
  /** Check-out policy */
  checkOut: {
    time: string;
    lateCheckoutAvailable?: boolean;
    lateCheckoutFee?: UnifiedPrice;
  };
  
  /** Pet policy */
  pets?: {
    allowed: boolean;
    fee?: UnifiedPrice;
    restrictions?: string;
  };
  
  /** Smoking policy */
  smoking?: {
    allowed: boolean;
    designatedAreas?: boolean;
  };
  
  /** Payment methods accepted */
  paymentMethods?: string[];
  
  /** Required at check-in */
  requiredAtCheckIn?: string[];
}
