/**
 * CHECKOUT TYPES
 * 
 * Type definitions for the flight checkout flow.
 */

import { PriceConfirmationResult, BaggageInfo, FareRules, SeatMap } from '@/services/flight-offer-price.service';

// ============================================
// TRAVELER TYPES
// ============================================

export type TravelerType = 'adult' | 'child' | 'infant';
export type Gender = 'male' | 'female';

export interface TravelerDocument {
  type: 'passport' | 'id_card';
  number: string;
  expiryDate?: string;
  nationality?: string;
  issuingCountry?: string;
}

export interface Traveler {
  id: string;
  type: TravelerType;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: Gender;
  email: string;
  phone: string;
  document?: TravelerDocument;
}

// ============================================
// BAGGAGE TYPES
// ============================================

export interface BaggageSelection {
  checked: number;
  pricePerBag: number;
  totalPrice: number;
}

// ============================================
// SEAT TYPES
// ============================================

export interface SelectedSeat {
  segmentId: string;
  seatNumber: string;
  price: number;
  currency: string;
}

// ============================================
// PAYMENT TYPES
// ============================================

export interface PaymentInfo {
  cardNumber: string;
  cardHolder: string;
  expiryDate: string;
  cvv: string;
}

// ============================================
// EXTRAS TYPES
// ============================================

export interface ExtrasSelection {
  checkedBags: number;
  meal: string | null;
  priorityBoarding: boolean;
  insurance: boolean;
}

// ============================================
// PRICING TYPES
// ============================================

export interface PricingSummary {
  baseFare: number;
  taxes: number;
  baggageFees: number;
  seatFees: number;
  serviceFee: number;
  total: number;
  currency: string;
}

// ============================================
// CHECKOUT STATE
// ============================================

export type CheckoutStep = 
  | 'loading'
  | 'price_changed'
  | 'ready'
  | 'processing'
  | 'success'
  | 'error';

export interface CheckoutState {
  // Current step
  step: CheckoutStep;
  
  // Loading states
  isLoadingPrice: boolean;
  isProcessingPayment: boolean;
  
  // Price confirmation from API
  priceConfirmation: PriceConfirmationResult | null;
  
  // Provider info
  provider: 'amadeus' | 'kiwi' | null;
  
  // User selections
  selectedSeats: SelectedSeat[];
  baggage: BaggageSelection;
  extras: ExtrasSelection;
  travelers: Traveler[];
  paymentInfo: PaymentInfo;
  
  // Pricing
  pricingSummary: PricingSummary;
  
  // Validation
  errors: Record<string, string>;
  
  // Offer expiry
  expiresAt: string | null;
}

// ============================================
// CHECKOUT ACTIONS
// ============================================

export type CheckoutAction =
  | { type: 'SET_LOADING_PRICE'; payload: boolean }
  | { type: 'SET_PRICE_CONFIRMATION'; payload: PriceConfirmationResult }
  | { type: 'SET_PROVIDER'; payload: 'amadeus' | 'kiwi' }
  | { type: 'SET_STEP'; payload: CheckoutStep }
  | { type: 'SET_SELECTED_SEATS'; payload: SelectedSeat[] }
  | { type: 'SET_BAGGAGE'; payload: BaggageSelection }
  | { type: 'SET_EXTRAS'; payload: ExtrasSelection }
  | { type: 'SET_TRAVELERS'; payload: Traveler[] }
  | { type: 'UPDATE_TRAVELER'; payload: { index: number; traveler: Traveler } }
  | { type: 'SET_PAYMENT_INFO'; payload: PaymentInfo }
  | { type: 'SET_ERRORS'; payload: Record<string, string> }
  | { type: 'CLEAR_ERROR'; payload: string }
  | { type: 'UPDATE_PRICING' }
  | { type: 'SET_PROCESSING'; payload: boolean }
  | { type: 'RESET' };

// ============================================
// FLIGHT INFO (normalized from different sources)
// ============================================

export interface NormalizedFlightInfo {
  id: string;
  provider: 'amadeus' | 'kiwi';
  airlineName: string;
  airlineCode: string;
  flightNumber: string;
  originCode: string;
  originCity?: string;
  destCode: string;
  destCity?: string;
  departureTime: string;
  arrivalTime: string;
  duration: number; // minutes
  stops: number;
  price: number;
  currency: string;
  cabinClass: string;
  refundable: boolean;
  changeable: boolean;
}

// ============================================
// COMPONENT PROPS
// ============================================

export interface CheckoutSectionProps {
  title: string;
  icon: React.ReactNode;
  completed?: boolean;
  disabled?: boolean;
  onPress: () => void;
  subtitle?: string;
}

export interface FlightSummaryProps {
  flightInfo: NormalizedFlightInfo;
  fareRules?: FareRules;
  onViewDetails: () => void;
}

export interface SeatSelectionProps {
  available: boolean;
  seatMap?: SeatMap;
  selectedSeats: SelectedSeat[];
  onSelectSeats: (seats: SelectedSeat[]) => void;
  travelerCount: number;
}

export interface BaggageSelectionProps {
  baggage: BaggageInfo;
  selection: BaggageSelection;
  onSelect: (selection: BaggageSelection) => void;
}

export interface TravelerFormProps {
  travelers: Traveler[];
  requirements: {
    documentRequired: boolean;
    fields: string[];
  };
  onUpdate: (travelers: Traveler[]) => void;
  errors: Record<string, string>;
}

export interface PaymentFormProps {
  paymentInfo: PaymentInfo;
  onUpdate: (info: PaymentInfo) => void;
  errors: Record<string, string>;
  totalAmount: number;
  currency: string;
}

export interface PriceSummaryProps {
  pricing: PricingSummary;
  onBook: () => void;
  canBook: boolean;
  isProcessing: boolean;
}
