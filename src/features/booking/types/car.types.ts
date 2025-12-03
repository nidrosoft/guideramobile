/**
 * CAR RENTAL TYPES
 * 
 * Types specific to car rental booking flow.
 */

import { Location, PriceDisplay, Booking } from './booking.types';

// ============================================
// CAR
// ============================================

export interface Car {
  id: string;
  name: string;
  category: CarCategory;
  make: string;
  model: string;
  year: number;
  images: string[];
  features: CarFeature[];
  specs: CarSpecs;
  rental: RentalDetails;
  available: boolean;
  popularChoice: boolean;
}

export interface CarSpecs {
  seats: number;
  doors: number;
  luggage: {
    large: number;
    small: number;
  };
  transmission: 'automatic' | 'manual';
  fuelType: FuelType;
  fuelPolicy: FuelPolicy;
  airConditioning: boolean;
  mileage: 'unlimited' | number;  // km per day if limited
}

export type CarCategory = 
  | 'mini'
  | 'economy' 
  | 'compact' 
  | 'midsize' 
  | 'standard'
  | 'fullsize' 
  | 'premium'
  | 'luxury'
  | 'suv_compact'
  | 'suv_standard'
  | 'suv_premium'
  | 'van' 
  | 'minivan'
  | 'convertible'
  | 'sports';

export type FuelType = 'petrol' | 'diesel' | 'electric' | 'hybrid' | 'plugin_hybrid';
export type FuelPolicy = 'full_to_full' | 'full_to_empty' | 'same_to_same' | 'prepaid';

export interface CarFeature {
  id: string;
  name: string;
  icon: string;
  included: boolean;
}

export const CAR_CATEGORY_LABELS: Record<CarCategory, string> = {
  mini: 'Mini',
  economy: 'Economy',
  compact: 'Compact',
  midsize: 'Midsize',
  standard: 'Standard',
  fullsize: 'Full Size',
  premium: 'Premium',
  luxury: 'Luxury',
  suv_compact: 'Compact SUV',
  suv_standard: 'Standard SUV',
  suv_premium: 'Premium SUV',
  van: 'Van',
  minivan: 'Minivan',
  convertible: 'Convertible',
  sports: 'Sports',
};

// ============================================
// RENTAL COMPANY
// ============================================

export interface RentalCompany {
  id: string;
  name: string;
  logo: string;
  rating: number;
  reviewCount: number;
  locations: number;
}

export interface RentalDetails {
  company: RentalCompany;
  pricePerDay: PriceDisplay;
  totalPrice: PriceDisplay;
  deposit: number;
  currency: string;
  insurance: InsuranceOption[];
  extras: CarExtra[];
  policies: RentalPolicies;
}

// ============================================
// PICKUP / DROPOFF
// ============================================

export interface RentalLocation {
  id: string;
  name: string;
  type: 'airport' | 'city' | 'train_station' | 'hotel';
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  openingHours: {
    [day: string]: { open: string; close: string } | 'closed';
  };
  afterHoursPickup: boolean;
  afterHoursDropoff: boolean;
  phone?: string;
}

export interface PickupDropoff {
  location: RentalLocation;
  date: Date;
  time: string;
}

// ============================================
// INSURANCE
// ============================================

export type InsuranceCoverage = 
  | 'basic'
  | 'standard'
  | 'premium'
  | 'full';

export interface InsuranceOption {
  id: string;
  name: string;
  coverage: InsuranceCoverage;
  description: string;
  includes: string[];
  excludes: string[];
  deductible: number;
  pricePerDay: number;
  recommended: boolean;
}

// ============================================
// EXTRAS
// ============================================

export interface CarExtra {
  id: string;
  name: string;
  description: string;
  icon: string;
  pricePerDay: number;
  priceTotal?: number;
  maxQuantity: number;
  category: 'equipment' | 'service' | 'protection';
}

export const COMMON_CAR_EXTRAS: Partial<CarExtra>[] = [
  { id: 'gps', name: 'GPS Navigation', icon: 'navigation', category: 'equipment' },
  { id: 'child_seat', name: 'Child Seat', icon: 'baby', category: 'equipment' },
  { id: 'booster_seat', name: 'Booster Seat', icon: 'child', category: 'equipment' },
  { id: 'wifi', name: 'Mobile WiFi', icon: 'wifi', category: 'equipment' },
  { id: 'snow_chains', name: 'Snow Chains', icon: 'snowflake', category: 'equipment' },
  { id: 'ski_rack', name: 'Ski Rack', icon: 'ski', category: 'equipment' },
  { id: 'additional_driver', name: 'Additional Driver', icon: 'user-plus', category: 'service' },
  { id: 'roadside_assistance', name: 'Roadside Assistance', icon: 'phone', category: 'protection' },
  { id: 'tire_protection', name: 'Tire & Windscreen Protection', icon: 'shield', category: 'protection' },
];

// ============================================
// POLICIES
// ============================================

export interface RentalPolicies {
  minAge: number;
  maxAge?: number;
  youngDriverFee?: { age: number; fee: number };
  seniorDriverFee?: { age: number; fee: number };
  licenseRequirements: string;
  internationalLicense: boolean;
  crossBorder: boolean;
  crossBorderCountries?: string[];
  oneWayAllowed: boolean;
  oneWayFee?: number;
  cancellation: {
    freeBefore: number;      // hours before pickup
    penalty: number;         // percentage after deadline
  };
  noShow: number;            // percentage penalty
  lateReturn: {
    gracePeriod: number;     // minutes
    hourlyFee: number;
  };
}

// ============================================
// DRIVER INFO
// ============================================

export interface DriverInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: Date;
  licenseNumber: string;
  licenseCountry: string;
  licenseExpiry: Date;
  address: {
    street: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
  };
}

// ============================================
// SEARCH PARAMS
// ============================================

export interface CarSearchParams {
  pickupLocation: RentalLocation | null;
  dropoffLocation: RentalLocation | null;
  sameDropoff: boolean;
  pickupDate: Date | null;
  pickupTime: string;
  dropoffDate: Date | null;
  dropoffTime: string;
  driverAge: number;
}

export interface CarFilters {
  category: CarCategory[];
  transmission: ('automatic' | 'manual')[];
  fuelType: FuelType[];
  priceRange: { min: number; max: number } | null;
  company: string[];
  features: string[];
  seats: number | null;
  unlimitedMileage: boolean;
}

// ============================================
// CAR BOOKING
// ============================================

export interface CarBooking extends Booking {
  type: 'car';
  searchParams: CarSearchParams;
  car: Car;
  pickup: PickupDropoff;
  dropoff: PickupDropoff;
  driver: DriverInfo;
  additionalDrivers: DriverInfo[];
  insurance: InsuranceOption;
  extras: CarExtra[];
  rentalDays: number;
  voucher: CarVoucher;
}

export interface CarVoucher {
  id: string;
  confirmationNumber: string;
  company: string;
  carName: string;
  category: CarCategory;
  pickup: {
    location: string;
    address: string;
    dateTime: Date;
  };
  dropoff: {
    location: string;
    address: string;
    dateTime: Date;
  };
  driverName: string;
  totalAmount: number;
  currency: string;
  prepaid: boolean;
  payAtCounter?: number;
  qrCode: string;
  importantInfo: string[];
}
