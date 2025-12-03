/**
 * EXPERIENCE TYPES
 * 
 * Types specific to experience/activity booking flow.
 */

import { Location, PriceDisplay, Booking } from './booking.types';

// ============================================
// EXPERIENCE
// ============================================

export interface Experience {
  id: string;
  title: string;
  description: string;
  shortDescription: string;
  images: string[];
  category: ExperienceCategory;
  subcategory?: string;
  duration: number;              // minutes
  location: ExperienceLocation;
  host: ExperienceHost;
  price: PriceDisplay;
  originalPrice?: PriceDisplay;  // For discounts
  rating: number;
  reviewCount: number;
  maxParticipants: number;
  minParticipants?: number;
  includes: string[];
  notIncluded: string[];
  requirements: string[];
  whatToBring: string[];
  accessibility: AccessibilityInfo;
  languages: string[];
  availability: TimeSlot[];
  cancellationPolicy: ExperienceCancellationPolicy;
  instantConfirmation: boolean;
  mobileTicket: boolean;
  featured: boolean;
  bestSeller: boolean;
  tags: string[];
}

export interface ExperienceLocation {
  city: string;
  country: string;
  address?: string;
  meetingPoint: MeetingPoint;
  endPoint?: MeetingPoint;
  coordinates: {
    lat: number;
    lng: number;
  };
}

export interface MeetingPoint {
  name: string;
  address: string;
  instructions: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  landmark?: string;
}

// ============================================
// CATEGORIES
// ============================================

export type ExperienceCategory = 
  | 'tours'
  | 'attractions'
  | 'day_trips'
  | 'food_drink'
  | 'adventure'
  | 'water_activities'
  | 'culture_history'
  | 'nature_wildlife'
  | 'wellness'
  | 'nightlife'
  | 'classes_workshops'
  | 'transportation'
  | 'shows_events';

export const EXPERIENCE_CATEGORY_LABELS: Record<ExperienceCategory, string> = {
  tours: 'Tours & Sightseeing',
  attractions: 'Attractions & Tickets',
  day_trips: 'Day Trips & Excursions',
  food_drink: 'Food & Drink',
  adventure: 'Adventure & Outdoor',
  water_activities: 'Water Activities',
  culture_history: 'Culture & History',
  nature_wildlife: 'Nature & Wildlife',
  wellness: 'Wellness & Spa',
  nightlife: 'Nightlife & Entertainment',
  classes_workshops: 'Classes & Workshops',
  transportation: 'Transportation',
  shows_events: 'Shows & Events',
};

export const EXPERIENCE_CATEGORY_ICONS: Record<ExperienceCategory, string> = {
  tours: 'map',
  attractions: 'ticket',
  day_trips: 'bus',
  food_drink: 'restaurant',
  adventure: 'mountain',
  water_activities: 'water',
  culture_history: 'museum',
  nature_wildlife: 'tree',
  wellness: 'spa',
  nightlife: 'moon',
  classes_workshops: 'school',
  transportation: 'car',
  shows_events: 'theater',
};

// ============================================
// HOST
// ============================================

export interface ExperienceHost {
  id: string;
  name: string;
  avatar: string;
  bio?: string;
  rating: number;
  reviewCount: number;
  responseRate: number;
  responseTime: string;
  languages: string[];
  verified: boolean;
  superHost: boolean;
  memberSince: Date;
  totalExperiences: number;
}

// ============================================
// AVAILABILITY
// ============================================

export interface TimeSlot {
  id: string;
  date: Date;
  startTime: string;
  endTime: string;
  spotsAvailable: number;
  spotsTotal: number;
  price?: PriceDisplay;        // If price varies by time
  specialOffer?: boolean;
}

export interface AvailabilityCalendar {
  experienceId: string;
  month: number;
  year: number;
  availableDates: Date[];
  unavailableDates: Date[];
  timeSlots: { [date: string]: TimeSlot[] };
}

// ============================================
// ACCESSIBILITY
// ============================================

export interface AccessibilityInfo {
  wheelchairAccessible: boolean;
  mobilityAid: boolean;
  visualAid: boolean;
  hearingAid: boolean;
  serviceAnimals: boolean;
  infantFriendly: boolean;
  childFriendly: boolean;
  seniorFriendly: boolean;
  fitnessLevel: 'easy' | 'moderate' | 'challenging' | 'strenuous';
  notes?: string;
}

// ============================================
// REVIEWS
// ============================================

export interface ExperienceReview {
  id: string;
  experienceId: string;
  author: {
    name: string;
    avatar?: string;
    country?: string;
  };
  rating: number;
  title?: string;
  content: string;
  date: Date;
  visitDate: Date;
  groupType: 'solo' | 'couple' | 'family' | 'friends' | 'business';
  images?: string[];
  helpful: number;
  hostResponse?: {
    content: string;
    date: Date;
  };
}

// ============================================
// CANCELLATION
// ============================================

export type ExperienceCancellationPolicy = 
  | 'free_24h'
  | 'free_48h'
  | 'free_7d'
  | 'partial'
  | 'non_refundable';

export const CANCELLATION_POLICY_LABELS: Record<ExperienceCancellationPolicy, string> = {
  free_24h: 'Free cancellation up to 24 hours before',
  free_48h: 'Free cancellation up to 48 hours before',
  free_7d: 'Free cancellation up to 7 days before',
  partial: 'Partial refund available',
  non_refundable: 'Non-refundable',
};

// ============================================
// PARTICIPANTS
// ============================================

export interface ParticipantCount {
  adults: number;
  children: number;
  infants: number;
}

export interface ParticipantPricing {
  adult: number;
  child?: number;
  infant?: number;
  childAgeRange?: { min: number; max: number };
  infantAgeRange?: { min: number; max: number };
  groupDiscount?: {
    minSize: number;
    discount: number;
  };
}

// ============================================
// SEARCH PARAMS
// ============================================

export interface ExperienceSearchParams {
  destination: Location | null;
  date: Date | null;
  dateRange?: { start: Date; end: Date };
  participants: ParticipantCount;
  category?: ExperienceCategory;
  query?: string;
}

export interface ExperienceFilters {
  category: ExperienceCategory[];
  priceRange: { min: number; max: number } | null;
  duration: { min: number; max: number } | null;  // minutes
  rating: number | null;
  languages: string[];
  timeOfDay: ('morning' | 'afternoon' | 'evening' | 'night')[];
  features: string[];
  freeCancellation: boolean;
  instantConfirmation: boolean;
  skipTheLine: boolean;
  privateExperience: boolean;
}

// ============================================
// EXPERIENCE BOOKING
// ============================================

export interface ExperienceBooking extends Booking {
  type: 'experience';
  searchParams: ExperienceSearchParams;
  experience: Experience;
  selectedDate: Date;
  selectedTimeSlot: TimeSlot;
  participants: ParticipantCount;
  specialRequests?: string;
  ticket: ExperienceTicket;
}

export interface ExperienceTicket {
  id: string;
  confirmationNumber: string;
  experienceTitle: string;
  date: Date;
  time: string;
  duration: string;
  participants: {
    adults: number;
    children: number;
    infants: number;
  };
  meetingPoint: MeetingPoint;
  hostName: string;
  hostPhone?: string;
  totalAmount: number;
  currency: string;
  qrCode: string;
  barcode: string;
  importantInfo: string[];
  whatToBring: string[];
}
