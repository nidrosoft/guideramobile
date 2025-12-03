/**
 * HOTEL TYPES
 * 
 * Types specific to hotel booking flow.
 */

import { Location, GuestCount, PriceDisplay, Booking } from './booking.types';

// ============================================
// HOTEL
// ============================================

export interface Hotel {
  id: string;
  name: string;
  description: string;
  shortDescription: string;
  starRating: number;          // 1-5
  userRating: number;          // 0-10
  reviewCount: number;
  images: HotelImage[];
  location: HotelLocation;
  amenities: Amenity[];
  rooms: Room[];
  policies: HotelPolicies;
  pricePerNight: PriceDisplay;
  lowestPrice: PriceDisplay;
  featured: boolean;
  verified: boolean;
  propertyType: PropertyType;
}

export interface HotelImage {
  id: string;
  url: string;
  caption?: string;
  category: 'exterior' | 'lobby' | 'room' | 'bathroom' | 'pool' | 'restaurant' | 'gym' | 'other';
}

export interface HotelLocation {
  address: string;
  city: string;
  state?: string;
  country: string;
  postalCode?: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  neighborhood?: string;
  distanceFromCenter?: number;  // km
  nearbyAttractions?: NearbyAttraction[];
}

export interface NearbyAttraction {
  name: string;
  distance: number;            // km
  type: 'landmark' | 'transport' | 'restaurant' | 'shopping' | 'beach' | 'park';
}

export type PropertyType = 
  | 'hotel' 
  | 'resort' 
  | 'apartment' 
  | 'villa' 
  | 'hostel' 
  | 'boutique' 
  | 'bed_breakfast' 
  | 'guesthouse';

// ============================================
// ROOM
// ============================================

export interface Room {
  id: string;
  name: string;
  description: string;
  images: string[];
  maxOccupancy: number;
  maxAdults: number;
  maxChildren: number;
  bedConfiguration: BedConfiguration[];
  size: number;                // sqm
  amenities: string[];
  view?: string;
  price: PriceDisplay;
  originalPrice?: PriceDisplay;  // For discounts
  available: number;
  refundable: boolean;
  refundDeadline?: Date;
  breakfast: BreakfastOption;
  cancellationPolicy: string;
}

export interface BedConfiguration {
  type: BedType;
  count: number;
}

export type BedType = 
  | 'single' 
  | 'double' 
  | 'queen' 
  | 'king' 
  | 'twin' 
  | 'sofa_bed' 
  | 'bunk';

export type BreakfastOption = 'included' | 'available' | 'not_available';

// ============================================
// AMENITIES
// ============================================

export interface Amenity {
  id: string;
  name: string;
  icon: string;
  category: AmenityCategory;
  description?: string;
}

export type AmenityCategory = 
  | 'general' 
  | 'room' 
  | 'bathroom' 
  | 'outdoor' 
  | 'food' 
  | 'wellness' 
  | 'business' 
  | 'family' 
  | 'accessibility';

export const AMENITY_ICONS: Record<string, string> = {
  wifi: 'wifi',
  parking: 'car',
  pool: 'swimming',
  gym: 'dumbbell',
  spa: 'spa',
  restaurant: 'restaurant',
  bar: 'wine',
  room_service: 'bell',
  air_conditioning: 'snowflake',
  tv: 'tv',
  minibar: 'refrigerator',
  safe: 'lock',
  balcony: 'balcony',
  kitchen: 'kitchen',
  washer: 'washer',
  pet_friendly: 'paw',
  beach_access: 'beach',
  airport_shuttle: 'shuttle',
  concierge: 'concierge',
  business_center: 'briefcase',
};

// ============================================
// REVIEWS
// ============================================

export interface HotelReview {
  id: string;
  hotelId: string;
  author: {
    name: string;
    avatar?: string;
    country?: string;
  };
  rating: number;
  title?: string;
  content: string;
  date: Date;
  stayDate: Date;
  roomType?: string;
  travelType: 'business' | 'couple' | 'family' | 'friends' | 'solo';
  pros?: string[];
  cons?: string[];
  hotelResponse?: {
    content: string;
    date: Date;
  };
  helpful: number;
  images?: string[];
}

export interface ReviewSummary {
  overall: number;
  categories: {
    cleanliness: number;
    comfort: number;
    location: number;
    facilities: number;
    staff: number;
    value: number;
  };
  totalReviews: number;
  ratingDistribution: {
    excellent: number;    // 9-10
    veryGood: number;     // 7-8
    average: number;      // 5-6
    poor: number;         // 3-4
    terrible: number;     // 1-2
  };
}

// ============================================
// POLICIES
// ============================================

export interface HotelPolicies {
  checkIn: {
    from: string;         // HH:mm
    until: string;
  };
  checkOut: {
    from: string;
    until: string;
  };
  cancellation: CancellationPolicy;
  children: string;
  pets: PetPolicy;
  smoking: 'allowed' | 'designated_areas' | 'not_allowed';
  parties: boolean;
  quietHours?: { from: string; until: string };
  paymentMethods: string[];
  deposit?: {
    amount: number;
    currency: string;
    refundable: boolean;
  };
}

export interface CancellationPolicy {
  type: 'free' | 'partial' | 'non_refundable';
  deadline?: Date;
  penalty?: number;        // percentage
  description: string;
}

export type PetPolicy = 'allowed' | 'allowed_with_fee' | 'not_allowed';

// ============================================
// SEARCH PARAMS
// ============================================

export interface HotelSearchParams {
  destination: Location | null;
  checkIn: Date | null;
  checkOut: Date | null;
  guests: GuestCount;
}

export interface HotelFilters {
  starRating: number[];
  priceRange: { min: number; max: number } | null;
  propertyType: PropertyType[];
  amenities: string[];
  userRating: number | null;      // Minimum rating
  freeCancellation: boolean;
  breakfast: boolean;
  distanceFromCenter: number | null;  // Max km
}

// ============================================
// HOTEL BOOKING
// ============================================

export interface HotelBooking extends Booking {
  type: 'hotel';
  searchParams: HotelSearchParams;
  hotel: Hotel;
  room: Room;
  nights: number;
  specialRequests?: string;
  arrivalTime?: string;
  extras: HotelExtras;
  confirmationVoucher: HotelVoucher;
}

export interface HotelExtras {
  breakfast: boolean;
  parking: boolean;
  airportTransfer: boolean;
  earlyCheckIn: boolean;
  lateCheckOut: boolean;
  extraBed: boolean;
}

export interface HotelVoucher {
  id: string;
  confirmationNumber: string;
  hotelName: string;
  address: string;
  checkIn: Date;
  checkOut: Date;
  roomType: string;
  guestName: string;
  totalAmount: number;
  currency: string;
  qrCode: string;
  notes?: string;
}
