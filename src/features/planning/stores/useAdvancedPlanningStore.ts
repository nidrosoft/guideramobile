/**
 * ADVANCED PLANNING STORE
 * Zustand store for advanced trip planning state management
 */

import { create } from 'zustand';
import { Location } from '@/features/booking/types/booking.types';
import {
  AdvancedTripFormData,
  AdvancedTripType,
  DateFlexibility,
  SpendingStyle,
  BudgetPriority,
  TripPace,
  TimePreference,
  AccommodationType,
  LocationPriority,
  TransportMode,
  LocalTransport,
  FlightClass,
  FlightStops,
  FlightTimePreference,
  InterestCategory,
  DestinationWithNights,
  TravelerDetails,
  SpecialRequirements,
  TripPlan,
  AIGeneratedContent,
} from '../types/planning.types';
import { DEFAULT_ADVANCED_TRIP_DATA, ADVANCED_TRIP_STEPS } from '../config/planning.config';

interface AdvancedPlanningState {
  // Current Plan
  currentPlan: TripPlan | null;
  
  // Advanced Trip Form Data
  advancedTripData: AdvancedTripFormData;
  
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
  
  // Actions - Step 1: Trip Type
  setTripType: (type: AdvancedTripType) => void;
  
  // Actions - Step 2: Destinations
  setOrigin: (location: Location | null) => void;
  addDestination: () => void;
  removeDestination: (index: number) => void;
  updateDestination: (index: number, location: Location | null) => void;
  updateDestinationNights: (index: number, nights: number) => void;
  
  // Actions - Step 3: Dates
  setDepartureDate: (date: Date | null) => void;
  setReturnDate: (date: Date | null) => void;
  setFlexibility: (flexibility: DateFlexibility) => void;
  addBlackoutDate: (date: Date) => void;
  removeBlackoutDate: (date: Date) => void;
  
  // Actions - Step 4: Travelers
  setAdults: (count: number) => void;
  addChild: (age: number) => void;
  removeChild: (index: number) => void;
  updateChildAge: (index: number, age: number) => void;
  setInfants: (count: number) => void;
  setWheelchairAccessible: (value: boolean) => void;
  setTravelingWithPet: (value: boolean) => void;
  toggleDietaryRestriction: (restriction: string) => void;
  
  // Actions - Step 5: Budget
  setBudgetAmount: (amount: number) => void;
  setBudgetCurrency: (currency: string) => void;
  setSpendingStyle: (style: SpendingStyle) => void;
  setBudgetPriority: (priority: BudgetPriority) => void;
  
  // Actions - Step 6: Interests
  toggleInterest: (interest: InterestCategory) => void;
  setPace: (pace: TripPace) => void;
  setTimePreference: (preference: TimePreference) => void;
  
  // Actions - Step 7: Accommodation
  setAccommodationType: (type: AccommodationType) => void;
  toggleStarRating: (rating: number) => void;
  setLocationPriority: (priority: LocationPriority) => void;
  toggleAmenity: (amenity: string) => void;
  setSkipAccommodation: (skip: boolean) => void;
  
  // Actions - Step 8: Transportation
  setTransportMode: (mode: TransportMode) => void;
  setFlightClass: (flightClass: FlightClass) => void;
  setFlightStops: (stops: FlightStops) => void;
  setFlightTimePreference: (preference: FlightTimePreference) => void;
  setLocalTransport: (transport: LocalTransport) => void;
  setSkipTransportation: (skip: boolean) => void;
  
  // Actions - Step 9: Bookings
  addLinkedBooking: (type: 'flight' | 'hotel' | 'car' | 'experience', id: string) => void;
  removeLinkedBooking: (type: 'flight' | 'hotel' | 'car' | 'experience', id: string) => void;
  
  // Actions - AI Generation
  startGeneration: () => void;
  updateGenerationProgress: (progress: number, message: string) => void;
  setAIContent: (content: AIGeneratedContent) => void;
  
  // Actions - Plan Management
  saveDraft: () => Promise<TripPlan>;
  confirmPlan: () => Promise<TripPlan>;
  reset: () => void;
  
  // Validation
  isTripTypeValid: () => boolean;
  isDestinationsValid: () => boolean;
  isDatesValid: () => boolean;
  isTravelersValid: () => boolean;
  isBudgetValid: () => boolean;
  isInterestsValid: () => boolean;
  isAccommodationValid: () => boolean;
  isTransportationValid: () => boolean;
  isReadyToGenerate: () => boolean;
  
  // Helpers
  getTotalNights: () => number;
  getTotalTravelers: () => number;
}

const initialAdvancedTripData: AdvancedTripFormData = DEFAULT_ADVANCED_TRIP_DATA as AdvancedTripFormData;

export const useAdvancedPlanningStore = create<AdvancedPlanningState>((set, get) => ({
  // Initial State
  currentPlan: null,
  advancedTripData: initialAdvancedTripData,
  currentStepIndex: 0,
  isGenerating: false,
  generationProgress: 0,
  generationMessage: '',
  aiContent: null,
  
  // Navigation
  setCurrentStep: (index) => set({ currentStepIndex: index }),
  
  nextStep: () => set((state) => ({ 
    currentStepIndex: Math.min(state.currentStepIndex + 1, ADVANCED_TRIP_STEPS.length - 1)
  })),
  
  prevStep: () => set((state) => ({ 
    currentStepIndex: Math.max(0, state.currentStepIndex - 1) 
  })),
  
  // Step 1: Trip Type
  setTripType: (tripType) => set((state) => ({
    advancedTripData: { ...state.advancedTripData, tripType }
  })),
  
  // Step 2: Destinations
  setOrigin: (origin) => set((state) => ({
    advancedTripData: { ...state.advancedTripData, origin }
  })),
  
  addDestination: () => set((state) => ({
    advancedTripData: {
      ...state.advancedTripData,
      destinations: [...state.advancedTripData.destinations, { location: null, nights: 3 }]
    }
  })),
  
  removeDestination: (index) => set((state) => ({
    advancedTripData: {
      ...state.advancedTripData,
      destinations: state.advancedTripData.destinations.filter((_, i) => i !== index)
    }
  })),
  
  updateDestination: (index, location) => set((state) => ({
    advancedTripData: {
      ...state.advancedTripData,
      destinations: state.advancedTripData.destinations.map((d, i) => 
        i === index ? { ...d, location } : d
      )
    }
  })),
  
  updateDestinationNights: (index, nights) => set((state) => ({
    advancedTripData: {
      ...state.advancedTripData,
      destinations: state.advancedTripData.destinations.map((d, i) => 
        i === index ? { ...d, nights } : d
      )
    }
  })),
  
  // Step 3: Dates
  setDepartureDate: (departureDate) => set((state) => ({
    advancedTripData: { ...state.advancedTripData, departureDate }
  })),
  
  setReturnDate: (returnDate) => set((state) => ({
    advancedTripData: { ...state.advancedTripData, returnDate }
  })),
  
  setFlexibility: (flexibility) => set((state) => ({
    advancedTripData: { ...state.advancedTripData, flexibility }
  })),
  
  addBlackoutDate: (date) => set((state) => ({
    advancedTripData: {
      ...state.advancedTripData,
      blackoutDates: [...state.advancedTripData.blackoutDates, date]
    }
  })),
  
  removeBlackoutDate: (date) => set((state) => ({
    advancedTripData: {
      ...state.advancedTripData,
      blackoutDates: state.advancedTripData.blackoutDates.filter(
        d => d.getTime() !== date.getTime()
      )
    }
  })),
  
  // Step 4: Travelers
  setAdults: (adults) => set((state) => ({
    advancedTripData: {
      ...state.advancedTripData,
      travelers: { ...state.advancedTripData.travelers, adults }
    }
  })),
  
  addChild: (age) => set((state) => ({
    advancedTripData: {
      ...state.advancedTripData,
      travelers: {
        ...state.advancedTripData.travelers,
        children: [...state.advancedTripData.travelers.children, age]
      }
    }
  })),
  
  removeChild: (index) => set((state) => ({
    advancedTripData: {
      ...state.advancedTripData,
      travelers: {
        ...state.advancedTripData.travelers,
        children: state.advancedTripData.travelers.children.filter((_, i) => i !== index)
      }
    }
  })),
  
  updateChildAge: (index, age) => set((state) => ({
    advancedTripData: {
      ...state.advancedTripData,
      travelers: {
        ...state.advancedTripData.travelers,
        children: state.advancedTripData.travelers.children.map((a, i) => i === index ? age : a)
      }
    }
  })),
  
  setInfants: (infants) => set((state) => ({
    advancedTripData: {
      ...state.advancedTripData,
      travelers: { ...state.advancedTripData.travelers, infants }
    }
  })),
  
  setWheelchairAccessible: (wheelchairAccessible) => set((state) => ({
    advancedTripData: {
      ...state.advancedTripData,
      specialRequirements: { ...state.advancedTripData.specialRequirements, wheelchairAccessible }
    }
  })),
  
  setTravelingWithPet: (travelingWithPet) => set((state) => ({
    advancedTripData: {
      ...state.advancedTripData,
      specialRequirements: { ...state.advancedTripData.specialRequirements, travelingWithPet }
    }
  })),
  
  toggleDietaryRestriction: (restriction) => set((state) => {
    const current = state.advancedTripData.specialRequirements.dietaryRestrictions;
    const isSelected = current.includes(restriction);
    return {
      advancedTripData: {
        ...state.advancedTripData,
        specialRequirements: {
          ...state.advancedTripData.specialRequirements,
          dietaryRestrictions: isSelected
            ? current.filter(r => r !== restriction)
            : [...current, restriction]
        }
      }
    };
  }),
  
  // Step 5: Budget
  setBudgetAmount: (amount) => set((state) => ({
    advancedTripData: {
      ...state.advancedTripData,
      budget: { ...state.advancedTripData.budget, amount }
    }
  })),
  
  setBudgetCurrency: (currency) => set((state) => ({
    advancedTripData: {
      ...state.advancedTripData,
      budget: { ...state.advancedTripData.budget, currency }
    }
  })),
  
  setSpendingStyle: (spendingStyle) => set((state) => ({
    advancedTripData: { ...state.advancedTripData, spendingStyle }
  })),
  
  setBudgetPriority: (budgetPriority) => set((state) => ({
    advancedTripData: { ...state.advancedTripData, budgetPriority }
  })),
  
  // Step 6: Interests
  toggleInterest: (interest) => set((state) => {
    const current = state.advancedTripData.interests;
    const isSelected = current.includes(interest);
    let newInterests: InterestCategory[];
    
    if (isSelected) {
      newInterests = current.filter(i => i !== interest);
    } else if (current.length < 5) {
      newInterests = [...current, interest];
    } else {
      // Replace oldest if at max
      newInterests = [...current.slice(1), interest];
    }
    
    return {
      advancedTripData: { ...state.advancedTripData, interests: newInterests }
    };
  }),
  
  setPace: (pace) => set((state) => ({
    advancedTripData: { ...state.advancedTripData, pace }
  })),
  
  setTimePreference: (timePreference) => set((state) => ({
    advancedTripData: { ...state.advancedTripData, timePreference }
  })),
  
  // Step 7: Accommodation
  setAccommodationType: (type) => set((state) => ({
    advancedTripData: {
      ...state.advancedTripData,
      accommodation: { ...state.advancedTripData.accommodation, type }
    }
  })),
  
  toggleStarRating: (rating) => set((state) => {
    const current = state.advancedTripData.accommodation.starRating;
    const isSelected = current.includes(rating);
    return {
      advancedTripData: {
        ...state.advancedTripData,
        accommodation: {
          ...state.advancedTripData.accommodation,
          starRating: isSelected
            ? current.filter(r => r !== rating)
            : [...current, rating].sort()
        }
      }
    };
  }),
  
  setLocationPriority: (locationPriority) => set((state) => ({
    advancedTripData: {
      ...state.advancedTripData,
      accommodation: { ...state.advancedTripData.accommodation, locationPriority }
    }
  })),
  
  toggleAmenity: (amenity) => set((state) => {
    const current = state.advancedTripData.accommodation.amenities;
    const isSelected = current.includes(amenity);
    return {
      advancedTripData: {
        ...state.advancedTripData,
        accommodation: {
          ...state.advancedTripData.accommodation,
          amenities: isSelected
            ? current.filter(a => a !== amenity)
            : [...current, amenity]
        }
      }
    };
  }),
  
  setSkipAccommodation: (skipAccommodation) => set((state) => ({
    advancedTripData: { ...state.advancedTripData, skipAccommodation }
  })),
  
  // Step 8: Transportation
  setTransportMode: (gettingThere) => set((state) => ({
    advancedTripData: {
      ...state.advancedTripData,
      transportation: { ...state.advancedTripData.transportation, gettingThere }
    }
  })),
  
  setFlightClass: (flightClass) => set((state) => ({
    advancedTripData: {
      ...state.advancedTripData,
      transportation: {
        ...state.advancedTripData.transportation,
        flightPreferences: {
          ...state.advancedTripData.transportation.flightPreferences!,
          class: flightClass
        }
      }
    }
  })),
  
  setFlightStops: (stops) => set((state) => ({
    advancedTripData: {
      ...state.advancedTripData,
      transportation: {
        ...state.advancedTripData.transportation,
        flightPreferences: {
          ...state.advancedTripData.transportation.flightPreferences!,
          stops
        }
      }
    }
  })),
  
  setFlightTimePreference: (timePreference) => set((state) => ({
    advancedTripData: {
      ...state.advancedTripData,
      transportation: {
        ...state.advancedTripData.transportation,
        flightPreferences: {
          ...state.advancedTripData.transportation.flightPreferences!,
          timePreference
        }
      }
    }
  })),
  
  setLocalTransport: (gettingAround) => set((state) => ({
    advancedTripData: {
      ...state.advancedTripData,
      transportation: { ...state.advancedTripData.transportation, gettingAround }
    }
  })),
  
  setSkipTransportation: (skipTransportation) => set((state) => ({
    advancedTripData: { ...state.advancedTripData, skipTransportation }
  })),
  
  // Step 9: Bookings
  addLinkedBooking: (type, id) => set((state) => {
    const key = `${type}Ids` as keyof typeof state.advancedTripData.linkedBookings;
    return {
      advancedTripData: {
        ...state.advancedTripData,
        linkedBookings: {
          ...state.advancedTripData.linkedBookings,
          [key]: [...state.advancedTripData.linkedBookings[key], id]
        }
      }
    };
  }),
  
  removeLinkedBooking: (type, id) => set((state) => {
    const key = `${type}Ids` as keyof typeof state.advancedTripData.linkedBookings;
    return {
      advancedTripData: {
        ...state.advancedTripData,
        linkedBookings: {
          ...state.advancedTripData.linkedBookings,
          [key]: state.advancedTripData.linkedBookings[key].filter(i => i !== id)
        }
      }
    };
  }),
  
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
    const { advancedTripData, aiContent } = get();
    const firstDestination = advancedTripData.destinations[0]?.location;
    
    const plan: TripPlan = {
      id: `plan_${Date.now()}`,
      userId: 'current_user',
      type: 'advanced',
      status: 'draft',
      name: `Trip to ${firstDestination?.name || 'Unknown'}`,
      formData: advancedTripData as any, // Will need type adjustment
      aiContent,
      bookings: advancedTripData.linkedBookings,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    set({ currentPlan: plan });
    return plan;
  },
  
  confirmPlan: async () => {
    const { currentPlan, advancedTripData, aiContent } = get();
    const firstDestination = advancedTripData.destinations[0]?.location;
    
    const plan: TripPlan = currentPlan || {
      id: `plan_${Date.now()}`,
      userId: 'current_user',
      type: 'advanced',
      status: 'confirmed',
      name: `Trip to ${firstDestination?.name || 'Unknown'}`,
      formData: advancedTripData as any,
      aiContent,
      bookings: advancedTripData.linkedBookings,
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
    advancedTripData: initialAdvancedTripData,
    currentStepIndex: 0,
    isGenerating: false,
    generationProgress: 0,
    generationMessage: '',
    aiContent: null,
  }),
  
  // Validation
  isTripTypeValid: () => {
    const { advancedTripData } = get();
    return !!advancedTripData.tripType;
  },
  
  isDestinationsValid: () => {
    const { advancedTripData } = get();
    const hasOrigin = advancedTripData.tripType !== 'oneway' ? !!advancedTripData.origin : true;
    const hasDestination = advancedTripData.destinations.some(d => d.location !== null);
    return hasOrigin && hasDestination;
  },
  
  isDatesValid: () => {
    const { advancedTripData } = get();
    return advancedTripData.departureDate !== null && 
           (advancedTripData.tripType === 'oneway' || advancedTripData.returnDate !== null);
  },
  
  isTravelersValid: () => {
    const { advancedTripData } = get();
    return advancedTripData.travelers.adults >= 1;
  },
  
  isBudgetValid: () => {
    const { advancedTripData } = get();
    return advancedTripData.budget.amount > 0;
  },
  
  isInterestsValid: () => {
    const { advancedTripData } = get();
    return advancedTripData.interests.length >= 3;
  },
  
  isAccommodationValid: () => {
    const { advancedTripData } = get();
    return advancedTripData.skipAccommodation || !!advancedTripData.accommodation.type;
  },
  
  isTransportationValid: () => {
    const { advancedTripData } = get();
    return advancedTripData.skipTransportation || !!advancedTripData.transportation.gettingThere;
  },
  
  isReadyToGenerate: () => {
    const state = get();
    return (
      state.isTripTypeValid() &&
      state.isDestinationsValid() &&
      state.isDatesValid() &&
      state.isTravelersValid() &&
      state.isBudgetValid() &&
      state.isInterestsValid()
    );
  },
  
  // Helpers
  getTotalNights: () => {
    const { advancedTripData } = get();
    return advancedTripData.destinations.reduce((sum, d) => sum + d.nights, 0);
  },
  
  getTotalTravelers: () => {
    const { advancedTripData } = get();
    const { adults, children, infants } = advancedTripData.travelers;
    return adults + children.length + infants;
  },
}));
