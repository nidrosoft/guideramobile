/**
 * BOOKING STORE
 * 
 * Shared booking state used across all booking flows.
 * Manages cart, active bookings, and common state.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  Booking, 
  BookingType, 
  Traveler, 
  ContactInfo, 
  PaymentMethod,
  PromoCode,
} from '../types/booking.types';

// ============================================
// STATE INTERFACE
// ============================================

interface BookingState {
  // Active booking session
  activeBookingType: BookingType | null;
  sessionStartTime: Date | null;
  sessionExpiry: Date | null;
  
  // Saved travelers (for quick fill)
  savedTravelers: Traveler[];
  primaryTraveler: Traveler | null;
  
  // Contact info
  savedContactInfo: ContactInfo | null;
  
  // Payment methods
  savedPaymentMethods: PaymentMethod[];
  defaultPaymentMethod: PaymentMethod | null;
  
  // Promo codes
  appliedPromoCode: PromoCode | null;
  
  // Recent bookings
  recentBookings: Booking[];
  
  // Draft bookings (incomplete)
  draftBookings: {
    id: string;
    type: BookingType;
    data: any;
    lastUpdated: Date;
  }[];
  
  // UI State
  isProcessing: boolean;
  error: string | null;
}

// ============================================
// ACTIONS INTERFACE
// ============================================

interface BookingActions {
  // Session management
  startBookingSession: (type: BookingType) => void;
  endBookingSession: () => void;
  isSessionValid: () => boolean;
  
  // Travelers
  addSavedTraveler: (traveler: Traveler) => void;
  updateSavedTraveler: (id: string, traveler: Partial<Traveler>) => void;
  removeSavedTraveler: (id: string) => void;
  setPrimaryTraveler: (traveler: Traveler | null) => void;
  
  // Contact info
  saveContactInfo: (info: ContactInfo) => void;
  
  // Payment methods
  addPaymentMethod: (method: PaymentMethod) => void;
  removePaymentMethod: (index: number) => void;
  setDefaultPaymentMethod: (method: PaymentMethod | null) => void;
  
  // Promo codes
  applyPromoCode: (code: PromoCode) => void;
  removePromoCode: () => void;
  
  // Bookings
  addRecentBooking: (booking: Booking) => void;
  clearRecentBookings: () => void;
  
  // Drafts
  saveDraft: (type: BookingType, data: any) => void;
  loadDraft: (type: BookingType) => any | null;
  removeDraft: (type: BookingType) => void;
  clearAllDrafts: () => void;
  
  // UI State
  setProcessing: (isProcessing: boolean) => void;
  setError: (error: string | null) => void;
  
  // Reset
  reset: () => void;
}

// ============================================
// INITIAL STATE
// ============================================

const initialState: BookingState = {
  activeBookingType: null,
  sessionStartTime: null,
  sessionExpiry: null,
  savedTravelers: [],
  primaryTraveler: null,
  savedContactInfo: null,
  savedPaymentMethods: [],
  defaultPaymentMethod: null,
  appliedPromoCode: null,
  recentBookings: [],
  draftBookings: [],
  isProcessing: false,
  error: null,
};

// ============================================
// STORE
// ============================================

export const useBookingStore = create<BookingState & BookingActions>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      // Session management
      startBookingSession: (type) => {
        const now = new Date();
        const expiry = new Date(now.getTime() + 20 * 60 * 1000); // 20 minutes
        set({
          activeBookingType: type,
          sessionStartTime: now,
          sessionExpiry: expiry,
          error: null,
        });
      },
      
      endBookingSession: () => {
        set({
          activeBookingType: null,
          sessionStartTime: null,
          sessionExpiry: null,
          appliedPromoCode: null,
        });
      },
      
      isSessionValid: () => {
        const { sessionExpiry } = get();
        if (!sessionExpiry) return false;
        return new Date() < new Date(sessionExpiry);
      },
      
      // Travelers
      addSavedTraveler: (traveler) => {
        set((state) => ({
          savedTravelers: [...state.savedTravelers, traveler],
        }));
      },
      
      updateSavedTraveler: (id, updates) => {
        set((state) => ({
          savedTravelers: state.savedTravelers.map((t) =>
            t.id === id ? { ...t, ...updates } : t
          ),
        }));
      },
      
      removeSavedTraveler: (id) => {
        set((state) => ({
          savedTravelers: state.savedTravelers.filter((t) => t.id !== id),
          primaryTraveler: state.primaryTraveler?.id === id ? null : state.primaryTraveler,
        }));
      },
      
      setPrimaryTraveler: (traveler) => {
        set({ primaryTraveler: traveler });
      },
      
      // Contact info
      saveContactInfo: (info) => {
        set({ savedContactInfo: info });
      },
      
      // Payment methods
      addPaymentMethod: (method) => {
        set((state) => ({
          savedPaymentMethods: [...state.savedPaymentMethods, method],
        }));
      },
      
      removePaymentMethod: (index) => {
        set((state) => ({
          savedPaymentMethods: state.savedPaymentMethods.filter((_, i) => i !== index),
        }));
      },
      
      setDefaultPaymentMethod: (method) => {
        set({ defaultPaymentMethod: method });
      },
      
      // Promo codes
      applyPromoCode: (code) => {
        set({ appliedPromoCode: code });
      },
      
      removePromoCode: () => {
        set({ appliedPromoCode: null });
      },
      
      // Bookings
      addRecentBooking: (booking) => {
        set((state) => ({
          recentBookings: [booking, ...state.recentBookings].slice(0, 10), // Keep last 10
        }));
      },
      
      clearRecentBookings: () => {
        set({ recentBookings: [] });
      },
      
      // Drafts
      saveDraft: (type, data) => {
        set((state) => {
          const existingIndex = state.draftBookings.findIndex((d) => d.type === type);
          const draft = {
            id: `draft-${type}-${Date.now()}`,
            type,
            data,
            lastUpdated: new Date(),
          };
          
          if (existingIndex >= 0) {
            const updated = [...state.draftBookings];
            updated[existingIndex] = draft;
            return { draftBookings: updated };
          }
          
          return { draftBookings: [...state.draftBookings, draft] };
        });
      },
      
      loadDraft: (type) => {
        const draft = get().draftBookings.find((d) => d.type === type);
        return draft?.data || null;
      },
      
      removeDraft: (type) => {
        set((state) => ({
          draftBookings: state.draftBookings.filter((d) => d.type !== type),
        }));
      },
      
      clearAllDrafts: () => {
        set({ draftBookings: [] });
      },
      
      // UI State
      setProcessing: (isProcessing) => {
        set({ isProcessing });
      },
      
      setError: (error) => {
        set({ error });
      },
      
      // Reset
      reset: () => {
        set(initialState);
      },
    }),
    {
      name: 'guidera-booking-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        // Only persist these fields
        savedTravelers: state.savedTravelers,
        primaryTraveler: state.primaryTraveler,
        savedContactInfo: state.savedContactInfo,
        savedPaymentMethods: state.savedPaymentMethods,
        defaultPaymentMethod: state.defaultPaymentMethod,
        recentBookings: state.recentBookings,
        draftBookings: state.draftBookings,
      }),
    }
  )
);
