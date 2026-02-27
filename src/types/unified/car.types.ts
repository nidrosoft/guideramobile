/**
 * UNIFIED DATA MODEL - CAR RENTAL TYPES
 * 
 * Complete car rental offer representation.
 */

import { VehicleCategory, VehicleType, FuelPolicyType, InsuranceType, CarLocationType } from './enums';
import { UnifiedPrice, ProviderMeta, Address, Coordinates } from './common.types';

// ============================================
// MAIN CAR RENTAL TYPE
// ============================================

export interface UnifiedCarRental {
  // ═══════════════════════════════════════════════════════════════════
  // IDENTIFICATION
  // ═══════════════════════════════════════════════════════════════════
  
  /** Unique identifier */
  id: string;
  
  /** Provider offer ID */
  providerOfferId: string;
  
  /** Provider info */
  provider: ProviderMeta;
  
  /** Type */
  type: 'car';
  
  // ═══════════════════════════════════════════════════════════════════
  // VEHICLE INFORMATION
  // ═══════════════════════════════════════════════════════════════════
  
  /** Vehicle details */
  vehicle: Vehicle;
  
  /** Rental company */
  rentalCompany: RentalCompany;
  
  // ═══════════════════════════════════════════════════════════════════
  // RENTAL DETAILS
  // ═══════════════════════════════════════════════════════════════════
  
  /** Pickup location */
  pickupLocation: CarLocation;
  
  /** Dropoff location */
  dropoffLocation: CarLocation;
  
  /** Pickup datetime */
  pickupAt: string;
  
  /** Dropoff datetime */
  dropoffAt: string;
  
  /** Rental duration in days */
  rentalDays: number;
  
  // ═══════════════════════════════════════════════════════════════════
  // PRICING
  // ═══════════════════════════════════════════════════════════════════
  
  /** Total price */
  price: UnifiedPrice;
  
  /** Price per day */
  pricePerDay: UnifiedPrice;
  
  /** What's included in price */
  inclusions: CarInclusion[];
  
  /** Available extras */
  extras?: CarExtra[];
  
  // ═══════════════════════════════════════════════════════════════════
  // POLICIES
  // ═══════════════════════════════════════════════════════════════════
  
  /** Mileage policy */
  mileagePolicy: MileagePolicy;
  
  /** Fuel policy */
  fuelPolicy: FuelPolicy;
  
  /** Insurance options */
  insurance: InsuranceOption[];
  
  /** Cancellation policy */
  cancellationPolicy: CarCancellationPolicy;
  
  /** Driver requirements */
  driverRequirements: DriverRequirements;
  
  // ═══════════════════════════════════════════════════════════════════
  // METADATA
  // ═══════════════════════════════════════════════════════════════════
  
  /** Supplier rating */
  supplierRating?: number;
  
  /** Is pay at pickup? */
  payAtPickup: boolean;
  
  /** Pay now vs pay later price difference */
  payLaterPrice?: UnifiedPrice;
  
  /** Retrieved at */
  retrievedAt: string;
  
  /** Deep link */
  deepLink?: string;
}

// ============================================
// VEHICLE
// ============================================

export interface Vehicle {
  /** Vehicle name/model */
  name: string;
  
  /** Example models */
  exampleModels?: string[];
  
  /** Vehicle category */
  category: VehicleCategory;
  
  /** Vehicle type */
  vehicleType: VehicleType;
  
  /** Transmission */
  transmission: 'automatic' | 'manual';
  
  /** Fuel type */
  fuelType: 'petrol' | 'diesel' | 'electric' | 'hybrid';
  
  /** Number of seats */
  seats: number;
  
  /** Number of doors */
  doors: number;
  
  /** Luggage capacity */
  luggage: {
    large: number;
    small: number;
  };
  
  /** Air conditioning */
  airConditioning: boolean;
  
  /** Vehicle image */
  imageUrl?: string;
  
  /** ACRISS code */
  acrissCode?: string;
  
  /** Features */
  features?: string[];
}

// ============================================
// RENTAL COMPANY
// ============================================

export interface RentalCompany {
  /** Company code */
  code: string;
  
  /** Company name */
  name: string;
  
  /** Logo URL */
  logoUrl?: string;
  
  /** Rating */
  rating?: number;
  
  /** Review count */
  reviewCount?: number;
}

// ============================================
// CAR LOCATION
// ============================================

export interface CarLocation {
  /** Location type */
  type: CarLocationType;
  
  /** Location name */
  name: string;
  
  /** Full address */
  address: Address;
  
  /** Coordinates */
  coordinates?: Coordinates;
  
  /** Airport code (if airport) */
  airportCode?: string;
  
  /** Is in terminal? */
  inTerminal?: boolean;
  
  /** Shuttle available? */
  shuttleAvailable?: boolean;
  
  /** Counter location instructions */
  instructions?: string;
  
  /** Operating hours */
  operatingHours?: {
    open: string;
    close: string;
    is24Hours: boolean;
  };
}

// ============================================
// CAR INCLUSIONS & EXTRAS
// ============================================

export interface CarInclusion {
  /** Inclusion type */
  type: 'insurance' | 'mileage' | 'tax' | 'fee' | 'equipment' | 'other';
  
  /** Name */
  name: string;
  
  /** Description */
  description?: string;
}

export interface CarExtra {
  /** Extra type */
  type: 'gps' | 'child_seat' | 'ski_rack' | 'additional_driver' | 'wifi' | 'other';
  
  /** Name */
  name: string;
  
  /** Price */
  price: UnifiedPrice;
  
  /** Price type */
  priceType: 'per_day' | 'per_rental' | 'one_time';
  
  /** Max quantity */
  maxQuantity?: number;
}

// ============================================
// MILEAGE POLICY
// ============================================

export interface MileagePolicy {
  /** Is unlimited? */
  unlimited: boolean;
  
  /** Included miles/km (if not unlimited) */
  includedDistance?: number;
  
  /** Distance unit */
  unit?: 'km' | 'mi';
  
  /** Cost per extra unit */
  extraCost?: UnifiedPrice;
}

// ============================================
// FUEL POLICY
// ============================================

export interface FuelPolicy {
  /** Policy type */
  type: FuelPolicyType;
  
  /** Description */
  description: string;
}

// ============================================
// INSURANCE OPTION
// ============================================

export interface InsuranceOption {
  /** Insurance type */
  type: InsuranceType;
  
  /** Name */
  name: string;
  
  /** Is included in base price? */
  included: boolean;
  
  /** Price if not included */
  price?: UnifiedPrice;
  
  /** Coverage details */
  coverage?: string;
  
  /** Excess/deductible amount */
  excess?: UnifiedPrice;
}

// ============================================
// CAR CANCELLATION POLICY
// ============================================

export interface CarCancellationPolicy {
  /** Is free cancellation available? */
  freeCancellation: boolean;
  
  /** Free cancellation deadline */
  freeCancellationDeadline?: string;
  
  /** Policy description */
  description: string;
  
  /** Penalty if cancelled after deadline */
  penalty?: UnifiedPrice;
}

// ============================================
// DRIVER REQUIREMENTS
// ============================================

export interface DriverRequirements {
  /** Minimum age */
  minimumAge: number;
  
  /** Young driver fee (if applicable) */
  youngDriverFee?: {
    maxAge: number;
    fee: UnifiedPrice;
  };
  
  /** License requirements */
  licenseRequirements: string[];
  
  /** International license needed? */
  internationalLicenseRequired?: boolean;
  
  /** Credit card required? */
  creditCardRequired: boolean;
  
  /** Additional driver fee */
  additionalDriverFee?: UnifiedPrice;
}
