// ─── Enums ──────────────────────────────────────────────

export enum ClaimStatus {
  POTENTIAL = 'potential',
  ANALYZING = 'analyzing',
  READY_TO_FILE = 'ready_to_file',
  ACTIVE = 'active',
  SUBMITTED = 'submitted',
  FILED = 'filed',
  ACKNOWLEDGED = 'acknowledged',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  PAID = 'paid',
  COMPLETED = 'completed',
  DENIED = 'denied',
  ESCALATED = 'escalated',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
  NOT_ELIGIBLE = 'not_eligible',
}

export enum ClaimType {
  FLIGHT_DELAY = 'flight_delay',
  FLIGHT_CANCELLATION = 'flight_cancellation',
  OVERBOOKING = 'overbooking',
  DENIED_BOARDING = 'denied_boarding',
  MISSED_CONNECTION = 'missed_connection',
  DOWNGRADE = 'downgrade',
  LOST_BAGGAGE = 'lost_baggage',
  DAMAGED_BAGGAGE = 'damaged_baggage',
  HOTEL_ISSUE = 'hotel_issue',
  OTHER = 'other',
}

export type Regulation = 'EU261' | 'UK261' | 'APPR' | 'US_DOT' | 'ACCC' | 'AIRLINE_POLICY' | 'NONE';
export type DisruptionType = 'delay' | 'cancellation' | 'missed_connection' | 'downgrade' | 'denied_boarding';
export type DistanceTier = 'short_haul' | 'medium_haul' | 'long_haul';
export type EligibilityVerdict = 'eligible' | 'likely_eligible' | 'unlikely_eligible' | 'not_eligible' | 'needs_more_info';
export type MonitoringStatus = 'dormant' | 'monitoring' | 'disrupted' | 'resolved';

// ─── Rights Card (per flight segment) ───────────────────

export interface RightsCard {
  id: string;
  tripId: string;
  userId: string;
  bookingId?: string;

  // Flight segment
  flightNumber?: string;
  airlineName?: string;
  airlineIata?: string;
  departureAirport?: string;
  arrivalAirport?: string;
  departureCountry?: string;
  arrivalCountry?: string;
  departureDate?: string;
  scheduledDeparture?: string;
  scheduledArrival?: string;
  distanceKm?: number;
  cabinClass?: string;

  // Regulation
  applicableRegulation: Regulation;
  regulationDetails: RegulationDetails;
  maxCompensationAmount?: number;
  compensationCurrency: string;
  distanceTier?: DistanceTier;

  // Monitoring
  monitoringStatus: MonitoringStatus;
  lastCheckedAt?: string;
  disruptionDetected: boolean;
  claimId?: string;

  createdAt: string;
  updatedAt: string;
}

export interface RegulationDetails {
  name: string;
  shortName: string;
  jurisdiction: string;
  delayThresholdMinutes: number;
  tiers?: RegulationTier[];
  statuteOfLimitationsYears: number;
  notes?: string;
}

export interface RegulationTier {
  distanceTier: DistanceTier;
  distanceRange: string;
  amount: number;
  currency: string;
}

// ─── Claim (extended with AI) ───────────────────────────

export interface Claim {
  id: string;
  tripId: string;
  bookingId?: string;
  rightsCardId?: string;
  type: ClaimType;
  status: ClaimStatus;

  // Flight/Booking Details
  provider: string;
  flightNumber?: string;
  bookingReference: string;
  date: Date;

  // Disruption Details
  disruptionType?: DisruptionType;
  delayMinutes?: number;
  cancellationReason?: string;
  applicableRegulation?: Regulation;

  // Claim Details
  estimatedAmount: number;
  currency: string;
  description: string;
  reason: string;

  // AI Analysis (full JSONB)
  aiAnalysis?: CompensationAnalysis;
  aiConfidence?: number;
  policyDetails?: string;
  eligibilityNotes?: string;

  // Claim Letter
  claimLetterSubject?: string;
  claimLetterBody?: string;
  claimLetterNotes?: string[];

  // Filing & Intel
  filingOptions?: FilingOption[];
  gateProtocol?: GateProtocolStep[];
  airlineIntel?: AirlineIntel;
  claimDeadline?: ClaimDeadline;

  // Status Tracking
  submittedDate?: Date;
  completedDate?: Date;
  analyzedAt?: Date;
  actualAmount?: number;
  generatedBy?: string;

  // Documentation
  documents?: string[];
  notes?: string;

  createdAt: Date;
  updatedAt: Date;
}

// ─── AI Analysis Output ─────────────────────────────────

export interface CompensationAnalysis {
  flightDetails: AnalysisFlightDetails;
  disruption: AnalysisDisruption;
  regulation: AnalysisRegulation;
  eligibility: AnalysisEligibility;
  compensation: AnalysisCompensation;
  gateProtocol: GateProtocolStep[];
  claimLetter: AnalysisClaimLetter;
  filingOptions: FilingOption[];
  claimDeadline: ClaimDeadline;
  airlineIntel: AirlineIntel;
}

export interface AnalysisFlightDetails {
  flightNumber: string;
  airline: string;
  route: string;
  departureAirport: string;
  arrivalAirport: string;
  scheduledDeparture: string;
  scheduledArrival: string;
  distanceKm: number;
  distanceTier: DistanceTier;
}

export interface AnalysisDisruption {
  type: DisruptionType;
  delayMinutes?: number;
  description: string;
  airlineStatedReason?: string;
  isExtraordinaryCircumstances: boolean;
  extraordinaryCircumstancesAnalysis?: string;
}

export interface AnalysisRegulation {
  applicable: Regulation;
  fullName: string;
  jurisdiction: string;
  delayThreshold: string;
  applicableArticles: string[];
}

export interface AnalysisEligibility {
  verdict: EligibilityVerdict;
  confidence: number;
  reasoning: string;
  caveats?: string[];
}

export interface AnalysisCompensation {
  amountPerPassenger: number;
  totalAmount: number;
  currency: string;
  numberOfPassengers: number;
  calculation: string;
  additionalCosts?: string;
}

export interface GateProtocolStep {
  step: number;
  action: string;
  reason: string;
}

export interface AnalysisClaimLetter {
  subject: string;
  body: string;
  personalizationNotes: string[];
}

export interface FilingOption {
  rank: number;
  method: string;
  name: string;
  url?: string;
  affiliate?: boolean;
  costToPassenger: string;
  typicalResponseTime: string;
  successRateNote?: string;
  recommended?: boolean;
  recommendedWhen?: string;
  instructions?: string;
}

export interface ClaimDeadline {
  deadlineDate: string;
  regulationBasis: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  note: string;
}

export interface AirlineIntel {
  complianceRate?: number;
  typicalResponseDays?: number;
  knownTactics?: string[];
  recommendedApproach?: string;
}

// ─── Stats ──────────────────────────────────────────────

export interface ClaimStats {
  totalClaims: number;
  potentialClaims: number;
  analyzingClaims: number;
  readyToFileClaims: number;
  activeClaims: number;
  completedClaims: number;
  deniedClaims: number;
  totalPotentialAmount: number;
  totalCompletedAmount: number;
  averageClaimAmount: number;
  successRate: number;
}

// ─── UI Helpers ─────────────────────────────────────────

export interface ClaimTypeInfo {
  id: ClaimType;
  name: string;
  icon: string;
  color: string;
  emoji: string;
  description: string;
}

export const CLAIM_STATUS_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  [ClaimStatus.POTENTIAL]: { label: 'Potential', color: '#F59E0B', icon: 'warning' },
  [ClaimStatus.ANALYZING]: { label: 'Analyzing', color: '#8B5CF6', icon: 'cpu' },
  [ClaimStatus.READY_TO_FILE]: { label: 'Ready to File', color: '#3B82F6', icon: 'document' },
  [ClaimStatus.ACTIVE]: { label: 'Active', color: '#3FC39E', icon: 'clock' },
  [ClaimStatus.SUBMITTED]: { label: 'Submitted', color: '#06B6D4', icon: 'send' },
  [ClaimStatus.FILED]: { label: 'Filed', color: '#06B6D4', icon: 'tick' },
  [ClaimStatus.ACKNOWLEDGED]: { label: 'Acknowledged', color: '#10B981', icon: 'tick-circle' },
  [ClaimStatus.UNDER_REVIEW]: { label: 'Under Review', color: '#F59E0B', icon: 'search' },
  [ClaimStatus.APPROVED]: { label: 'Approved', color: '#10B981', icon: 'tick-circle' },
  [ClaimStatus.PAID]: { label: 'Paid', color: '#10B981', icon: 'money' },
  [ClaimStatus.COMPLETED]: { label: 'Completed', color: '#10B981', icon: 'tick-circle' },
  [ClaimStatus.DENIED]: { label: 'Denied', color: '#EF4444', icon: 'close-circle' },
  [ClaimStatus.ESCALATED]: { label: 'Escalated', color: '#F97316', icon: 'arrow-up' },
  [ClaimStatus.REJECTED]: { label: 'Rejected', color: '#EF4444', icon: 'close-circle' },
  [ClaimStatus.EXPIRED]: { label: 'Expired', color: '#6B7280', icon: 'clock' },
  [ClaimStatus.NOT_ELIGIBLE]: { label: 'Not Eligible', color: '#6B7280', icon: 'info-circle' },
};

export const REGULATION_INFO: Record<Regulation, { name: string; flag: string; description: string }> = {
  EU261: { name: 'EU Regulation 261/2004', flag: '🇪🇺', description: 'European Union passenger rights' },
  UK261: { name: 'UK Air Passenger Rights', flag: '🇬🇧', description: 'UK equivalent of EU261' },
  APPR: { name: 'Canadian APPR', flag: '🇨🇦', description: 'Air Passenger Protection Regulations' },
  US_DOT: { name: 'US DOT Rules', flag: '🇺🇸', description: 'US Department of Transportation rules' },
  ACCC: { name: 'Australian Consumer Law', flag: '🇦🇺', description: 'Australian Competition & Consumer Commission' },
  AIRLINE_POLICY: { name: 'Airline Policy', flag: '✈️', description: 'Airline-specific compensation policy' },
  NONE: { name: 'No Regulation', flag: '⚠️', description: 'No known regulation applies' },
};
