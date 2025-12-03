/**
 * EXPERIENCE STORE
 * 
 * Zustand store for experience booking state management.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Experience,
  ExperienceCategory,
  ExperienceSearchParams,
  ExperienceFilters,
  TimeSlot,
  ParticipantCount,
} from '../types/experience.types';
import { Location } from '../types/booking.types';

// ============================================
// TYPES
// ============================================

export interface LeadTraveler {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  countryCode: string;
}

export interface ExperiencePricing {
  adultPrice: number;
  childPrice: number;
  infantPrice: number;
  adultTotal: number;
  childTotal: number;
  infantTotal: number;
  subtotal: number;
  serviceFee: number;
  taxes: number;
  total: number;
}

interface ExperienceState {
  // Search
  searchParams: ExperienceSearchParams;
  
  // Results
  results: Experience[];
  filters: ExperienceFilters;
  sortBy: 'recommended' | 'price_low' | 'price_high' | 'rating' | 'duration' | 'popularity';
  isLoading: boolean;
  
  // Selection
  selectedExperience: Experience | null;
  selectedDate: Date | null;
  selectedTimeSlot: TimeSlot | null;
  
  // Booking
  leadTraveler: LeadTraveler;
  specialRequests: string;
  
  // Pricing
  pricing: ExperiencePricing;
  
  // Confirmation
  bookingReference: string | null;
  bookingConfirmed: boolean;
  
  // Actions
  setDestination: (destination: Location | null) => void;
  setDate: (date: Date | null) => void;
  setParticipants: (participants: ParticipantCount) => void;
  setCategory: (category: ExperienceCategory | undefined) => void;
  setQuery: (query: string) => void;
  
  setResults: (results: Experience[]) => void;
  setFilters: (filters: Partial<ExperienceFilters>) => void;
  setSortBy: (sortBy: ExperienceState['sortBy']) => void;
  setLoading: (loading: boolean) => void;
  
  selectExperience: (experience: Experience | null) => void;
  selectDate: (date: Date | null) => void;
  selectTimeSlot: (timeSlot: TimeSlot | null) => void;
  
  setLeadTraveler: (traveler: Partial<LeadTraveler>) => void;
  setSpecialRequests: (requests: string) => void;
  
  calculatePricing: () => void;
  setBookingReference: (ref: string) => void;
  confirmBooking: () => void;
  
  getFilteredResults: () => Experience[];
  reset: () => void;
}

// ============================================
// INITIAL STATE
// ============================================

const initialSearchParams: ExperienceSearchParams = {
  destination: null,
  date: null,
  participants: {
    adults: 2,
    children: 0,
    infants: 0,
  },
  category: undefined,
  query: '',
};

const initialFilters: ExperienceFilters = {
  category: [],
  priceRange: null,
  duration: null,
  rating: null,
  languages: [],
  timeOfDay: [],
  features: [],
  freeCancellation: false,
  instantConfirmation: false,
  skipTheLine: false,
  privateExperience: false,
};

const initialLeadTraveler: LeadTraveler = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  countryCode: '+1',
};

const initialPricing: ExperiencePricing = {
  adultPrice: 0,
  childPrice: 0,
  infantPrice: 0,
  adultTotal: 0,
  childTotal: 0,
  infantTotal: 0,
  subtotal: 0,
  serviceFee: 0,
  taxes: 0,
  total: 0,
};

// ============================================
// STORE
// ============================================

export const useExperienceStore = create<ExperienceState>()(
  persist(
    (set, get) => ({
      // Initial state
      searchParams: initialSearchParams,
      results: [],
      filters: initialFilters,
      sortBy: 'recommended',
      isLoading: false,
      selectedExperience: null,
      selectedDate: null,
      selectedTimeSlot: null,
      leadTraveler: initialLeadTraveler,
      specialRequests: '',
      pricing: initialPricing,
      bookingReference: null,
      bookingConfirmed: false,
      
      // Search actions
      setDestination: (destination) => set((state) => ({
        searchParams: { ...state.searchParams, destination },
      })),
      
      setDate: (date) => set((state) => ({
        searchParams: { ...state.searchParams, date },
      })),
      
      setParticipants: (participants) => set((state) => ({
        searchParams: { ...state.searchParams, participants },
      })),
      
      setCategory: (category) => set((state) => ({
        searchParams: { ...state.searchParams, category },
      })),
      
      setQuery: (query) => set((state) => ({
        searchParams: { ...state.searchParams, query },
      })),
      
      // Results actions
      setResults: (results) => set({ results }),
      
      setFilters: (newFilters) => set((state) => ({
        filters: { ...state.filters, ...newFilters },
      })),
      
      setSortBy: (sortBy) => set({ sortBy }),
      
      setLoading: (isLoading) => set({ isLoading }),
      
      // Selection actions
      selectExperience: (experience) => {
        set({ selectedExperience: experience });
        if (experience) {
          get().calculatePricing();
        }
      },
      
      selectDate: (date) => {
        set({ selectedDate: date, selectedTimeSlot: null });
      },
      
      selectTimeSlot: (timeSlot) => {
        set({ selectedTimeSlot: timeSlot });
        get().calculatePricing();
      },
      
      // Traveler actions
      setLeadTraveler: (traveler) => set((state) => ({
        leadTraveler: { ...state.leadTraveler, ...traveler },
      })),
      
      setSpecialRequests: (specialRequests) => set({ specialRequests }),
      
      // Pricing
      calculatePricing: () => {
        const { selectedExperience, searchParams, selectedTimeSlot } = get();
        if (!selectedExperience) return;
        
        const basePrice = selectedTimeSlot?.price?.amount || selectedExperience.price.amount;
        const { adults, children, infants } = searchParams.participants;
        
        // Pricing tiers (typically children are 70% of adult price, infants free)
        const adultPrice = basePrice;
        const childPrice = Math.round(basePrice * 0.7);
        const infantPrice = 0;
        
        const adultTotal = adultPrice * adults;
        const childTotal = childPrice * children;
        const infantTotal = infantPrice * infants;
        const subtotal = adultTotal + childTotal + infantTotal;
        
        // Service fee (5%)
        const serviceFee = Math.round(subtotal * 0.05);
        
        // Taxes (8%)
        const taxes = Math.round(subtotal * 0.08);
        
        const total = subtotal + serviceFee + taxes;
        
        set({
          pricing: {
            adultPrice,
            childPrice,
            infantPrice,
            adultTotal,
            childTotal,
            infantTotal,
            subtotal,
            serviceFee,
            taxes,
            total,
          },
        });
      },
      
      setBookingReference: (bookingReference) => set({ bookingReference }),
      
      confirmBooking: () => set({ bookingConfirmed: true }),
      
      // Filtered results
      getFilteredResults: () => {
        const { results, filters, sortBy } = get();
        let filtered = [...results];
        
        // Apply filters
        if (filters.category.length > 0) {
          filtered = filtered.filter((exp) => filters.category.includes(exp.category));
        }
        
        if (filters.priceRange) {
          filtered = filtered.filter(
            (exp) =>
              exp.price.amount >= filters.priceRange!.min &&
              exp.price.amount <= filters.priceRange!.max
          );
        }
        
        if (filters.duration) {
          filtered = filtered.filter(
            (exp) =>
              exp.duration >= filters.duration!.min &&
              exp.duration <= filters.duration!.max
          );
        }
        
        if (filters.rating) {
          filtered = filtered.filter((exp) => exp.rating >= filters.rating!);
        }
        
        if (filters.freeCancellation) {
          filtered = filtered.filter(
            (exp) => exp.cancellationPolicy.startsWith('free')
          );
        }
        
        if (filters.instantConfirmation) {
          filtered = filtered.filter((exp) => exp.instantConfirmation);
        }
        
        // Sort
        switch (sortBy) {
          case 'price_low':
            filtered.sort((a, b) => a.price.amount - b.price.amount);
            break;
          case 'price_high':
            filtered.sort((a, b) => b.price.amount - a.price.amount);
            break;
          case 'rating':
            filtered.sort((a, b) => b.rating - a.rating);
            break;
          case 'duration':
            filtered.sort((a, b) => a.duration - b.duration);
            break;
          case 'popularity':
            filtered.sort((a, b) => b.reviewCount - a.reviewCount);
            break;
          default:
            // recommended - featured first, then by rating
            filtered.sort((a, b) => {
              if (a.featured && !b.featured) return -1;
              if (!a.featured && b.featured) return 1;
              if (a.bestSeller && !b.bestSeller) return -1;
              if (!a.bestSeller && b.bestSeller) return 1;
              return b.rating - a.rating;
            });
        }
        
        return filtered;
      },
      
      // Reset
      reset: () => set({
        searchParams: initialSearchParams,
        results: [],
        filters: initialFilters,
        sortBy: 'recommended',
        isLoading: false,
        selectedExperience: null,
        selectedDate: null,
        selectedTimeSlot: null,
        leadTraveler: initialLeadTraveler,
        specialRequests: '',
        pricing: initialPricing,
        bookingReference: null,
        bookingConfirmed: false,
      }),
    }),
    {
      name: 'experience-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        searchParams: state.searchParams,
        leadTraveler: state.leadTraveler,
      }),
    }
  )
);
