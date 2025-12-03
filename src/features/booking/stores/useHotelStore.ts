/**
 * HOTEL STORE
 * 
 * State management for hotel booking flow.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Traveler, ContactInfo, PriceBreakdown, SortOption, Location, GuestCount } from '../types/booking.types';
import {
  Hotel,
  HotelSearchParams,
  HotelFilters,
  Room,
  HotelExtras,
  HotelReview,
  PropertyType,
} from '../types/hotel.types';
import { BOOKING_DEFAULTS } from '../config/booking.config';

// ============================================
// STATE INTERFACE
// ============================================

interface HotelState {
  // Current step
  currentStep: string;
  
  // Search parameters
  searchParams: HotelSearchParams;
  
  // Search results
  searchResults: Hotel[];
  filteredResults: Hotel[];
  isSearching: boolean;
  searchError: string | null;
  
  // Filters & Sort
  filters: HotelFilters;
  sortBy: SortOption;
  
  // Selected hotel & room
  selectedHotel: Hotel | null;
  selectedRoom: Room | null;
  
  // Extras
  extras: HotelExtras;
  
  // Guest info
  primaryGuest: Traveler | null;
  additionalGuests: Traveler[];
  contactInfo: ContactInfo | null;
  specialRequests: string;
  arrivalTime: string | null;
  
  // Pricing
  priceBreakdown: PriceBreakdown | null;
  
  // Booking result
  bookingReference: string | null;
  bookingConfirmed: boolean;
}

// ============================================
// ACTIONS INTERFACE
// ============================================

interface HotelActions {
  // Navigation
  setCurrentStep: (step: string) => void;
  
  // Search params
  setSearchParams: (params: Partial<HotelSearchParams>) => void;
  setDestination: (destination: Location | null) => void;
  setCheckInDate: (date: Date | null) => void;
  setCheckOutDate: (date: Date | null) => void;
  setGuests: (guests: Partial<GuestCount>) => void;
  
  // Search
  setSearchResults: (results: Hotel[]) => void;
  setSearching: (isSearching: boolean) => void;
  setSearchError: (error: string | null) => void;
  
  // Filters & Sort
  setFilters: (filters: Partial<HotelFilters>) => void;
  resetFilters: () => void;
  setSortBy: (sort: SortOption) => void;
  applyFiltersAndSort: () => void;
  
  // Hotel & Room selection
  selectHotel: (hotel: Hotel | null) => void;
  selectRoom: (room: Room | null) => void;
  
  // Extras
  setExtras: (extras: Partial<HotelExtras>) => void;
  toggleBreakfast: () => void;
  toggleParking: () => void;
  toggleAirportTransfer: () => void;
  toggleEarlyCheckIn: () => void;
  toggleLateCheckOut: () => void;
  toggleExtraBed: () => void;
  
  // Guest info
  setPrimaryGuest: (guest: Traveler) => void;
  setAdditionalGuests: (guests: Traveler[]) => void;
  setContactInfo: (info: ContactInfo) => void;
  setSpecialRequests: (requests: string) => void;
  setArrivalTime: (time: string | null) => void;
  
  // Pricing
  calculatePrice: () => void;
  
  // Booking
  setBookingReference: (ref: string) => void;
  setBookingConfirmed: (confirmed: boolean) => void;
  
  // Helpers
  getNights: () => number;
  getTotalGuests: () => number;
  
  // Reset
  reset: () => void;
  resetSearch: () => void;
}

// ============================================
// INITIAL STATE
// ============================================

const initialFilters: HotelFilters = {
  starRating: [],
  priceRange: null,
  propertyType: [],
  amenities: [],
  userRating: null,
  freeCancellation: false,
  breakfast: false,
  distanceFromCenter: null,
};

const initialExtras: HotelExtras = {
  breakfast: false,
  parking: false,
  airportTransfer: false,
  earlyCheckIn: false,
  lateCheckOut: false,
  extraBed: false,
};

const initialSearchParams: HotelSearchParams = {
  destination: null,
  checkIn: null,
  checkOut: null,
  guests: {
    rooms: BOOKING_DEFAULTS.guests.rooms,
    adults: BOOKING_DEFAULTS.guests.adults,
    children: BOOKING_DEFAULTS.guests.children,
  },
};

const initialState: HotelState = {
  currentStep: 'search',
  searchParams: initialSearchParams,
  searchResults: [],
  filteredResults: [],
  isSearching: false,
  searchError: null,
  filters: initialFilters,
  sortBy: 'recommended',
  selectedHotel: null,
  selectedRoom: null,
  extras: initialExtras,
  primaryGuest: null,
  additionalGuests: [],
  contactInfo: null,
  specialRequests: '',
  arrivalTime: null,
  priceBreakdown: null,
  bookingReference: null,
  bookingConfirmed: false,
};

// ============================================
// STORE
// ============================================

export const useHotelStore = create<HotelState & HotelActions>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      // Navigation
      setCurrentStep: (step) => set({ currentStep: step }),
      
      // Search params
      setSearchParams: (params) => set((state) => ({
        searchParams: { ...state.searchParams, ...params },
      })),
      
      setDestination: (destination) => set((state) => ({
        searchParams: { ...state.searchParams, destination },
      })),
      
      setCheckInDate: (date) => set((state) => ({
        searchParams: { ...state.searchParams, checkIn: date },
      })),
      
      setCheckOutDate: (date) => set((state) => ({
        searchParams: { ...state.searchParams, checkOut: date },
      })),
      
      setGuests: (guests) => set((state) => ({
        searchParams: {
          ...state.searchParams,
          guests: { ...state.searchParams.guests, ...guests },
        },
      })),
      
      // Search
      setSearchResults: (results) => {
        set({ searchResults: results });
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
      
      setSortBy: (sortBy) => {
        set({ sortBy });
        get().applyFiltersAndSort();
      },
      
      applyFiltersAndSort: () => {
        const { searchResults, filters, sortBy } = get();
        
        let filtered = [...searchResults];
        
        // Apply filters
        if (filters.starRating.length > 0) {
          filtered = filtered.filter((h) => filters.starRating.includes(h.starRating));
        }
        
        if (filters.priceRange) {
          filtered = filtered.filter(
            (h) =>
              h.lowestPrice.amount >= filters.priceRange!.min &&
              h.lowestPrice.amount <= filters.priceRange!.max
          );
        }
        
        if (filters.propertyType.length > 0) {
          filtered = filtered.filter((h) => filters.propertyType.includes(h.propertyType));
        }
        
        if (filters.amenities.length > 0) {
          filtered = filtered.filter((h) =>
            filters.amenities.every((a) => h.amenities.some((ha) => ha.id === a))
          );
        }
        
        if (filters.userRating !== null) {
          filtered = filtered.filter((h) => h.userRating >= filters.userRating!);
        }
        
        if (filters.freeCancellation) {
          filtered = filtered.filter((h) =>
            h.rooms.some((r) => r.refundable)
          );
        }
        
        if (filters.breakfast) {
          filtered = filtered.filter((h) =>
            h.rooms.some((r) => r.breakfast === 'included')
          );
        }
        
        if (filters.distanceFromCenter !== null) {
          filtered = filtered.filter(
            (h) =>
              h.location.distanceFromCenter !== undefined &&
              h.location.distanceFromCenter <= filters.distanceFromCenter!
          );
        }
        
        // Apply sorting
        switch (sortBy) {
          case 'price_low':
            filtered.sort((a, b) => a.lowestPrice.amount - b.lowestPrice.amount);
            break;
          case 'price_high':
            filtered.sort((a, b) => b.lowestPrice.amount - a.lowestPrice.amount);
            break;
          case 'recommended':
          default:
            // Sort by a combination of rating and reviews
            filtered.sort((a, b) => {
              const scoreA = a.userRating * 0.7 + Math.min(a.reviewCount / 100, 3) * 0.3;
              const scoreB = b.userRating * 0.7 + Math.min(b.reviewCount / 100, 3) * 0.3;
              return scoreB - scoreA;
            });
            break;
        }
        
        set({ filteredResults: filtered });
      },
      
      // Hotel & Room selection
      selectHotel: (hotel) => set({ selectedHotel: hotel, selectedRoom: null }),
      
      selectRoom: (room) => set({ selectedRoom: room }),
      
      // Extras
      setExtras: (extras) => set((state) => ({
        extras: { ...state.extras, ...extras },
      })),
      
      toggleBreakfast: () => set((state) => ({
        extras: { ...state.extras, breakfast: !state.extras.breakfast },
      })),
      
      toggleParking: () => set((state) => ({
        extras: { ...state.extras, parking: !state.extras.parking },
      })),
      
      toggleAirportTransfer: () => set((state) => ({
        extras: { ...state.extras, airportTransfer: !state.extras.airportTransfer },
      })),
      
      toggleEarlyCheckIn: () => set((state) => ({
        extras: { ...state.extras, earlyCheckIn: !state.extras.earlyCheckIn },
      })),
      
      toggleLateCheckOut: () => set((state) => ({
        extras: { ...state.extras, lateCheckOut: !state.extras.lateCheckOut },
      })),
      
      toggleExtraBed: () => set((state) => ({
        extras: { ...state.extras, extraBed: !state.extras.extraBed },
      })),
      
      // Guest info
      setPrimaryGuest: (guest) => set({ primaryGuest: guest }),
      
      setAdditionalGuests: (guests) => set({ additionalGuests: guests }),
      
      setContactInfo: (info) => set({ contactInfo: info }),
      
      setSpecialRequests: (requests) => set({ specialRequests: requests }),
      
      setArrivalTime: (time) => set({ arrivalTime: time }),
      
      // Pricing
      calculatePrice: () => {
        const { selectedRoom, searchParams, extras } = get();
        
        if (!selectedRoom || !searchParams.checkIn || !searchParams.checkOut) {
          set({ priceBreakdown: null });
          return;
        }
        
        const nights = get().getNights();
        const roomTotal = selectedRoom.price.amount * nights;
        
        // Calculate extras
        let extrasTotal = 0;
        if (extras.breakfast && selectedRoom.breakfast !== 'included') {
          extrasTotal += 25 * nights * searchParams.guests.adults; // $25 per person per night
        }
        if (extras.parking) {
          extrasTotal += 20 * nights; // $20 per night
        }
        if (extras.airportTransfer) {
          extrasTotal += 50; // One-time fee
        }
        if (extras.earlyCheckIn) {
          extrasTotal += 30; // One-time fee
        }
        if (extras.lateCheckOut) {
          extrasTotal += 30; // One-time fee
        }
        if (extras.extraBed) {
          extrasTotal += 40 * nights; // $40 per night
        }
        
        const taxes = (roomTotal + extrasTotal) * 0.12; // 12% tax
        const fees = 15; // Service fee
        const total = roomTotal + extrasTotal + taxes + fees;
        
        set({
          priceBreakdown: {
            basePrice: roomTotal,
            taxes,
            fees,
            extras: extrasTotal,
            discount: 0,
            total,
            currency: selectedRoom.price.currency,
          },
        });
      },
      
      // Booking
      setBookingReference: (ref) => set({ bookingReference: ref }),
      
      setBookingConfirmed: (confirmed) => set({ bookingConfirmed: confirmed }),
      
      // Helpers
      getNights: () => {
        const { checkIn, checkOut } = get().searchParams;
        if (!checkIn || !checkOut) return 0;
        const diffTime = checkOut.getTime() - checkIn.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      },
      
      getTotalGuests: () => {
        const { guests } = get().searchParams;
        return guests.adults + guests.children;
      },
      
      // Reset
      reset: () => set(initialState),
      
      resetSearch: () => set({
        searchResults: [],
        filteredResults: [],
        isSearching: false,
        searchError: null,
        selectedHotel: null,
        selectedRoom: null,
      }),
    }),
    {
      name: 'hotel-booking-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        // Only persist search params and selected items
        searchParams: state.searchParams,
        selectedHotel: state.selectedHotel,
        selectedRoom: state.selectedRoom,
        extras: state.extras,
        primaryGuest: state.primaryGuest,
        contactInfo: state.contactInfo,
        specialRequests: state.specialRequests,
      }),
    }
  )
);

export default useHotelStore;
