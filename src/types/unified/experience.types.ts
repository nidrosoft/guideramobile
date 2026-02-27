/**
 * UNIFIED DATA MODEL - EXPERIENCE TYPES
 * 
 * Complete activity/tour offer representation.
 */

import { ExperienceCategory, FitnessLevel, VoucherType } from './enums';
import { UnifiedPrice, ProviderMeta, Address, Coordinates, ExperienceImage, Rating } from './common.types';

// ============================================
// MAIN EXPERIENCE TYPE
// ============================================

export interface UnifiedExperience {
  // ═══════════════════════════════════════════════════════════════════
  // IDENTIFICATION
  // ═══════════════════════════════════════════════════════════════════
  
  /** Unique identifier */
  id: string;
  
  /** Provider product ID */
  providerProductId: string;
  
  /** Provider info */
  provider: ProviderMeta;
  
  /** Type */
  type: 'experience';
  
  // ═══════════════════════════════════════════════════════════════════
  // BASIC INFO
  // ═══════════════════════════════════════════════════════════════════
  
  /** Activity title */
  title: string;
  
  /** Short description */
  shortDescription: string;
  
  /** Full description */
  description: string;
  
  /** Activity category */
  category: ExperienceCategory;
  
  /** Subcategories/tags */
  tags: string[];
  
  // ═══════════════════════════════════════════════════════════════════
  // LOCATION
  // ═══════════════════════════════════════════════════════════════════
  
  /** Primary location */
  location: ExperienceLocation;
  
  /** Meeting point */
  meetingPoint?: MeetingPoint;
  
  /** Ending point (if different) */
  endingPoint?: MeetingPoint;
  
  // ═══════════════════════════════════════════════════════════════════
  // DURATION & SCHEDULE
  // ═══════════════════════════════════════════════════════════════════
  
  /** Duration */
  duration: {
    value: number;
    unit: 'minutes' | 'hours' | 'days';
    isFlexible: boolean;
  };
  
  /** Available dates/times */
  availability: ExperienceAvailability;
  
  // ═══════════════════════════════════════════════════════════════════
  // PRICING
  // ═══════════════════════════════════════════════════════════════════
  
  /** Starting price (per person) */
  price: UnifiedPrice;
  
  /** Price type */
  priceType: 'per_person' | 'per_group' | 'per_unit';
  
  /** Pricing options by participant type */
  pricingOptions: PricingOption[];
  
  /** Group discount available? */
  groupDiscount?: {
    minSize: number;
    discountPercent: number;
  };
  
  // ═══════════════════════════════════════════════════════════════════
  // MEDIA
  // ═══════════════════════════════════════════════════════════════════
  
  /** Images */
  images: ExperienceImage[];
  
  /** Hero image */
  heroImage: string;
  
  /** Video URL */
  videoUrl?: string;
  
  // ═══════════════════════════════════════════════════════════════════
  // RATINGS & REVIEWS
  // ═══════════════════════════════════════════════════════════════════
  
  /** Rating */
  rating: Rating;
  
  /** Sample reviews */
  sampleReviews?: ExperienceReview[];
  
  // ═══════════════════════════════════════════════════════════════════
  // DETAILS
  // ═══════════════════════════════════════════════════════════════════
  
  /** What's included */
  inclusions: string[];
  
  /** What's not included */
  exclusions: string[];
  
  /** Highlights */
  highlights: string[];
  
  /** What to bring */
  whatToBring?: string[];
  
  /** Itinerary (for tours) */
  itinerary?: ItineraryStop[];
  
  // ═══════════════════════════════════════════════════════════════════
  // REQUIREMENTS
  // ═══════════════════════════════════════════════════════════════════
  
  /** Physical requirements */
  physicalRequirements?: {
    fitnessLevel: FitnessLevel;
    description?: string;
  };
  
  /** Age restrictions */
  ageRestrictions?: {
    minAge?: number;
    maxAge?: number;
    childPolicy?: string;
  };
  
  /** Accessibility */
  accessibility?: {
    wheelchairAccessible: boolean;
    details?: string;
  };
  
  /** Language */
  languages: string[];
  
  // ═══════════════════════════════════════════════════════════════════
  // POLICIES
  // ═══════════════════════════════════════════════════════════════════
  
  /** Cancellation policy */
  cancellationPolicy: ExperienceCancellationPolicy;
  
  /** Booking requirements */
  bookingRequirements: {
    advanceBookingRequired: boolean;
    minAdvanceHours?: number;
    instantConfirmation: boolean;
    voucherType: VoucherType;
  };
  
  // ═══════════════════════════════════════════════════════════════════
  // METADATA
  // ═══════════════════════════════════════════════════════════════════
  
  /** Is this a bestseller? */
  isBestseller: boolean;
  
  /** Is this a special offer? */
  isSpecialOffer: boolean;
  
  /** Special offer details */
  specialOffer?: {
    name: string;
    discountPercent: number;
    validUntil: string;
  };
  
  /** Skip the line? */
  skipTheLine: boolean;
  
  /** Free cancellation? */
  freeCancellation: boolean;
  
  /** Retrieved at */
  retrievedAt: string;
  
  /** Deep link */
  deepLink?: string;
}

// ============================================
// EXPERIENCE LOCATION
// ============================================

export interface ExperienceLocation {
  /** City */
  city: string;
  
  /** Country */
  country: string;
  
  /** Country code */
  countryCode: string;
  
  /** Region/area */
  region?: string;
  
  /** Coordinates */
  coordinates?: Coordinates;
  
  /** Address */
  address?: Address;
}

// ============================================
// MEETING POINT
// ============================================

export interface MeetingPoint {
  /** Location name */
  name: string;
  
  /** Full address */
  address?: Address;
  
  /** Coordinates */
  coordinates?: Coordinates;
  
  /** Instructions */
  instructions?: string;
  
  /** Image/map */
  imageUrl?: string;
}

// ============================================
// EXPERIENCE AVAILABILITY
// ============================================

export interface ExperienceAvailability {
  /** Available dates (next 30 days summary) */
  availableDates: string[];
  
  /** Time slots for a specific date (populated on date selection) */
  timeSlots?: TimeSlot[];
  
  /** Seasonal availability */
  seasonalAvailability?: {
    available: boolean;
    months?: number[];
    note?: string;
  };
  
  /** Next available date */
  nextAvailable?: string;
}

export interface TimeSlot {
  /** Start time */
  startTime: string;
  
  /** End time */
  endTime?: string;
  
  /** Available spots */
  availableSpots?: number;
  
  /** Price for this slot (if different) */
  price?: UnifiedPrice;
}

// ============================================
// PRICING OPTION
// ============================================

export interface PricingOption {
  /** Participant type */
  type: 'adult' | 'child' | 'infant' | 'senior' | 'student' | 'group';
  
  /** Label */
  label: string;
  
  /** Age range */
  ageRange?: {
    min: number;
    max: number;
  };
  
  /** Price */
  price: UnifiedPrice;
  
  /** Is required? (e.g., must have at least 1 adult) */
  required?: boolean;
  
  /** Min quantity */
  minQuantity?: number;
  
  /** Max quantity */
  maxQuantity?: number;
}

// ============================================
// ITINERARY STOP
// ============================================

export interface ItineraryStop {
  /** Order in itinerary */
  order: number;
  
  /** Stop name */
  name: string;
  
  /** Duration at stop */
  durationMinutes?: number;
  
  /** Description */
  description?: string;
  
  /** Admission included? */
  admissionIncluded?: boolean;
}

// ============================================
// EXPERIENCE REVIEW
// ============================================

export interface ExperienceReview {
  /** Reviewer name */
  reviewerName: string;
  
  /** Rating */
  rating: number;
  
  /** Review text */
  text: string;
  
  /** Review date */
  date: string;
  
  /** Helpful count */
  helpfulCount?: number;
}

// ============================================
// EXPERIENCE CANCELLATION POLICY
// ============================================

export interface ExperienceCancellationPolicy {
  /** Free cancellation available? */
  freeCancellation: boolean;
  
  /** Free cancellation deadline (hours before) */
  freeCancellationHours?: number;
  
  /** Policy description */
  description: string;
  
  /** Refund rules */
  refundRules?: {
    hoursBeforeStart: number;
    refundPercent: number;
  }[];
}
