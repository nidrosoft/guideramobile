/**
 * FLIGHT STORE
 * 
 * State management for flight booking flow.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Traveler, ContactInfo, PriceBreakdown, SortOption } from '../types/booking.types';
import {
  FlightSearchParams,
  FlightFilters,
  Flight,
  Seat,
  FlightExtras,
  BaggageOption,
  MealOption,
  FlightInsuranceOption,
  CabinClass,
  TripType,
} from '../types/flight.types';
import { BOOKING_DEFAULTS } from '../config/booking.config';

// ============================================
// STATE INTERFACE
// ============================================

interface FlightState {
  // Current step
  currentStep: string;
  
  // Search parameters
  searchParams: FlightSearchParams;
  
  // Search results
  searchResults: Flight[];
  filteredResults: Flight[];
  isSearching: boolean;
  searchError: string | null;
  
  // Filters & Sort
  filters: FlightFilters;
  sortBy: SortOption;
  
  // Selected flights
  selectedOutboundFlight: Flight | null;
  selectedReturnFlight: Flight | null;
  
  // Seat selection
  selectedSeats: {
    outbound: { passengerId: string; seat: Seat }[];
    return: { passengerId: string; seat: Seat }[];
  };
  
  // Extras
  extras: FlightExtras;
  
  // Travelers
  travelers: Traveler[];
  contactInfo: ContactInfo | null;
  
  // Pricing
  priceBreakdown: PriceBreakdown | null;
  
  // Booking result
  bookingReference: string | null;
  bookingConfirmed: boolean;
}

// ============================================
// ACTIONS INTERFACE
// ============================================

interface FlightActions {
  // Navigation
  setCurrentStep: (step: string) => void;
  
  // Search params
  setSearchParams: (params: Partial<FlightSearchParams>) => void;
  setTripType: (type: TripType) => void;
  setCabinClass: (cabinClass: CabinClass) => void;
  swapLocations: () => void;
  
  // Search
  setSearchResults: (results: Flight[]) => void;
  setSearching: (isSearching: boolean) => void;
  setSearchError: (error: string | null) => void;
  
  // Filters & Sort
  setFilters: (filters: Partial<FlightFilters>) => void;
  resetFilters: () => void;
  setSortBy: (sort: SortOption) => void;
  applyFiltersAndSort: () => void;
  
  // Flight selection
  selectOutboundFlight: (flight: Flight | null) => void;
  selectReturnFlight: (flight: Flight | null) => void;
  
  // Seats
  selectSeat: (passengerId: string, seat: Seat, leg: 'outbound' | 'return') => void;
  removeSeat: (passengerId: string, leg: 'outbound' | 'return') => void;
  clearSeats: (leg?: 'outbound' | 'return') => void;
  
  // Extras
  addBaggage: (option: BaggageOption) => void;
  removeBaggage: (optionId: string) => void;
  setMeal: (passengerId: string, meal: MealOption) => void;
  removeMeal: (passengerId: string) => void;
  setInsurance: (option: FlightInsuranceOption | null) => void;
  setPriorityBoarding: (enabled: boolean) => void;
  setLoungeAccess: (enabled: boolean) => void;
  
  // Travelers
  setTravelers: (travelers: Traveler[]) => void;
  updateTraveler: (index: number, traveler: Partial<Traveler>) => void;
  setContactInfo: (info: ContactInfo) => void;
  
  // Pricing
  calculatePrice: () => void;
  
  // Booking
  setBookingReference: (ref: string) => void;
  setBookingConfirmed: (confirmed: boolean) => void;
  
  // Reset
  reset: () => void;
  resetSearch: () => void;
}

// ============================================
// INITIAL STATE
// ============================================

const initialFilters: FlightFilters = {
  stops: [],
  airlines: [],
  departureTime: null,
  arrivalTime: null,
  priceRange: null,
  duration: null,
  airports: [],
};

const initialExtras: FlightExtras = {
  baggage: [],
  meals: [],
  seats: [],
  insurance: null,
  priorityBoarding: false,
  loungeAccess: false,
};

const initialState: FlightState = {
  currentStep: 'search',
  searchParams: {
    tripType: BOOKING_DEFAULTS.tripType,
    origin: null,
    destination: null,
    departureDate: null,
    returnDate: null,
    passengers: { ...BOOKING_DEFAULTS.passengers },
    cabinClass: BOOKING_DEFAULTS.cabinClass,
    directOnly: BOOKING_DEFAULTS.directOnly,
    flexibleDates: BOOKING_DEFAULTS.flexibleDates,
  },
  searchResults: [],
  filteredResults: [],
  isSearching: false,
  searchError: null,
  filters: initialFilters,
  sortBy: 'recommended',
  selectedOutboundFlight: null,
  selectedReturnFlight: null,
  selectedSeats: {
    outbound: [],
    return: [],
  },
  extras: initialExtras,
  travelers: [],
  contactInfo: null,
  priceBreakdown: null,
  bookingReference: null,
  bookingConfirmed: false,
};

// ============================================
// STORE
// ============================================

export const useFlightStore = create<FlightState & FlightActions>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      // Navigation
      setCurrentStep: (step) => set({ currentStep: step }),
      
      // Search params
      setSearchParams: (params) => {
        set((state) => ({
          searchParams: { ...state.searchParams, ...params },
        }));
      },
      
      setTripType: (type) => {
        set((state) => ({
          searchParams: {
            ...state.searchParams,
            tripType: type,
            returnDate: type === 'one-way' ? null : state.searchParams.returnDate,
          },
        }));
      },
      
      setCabinClass: (cabinClass) => {
        set((state) => ({
          searchParams: { ...state.searchParams, cabinClass },
        }));
      },
      
      swapLocations: () => {
        set((state) => ({
          searchParams: {
            ...state.searchParams,
            origin: state.searchParams.destination,
            destination: state.searchParams.origin,
          },
        }));
      },
      
      // Search
      setSearchResults: (results) => {
        set({ searchResults: results, filteredResults: results });
        get().applyFiltersAndSort();
      },
      
      setSearching: (isSearching) => set({ isSearching }),
      
      setSearchError: (error) => set({ searchError: error }),
      
      // Filters & Sort
      setFilters: (filters) => {
        set((state) => ({
          filters: { ...state.filters, ...filters },
        }));
        get().applyFiltersAndSort();
      },
      
      resetFilters: () => {
        set({ filters: initialFilters });
        get().applyFiltersAndSort();
      },
      
      setSortBy: (sort) => {
        set({ sortBy: sort });
        get().applyFiltersAndSort();
      },
      
      applyFiltersAndSort: () => {
        const { searchResults, filters, sortBy } = get();
        let filtered = [...searchResults];
        
        // Apply filters
        if (filters.stops.length > 0) {
          filtered = filtered.filter((f) => filters.stops.includes(f.stops));
        }
        if (filters.airlines.length > 0) {
          filtered = filtered.filter((f) =>
            f.segments.some((s) => filters.airlines.includes(s.airline.code))
          );
        }
        if (filters.priceRange) {
          filtered = filtered.filter(
            (f) =>
              f.price.amount >= filters.priceRange!.min &&
              f.price.amount <= filters.priceRange!.max
          );
        }
        if (filters.duration) {
          filtered = filtered.filter((f) => f.totalDuration <= filters.duration!);
        }
        
        // Apply sort
        switch (sortBy) {
          case 'price_low':
            filtered.sort((a, b) => a.price.amount - b.price.amount);
            break;
          case 'price_high':
            filtered.sort((a, b) => b.price.amount - a.price.amount);
            break;
          case 'duration_short':
            filtered.sort((a, b) => a.totalDuration - b.totalDuration);
            break;
          case 'departure_early':
            filtered.sort(
              (a, b) =>
                new Date(a.segments[0].departureTime).getTime() -
                new Date(b.segments[0].departureTime).getTime()
            );
            break;
          default:
            // 'recommended' - keep original order
            break;
        }
        
        set({ filteredResults: filtered });
      },
      
      // Flight selection
      selectOutboundFlight: (flight) => set({ selectedOutboundFlight: flight }),
      selectReturnFlight: (flight) => set({ selectedReturnFlight: flight }),
      
      // Seats
      selectSeat: (passengerId, seat, leg) => {
        set((state) => {
          const seats = { ...state.selectedSeats };
          const legSeats = seats[leg].filter((s) => s.passengerId !== passengerId);
          legSeats.push({ passengerId, seat });
          seats[leg] = legSeats;
          return { selectedSeats: seats };
        });
      },
      
      removeSeat: (passengerId, leg) => {
        set((state) => {
          const seats = { ...state.selectedSeats };
          seats[leg] = seats[leg].filter((s) => s.passengerId !== passengerId);
          return { selectedSeats: seats };
        });
      },
      
      clearSeats: (leg) => {
        set((state) => {
          if (leg) {
            return {
              selectedSeats: { ...state.selectedSeats, [leg]: [] },
            };
          }
          return { selectedSeats: { outbound: [], return: [] } };
        });
      },
      
      // Extras
      addBaggage: (option) => {
        set((state) => ({
          extras: {
            ...state.extras,
            baggage: [...state.extras.baggage, option],
          },
        }));
      },
      
      removeBaggage: (optionId) => {
        set((state) => ({
          extras: {
            ...state.extras,
            baggage: state.extras.baggage.filter((b) => b.id !== optionId),
          },
        }));
      },
      
      setMeal: (passengerId, meal) => {
        set((state) => {
          const meals = state.extras.meals.filter((m) => m.passengerId !== passengerId);
          meals.push({ passengerId, meal });
          return { extras: { ...state.extras, meals } };
        });
      },
      
      removeMeal: (passengerId) => {
        set((state) => ({
          extras: {
            ...state.extras,
            meals: state.extras.meals.filter((m) => m.passengerId !== passengerId),
          },
        }));
      },
      
      setInsurance: (option) => {
        set((state) => ({
          extras: { ...state.extras, insurance: option },
        }));
      },
      
      setPriorityBoarding: (enabled) => {
        set((state) => ({
          extras: { ...state.extras, priorityBoarding: enabled },
        }));
      },
      
      setLoungeAccess: (enabled) => {
        set((state) => ({
          extras: { ...state.extras, loungeAccess: enabled },
        }));
      },
      
      // Travelers
      setTravelers: (travelers) => set({ travelers }),
      
      updateTraveler: (index, traveler) => {
        set((state) => {
          const updated = [...state.travelers];
          updated[index] = { ...updated[index], ...traveler };
          return { travelers: updated };
        });
      },
      
      setContactInfo: (info) => set({ contactInfo: info }),
      
      // Pricing
      calculatePrice: () => {
        const state = get();
        const { selectedOutboundFlight, selectedReturnFlight, extras, searchParams } = state;
        
        if (!selectedOutboundFlight) {
          set({ priceBreakdown: null });
          return;
        }
        
        const totalPassengers =
          searchParams.passengers.adults +
          searchParams.passengers.children +
          searchParams.passengers.infants;
        
        let basePrice = selectedOutboundFlight.price.amount * totalPassengers;
        if (selectedReturnFlight) {
          basePrice += selectedReturnFlight.price.amount * totalPassengers;
        }
        
        // Calculate extras
        const baggageTotal = extras.baggage.reduce((sum, b) => sum + b.price, 0);
        const mealsTotal = extras.meals.reduce((sum, m) => sum + m.meal.price, 0);
        const seatsTotal =
          state.selectedSeats.outbound.reduce((sum, s) => sum + s.seat.price, 0) +
          state.selectedSeats.return.reduce((sum, s) => sum + s.seat.price, 0);
        const insuranceTotal = extras.insurance?.price || 0;
        const extrasTotal = baggageTotal + mealsTotal + seatsTotal + insuranceTotal;
        
        const taxes = basePrice * 0.12; // 12% taxes
        const fees = 15; // Fixed booking fee
        
        set({
          priceBreakdown: {
            basePrice,
            taxes,
            fees,
            extras: extrasTotal,
            discount: 0,
            total: basePrice + taxes + fees + extrasTotal,
            currency: selectedOutboundFlight.price.currency,
          },
        });
      },
      
      // Booking
      setBookingReference: (ref) => set({ bookingReference: ref }),
      setBookingConfirmed: (confirmed) => set({ bookingConfirmed: confirmed }),
      
      // Reset
      reset: () => set(initialState),
      
      resetSearch: () => {
        set({
          searchResults: [],
          filteredResults: [],
          isSearching: false,
          searchError: null,
          filters: initialFilters,
          sortBy: 'recommended',
          selectedOutboundFlight: null,
          selectedReturnFlight: null,
        });
      },
    }),
    {
      name: 'guidera-flight-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        // Only persist search params for draft recovery
        searchParams: state.searchParams,
      }),
    }
  )
);
