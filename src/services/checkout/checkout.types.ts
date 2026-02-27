/**
 * CHECKOUT TYPES
 * 
 * Type definitions for the checkout and payment system.
 */

import { CartWithItems, CartItem } from '../cart/cart.types';

// ============================================
// CHECKOUT SESSION TYPES
// ============================================

export type CheckoutStatus =
  | 'pending'
  | 'price_verification'
  | 'price_changed'
  | 'traveler_details'
  | 'payment_pending'
  | 'payment_processing'
  | 'payment_authorized'
  | 'booking_in_progress'
  | 'booking_partial'
  | 'completed'
  | 'failed'
  | 'expired'
  | 'cancelled';

export type PaymentStatus =
  | 'pending'
  | 'requires_action'
  | 'processing'
  | 'authorized'
  | 'captured'
  | 'failed'
  | 'cancelled'
  | 'refunded';

export interface CheckoutSession {
  id: string;
  cart_id: string;
  user_id: string;
  checkout_token: string;
  idempotency_key: string;
  status: CheckoutStatus;
  
  // Locked pricing
  locked_subtotal: number;
  locked_taxes: number;
  locked_fees: number;
  locked_discount: number;
  locked_total: number;
  currency: string;
  
  // Final pricing
  final_subtotal: number | null;
  final_taxes: number | null;
  final_fees: number | null;
  final_total: number | null;
  
  // Price change
  price_increased: boolean;
  price_increase_amount: number | null;
  price_increase_acknowledged: boolean;
  price_increase_acknowledged_at: string | null;
  
  // Traveler details
  travelers: TravelerDetails[] | null;
  contact_info: ContactInfo | null;
  billing_address: BillingAddress | null;
  
  // Payment
  stripe_customer_id: string | null;
  stripe_payment_intent_id: string | null;
  stripe_payment_method_id: string | null;
  payment_status: PaymentStatus | null;
  payment_authorized_at: string | null;
  payment_captured_at: string | null;
  payment_amount: number | null;
  
  // Booking results
  booking_results: BookingResult[];
  all_bookings_successful: boolean | null;
  
  // Error tracking
  error_code: string | null;
  error_message: string | null;
  error_details: any | null;
  
  // Timestamps
  created_at: string;
  expires_at: string;
  completed_at: string | null;
  
  // Audit
  ip_address: string | null;
  user_agent: string | null;
  device_fingerprint: string | null;
}

// ============================================
// TRAVELER TYPES
// ============================================

export type TravelerType = 'adult' | 'child' | 'infant';
export type Gender = 'male' | 'female' | 'other';
export type DocumentType = 'passport' | 'national_id' | 'drivers_license';

export interface TravelerDetails {
  type: TravelerType;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: Gender;
  email?: string;
  phone?: string;
  document?: TravelDocument;
  loyaltyPrograms?: LoyaltyProgram[];
  seatPreference?: 'window' | 'aisle' | 'middle' | 'no_preference';
  mealPreference?: string;
  specialAssistance?: string[];
}

export interface TravelDocument {
  type: DocumentType;
  number: string;
  issuingCountry: string;
  expiryDate: string;
  nationality?: string;
}

export interface LoyaltyProgram {
  programCode: string;
  memberId: string;
}

export interface ContactInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  countryCode: string;
}

export interface BillingAddress {
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
}

// ============================================
// PRICE VERIFICATION TYPES
// ============================================

export interface PriceVerificationResult {
  verified: boolean;
  priceChanged: boolean;
  hasUnavailableItems: boolean;
  items: PriceVerificationItem[];
  originalTotal: number;
  newTotal: number;
  totalChange: number;
  currency: string;
}

export interface PriceVerificationItem {
  itemId: string;
  category: string;
  originalPrice: number;
  currentPrice: number;
  priceChange: number;
  available: boolean;
  unavailableReason?: string;
}

// ============================================
// BOOKING RESULT TYPES
// ============================================

export interface BookingResult {
  itemId: string;
  provider: string;
  category: string;
  success: boolean;
  providerReference?: string;
  confirmationNumber?: string;
  error?: string;
  errorCode?: string;
}

export interface BookingResults {
  allSuccessful: boolean;
  results: BookingResult[];
  errors: string[];
}

// ============================================
// VALIDATION TYPES
// ============================================

export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

// ============================================
// REQUEST/RESPONSE TYPES
// ============================================

export interface InitializeCheckoutRequest {
  cartId: string;
  userId: string;
  idempotencyKey: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface InitializeCheckoutResponse {
  success: boolean;
  checkoutToken?: string;
  checkoutSessionId?: string;
  lockedPricing?: {
    subtotal: number;
    taxes: number;
    fees: number;
    discount: number;
    total: number;
    currency: string;
  };
  items?: CartItem[];
  expiresAt?: string;
  error?: {
    code: string;
    message: string;
  };
}

export interface AcknowledgePriceChangeRequest {
  checkoutToken: string;
  acknowledged: boolean;
  acceptNewPrice: boolean;
}

export interface SubmitTravelerDetailsRequest {
  checkoutToken: string;
  travelers: TravelerDetails[];
  contact: ContactInfo;
  billingAddress?: BillingAddress;
}

export interface SubmitTravelerDetailsResponse {
  success: boolean;
  validationErrors?: ValidationError[];
  nextStep?: string;
}

export interface CreatePaymentIntentRequest {
  checkoutToken: string;
  paymentMethodId?: string;
  savePaymentMethod?: boolean;
}

export interface CreatePaymentIntentResponse {
  success: boolean;
  paymentIntentId?: string;
  clientSecret?: string;
  amount?: number;
  currency?: string;
  requiresAction?: boolean;
  status?: string;
  error?: {
    code: string;
    message: string;
  };
}

export interface ConfirmPaymentRequest {
  checkoutToken: string;
  paymentIntentId: string;
  paymentMethodId: string;
}

export interface ConfirmPaymentResponse {
  success: boolean;
  requiresAction: boolean;
  actionUrl?: string;
  bookingReference?: string;
  bookings?: BookingConfirmation[];
  error?: {
    code: string;
    message: string;
  };
}

export interface BookingConfirmation {
  bookingId: string;
  bookingReference: string;
  status: string;
  items: {
    itemId: string;
    category: string;
    providerReference: string;
    confirmationNumber: string;
  }[];
  totalAmount: number;
  currency: string;
}

// ============================================
// CHECKOUT ERROR TYPES
// ============================================

export class CheckoutError extends Error {
  code: string;
  details?: any;

  constructor(code: string, message: string, details?: any) {
    super(message);
    this.name = 'CheckoutError';
    this.code = code;
    this.details = details;
  }
}

export const CHECKOUT_ERROR_CODES = {
  CART_NOT_FOUND: 'CART_NOT_FOUND',
  CART_EMPTY: 'CART_EMPTY',
  CART_EXPIRED: 'CART_EXPIRED',
  CART_ACCESS_DENIED: 'CART_ACCESS_DENIED',
  SESSION_NOT_FOUND: 'SESSION_NOT_FOUND',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  INVALID_STATE: 'INVALID_STATE',
  PRICE_CHANGE_REJECTED: 'PRICE_CHANGE_REJECTED',
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  PAYMENT_MISMATCH: 'PAYMENT_MISMATCH',
  BOOKING_FAILED: 'BOOKING_FAILED',
  ROLLBACK_FAILED: 'ROLLBACK_FAILED',
  UNEXPECTED_ERROR: 'UNEXPECTED_ERROR',
} as const;
