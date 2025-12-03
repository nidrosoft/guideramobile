/**
 * TRAVEL BUDDY TYPES
 * 
 * Type definitions for the travel buddy matching feature.
 */

export type TravelStyle = 'backpacker' | 'budget' | 'mid_range' | 'luxury' | 'adventure' | 'relaxation';
export type ConnectionStatus = 'none' | 'pending_sent' | 'pending_received' | 'connected' | 'declined' | 'blocked';
export type VerificationLevel = 'none' | 'email' | 'phone' | 'id' | 'full';

export interface TravelPreferences {
  styles: TravelStyle[];
  interests: string[];
  languages: string[];
  ageRange?: {
    min: number;
    max: number;
  };
  preferredGroupSize: 'solo' | 'duo' | 'small_group' | 'large_group' | 'any';
  smokingOk: boolean;
  drinkingOk: boolean;
  petsOk: boolean;
}

export interface UpcomingTrip {
  id: string;
  destination: {
    city: string;
    country: string;
    countryCode: string;
  };
  startDate: Date;
  endDate: Date;
  isFlexible: boolean;
  lookingForBuddy: boolean;
  notes?: string;
}

export interface TravelBuddyProfile {
  userId: string;
  bio: string;
  travelPreferences: TravelPreferences;
  upcomingTrips: UpcomingTrip[];
  countriesVisited: number;
  tripsCompleted: number;
  verificationLevel: VerificationLevel;
  rating: number;
  reviewCount: number;
  responseRate: number;
  responseTime: string; // e.g., "within a day"
  lastActive: Date;
  createdAt: Date;
}

export interface BuddyMatch {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  avatar: string;
  bio: string;
  matchScore: number; // 0-100
  matchReasons: string[];
  travelStyles: TravelStyle[];
  languages: string[];
  verificationLevel: VerificationLevel;
  countriesVisited: number;
  rating: number;
  connectionStatus: ConnectionStatus;
  sharedTrip?: {
    destination: string;
    dates: string;
  };
}

export interface BuddyConnection {
  id: string;
  requesterId: string;
  receiverId: string;
  status: ConnectionStatus;
  message?: string;
  sharedTripId?: string;
  createdAt: Date;
  respondedAt?: Date;
}

// ============================================
// BUDDY ACTIONS
// ============================================

export interface SendConnectionRequest {
  receiverId: string;
  message?: string;
  sharedTripId?: string;
}

export interface RespondToConnection {
  connectionId: string;
  accept: boolean;
  message?: string;
}

export interface BuddySearchParams {
  destination?: string;
  startDate?: Date;
  endDate?: Date;
  travelStyles?: TravelStyle[];
  languages?: string[];
  verificationLevel?: VerificationLevel;
  limit?: number;
  offset?: number;
}

// ============================================
// BUDDY REVIEWS (Future)
// ============================================

export interface BuddyReview {
  id: string;
  reviewerId: string;
  revieweeId: string;
  tripId?: string;
  rating: number;
  content: string;
  traveledTogether: boolean;
  wouldTravelAgain: boolean;
  createdAt: Date;
}
