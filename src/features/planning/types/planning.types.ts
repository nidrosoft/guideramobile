/**
 * PLANNING TYPES
 * Core type definitions for trip planning feature
 */

import { Location } from '@/features/booking/types/booking.types';

// Trip Styles
export type TripStyle = 
  | 'relaxation'
  | 'culture'
  | 'foodie'
  | 'adventure'
  | 'shopping'
  | 'family'
  | 'romantic'
  | 'business'
  | 'nightlife'
  | 'nature'
  | 'wellness';

// Companion Types
export type CompanionType = 'solo' | 'couple' | 'family' | 'friends' | 'group';

// Duration Presets
export type DurationPreset = 'weekend' | '1week' | '2weeks' | 'custom';

// Plan Status
export type PlanStatus = 'draft' | 'planned' | 'confirmed' | 'completed' | 'cancelled';

// Plan Type
export type PlanType = 'quick' | 'advanced' | 'imported';

// Trip Style Option
export interface TripStyleOption {
  id: TripStyle;
  label: string;
  emoji: string;
  description: string;
}

// Companion Option
export interface CompanionOption {
  id: CompanionType;
  label: string;
  emoji: string;
  description: string;
}

// Quick Trip Form Data
export interface QuickTripFormData {
  // Step 1: Destination
  destination: Location | null;
  
  // Step 2: Dates
  startDate: Date | null;
  endDate: Date | null;
  durationPreset: DurationPreset;
  isFlexible: boolean;
  
  // Step 3: Travelers & Style
  companionType: CompanionType | null;
  tripStyles: TripStyle[];
  travelerCount: {
    adults: number;
    children: number;
    infants: number;
  };
}

// AI Generated Content
export interface AIGeneratedContent {
  // Itinerary
  itinerary: DayPlan[];
  
  // Safety & Tips
  safetyTips: SafetyTip[];
  packingList: PackingItem[];
  culturalTips: CulturalTip[];
  localPhrases: LocalPhrase[];
  
  // Practical Info
  weatherForecast: WeatherDay[];
  budgetEstimate: BudgetEstimate;
  emergencyContacts: EmergencyContact[];
  
  // Metadata
  generatedAt: Date;
  confidence: number;
}

// Day Plan
export interface DayPlan {
  dayNumber: number;
  date: Date;
  title: string;
  activities: PlannedActivity[];
  meals: MealSuggestion[];
  notes: string[];
  weather?: WeatherInfo;
  estimatedCost: number;
}

// Activity Type
export type ActivityType = 
  | 'attraction' 
  | 'activity' 
  | 'tour' 
  | 'transport' 
  | 'rest'
  | 'flight'
  | 'hotel'
  | 'restaurant'
  | 'car';

// Planned Activity
export interface PlannedActivity {
  id: string;
  name: string;
  type: ActivityType;
  startTime: string;
  endTime: string;
  duration: number; // minutes
  location: {
    name: string;
    address?: string;
    coordinates?: { lat: number; lng: number };
  };
  description?: string;
  cost?: {
    amount: number;
    currency: string;
  };
  tips?: string[];
  imageUrl?: string;
  bookingRequired: boolean;
  bookingUrl?: string;
}

// Meal Suggestion
export interface MealSuggestion {
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  name: string;
  cuisine: string;
  priceRange: '$' | '$$' | '$$$' | '$$$$';
  location?: string;
  recommendation: string;
}

// Safety Tip
export interface SafetyTip {
  category: 'health' | 'security' | 'transport' | 'scam' | 'emergency' | 'general';
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'critical';
}

// Packing Item
export interface PackingItem {
  category: 'clothing' | 'toiletries' | 'electronics' | 'documents' | 'misc';
  item: string;
  quantity: number;
  essential: boolean;
  notes?: string;
}

// Cultural Tip
export interface CulturalTip {
  type: 'do' | 'dont';
  title: string;
  description: string;
  importance: 'low' | 'medium' | 'high';
}

// Local Phrase
export interface LocalPhrase {
  english: string;
  local: string;
  pronunciation: string;
  context: string;
}

// Weather Info
export interface WeatherInfo {
  condition: 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'stormy';
  tempHigh: number;
  tempLow: number;
  humidity: number;
  precipitation: number;
}

export interface WeatherDay extends WeatherInfo {
  date: Date;
}

// Budget Estimate
export interface BudgetEstimate {
  total: {
    min: number;
    max: number;
    currency: string;
  };
  breakdown: {
    accommodation: { min: number; max: number };
    food: { min: number; max: number };
    activities: { min: number; max: number };
    transport: { min: number; max: number };
    misc: { min: number; max: number };
  };
  perDay: number;
  tips: string[];
}

// Emergency Contact
export interface EmergencyContact {
  type: 'police' | 'ambulance' | 'fire' | 'embassy' | 'tourist_police';
  name: string;
  number: string;
  notes?: string;
}

// Trip Plan (Full Model)
export interface TripPlan {
  id: string;
  userId: string;
  type: PlanType;
  status: PlanStatus;
  
  // Basic Info
  name: string;
  description?: string;
  coverImage?: string;
  
  // Form Data
  formData: QuickTripFormData;
  
  // AI Generated
  aiContent: AIGeneratedContent | null;
  
  // Linked Bookings
  bookings: {
    flightIds: string[];
    hotelIds: string[];
    carIds: string[];
    experienceIds: string[];
  };
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  confirmedAt?: Date;
}

// Step Configuration
export interface PlanningStep {
  id: string;
  title: string;
  subtitle?: string;
  optional?: boolean;
}
