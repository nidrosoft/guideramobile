/**
 * CHECKOUT CONTEXT
 * 
 * State management for the flight checkout flow.
 * Handles price confirmation, selections, and validation.
 */

import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import {
  CheckoutState,
  CheckoutAction,
  CheckoutStep,
  Traveler,
  SelectedSeat,
  BaggageSelection,
  ExtrasSelection,
  PaymentInfo,
  PricingSummary,
  NormalizedFlightInfo,
} from '../types/checkout.types';
import {
  confirmFlightPrice,
  PriceConfirmationResult,
  FlightOffer,
  TravelerCount,
} from '@/services/flight-offer-price.service';

// ============================================
// INITIAL STATE
// ============================================

const initialState: CheckoutState = {
  step: 'loading',
  isLoadingPrice: true,
  isProcessingPayment: false,
  priceConfirmation: null,
  provider: null,
  selectedSeats: [],
  baggage: {
    checked: 0,
    pricePerBag: 35,
    totalPrice: 0,
  },
  extras: {
    checkedBags: 0,
    meal: null,
    priorityBoarding: false,
    insurance: false,
  },
  travelers: [],
  paymentInfo: {
    cardNumber: '',
    cardHolder: '',
    expiryDate: '',
    cvv: '',
  },
  pricingSummary: {
    baseFare: 0,
    taxes: 0,
    baggageFees: 0,
    seatFees: 0,
    serviceFee: 0,
    total: 0,
    currency: 'USD',
  },
  errors: {},
  expiresAt: null,
};

// ============================================
// REDUCER
// ============================================

function checkoutReducer(state: CheckoutState, action: CheckoutAction): CheckoutState {
  switch (action.type) {
    case 'SET_LOADING_PRICE':
      return { ...state, isLoadingPrice: action.payload };

    case 'SET_PRICE_CONFIRMATION':
      const confirmation = action.payload;
      const bagPricePerBag = confirmation.baggage.checked.addOnOptions?.[0]?.price || 35;
      
      return {
        ...state,
        priceConfirmation: confirmation,
        isLoadingPrice: false,
        step: confirmation.priceChanged ? 'price_changed' : 'ready',
        baggage: {
          ...state.baggage,
          pricePerBag: bagPricePerBag,
        },
        pricingSummary: {
          ...state.pricingSummary,
          baseFare: confirmation.confirmedPrice,
          total: confirmation.confirmedPrice,
          currency: confirmation.currency,
        },
        expiresAt: confirmation.expiresAt || null,
      };

    case 'SET_PROVIDER':
      return { ...state, provider: action.payload };

    case 'SET_STEP':
      return { ...state, step: action.payload };

    case 'SET_SELECTED_SEATS':
      const seatFees = action.payload.reduce((sum, seat) => sum + seat.price, 0);
      return {
        ...state,
        selectedSeats: action.payload,
        pricingSummary: {
          ...state.pricingSummary,
          seatFees,
          total: state.pricingSummary.baseFare + state.pricingSummary.baggageFees + seatFees + state.pricingSummary.serviceFee,
        },
      };

    case 'SET_BAGGAGE':
      return {
        ...state,
        baggage: action.payload,
        pricingSummary: {
          ...state.pricingSummary,
          baggageFees: action.payload.totalPrice,
          total: state.pricingSummary.baseFare + action.payload.totalPrice + state.pricingSummary.seatFees + state.pricingSummary.serviceFee,
        },
      };

    case 'SET_EXTRAS':
      return { ...state, extras: action.payload };

    case 'SET_TRAVELERS':
      return { ...state, travelers: action.payload };

    case 'UPDATE_TRAVELER':
      const updatedTravelers = [...state.travelers];
      updatedTravelers[action.payload.index] = action.payload.traveler;
      return { ...state, travelers: updatedTravelers };

    case 'SET_PAYMENT_INFO':
      return { ...state, paymentInfo: action.payload };

    case 'SET_ERRORS':
      return { ...state, errors: action.payload };

    case 'CLEAR_ERROR':
      const { [action.payload]: _, ...remainingErrors } = state.errors;
      return { ...state, errors: remainingErrors };

    case 'UPDATE_PRICING':
      const baggageFees = state.baggage.totalPrice;
      const seatFeesTotal = state.selectedSeats.reduce((sum, seat) => sum + seat.price, 0);
      const total = state.pricingSummary.baseFare + baggageFees + seatFeesTotal + state.pricingSummary.serviceFee;
      
      return {
        ...state,
        pricingSummary: {
          ...state.pricingSummary,
          baggageFees,
          seatFees: seatFeesTotal,
          total,
        },
      };

    case 'SET_PROCESSING':
      return { ...state, isProcessingPayment: action.payload };

    case 'RESET':
      return initialState;

    default:
      return state;
  }
}

// ============================================
// CONTEXT
// ============================================

interface CheckoutContextValue {
  state: CheckoutState;
  dispatch: React.Dispatch<CheckoutAction>;
  
  // Actions
  loadPriceConfirmation: (flight: FlightOffer, travelers: TravelerCount) => Promise<void>;
  selectSeats: (seats: SelectedSeat[]) => void;
  updateBaggage: (checked: number) => void;
  updateExtras: (extras: ExtrasSelection) => void;
  updateTravelers: (travelers: Traveler[]) => void;
  updatePayment: (payment: PaymentInfo) => void;
  setErrors: (errors: Record<string, string>) => void;
  clearError: (field: string) => void;
  acceptPriceChange: () => void;
  processPayment: () => Promise<boolean>;
  
  // Computed
  canProceed: boolean;
  isSeatSelectionAvailable: boolean;
}

const CheckoutContext = createContext<CheckoutContextValue | null>(null);

// ============================================
// PROVIDER
// ============================================

interface CheckoutProviderProps {
  children: React.ReactNode;
  flightOffer: FlightOffer;
  travelerCount: TravelerCount;
}

export function CheckoutProvider({ children, flightOffer, travelerCount }: CheckoutProviderProps) {
  const [state, dispatch] = useReducer(checkoutReducer, initialState);

  // Determine provider from flight offer
  const provider = getProviderFromOffer(flightOffer);

  // Initialize travelers based on count
  useEffect(() => {
    const initialTravelers: Traveler[] = [];
    
    for (let i = 0; i < travelerCount.adults; i++) {
      initialTravelers.push(createEmptyTraveler(`adult-${i}`, 'adult'));
    }
    
    for (let i = 0; i < (travelerCount.children || 0); i++) {
      initialTravelers.push(createEmptyTraveler(`child-${i}`, 'child'));
    }
    
    for (let i = 0; i < (travelerCount.infants || 0); i++) {
      initialTravelers.push(createEmptyTraveler(`infant-${i}`, 'infant'));
    }
    
    dispatch({ type: 'SET_TRAVELERS', payload: initialTravelers });
    dispatch({ type: 'SET_PROVIDER', payload: provider });
  }, [travelerCount, provider]);

  // Load price confirmation on mount
  const loadPriceConfirmation = useCallback(async (flight: FlightOffer, travelers: TravelerCount) => {
    dispatch({ type: 'SET_LOADING_PRICE', payload: true });
    
    try {
      const result = await confirmFlightPrice(flight, travelers, {
        includeSeatMap: provider === 'amadeus',
      });
      
      dispatch({ type: 'SET_PRICE_CONFIRMATION', payload: result });
    } catch (error) {
      console.error('Failed to confirm price:', error);
      dispatch({ type: 'SET_STEP', payload: 'error' });
    }
  }, [provider]);

  // Load price on mount
  useEffect(() => {
    loadPriceConfirmation(flightOffer, travelerCount);
  }, []);

  // Actions
  const selectSeats = useCallback((seats: SelectedSeat[]) => {
    dispatch({ type: 'SET_SELECTED_SEATS', payload: seats });
  }, []);

  const updateBaggage = useCallback((checked: number) => {
    const totalPrice = checked * state.baggage.pricePerBag;
    dispatch({
      type: 'SET_BAGGAGE',
      payload: { checked, pricePerBag: state.baggage.pricePerBag, totalPrice },
    });
  }, [state.baggage.pricePerBag]);

  const updateExtras = useCallback((extras: ExtrasSelection) => {
    dispatch({ type: 'SET_EXTRAS', payload: extras });
  }, []);

  const updateTravelers = useCallback((travelers: Traveler[]) => {
    dispatch({ type: 'SET_TRAVELERS', payload: travelers });
  }, []);

  const updatePayment = useCallback((payment: PaymentInfo) => {
    dispatch({ type: 'SET_PAYMENT_INFO', payload: payment });
  }, []);

  const setErrors = useCallback((errors: Record<string, string>) => {
    dispatch({ type: 'SET_ERRORS', payload: errors });
  }, []);

  const clearError = useCallback((field: string) => {
    dispatch({ type: 'CLEAR_ERROR', payload: field });
  }, []);

  const acceptPriceChange = useCallback(() => {
    dispatch({ type: 'SET_STEP', payload: 'ready' });
  }, []);

  const processPayment = useCallback(async (): Promise<boolean> => {
    dispatch({ type: 'SET_PROCESSING', payload: true });
    
    try {
      // TODO: Implement actual payment processing with Stripe
      // For now, simulate a delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      dispatch({ type: 'SET_STEP', payload: 'success' });
      return true;
    } catch (error) {
      console.error('Payment failed:', error);
      dispatch({ type: 'SET_STEP', payload: 'error' });
      return false;
    } finally {
      dispatch({ type: 'SET_PROCESSING', payload: false });
    }
  }, []);

  // Computed values
  const isTravelersComplete = state.travelers.length > 0 && 
    state.travelers.every(t => t.firstName && t.lastName && t.email && t.phone && t.dateOfBirth);
  
  const isPaymentComplete = !!(
    state.paymentInfo.cardNumber.replace(/\s/g, '').length >= 16 &&
    state.paymentInfo.cardHolder &&
    state.paymentInfo.expiryDate.length >= 5 &&
    state.paymentInfo.cvv.length >= 3
  );

  const canProceed = isTravelersComplete && isPaymentComplete && state.step === 'ready';
  const isSeatSelectionAvailable = state.provider === 'amadeus' && (state.priceConfirmation?.seatMap?.available ?? false);

  const value: CheckoutContextValue = {
    state,
    dispatch,
    loadPriceConfirmation,
    selectSeats,
    updateBaggage,
    updateExtras,
    updateTravelers,
    updatePayment,
    setErrors,
    clearError,
    acceptPriceChange,
    processPayment,
    canProceed,
    isSeatSelectionAvailable,
  };

  return (
    <CheckoutContext.Provider value={value}>
      {children}
    </CheckoutContext.Provider>
  );
}

// ============================================
// HOOK
// ============================================

export function useCheckout(): CheckoutContextValue {
  const context = useContext(CheckoutContext);
  if (!context) {
    throw new Error('useCheckout must be used within a CheckoutProvider');
  }
  return context;
}

// ============================================
// HELPERS
// ============================================

function getProviderFromOffer(offer: FlightOffer): 'amadeus' | 'kiwi' {
  if (offer.provider?.code) {
    const code = offer.provider.code.toLowerCase();
    if (code === 'amadeus') return 'amadeus';
    if (code === 'kiwi') return 'kiwi';
  }
  
  if (offer.id?.startsWith('amadeus-')) return 'amadeus';
  if (offer.id?.startsWith('kiwi-')) return 'kiwi';
  
  return 'amadeus';
}

function createEmptyTraveler(id: string, type: 'adult' | 'child' | 'infant'): Traveler {
  return {
    id,
    type,
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: 'male',
    email: '',
    phone: '',
  };
}

// ============================================
// UTILITY: Normalize flight info from different sources
// ============================================

export function normalizeFlightInfo(flight: any): NormalizedFlightInfo {
  // Handle provider-manager format
  if (flight.outbound) {
    const outbound = flight.outbound;
    const firstSegment = outbound.segments?.[0];
    
    return {
      id: flight.id,
      provider: flight.provider?.code?.toLowerCase() === 'kiwi' ? 'kiwi' : 'amadeus',
      airlineName: firstSegment?.carrier?.name || 'Unknown Airline',
      airlineCode: firstSegment?.carrier?.code || 'XX',
      flightNumber: firstSegment?.flightNumber || '',
      originCode: outbound.departure?.airport || '',
      destCode: outbound.arrival?.airport || '',
      departureTime: outbound.departure?.time || '',
      arrivalTime: outbound.arrival?.time || '',
      duration: flight.totalDurationMinutes || outbound.duration || 0,
      stops: flight.totalStops || outbound.stops || 0,
      price: flight.price?.amount || 0,
      currency: flight.price?.currency || 'USD',
      cabinClass: firstSegment?.cabinClass || 'ECONOMY',
      refundable: flight.refundable || false,
      changeable: flight.changeable ?? true,
    };
  }
  
  // Handle legacy/mock format
  return {
    id: flight.id || '',
    provider: flight.provider?.code?.toLowerCase() === 'kiwi' ? 'kiwi' : 'amadeus',
    airlineName: flight.airlineName || 'Unknown Airline',
    airlineCode: flight.airlineCode || 'XX',
    flightNumber: flight.flightNumber || '',
    originCode: flight.originCode || '',
    destCode: flight.destCode || '',
    departureTime: flight.departureTime || '',
    arrivalTime: flight.arrivalTime || '',
    duration: flight.duration || 0,
    stops: flight.stops || 0,
    price: typeof flight.price === 'number' ? flight.price : flight.price?.amount || 0,
    currency: flight.price?.currency || 'USD',
    cabinClass: flight.cabinClass || 'economy',
    refundable: flight.refundable || false,
    changeable: flight.changeable ?? true,
  };
}
