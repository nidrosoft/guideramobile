/**
 * PLANNING STORE
 * Zustand store for trip planning state management
 */

import { create } from 'zustand';
import { Location } from '@/features/booking/types/booking.types';
import {
  QuickTripFormData,
  TripPlan,
  AIGeneratedContent,
  TripStyle,
  CompanionType,
  DurationPreset,
  PlanStatus,
} from '../types/planning.types';
import { DEFAULT_TRAVELERS } from '../config/planning.config';

interface PlanningState {
  // Current Plan
  currentPlan: TripPlan | null;
  
  // Quick Trip Form Data
  quickTripData: QuickTripFormData;
  
  // Flow State
  currentStepIndex: number;
  isGenerating: boolean;
  generationProgress: number;
  generationMessage: string;
  
  // AI Content
  aiContent: AIGeneratedContent | null;
  
  // Actions - Navigation
  setCurrentStep: (index: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  
  // Actions - Destination
  setDestination: (destination: Location | null) => void;
  
  // Actions - Dates
  setStartDate: (date: Date | null) => void;
  setEndDate: (date: Date | null) => void;
  setDurationPreset: (preset: DurationPreset) => void;
  setFlexible: (flexible: boolean) => void;
  
  // Actions - Travelers & Style
  setCompanionType: (type: CompanionType | null) => void;
  toggleTripStyle: (style: TripStyle) => void;
  setTravelerCount: (travelers: { adults: number; children: number; infants: number }) => void;
  
  // Actions - AI Generation
  startGeneration: () => void;
  updateGenerationProgress: (progress: number, message: string) => void;
  setAIContent: (content: AIGeneratedContent) => void;
  
  // Actions - Plan Management
  saveDraft: () => Promise<TripPlan>;
  confirmPlan: () => Promise<TripPlan>;
  reset: () => void;
  
  // Actions - Apply Saved Preferences
  applyPreferences: (preferences: {
    companionType?: CompanionType | null;
    tripStyles?: TripStyle[];
    travelers?: { adults: number; children: number; infants: number };
  }) => void;
  hasAppliedPreferences: boolean;
  setHasAppliedPreferences: (value: boolean) => void;
  
  // Validation
  isDestinationValid: () => boolean;
  isDatesValid: () => boolean;
  isStyleValid: () => boolean;
  isReadyToGenerate: () => boolean;
}

const initialQuickTripData: QuickTripFormData = {
  destination: null,
  startDate: null,
  endDate: null,
  durationPreset: 'weekend',
  isFlexible: false,
  companionType: null,
  tripStyles: [],
  travelerCount: DEFAULT_TRAVELERS,
};

export const usePlanningStore = create<PlanningState>((set, get) => ({
  // Initial State
  currentPlan: null,
  quickTripData: initialQuickTripData,
  currentStepIndex: 0,
  isGenerating: false,
  generationProgress: 0,
  generationMessage: '',
  aiContent: null,
  hasAppliedPreferences: false,
  
  // Navigation
  setCurrentStep: (index) => set({ currentStepIndex: index }),
  
  nextStep: () => set((state) => ({ 
    currentStepIndex: state.currentStepIndex + 1 
  })),
  
  prevStep: () => set((state) => ({ 
    currentStepIndex: Math.max(0, state.currentStepIndex - 1) 
  })),
  
  // Destination
  setDestination: (destination) => set((state) => ({
    quickTripData: { ...state.quickTripData, destination }
  })),
  
  // Dates
  setStartDate: (startDate) => set((state) => ({
    quickTripData: { ...state.quickTripData, startDate }
  })),
  
  setEndDate: (endDate) => set((state) => ({
    quickTripData: { ...state.quickTripData, endDate }
  })),
  
  setDurationPreset: (durationPreset) => {
    const { quickTripData } = get();
    const startDate = quickTripData.startDate || new Date();
    
    let days = 3;
    if (durationPreset === '1week') days = 7;
    if (durationPreset === '2weeks') days = 14;
    
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + days - 1);
    
    set((state) => ({
      quickTripData: { 
        ...state.quickTripData, 
        durationPreset,
        endDate 
      }
    }));
  },
  
  setFlexible: (isFlexible) => set((state) => ({
    quickTripData: { ...state.quickTripData, isFlexible }
  })),
  
  // Travelers & Style
  setCompanionType: (companionType) => {
    // Auto-set traveler count based on companion type
    let travelers = { ...DEFAULT_TRAVELERS };
    
    if (companionType === 'couple') {
      travelers.adults = 2;
    } else if (companionType === 'family') {
      travelers.adults = 2;
      travelers.children = 2;
    } else if (companionType === 'friends') {
      travelers.adults = 4;
    } else if (companionType === 'group') {
      travelers.adults = 6;
    }
    
    set((state) => ({
      quickTripData: { 
        ...state.quickTripData, 
        companionType,
        travelerCount: travelers
      }
    }));
  },
  
  toggleTripStyle: (style) => set((state) => {
    const currentStyles = state.quickTripData.tripStyles;
    const isSelected = currentStyles.includes(style);
    
    let newStyles: TripStyle[];
    if (isSelected) {
      newStyles = currentStyles.filter(s => s !== style);
    } else if (currentStyles.length < 4) {
      // Allow up to 4 styles
      newStyles = [...currentStyles, style];
    } else {
      // Replace the first one if already at max (4)
      newStyles = [...currentStyles.slice(1), style];
    }
    
    return {
      quickTripData: { ...state.quickTripData, tripStyles: newStyles }
    };
  }),
  
  setTravelerCount: (travelerCount) => set((state) => ({
    quickTripData: { ...state.quickTripData, travelerCount }
  })),
  
  // AI Generation
  startGeneration: () => set({ 
    isGenerating: true, 
    generationProgress: 0,
    generationMessage: 'Starting...'
  }),
  
  updateGenerationProgress: (progress, message) => set({ 
    generationProgress: progress,
    generationMessage: message
  }),
  
  setAIContent: (aiContent) => set({ 
    aiContent,
    isGenerating: false,
    generationProgress: 100
  }),
  
  // Plan Management
  saveDraft: async () => {
    const { quickTripData, aiContent } = get();
    
    const plan: TripPlan = {
      id: `plan_${Date.now()}`,
      userId: 'current_user', // TODO: Get from auth
      type: 'quick',
      status: 'draft',
      name: `Trip to ${quickTripData.destination?.name || 'Unknown'}`,
      formData: quickTripData,
      aiContent,
      bookings: {
        flightIds: [],
        hotelIds: [],
        carIds: [],
        experienceIds: [],
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    set({ currentPlan: plan });
    return plan;
  },
  
  confirmPlan: async () => {
    const { currentPlan, quickTripData, aiContent } = get();
    
    const plan: TripPlan = currentPlan || {
      id: `plan_${Date.now()}`,
      userId: 'current_user',
      type: 'quick',
      status: 'confirmed',
      name: `Trip to ${quickTripData.destination?.name || 'Unknown'}`,
      formData: quickTripData,
      aiContent,
      bookings: {
        flightIds: [],
        hotelIds: [],
        carIds: [],
        experienceIds: [],
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      confirmedAt: new Date(),
    };
    
    plan.status = 'confirmed';
    plan.confirmedAt = new Date();
    
    set({ currentPlan: plan });
    return plan;
  },
  
  reset: () => set({
    currentPlan: null,
    quickTripData: initialQuickTripData,
    currentStepIndex: 0,
    isGenerating: false,
    generationProgress: 0,
    generationMessage: '',
    aiContent: null,
    hasAppliedPreferences: false,
  }),
  
  // Apply saved preferences from user profile
  applyPreferences: (preferences) => {
    set((state) => {
      const newData = { ...state.quickTripData };
      
      if (preferences.companionType !== undefined) {
        newData.companionType = preferences.companionType;
      }
      
      if (preferences.tripStyles && preferences.tripStyles.length > 0) {
        newData.tripStyles = preferences.tripStyles.slice(0, 4) as TripStyle[];
      }
      
      if (preferences.travelers) {
        newData.travelerCount = preferences.travelers;
      }
      
      return {
        quickTripData: newData,
        hasAppliedPreferences: true,
      };
    });
  },
  
  setHasAppliedPreferences: (value) => set({ hasAppliedPreferences: value }),
  
  // Validation
  isDestinationValid: () => {
    const { quickTripData } = get();
    return quickTripData.destination !== null;
  },
  
  isDatesValid: () => {
    const { quickTripData } = get();
    return quickTripData.startDate !== null && quickTripData.endDate !== null;
  },
  
  isStyleValid: () => {
    const { quickTripData } = get();
    return (
      quickTripData.companionType !== null && 
      quickTripData.tripStyles.length > 0
    );
  },
  
  isReadyToGenerate: () => {
    const state = get();
    return (
      state.isDestinationValid() && 
      state.isDatesValid() && 
      state.isStyleValid()
    );
  },
}));
