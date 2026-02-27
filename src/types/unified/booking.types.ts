/**
 * UNIFIED DATA MODEL - BOOKING TYPES
 * 
 * Booking request and confirmation types.
 */

import { BookingStatus, PaymentStatus, DocumentType, Gender, SeatPreference } from './enums';
import { UnifiedPrice, Address } from './common.types';
import { UnifiedFlight } from './flight.types';
import { UnifiedHotel } from './hotel.types';
import { UnifiedCarRental } from './car.types';
import { UnifiedExperience } from './experience.types';
import { UnifiedPackage } from './package.types';

// ============================================
// BOOKING REQUEST
// ============================================

export interface BookingRequest {
  /** Session ID (from search) */
  sessionId: string;
  
  /** Offer ID to book */
  offerId: string;
  
  /** Provider code */
  providerCode: string;
  
  /** Category */
  category: 'flights' | 'hotels' | 'cars' | 'experiences' | 'packages';
  
  /** Traveler/guest details */
  travelers: TravelerDetails[];
  
  /** Contact information */
  contact: ContactInfo;
  
  /** Payment method */
  payment: PaymentMethod;
  
  /** Special requests */
  specialRequests?: string[];
  
  /** Terms accepted */
  termsAccepted: boolean;
  
  /** Idempotency key (prevent double booking) */
  idempotencyKey: string;
}

// ============================================
// TRAVELER DETAILS
// ============================================

export interface TravelerDetails {
  /** Traveler type */
  type: 'adult' | 'child' | 'infant';
  
  /** First name */
  firstName: string;
  
  /** Last name */
  lastName: string;
  
  /** Date of birth */
  dateOfBirth: string;
  
  /** Gender */
  gender: Gender;
  
  /** Email */
  email?: string;
  
  /** Phone */
  phone?: string;
  
  /** Passport/ID (for flights) */
  document?: {
    type: DocumentType;
    number: string;
    issuingCountry: string;
    expiryDate: string;
  };
  
  /** Loyalty program (optional) */
  loyaltyProgram?: {
    programCode: string;
    memberId: string;
  };
  
  /** Seat preference (flights) */
  seatPreference?: SeatPreference;
  
  /** Meal preference (flights) */
  mealPreference?: string;
  
  /** Special assistance */
  specialAssistance?: string[];
}

// ============================================
// CONTACT INFO
// ============================================

export interface ContactInfo {
  /** First name */
  firstName: string;
  
  /** Last name */
  lastName: string;
  
  /** Email */
  email: string;
  
  /** Phone */
  phone: string;
  
  /** Country code */
  countryCode: string;
  
  /** Address (optional) */
  address?: Address;
}

// ============================================
// PAYMENT METHOD
// ============================================

export interface PaymentMethod {
  /** Payment type */
  type: 'card' | 'pay_later' | 'wallet';
  
  /** Stripe payment method ID (if card) */
  stripePaymentMethodId?: string;
  
  /** Billing address */
  billingAddress?: Address;
}

// ============================================
// BOOKING CONFIRMATION
// ============================================

export interface BookingConfirmation {
  /** Was booking successful? */
  success: boolean;
  
  /** Booking reference */
  bookingReference: string;
  
  /** Provider confirmation number */
  providerReference: string;
  
  /** Booking details */
  booking: {
    /** Booking ID in our system */
    id: string;
    
    /** Status */
    status: BookingStatus;
    
    /** Category */
    category: 'flights' | 'hotels' | 'cars' | 'experiences' | 'packages';
    
    /** Booked item */
    item: UnifiedFlight | UnifiedHotel | UnifiedCarRental | UnifiedExperience | UnifiedPackage;
    
    /** Total paid */
    totalPaid: UnifiedPrice;
    
    /** Payment status */
    paymentStatus: PaymentStatus;
    
    /** Travelers */
    travelers: TravelerDetails[];
    
    /** Contact */
    contact: ContactInfo;
    
    /** Created at */
    createdAt: string;
  };
  
  /** Confirmation documents */
  documents?: {
    type: 'eticket' | 'voucher' | 'confirmation';
    url: string;
  }[];
  
  /** Next steps */
  nextSteps?: string[];
  
  /** Warnings */
  warnings?: string[];
}

// ============================================
// PRICE VERIFICATION
// ============================================

export interface PriceVerification {
  /** Is price still valid? */
  valid: boolean;
  
  /** Current price */
  currentPrice: UnifiedPrice;
  
  /** Original price (from search) */
  originalPrice: UnifiedPrice;
  
  /** Price changed? */
  priceChanged: boolean;
  
  /** Price difference */
  priceDifference?: UnifiedPrice;
  
  /** Offer still available? */
  available: boolean;
  
  /** Seats/rooms remaining */
  remaining?: number;
  
  /** Expires at */
  expiresAt?: string;
}

// ============================================
// CANCELLATION
// ============================================

export interface CancellationRequest {
  /** Booking ID */
  bookingId: string;
  
  /** Reason */
  reason?: string;
  
  /** Request refund */
  requestRefund: boolean;
}

export interface CancellationResult {
  /** Was cancellation successful? */
  success: boolean;
  
  /** Cancellation reference */
  cancellationReference?: string;
  
  /** Refund amount */
  refundAmount?: UnifiedPrice;
  
  /** Refund status */
  refundStatus?: 'pending' | 'processed' | 'denied';
  
  /** Penalty charged */
  penaltyCharged?: UnifiedPrice;
  
  /** Message */
  message: string;
}
