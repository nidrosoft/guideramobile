/**
 * BOOKING TYPES
 * 
 * Shared types used across all booking flows (flights, hotels, cars, experiences, packages).
 */

// ============================================
// LOCATION TYPES
// ============================================

export interface Location {
  id: string;
  name: string;
  code?: string;
  type: 'airport' | 'city' | 'hotel' | 'address';
  country: string;
  countryCode: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

// ============================================
// TRAVELER TYPES
// ============================================

export type TravelerType = 'adult' | 'child' | 'infant';
export type Gender = 'male' | 'female' | 'other';

export interface Traveler {
  id: string;
  type: TravelerType;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gender: Gender;
  nationality: string;
  passport?: PassportInfo;
  frequentFlyer?: FrequentFlyerInfo;
}

export interface PassportInfo {
  number: string;
  expiryDate: Date;
  issuingCountry: string;
}

export interface FrequentFlyerInfo {
  airline: string;
  number: string;
}

export interface ContactInfo {
  email: string;
  phone: string;
  countryCode: string;
}

// ============================================
// PASSENGER COUNT
// ============================================

export interface PassengerCount {
  adults: number;
  children: number;
  infants: number;
}

export interface GuestCount {
  rooms: number;
  adults: number;
  children: number;
}

// ============================================
// PAYMENT TYPES
// ============================================

export type PaymentMethodType = 'card' | 'paypal' | 'apple_pay' | 'google_pay';

export interface PaymentMethod {
  type: PaymentMethodType;
  card?: CardInfo;
}

export interface CardInfo {
  number: string;
  expiry: string;
  cvv: string;
  name: string;
  brand?: 'visa' | 'mastercard' | 'amex' | 'discover';
}

export interface PromoCode {
  code: string;
  discount: number;
  discountType: 'percentage' | 'fixed';
  validUntil: Date;
}

// ============================================
// PRICING TYPES
// ============================================

export interface PriceBreakdown {
  basePrice: number;
  taxes: number;
  fees: number;
  extras: number;
  discount: number;
  total: number;
  currency: string;
}

export interface PriceDisplay {
  amount: number;
  currency: string;
  formatted: string;
  perPerson?: boolean;
  perNight?: boolean;
  perDay?: boolean;
}

// ============================================
// BOOKING TYPES
// ============================================

export type BookingType = 'flight' | 'hotel' | 'car' | 'experience' | 'package';
export type BookingStatus = 'draft' | 'pending' | 'confirmed' | 'cancelled' | 'completed';
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';

export interface Booking {
  id: string;
  type: BookingType;
  status: BookingStatus;
  reference: string;
  createdAt: Date;
  updatedAt: Date;
  travelers: Traveler[];
  contactInfo: ContactInfo;
  payment: {
    method: PaymentMethod;
    amount: number;
    currency: string;
    status: PaymentStatus;
    transactionId?: string;
  };
  priceBreakdown: PriceBreakdown;
}

// ============================================
// SEARCH FILTER TYPES
// ============================================

export interface PriceRange {
  min: number;
  max: number;
}

export interface TimeRange {
  start: string; // HH:mm format
  end: string;
}

export type SortOption = 
  | 'price_low' 
  | 'price_high' 
  | 'duration_short' 
  | 'duration_long'
  | 'departure_early'
  | 'departure_late'
  | 'rating_high'
  | 'recommended';

// ============================================
// UI STATE TYPES
// ============================================

export interface LoadingState {
  isLoading: boolean;
  message?: string;
}

export interface ErrorState {
  hasError: boolean;
  message?: string;
  code?: string;
}

export interface StepConfig {
  id: string;
  title: string;
  subtitle?: string;
  icon?: string;
  optional?: boolean;
}

// ============================================
// FLOW NAVIGATION TYPES
// ============================================

export interface FlowNavigationProps {
  onNext: () => void;
  onBack: () => void;
  onGoToStep?: (stepId: string) => void;
  isFirstStep?: boolean;
  isLastStep?: boolean;
}

export interface FlowStepProps extends FlowNavigationProps {
  stepIndex: number;
  totalSteps: number;
}
