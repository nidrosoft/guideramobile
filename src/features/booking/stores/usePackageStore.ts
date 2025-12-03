/**
 * PACKAGE STORE
 * 
 * Zustand store for package booking state management.
 * Handles the unified bundle booking flow with flight, hotel, car, and experiences.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Location, Traveler, ContactInfo, PriceBreakdown } from '../types/booking.types';
import { Flight } from '../types/flight.types';
import { Hotel, Room } from '../types/hotel.types';
import { Car } from '../types/car.types';
import { Experience } from '../types/experience.types';
import { PackageTemplate, PACKAGE_TEMPLATES } from '../types/package.types';
import { BOOKING_DEFAULTS, PRICING_CONFIG } from '../config/booking.config';

// ============================================
// TYPES
// ============================================

export type PackageCategory = 'flight' | 'hotel' | 'car' | 'experience';

export interface TripSetup {
  origin: Location | null;
  destination: Location | null;
  departureDate: Date | null;
  returnDate: Date | null;
  travelers: {
    adults: number;
    children: number;
    infants: number;
  };
  packageType: PackageTemplate;
  requiredCategories: PackageCategory[];
}

export interface FlightSelection {
  outbound: Flight | null;
  return: Flight | null;
}

export interface HotelSelection {
  hotel: Hotel | null;
  room: Room | null;
}

export interface PackageSelections {
  flight: FlightSelection;
  hotel: HotelSelection;
  car: Car | null;
  experiences: Experience[];
}

export interface FlightExtras {
  seats: { passengerId: string; seatNumber: string; price: number }[];
  bags: { passengerId: string; type: string; price: number }[];
  meals: { passengerId: string; meal: string; price: number }[];
}

export interface HotelExtras {
  breakfast: boolean;
  parking: boolean;
  earlyCheckIn: boolean;
  lateCheckOut: boolean;
  airportTransfer: boolean;
}

export interface CarExtras {
  gps: boolean;
  childSeat: boolean;
  additionalDriver: boolean;
  insurance: 'basic' | 'premium' | 'full' | null;
}

export interface PackageExtras {
  flight: FlightExtras;
  hotel: HotelExtras;
  car: CarExtras;
  travelInsurance: boolean;
}

export interface PackagePricing {
  flight: number;
  hotel: number;
  car: number;
  experiences: number;
  extras: number;
  subtotal: number;
  bundleDiscount: number;
  taxes: number;
  fees: number;
  total: number;
  savings: number;
  savingsPercentage: number;
  currency: string;
}

export interface PackageVouchers {
  masterConfirmation: string;
  flight?: { confirmation: string; eTickets: string[] };
  hotel?: { confirmation: string; voucher: string };
  car?: { confirmation: string; voucher: string };
  experiences?: { id: string; confirmation: string; ticket: string }[];
}

interface PackageState {
  // Trip Setup
  tripSetup: TripSetup;
  
  // Selections
  selections: PackageSelections;
  
  // Active category in builder
  activeCategory: PackageCategory;
  
  // Search results for each category
  flightResults: Flight[];
  hotelResults: Hotel[];
  carResults: Car[];
  experienceResults: Experience[];
  
  // Loading states
  isSearching: Record<PackageCategory, boolean>;
  
  // Extras
  extras: PackageExtras;
  
  // Travelers
  travelers: Traveler[];
  contactInfo: ContactInfo | null;
  
  // Pricing
  pricing: PackagePricing;
  
  // Booking status
  bookingReference: string | null;
  vouchers: PackageVouchers | null;
  isBookingConfirmed: boolean;
  
  // Actions - Trip Setup
  setOrigin: (origin: Location | null) => void;
  setDestination: (destination: Location | null) => void;
  setDepartureDate: (date: Date | null) => void;
  setReturnDate: (date: Date | null) => void;
  setTravelers: (travelers: TripSetup['travelers']) => void;
  setPackageType: (type: PackageTemplate) => void;
  
  // Actions - Category Navigation
  setActiveCategory: (category: PackageCategory) => void;
  getNextRequiredCategory: () => PackageCategory | null;
  
  // Actions - Selections
  selectFlight: (type: 'outbound' | 'return', flight: Flight | null) => void;
  selectHotel: (hotel: Hotel | null) => void;
  selectRoom: (room: Room | null) => void;
  selectCar: (car: Car | null) => void;
  addExperience: (experience: Experience) => void;
  removeExperience: (experienceId: string) => void;
  clearSelection: (category: PackageCategory) => void;
  
  // Actions - Search Results
  setFlightResults: (flights: Flight[]) => void;
  setHotelResults: (hotels: Hotel[]) => void;
  setCarResults: (cars: Car[]) => void;
  setExperienceResults: (experiences: Experience[]) => void;
  setSearching: (category: PackageCategory, isSearching: boolean) => void;
  
  // Actions - Extras
  toggleFlightExtra: (type: keyof FlightExtras, data: any) => void;
  toggleHotelExtra: (extra: keyof HotelExtras) => void;
  toggleCarExtra: (extra: keyof CarExtras, value?: any) => void;
  toggleTravelInsurance: () => void;
  
  // Actions - Travelers
  setTravelersList: (travelers: Traveler[]) => void;
  updateTraveler: (index: number, traveler: Partial<Traveler>) => void;
  setContactInfo: (info: ContactInfo) => void;
  
  // Actions - Pricing
  calculatePricing: () => void;
  
  // Actions - Booking
  setBookingReference: (ref: string) => void;
  setVouchers: (vouchers: PackageVouchers) => void;
  confirmBooking: () => void;
  
  // Helpers
  isSelectionComplete: () => boolean;
  isCategoryComplete: (category: PackageCategory) => boolean;
  isCategoryRequired: (category: PackageCategory) => boolean;
  getCompletedCategories: () => PackageCategory[];
  getNights: () => number;
  getTotalTravelers: () => number;
  
  // Reset
  reset: () => void;
}

// ============================================
// INITIAL STATE
// ============================================

const initialTripSetup: TripSetup = {
  origin: null,
  destination: null,
  departureDate: null,
  returnDate: null,
  travelers: {
    adults: BOOKING_DEFAULTS.passengers.adults,
    children: BOOKING_DEFAULTS.passengers.children,
    infants: BOOKING_DEFAULTS.passengers.infants,
  },
  packageType: 'flight_hotel',
  requiredCategories: ['flight', 'hotel'],
};

const initialSelections: PackageSelections = {
  flight: { outbound: null, return: null },
  hotel: { hotel: null, room: null },
  car: null,
  experiences: [],
};

const initialExtras: PackageExtras = {
  flight: { seats: [], bags: [], meals: [] },
  hotel: { breakfast: false, parking: false, earlyCheckIn: false, lateCheckOut: false, airportTransfer: false },
  car: { gps: false, childSeat: false, additionalDriver: false, insurance: null },
  travelInsurance: false,
};

const initialPricing: PackagePricing = {
  flight: 0,
  hotel: 0,
  car: 0,
  experiences: 0,
  extras: 0,
  subtotal: 0,
  bundleDiscount: 0,
  taxes: 0,
  fees: 0,
  total: 0,
  savings: 0,
  savingsPercentage: 0,
  currency: 'USD',
};

// ============================================
// STORE
// ============================================

export const usePackageStore = create<PackageState>()(
  persist(
    (set, get) => ({
      // Initial State
      tripSetup: initialTripSetup,
      selections: initialSelections,
      activeCategory: 'flight',
      flightResults: [],
      hotelResults: [],
      carResults: [],
      experienceResults: [],
      isSearching: { flight: false, hotel: false, car: false, experience: false },
      extras: initialExtras,
      travelers: [],
      contactInfo: null,
      pricing: initialPricing,
      bookingReference: null,
      vouchers: null,
      isBookingConfirmed: false,
      
      // ============================================
      // TRIP SETUP ACTIONS
      // ============================================
      
      setOrigin: (origin) => set({ tripSetup: { ...get().tripSetup, origin } }),
      
      setDestination: (destination) => set({ tripSetup: { ...get().tripSetup, destination } }),
      
      setDepartureDate: (departureDate) => set({ tripSetup: { ...get().tripSetup, departureDate } }),
      
      setReturnDate: (returnDate) => set({ tripSetup: { ...get().tripSetup, returnDate } }),
      
      setTravelers: (travelers) => set({ tripSetup: { ...get().tripSetup, travelers } }),
      
      setPackageType: (packageType) => {
        const template = PACKAGE_TEMPLATES.find(t => t.type === packageType);
        const requiredCategories = template?.includes || ['flight', 'hotel'];
        set({
          tripSetup: {
            ...get().tripSetup,
            packageType,
            requiredCategories: requiredCategories as PackageCategory[],
          },
        });
      },
      
      // ============================================
      // CATEGORY NAVIGATION
      // ============================================
      
      setActiveCategory: (activeCategory) => set({ activeCategory }),
      
      getNextRequiredCategory: () => {
        const { tripSetup, selections } = get();
        const required = tripSetup.requiredCategories;
        
        // Check each required category in order
        for (const category of required) {
          if (!get().isCategoryComplete(category)) {
            return category;
          }
        }
        return null;
      },
      
      // ============================================
      // SELECTION ACTIONS
      // ============================================
      
      selectFlight: (type, flight) => {
        const current = get().selections.flight;
        set({
          selections: {
            ...get().selections,
            flight: { ...current, [type]: flight },
          },
        });
        get().calculatePricing();
      },
      
      selectHotel: (hotel) => {
        set({
          selections: {
            ...get().selections,
            hotel: { ...get().selections.hotel, hotel, room: null },
          },
        });
        get().calculatePricing();
      },
      
      selectRoom: (room) => {
        set({
          selections: {
            ...get().selections,
            hotel: { ...get().selections.hotel, room },
          },
        });
        get().calculatePricing();
      },
      
      selectCar: (car) => {
        set({ selections: { ...get().selections, car } });
        get().calculatePricing();
      },
      
      addExperience: (experience) => {
        const current = get().selections.experiences;
        if (!current.find(e => e.id === experience.id)) {
          set({
            selections: {
              ...get().selections,
              experiences: [...current, experience],
            },
          });
          get().calculatePricing();
        }
      },
      
      removeExperience: (experienceId) => {
        set({
          selections: {
            ...get().selections,
            experiences: get().selections.experiences.filter(e => e.id !== experienceId),
          },
        });
        get().calculatePricing();
      },
      
      clearSelection: (category) => {
        const { selections } = get();
        switch (category) {
          case 'flight':
            set({ selections: { ...selections, flight: { outbound: null, return: null } } });
            break;
          case 'hotel':
            set({ selections: { ...selections, hotel: { hotel: null, room: null } } });
            break;
          case 'car':
            set({ selections: { ...selections, car: null } });
            break;
          case 'experience':
            set({ selections: { ...selections, experiences: [] } });
            break;
        }
        get().calculatePricing();
      },
      
      // ============================================
      // SEARCH RESULTS
      // ============================================
      
      setFlightResults: (flightResults) => set({ flightResults }),
      setHotelResults: (hotelResults) => set({ hotelResults }),
      setCarResults: (carResults) => set({ carResults }),
      setExperienceResults: (experienceResults) => set({ experienceResults }),
      
      setSearching: (category, isSearching) => {
        set({
          isSearching: { ...get().isSearching, [category]: isSearching },
        });
      },
      
      // ============================================
      // EXTRAS ACTIONS
      // ============================================
      
      toggleFlightExtra: (type, data) => {
        const current = get().extras.flight;
        // Handle array-based extras (seats, bags, meals)
        set({
          extras: {
            ...get().extras,
            flight: { ...current, [type]: data },
          },
        });
        get().calculatePricing();
      },
      
      toggleHotelExtra: (extra) => {
        const current = get().extras.hotel;
        set({
          extras: {
            ...get().extras,
            hotel: { ...current, [extra]: !current[extra] },
          },
        });
        get().calculatePricing();
      },
      
      toggleCarExtra: (extra, value) => {
        const current = get().extras.car;
        const newValue = value !== undefined ? value : !current[extra];
        set({
          extras: {
            ...get().extras,
            car: { ...current, [extra]: newValue },
          },
        });
        get().calculatePricing();
      },
      
      toggleTravelInsurance: () => {
        set({
          extras: {
            ...get().extras,
            travelInsurance: !get().extras.travelInsurance,
          },
        });
        get().calculatePricing();
      },
      
      // ============================================
      // TRAVELER ACTIONS
      // ============================================
      
      setTravelersList: (travelers) => set({ travelers }),
      
      updateTraveler: (index, traveler) => {
        const travelers = [...get().travelers];
        travelers[index] = { ...travelers[index], ...traveler };
        set({ travelers });
      },
      
      setContactInfo: (contactInfo) => set({ contactInfo }),
      
      // ============================================
      // PRICING
      // ============================================
      
      calculatePricing: () => {
        const { selections, extras, tripSetup } = get();
        const nights = get().getNights();
        const totalTravelers = get().getTotalTravelers();
        
        // Calculate flight price
        let flightPrice = 0;
        if (selections.flight.outbound) {
          flightPrice += selections.flight.outbound.price.amount * totalTravelers;
        }
        if (selections.flight.return) {
          flightPrice += selections.flight.return.price.amount * totalTravelers;
        }
        
        // Calculate hotel price
        let hotelPrice = 0;
        if (selections.hotel.room) {
          hotelPrice = selections.hotel.room.price.amount * nights;
        }
        
        // Calculate car price
        let carPrice = 0;
        if (selections.car) {
          carPrice = selections.car.rental.pricePerDay.amount * (nights + 1); // Usually rent for trip duration + 1
        }
        
        // Calculate experiences price
        let experiencesPrice = 0;
        selections.experiences.forEach(exp => {
          experiencesPrice += exp.price.amount * totalTravelers;
        });
        
        // Calculate extras price
        let extrasPrice = 0;
        
        // Flight extras
        extras.flight.seats.forEach(s => extrasPrice += s.price);
        extras.flight.bags.forEach(b => extrasPrice += b.price);
        extras.flight.meals.forEach(m => extrasPrice += m.price);
        
        // Hotel extras
        if (extras.hotel.breakfast) extrasPrice += 25 * nights * totalTravelers;
        if (extras.hotel.parking) extrasPrice += 20 * nights;
        if (extras.hotel.earlyCheckIn) extrasPrice += 30;
        if (extras.hotel.lateCheckOut) extrasPrice += 30;
        if (extras.hotel.airportTransfer) extrasPrice += 50;
        
        // Car extras
        if (extras.car.gps) extrasPrice += 10 * (nights + 1);
        if (extras.car.childSeat) extrasPrice += 8 * (nights + 1);
        if (extras.car.additionalDriver) extrasPrice += 15 * (nights + 1);
        if (extras.car.insurance === 'premium') extrasPrice += 20 * (nights + 1);
        if (extras.car.insurance === 'full') extrasPrice += 35 * (nights + 1);
        
        // Travel insurance
        if (extras.travelInsurance) {
          extrasPrice += 15 * totalTravelers * nights;
        }
        
        // Calculate subtotal
        const subtotal = flightPrice + hotelPrice + carPrice + experiencesPrice + extrasPrice;
        
        // Calculate bundle discount (only if multiple categories selected)
        const selectedCategories = get().getCompletedCategories();
        let bundleDiscount = 0;
        if (selectedCategories.length >= 2) {
          bundleDiscount = (flightPrice + hotelPrice + carPrice) * PRICING_CONFIG.packageDiscount;
        }
        
        // Calculate taxes (12%)
        const taxes = (subtotal - bundleDiscount) * 0.12;
        
        // Calculate fees
        const fees = 15; // Service fee
        
        // Calculate total
        const total = subtotal - bundleDiscount + taxes + fees;
        
        // Calculate savings
        const savings = bundleDiscount;
        const savingsPercentage = subtotal > 0 ? (savings / subtotal) * 100 : 0;
        
        set({
          pricing: {
            flight: flightPrice,
            hotel: hotelPrice,
            car: carPrice,
            experiences: experiencesPrice,
            extras: extrasPrice,
            subtotal,
            bundleDiscount,
            taxes,
            fees,
            total,
            savings,
            savingsPercentage,
            currency: 'USD',
          },
        });
      },
      
      // ============================================
      // BOOKING ACTIONS
      // ============================================
      
      setBookingReference: (bookingReference) => set({ bookingReference }),
      
      setVouchers: (vouchers) => set({ vouchers }),
      
      confirmBooking: () => set({ isBookingConfirmed: true }),
      
      // ============================================
      // HELPERS
      // ============================================
      
      isSelectionComplete: () => {
        const { tripSetup } = get();
        return tripSetup.requiredCategories.every(cat => get().isCategoryComplete(cat));
      },
      
      isCategoryComplete: (category) => {
        const { selections } = get();
        switch (category) {
          case 'flight':
            return selections.flight.outbound !== null && selections.flight.return !== null;
          case 'hotel':
            return selections.hotel.hotel !== null && selections.hotel.room !== null;
          case 'car':
            return selections.car !== null;
          case 'experience':
            return selections.experiences.length > 0;
          default:
            return false;
        }
      },
      
      isCategoryRequired: (category) => {
        return get().tripSetup.requiredCategories.includes(category);
      },
      
      getCompletedCategories: () => {
        const categories: PackageCategory[] = ['flight', 'hotel', 'car', 'experience'];
        return categories.filter(cat => get().isCategoryComplete(cat));
      },
      
      getNights: () => {
        const { departureDate, returnDate } = get().tripSetup;
        if (!departureDate || !returnDate) return 1;
        // Ensure dates are proper Date objects (may be strings from persistence)
        const depDate = departureDate instanceof Date ? departureDate : new Date(departureDate);
        const retDate = returnDate instanceof Date ? returnDate : new Date(returnDate);
        if (isNaN(depDate.getTime()) || isNaN(retDate.getTime())) return 1;
        const diff = retDate.getTime() - depDate.getTime();
        return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
      },
      
      getTotalTravelers: () => {
        const { travelers } = get().tripSetup;
        return travelers.adults + travelers.children;
      },
      
      // ============================================
      // RESET
      // ============================================
      
      reset: () => set({
        tripSetup: initialTripSetup,
        selections: initialSelections,
        activeCategory: 'flight',
        flightResults: [],
        hotelResults: [],
        carResults: [],
        experienceResults: [],
        isSearching: { flight: false, hotel: false, car: false, experience: false },
        extras: initialExtras,
        travelers: [],
        contactInfo: null,
        pricing: initialPricing,
        bookingReference: null,
        vouchers: null,
        isBookingConfirmed: false,
      }),
    }),
    {
      name: 'guidera-package-booking',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        tripSetup: state.tripSetup,
        selections: state.selections,
        extras: state.extras,
        travelers: state.travelers,
        contactInfo: state.contactInfo,
      }),
    }
  )
);
