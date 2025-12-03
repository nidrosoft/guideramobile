/**
 * CAR RENTAL STORE
 * 
 * Zustand store for car rental booking state management.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Car, CarSearchParams, CarBooking, RentalCompany } from '../types/car.types';
import { Location } from '../types/booking.types';

// ============================================
// TYPES
// ============================================

export interface ProtectionPackage {
  id: string;
  name: string;
  description: string;
  coverage: string[];
  excessAmount: number;
  pricePerDay: number;
  recommended?: boolean;
}

export interface CarExtra {
  id: string;
  name: string;
  description: string;
  pricePerDay: number;
  maxQuantity: number;
  icon: string;
}

export interface DriverInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  licenseNumber: string;
  licenseCountry: string;
  licenseExpiry: string;
}

export interface CarSearchState {
  pickupLocation: Location | null;
  returnLocation: Location | null;
  sameReturnLocation: boolean;
  pickupDate: Date | null;
  pickupTime: string;
  returnDate: Date | null;
  returnTime: string;
  driverAge: number;
}

export interface CarFilters {
  vehicleTypes: string[];
  transmission: 'any' | 'automatic' | 'manual';
  suppliers: string[];
  features: string[];
  priceRange: { min: number; max: number };
}

export interface CarPricing {
  baseRate: number;
  protectionCost: number;
  extrasCost: number;
  airportFee: number;
  taxes: number;
  total: number;
  perDay: number;
  rentalDays: number;
}

interface CarState {
  // Search
  searchParams: CarSearchState;
  
  // Results
  results: Car[];
  isSearching: boolean;
  filters: CarFilters;
  sortBy: 'price' | 'recommended' | 'size';
  
  // Selection
  selectedCar: Car | null;
  selectedProtection: ProtectionPackage | null;
  selectedExtras: { extra: CarExtra; quantity: number }[];
  
  // Driver
  primaryDriver: DriverInfo | null;
  additionalDrivers: DriverInfo[];
  
  // Booking
  pricing: CarPricing;
  bookingReference: string | null;
  isBookingConfirmed: boolean;
  
  // Actions - Search
  setPickupLocation: (location: Location) => void;
  setReturnLocation: (location: Location | null) => void;
  setSameReturnLocation: (same: boolean) => void;
  setPickupDate: (date: Date) => void;
  setPickupTime: (time: string) => void;
  setReturnDate: (date: Date) => void;
  setReturnTime: (time: string) => void;
  setDriverAge: (age: number) => void;
  
  // Actions - Results
  setResults: (cars: Car[]) => void;
  setIsSearching: (searching: boolean) => void;
  setFilters: (filters: Partial<CarFilters>) => void;
  setSortBy: (sort: 'price' | 'recommended' | 'size') => void;
  
  // Actions - Selection
  selectCar: (car: Car) => void;
  selectProtection: (protection: ProtectionPackage) => void;
  toggleExtra: (extra: CarExtra) => void;
  setExtraQuantity: (extraId: string, quantity: number) => void;
  
  // Actions - Driver
  setPrimaryDriver: (driver: DriverInfo) => void;
  addAdditionalDriver: (driver: DriverInfo) => void;
  removeAdditionalDriver: (index: number) => void;
  
  // Actions - Booking
  calculatePricing: () => void;
  confirmBooking: () => void;
  setBookingReference: (ref: string) => void;
  
  // Helpers
  getRentalDays: () => number;
  getFilteredResults: () => Car[];
  isSearchValid: () => boolean;
  
  // Reset
  reset: () => void;
}

// ============================================
// INITIAL STATE
// ============================================

const initialSearchParams: CarSearchState = {
  pickupLocation: null,
  returnLocation: null,
  sameReturnLocation: true,
  pickupDate: null,
  pickupTime: '10:00',
  returnDate: null,
  returnTime: '10:00',
  driverAge: 30,
};

const initialFilters: CarFilters = {
  vehicleTypes: [],
  transmission: 'any',
  suppliers: [],
  features: [],
  priceRange: { min: 0, max: 500 },
};

const initialPricing: CarPricing = {
  baseRate: 0,
  protectionCost: 0,
  extrasCost: 0,
  airportFee: 0,
  taxes: 0,
  total: 0,
  perDay: 0,
  rentalDays: 1,
};

// ============================================
// PROTECTION PACKAGES
// ============================================

export const PROTECTION_PACKAGES: ProtectionPackage[] = [
  {
    id: 'basic',
    name: 'Basic',
    description: 'Standard coverage included with rental',
    coverage: ['Collision Damage Waiver', 'Theft Protection'],
    excessAmount: 1500,
    pricePerDay: 0,
  },
  {
    id: 'standard',
    name: 'Standard',
    description: 'Reduced excess for peace of mind',
    coverage: ['Collision Damage Waiver', 'Theft Protection', 'Reduced Excess'],
    excessAmount: 500,
    pricePerDay: 12,
    recommended: true,
  },
  {
    id: 'premium',
    name: 'Premium',
    description: 'Full protection with zero excess',
    coverage: ['Zero Excess', 'Theft Protection', 'Roadside Assistance', 'Personal Accident'],
    excessAmount: 0,
    pricePerDay: 22,
  },
];

// ============================================
// AVAILABLE EXTRAS
// ============================================

export const AVAILABLE_EXTRAS: CarExtra[] = [
  { id: 'gps', name: 'GPS Navigation', description: 'Never get lost', pricePerDay: 8, maxQuantity: 1, icon: 'gps' },
  { id: 'child_seat_infant', name: 'Infant Seat', description: '0-12 months', pricePerDay: 10, maxQuantity: 2, icon: 'child' },
  { id: 'child_seat_toddler', name: 'Toddler Seat', description: '1-4 years', pricePerDay: 10, maxQuantity: 2, icon: 'child' },
  { id: 'child_seat_booster', name: 'Booster Seat', description: '4-8 years', pricePerDay: 8, maxQuantity: 2, icon: 'child' },
  { id: 'additional_driver', name: 'Additional Driver', description: 'Add another driver', pricePerDay: 12, maxQuantity: 3, icon: 'user' },
  { id: 'wifi', name: 'WiFi Hotspot', description: 'Stay connected', pricePerDay: 10, maxQuantity: 1, icon: 'wifi' },
  { id: 'prepaid_fuel', name: 'Prepaid Fuel', description: 'Return empty, no refueling needed', pricePerDay: 0, maxQuantity: 1, icon: 'fuel' },
];

// ============================================
// STORE
// ============================================

export const useCarStore = create<CarState>()(
  persist(
    (set, get) => ({
      // Initial state
      searchParams: initialSearchParams,
      results: [],
      isSearching: false,
      filters: initialFilters,
      sortBy: 'recommended',
      selectedCar: null,
      selectedProtection: PROTECTION_PACKAGES[0], // Basic by default
      selectedExtras: [],
      primaryDriver: null,
      additionalDrivers: [],
      pricing: initialPricing,
      bookingReference: null,
      isBookingConfirmed: false,
      
      // ============================================
      // SEARCH ACTIONS
      // ============================================
      
      setPickupLocation: (location) => set((state) => ({
        searchParams: { ...state.searchParams, pickupLocation: location },
      })),
      
      setReturnLocation: (location) => set((state) => ({
        searchParams: { ...state.searchParams, returnLocation: location },
      })),
      
      setSameReturnLocation: (same) => set((state) => ({
        searchParams: { 
          ...state.searchParams, 
          sameReturnLocation: same,
          returnLocation: same ? null : state.searchParams.returnLocation,
        },
      })),
      
      setPickupDate: (date) => set((state) => ({
        searchParams: { ...state.searchParams, pickupDate: date },
      })),
      
      setPickupTime: (time) => set((state) => ({
        searchParams: { ...state.searchParams, pickupTime: time },
      })),
      
      setReturnDate: (date) => set((state) => ({
        searchParams: { ...state.searchParams, returnDate: date },
      })),
      
      setReturnTime: (time) => set((state) => ({
        searchParams: { ...state.searchParams, returnTime: time },
      })),
      
      setDriverAge: (age) => set((state) => ({
        searchParams: { ...state.searchParams, driverAge: age },
      })),
      
      // ============================================
      // RESULTS ACTIONS
      // ============================================
      
      setResults: (cars) => set({ results: cars }),
      
      setIsSearching: (searching) => set({ isSearching: searching }),
      
      setFilters: (filters) => set((state) => ({
        filters: { ...state.filters, ...filters },
      })),
      
      setSortBy: (sort) => set({ sortBy: sort }),
      
      // ============================================
      // SELECTION ACTIONS
      // ============================================
      
      selectCar: (car) => {
        set({ selectedCar: car });
        get().calculatePricing();
      },
      
      selectProtection: (protection) => {
        set({ selectedProtection: protection });
        get().calculatePricing();
      },
      
      toggleExtra: (extra) => {
        const { selectedExtras } = get();
        const existingIndex = selectedExtras.findIndex(e => e.extra.id === extra.id);
        
        if (existingIndex >= 0) {
          // Remove
          set({ selectedExtras: selectedExtras.filter((_, i) => i !== existingIndex) });
        } else {
          // Add with quantity 1
          set({ selectedExtras: [...selectedExtras, { extra, quantity: 1 }] });
        }
        get().calculatePricing();
      },
      
      setExtraQuantity: (extraId, quantity) => {
        const { selectedExtras } = get();
        if (quantity <= 0) {
          set({ selectedExtras: selectedExtras.filter(e => e.extra.id !== extraId) });
        } else {
          set({
            selectedExtras: selectedExtras.map(e =>
              e.extra.id === extraId ? { ...e, quantity: Math.min(quantity, e.extra.maxQuantity) } : e
            ),
          });
        }
        get().calculatePricing();
      },
      
      // ============================================
      // DRIVER ACTIONS
      // ============================================
      
      setPrimaryDriver: (driver) => set({ primaryDriver: driver }),
      
      addAdditionalDriver: (driver) => set((state) => ({
        additionalDrivers: [...state.additionalDrivers, driver],
      })),
      
      removeAdditionalDriver: (index) => set((state) => ({
        additionalDrivers: state.additionalDrivers.filter((_, i) => i !== index),
      })),
      
      // ============================================
      // PRICING
      // ============================================
      
      calculatePricing: () => {
        const { selectedCar, selectedProtection, selectedExtras, searchParams } = get();
        const rentalDays = get().getRentalDays();
        
        if (!selectedCar) {
          set({ pricing: initialPricing });
          return;
        }
        
        const baseRate = selectedCar.rental.pricePerDay.amount * rentalDays;
        const protectionCost = (selectedProtection?.pricePerDay || 0) * rentalDays;
        const extrasCost = selectedExtras.reduce(
          (sum, { extra, quantity }) => sum + (extra.pricePerDay * quantity * rentalDays),
          0
        );
        
        // Young driver fee
        let youngDriverFee = 0;
        if (searchParams.driverAge < 25) {
          youngDriverFee = 15 * rentalDays;
        }
        
        const subtotal = baseRate + protectionCost + extrasCost + youngDriverFee;
        // Airport fee based on search location
const airportFee = searchParams.pickupLocation?.type === 'airport' ? 25 : 0;
        const taxes = (subtotal + airportFee) * 0.12;
        const total = subtotal + airportFee + taxes;
        
        set({
          pricing: {
            baseRate,
            protectionCost,
            extrasCost: extrasCost + youngDriverFee,
            airportFee,
            taxes,
            total,
            perDay: total / rentalDays,
            rentalDays,
          },
        });
      },
      
      confirmBooking: () => set({ isBookingConfirmed: true }),
      
      setBookingReference: (ref) => set({ bookingReference: ref }),
      
      // ============================================
      // HELPERS
      // ============================================
      
      getRentalDays: () => {
        const { pickupDate, returnDate } = get().searchParams;
        if (!pickupDate || !returnDate) return 1;
        
        // Handle dates that may be strings from persistence
        const pickup = pickupDate instanceof Date ? pickupDate : new Date(pickupDate);
        const returnD = returnDate instanceof Date ? returnDate : new Date(returnDate);
        
        if (isNaN(pickup.getTime()) || isNaN(returnD.getTime())) return 1;
        
        const diff = returnD.getTime() - pickup.getTime();
        return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
      },
      
      getFilteredResults: () => {
        const { results, filters, sortBy } = get();
        let filtered = [...results];
        
        // Filter by vehicle type
        if (filters.vehicleTypes.length > 0) {
          filtered = filtered.filter(car => filters.vehicleTypes.includes(car.category));
        }
        
        // Filter by transmission
        if (filters.transmission !== 'any') {
          filtered = filtered.filter(car => car.specs.transmission === filters.transmission);
        }
        
        // Filter by price range
        filtered = filtered.filter(car => 
          car.rental.pricePerDay.amount >= filters.priceRange.min &&
          car.rental.pricePerDay.amount <= filters.priceRange.max
        );
        
        // Sort
        switch (sortBy) {
          case 'price':
            filtered.sort((a, b) => a.rental.pricePerDay.amount - b.rental.pricePerDay.amount);
            break;
          case 'size':
            const sizeOrder = ['economy', 'compact', 'midsize', 'fullsize', 'suv', 'luxury', 'van'];
            filtered.sort((a, b) => sizeOrder.indexOf(a.category) - sizeOrder.indexOf(b.category));
            break;
          case 'recommended':
          default:
            // Keep original order (assumed to be recommended)
            break;
        }
        
        return filtered;
      },
      
      isSearchValid: () => {
        const { pickupLocation, pickupDate, returnDate } = get().searchParams;
        return pickupLocation !== null && pickupDate !== null && returnDate !== null;
      },
      
      // ============================================
      // RESET
      // ============================================
      
      reset: () => set({
        searchParams: initialSearchParams,
        results: [],
        isSearching: false,
        filters: initialFilters,
        sortBy: 'recommended',
        selectedCar: null,
        selectedProtection: PROTECTION_PACKAGES[0],
        selectedExtras: [],
        primaryDriver: null,
        additionalDrivers: [],
        pricing: initialPricing,
        bookingReference: null,
        isBookingConfirmed: false,
      }),
    }),
    {
      name: 'guidera-car-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        searchParams: state.searchParams,
        selectedCar: state.selectedCar,
        selectedProtection: state.selectedProtection,
        selectedExtras: state.selectedExtras,
        primaryDriver: state.primaryDriver,
      }),
    }
  )
);
