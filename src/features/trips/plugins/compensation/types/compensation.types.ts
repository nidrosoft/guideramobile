export enum ClaimStatus {
  POTENTIAL = 'potential',
  ACTIVE = 'active',
  COMPLETED = 'completed',
}

export enum ClaimType {
  FLIGHT_DELAY = 'flight_delay',
  FLIGHT_CANCELLATION = 'flight_cancellation',
  OVERBOOKING = 'overbooking',
  LOST_BAGGAGE = 'lost_baggage',
  DAMAGED_BAGGAGE = 'damaged_baggage',
  HOTEL_ISSUE = 'hotel_issue',
  OTHER = 'other',
}

export interface Claim {
  id: string;
  tripId: string;
  bookingId?: string; // Link to existing booking if applicable
  type: ClaimType;
  status: ClaimStatus;
  
  // Flight/Booking Details
  provider: string; // Airline, hotel name, etc.
  flightNumber?: string;
  bookingReference: string;
  date: Date;
  
  // Claim Details
  estimatedAmount: number;
  currency: string;
  description: string;
  reason: string;
  
  // AI Analysis (future)
  aiConfidence?: number; // 0-100
  policyDetails?: string;
  eligibilityNotes?: string;
  
  // Status Tracking
  submittedDate?: Date;
  completedDate?: Date;
  actualAmount?: number;
  
  // Documentation
  documents?: string[]; // URIs to uploaded docs
  notes?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface ClaimStats {
  totalClaims: number;
  potentialClaims: number;
  activeClaims: number;
  completedClaims: number;
  totalPotentialAmount: number;
  totalCompletedAmount: number;
  averageClaimAmount: number;
  successRate: number;
}

export interface ClaimTypeInfo {
  id: ClaimType;
  name: string;
  icon: string;
  color: string;
  emoji: string;
  description: string;
}
