import { create } from 'zustand';

interface OnboardingData {
  firstName: string;
  lastName: string;
  dateOfBirth: Date | null;
  gender: string;
  ethnicity: string;
  country: string;
  language: string;
  languages: string[];
  emergencyContactPhone: string;
  travelStyle: string;
  travelStyles: string[];
  dietaryRestrictions: string;
  dietaryRestrictionsList: string[];
  accessibilityNeeds: string;
  accessibilityNeedsList: string[];
}

interface OnboardingStore {
  data: OnboardingData;
  currentStep: number;
  setFirstName: (name: string) => void;
  setLastName: (name: string) => void;
  setDateOfBirth: (date: Date) => void;
  setGender: (gender: string) => void;
  setEthnicity: (ethnicity: string) => void;
  setCountry: (country: string) => void;
  setLanguage: (language: string) => void;
  setEmergencyContactPhone: (phone: string) => void;
  setTravelStyle: (style: string) => void;
  setDietaryRestrictions: (restrictions: string) => void;
  setAccessibilityNeeds: (needs: string) => void;
  setLanguages: (languages: string[]) => void;
  setTravelStyles: (styles: string[]) => void;
  setDietaryRestrictionsList: (restrictions: string[]) => void;
  setAccessibilityNeedsList: (needs: string[]) => void;
  setCurrentStep: (step: number) => void;
  reset: () => void;
  getProfileUpdates: () => Record<string, any>;
}

const initialData: OnboardingData = {
  firstName: '',
  lastName: '',
  dateOfBirth: null,
  gender: '',
  ethnicity: '',
  country: '',
  language: '',
  emergencyContactPhone: '',
  travelStyle: '',
  travelStyles: [],
  dietaryRestrictions: '',
  dietaryRestrictionsList: [],
  accessibilityNeeds: '',
  accessibilityNeedsList: [],
  languages: [],
};

export const useOnboardingStore = create<OnboardingStore>((set, get) => ({
  data: { ...initialData },
  currentStep: 0,

  setFirstName: (name) => set((state) => ({ 
    data: { ...state.data, firstName: name } 
  })),

  setLastName: (name) => set((state) => ({ 
    data: { ...state.data, lastName: name } 
  })),

  setDateOfBirth: (date) => set((state) => ({ 
    data: { ...state.data, dateOfBirth: date } 
  })),

  setGender: (gender) => set((state) => ({ 
    data: { ...state.data, gender } 
  })),

  setEthnicity: (ethnicity) => set((state) => ({ 
    data: { ...state.data, ethnicity } 
  })),

  setCountry: (country) => set((state) => ({ 
    data: { ...state.data, country } 
  })),

  setLanguage: (language) => set((state) => ({ 
    data: { ...state.data, language } 
  })),

  setEmergencyContactPhone: (phone) => set((state) => ({ 
    data: { ...state.data, emergencyContactPhone: phone } 
  })),

  setTravelStyle: (style) => set((state) => ({ 
    data: { ...state.data, travelStyle: style } 
  })),

  setDietaryRestrictions: (restrictions) => set((state) => ({ 
    data: { ...state.data, dietaryRestrictions: restrictions } 
  })),

  setAccessibilityNeeds: (needs) => set((state) => ({ 
    data: { ...state.data, accessibilityNeeds: needs } 
  })),

  setLanguages: (languages) => set((state) => ({ 
    data: { ...state.data, languages } 
  })),

  setTravelStyles: (styles) => set((state) => ({ 
    data: { ...state.data, travelStyles: styles } 
  })),

  setDietaryRestrictionsList: (restrictions) => set((state) => ({ 
    data: { ...state.data, dietaryRestrictionsList: restrictions } 
  })),

  setAccessibilityNeedsList: (needs) => set((state) => ({ 
    data: { ...state.data, accessibilityNeedsList: needs } 
  })),

  setCurrentStep: (step) => set({ currentStep: step }),

  reset: () => set({ data: { ...initialData }, currentStep: 0 }),

  getProfileUpdates: () => {
    const { data } = get();
    return {
      first_name: data.firstName,
      last_name: data.lastName,
      date_of_birth: data.dateOfBirth?.toISOString().split('T')[0],
      gender: data.gender,
      ethnicity: data.ethnicity,
      country: data.country,
      preferences: {
        language: data.language || 'en',
        currency: 'USD',
        distance_unit: 'km',
        temperature_unit: 'celsius',
        notifications: {
          push: true,
          email: true,
          sms: false,
          trip_reminders: true,
          booking_updates: true,
          safety_alerts: true,
          deal_alerts: true,
        },
        privacy: {
          profile_visibility: 'private',
          show_trips: false,
          allow_messages: 'friends',
        },
      },
      // DEPRECATED: Kept for backward compat (AccountScreen reads this).
      // Primary source of truth is the travel_preferences table (written in setup.tsx).
      travel_preferences: {
        styles: data.travelStyles.length > 0 ? data.travelStyles : (data.travelStyle ? [data.travelStyle] : []),
        interests: [],
        dietary_restrictions: data.dietaryRestrictionsList.length > 0 ? data.dietaryRestrictionsList : (data.dietaryRestrictions ? [data.dietaryRestrictions] : []),
        accessibility_needs: data.accessibilityNeedsList.length > 0 ? data.accessibilityNeedsList : (data.accessibilityNeeds ? [data.accessibilityNeeds] : []),
      },
      languages_spoken: data.languages.length > 0 ? data.languages : (data.language ? [data.language] : ['English']),
      emergency_contact: data.emergencyContactPhone ? {
        phone: data.emergencyContactPhone,
      } : null,
    };
  },
}));
