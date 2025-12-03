/**
 * PACKAGE TYPES
 * 
 * Types specific to package/bundle booking flow.
 * Packages combine flights, hotels, cars, and experiences.
 */

import { Location, PassengerCount, PriceDisplay, Booking, DateRange } from './booking.types';
import { Flight, FlightSearchParams } from './flight.types';
import { Hotel, Room, HotelSearchParams } from './hotel.types';
import { Car, CarSearchParams } from './car.types';
import { Experience, ExperienceSearchParams } from './experience.types';

// ============================================
// PACKAGE
// ============================================

export interface Package {
  id: string;
  name: string;
  description: string;
  destination: PackageDestination;
  duration: number;              // nights
  images: string[];
  includes: PackageInclusion[];
  highlights: string[];
  itinerary: PackageItineraryDay[];
  price: PackagePrice;
  rating: number;
  reviewCount: number;
  featured: boolean;
  bestSeller: boolean;
  limitedOffer: boolean;
  validUntil?: Date;
  tags: string[];
}

export interface PackageDestination {
  city: string;
  country: string;
  region?: string;
  description: string;
  image: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

export interface PackageInclusion {
  type: 'flight' | 'hotel' | 'car' | 'experience' | 'transfer' | 'insurance' | 'meals';
  included: boolean;
  description: string;
  details?: string;
}

export interface PackageItineraryDay {
  day: number;
  title: string;
  description: string;
  activities: {
    time?: string;
    title: string;
    description: string;
    type: 'flight' | 'hotel' | 'activity' | 'meal' | 'transfer' | 'free_time';
    optional?: boolean;
  }[];
  meals: {
    breakfast: boolean;
    lunch: boolean;
    dinner: boolean;
  };
  accommodation?: string;
}

// ============================================
// PACKAGE PRICING
// ============================================

export interface PackagePrice {
  basePrice: PriceDisplay;
  perPerson: boolean;
  savings: number;                // Amount saved vs booking separately
  savingsPercentage: number;
  breakdown: PackagePriceBreakdown;
}

export interface PackagePriceBreakdown {
  flight: number;
  hotel: number;
  car?: number;
  experiences?: number;
  transfers?: number;
  taxes: number;
  fees: number;
  total: number;
  currency: string;
}

// ============================================
// CUSTOM PACKAGE BUILDER
// ============================================

export interface CustomPackage {
  id: string;
  destination: Location | null;
  dates: DateRange | null;
  travelers: PassengerCount;
  
  // Selected items
  flight: {
    outbound: Flight | null;
    return: Flight | null;
  };
  hotel: {
    hotel: Hotel | null;
    room: Room | null;
  };
  car: Car | null;
  experiences: Experience[];
  
  // Pricing
  pricing: CustomPackagePricing;
  
  // Status
  isComplete: boolean;
  completedSteps: string[];
}

export interface CustomPackagePricing {
  flight: number;
  hotel: number;
  car: number;
  experiences: number;
  subtotal: number;
  bundleDiscount: number;
  taxes: number;
  fees: number;
  total: number;
  currency: string;
  perPerson: boolean;
}

// ============================================
// PACKAGE TEMPLATES
// ============================================

export type PackageTemplate = 
  | 'flight_hotel'
  | 'flight_hotel_car'
  | 'flight_hotel_experience'
  | 'all_inclusive'
  | 'custom';

export interface PackageTemplateConfig {
  type: PackageTemplate;
  label: string;
  description: string;
  includes: ('flight' | 'hotel' | 'car' | 'experience')[];
  icon: string;
  popular: boolean;
}

export const PACKAGE_TEMPLATES: PackageTemplateConfig[] = [
  {
    type: 'flight_hotel',
    label: 'Flight + Hotel',
    description: 'Save up to 20% when you bundle',
    includes: ['flight', 'hotel'],
    icon: 'package',
    popular: true,
  },
  {
    type: 'flight_hotel_car',
    label: 'Flight + Hotel + Car',
    description: 'Complete travel package',
    includes: ['flight', 'hotel', 'car'],
    icon: 'car',
    popular: true,
  },
  {
    type: 'flight_hotel_experience',
    label: 'Flight + Hotel + Experience',
    description: 'Travel with activities included',
    includes: ['flight', 'hotel', 'experience'],
    icon: 'map',
    popular: false,
  },
  {
    type: 'all_inclusive',
    label: 'All-Inclusive',
    description: 'Everything you need in one package',
    includes: ['flight', 'hotel', 'car', 'experience'],
    icon: 'star',
    popular: false,
  },
  {
    type: 'custom',
    label: 'Build Your Own',
    description: 'Customize every detail',
    includes: [],
    icon: 'settings',
    popular: false,
  },
];

// ============================================
// POPULAR DESTINATIONS
// ============================================

export interface PopularDestination {
  id: string;
  city: string;
  country: string;
  image: string;
  startingPrice: PriceDisplay;
  duration: string;              // e.g., "3-7 nights"
  tags: string[];
  trending: boolean;
}

// ============================================
// DEALS & OFFERS
// ============================================

export interface PackageDeal {
  id: string;
  title: string;
  description: string;
  destination: PackageDestination;
  image: string;
  originalPrice: number;
  discountedPrice: number;
  discount: number;              // percentage
  currency: string;
  validFrom: Date;
  validUntil: Date;
  travelWindow: {
    from: Date;
    until: Date;
  };
  includes: string[];
  terms: string[];
  limitedSpots?: number;
  soldCount?: number;
}

// ============================================
// SEARCH PARAMS
// ============================================

export interface PackageSearchParams {
  destination: Location | null;
  origin: Location | null;
  dates: DateRange | null;
  flexibleDates: boolean;
  travelers: PassengerCount;
  template: PackageTemplate;
  
  // Optional filters
  budget?: { min: number; max: number };
  duration?: { min: number; max: number };  // nights
}

export interface PackageFilters {
  priceRange: { min: number; max: number } | null;
  duration: { min: number; max: number } | null;
  starRating: number[];
  includes: ('flight' | 'hotel' | 'car' | 'experience' | 'meals' | 'transfer')[];
  amenities: string[];
  rating: number | null;
}

// ============================================
// PACKAGE BOOKING
// ============================================

export interface PackageBooking extends Booking {
  type: 'package';
  searchParams: PackageSearchParams;
  package: Package | CustomPackage;
  isCustom: boolean;
  
  // Individual bookings
  flightBookingRef?: string;
  hotelBookingRef?: string;
  carBookingRef?: string;
  experienceBookingRefs?: string[];
  
  // Vouchers
  vouchers: PackageVoucher;
}

export interface PackageVoucher {
  masterConfirmation: string;
  flight?: {
    confirmationNumber: string;
    eTicketNumbers: string[];
  };
  hotel?: {
    confirmationNumber: string;
    voucherNumber: string;
  };
  car?: {
    confirmationNumber: string;
    voucherNumber: string;
  };
  experiences?: {
    confirmationNumber: string;
    ticketNumber: string;
    experienceName: string;
  }[];
  qrCode: string;
  downloadUrl: string;
}

// ============================================
// PACKAGE COMPARISON
// ============================================

export interface PackageComparison {
  packages: Package[];
  comparisonPoints: {
    category: string;
    items: {
      label: string;
      values: (string | boolean | number)[];
    }[];
  }[];
}
