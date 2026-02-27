/**
 * UNIFIED DATA MODEL - PACKAGE TYPES
 * 
 * Combined travel package representation.
 */

import { UnifiedPrice, ProviderMeta, Location, PaymentTerms } from './common.types';
import { UnifiedFlight } from './flight.types';
import { UnifiedHotel } from './hotel.types';
import { UnifiedCarRental } from './car.types';
import { UnifiedExperience } from './experience.types';

// ============================================
// MAIN PACKAGE TYPE
// ============================================

export interface UnifiedPackage {
  // ═══════════════════════════════════════════════════════════════════
  // IDENTIFICATION
  // ═══════════════════════════════════════════════════════════════════
  
  /** Unique identifier */
  id: string;
  
  /** Provider package ID */
  providerPackageId: string;
  
  /** Provider info */
  provider: ProviderMeta;
  
  /** Type */
  type: 'package';
  
  // ═══════════════════════════════════════════════════════════════════
  // PACKAGE COMPOSITION
  // ═══════════════════════════════════════════════════════════════════
  
  /** Package type */
  packageType: 'flight_hotel' | 'flight_hotel_car' | 'hotel_car' | 'custom';
  
  /** Package name/title */
  name: string;
  
  /** Description */
  description?: string;
  
  /** Included components */
  components: PackageComponent[];
  
  // ═══════════════════════════════════════════════════════════════════
  // DESTINATION
  // ═══════════════════════════════════════════════════════════════════
  
  /** Origin (for flight packages) */
  origin?: Location;
  
  /** Destination */
  destination: Location;
  
  /** Travel dates */
  dates: {
    startDate: string;
    endDate: string;
    nights: number;
  };
  
  // ═══════════════════════════════════════════════════════════════════
  // PRICING
  // ═══════════════════════════════════════════════════════════════════
  
  /** Total package price */
  totalPrice: UnifiedPrice;
  
  /** Price per person */
  pricePerPerson: UnifiedPrice;
  
  /** Breakdown by component */
  priceBreakdown: {
    componentType: string;
    price: UnifiedPrice;
  }[];
  
  /** Savings vs booking separately */
  savings?: UnifiedPrice;
  
  /** Savings percentage */
  savingsPercent?: number;
  
  // ═══════════════════════════════════════════════════════════════════
  // TRAVELERS
  // ═══════════════════════════════════════════════════════════════════
  
  /** Number of travelers this price is for */
  travelers: {
    adults: number;
    children: number;
    infants: number;
  };
  
  // ═══════════════════════════════════════════════════════════════════
  // POLICIES
  // ═══════════════════════════════════════════════════════════════════
  
  /** Package cancellation policy */
  cancellationPolicy: PackageCancellationPolicy;
  
  /** Payment terms */
  paymentTerms: PaymentTerms;
  
  // ═══════════════════════════════════════════════════════════════════
  // METADATA
  // ═══════════════════════════════════════════════════════════════════
  
  /** Is this a deal? */
  isDeal: boolean;
  
  /** Deal name */
  dealName?: string;
  
  /** Valid until */
  validUntil?: string;
  
  /** Limited availability? */
  limitedAvailability: boolean;
  
  /** Retrieved at */
  retrievedAt: string;
  
  /** Deep link */
  deepLink?: string;
}

// ============================================
// PACKAGE COMPONENT
// ============================================

export interface PackageComponent {
  /** Component type */
  type: 'flight' | 'hotel' | 'car' | 'experience' | 'transfer';
  
  /** Is this customizable? */
  isCustomizable: boolean;
  
  /** Is this optional? */
  isOptional: boolean;
  
  /** Component details */
  details: UnifiedFlight | UnifiedHotel | UnifiedCarRental | UnifiedExperience;
  
  /** Alternatives (if customizable) */
  alternatives?: (UnifiedFlight | UnifiedHotel | UnifiedCarRental | UnifiedExperience)[];
}

// ============================================
// PACKAGE CANCELLATION POLICY
// ============================================

export interface PackageCancellationPolicy {
  /** Is package cancellable? */
  cancellable: boolean;
  
  /** Free cancellation deadline */
  freeCancellationDeadline?: string;
  
  /** Cancellation rules */
  rules: {
    daysBeforeTravel: number;
    penaltyPercent: number;
    penaltyAmount?: UnifiedPrice;
  }[];
  
  /** Note about partial cancellation */
  partialCancellationNote?: string;
}
