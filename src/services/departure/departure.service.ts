/**
 * DEPARTURE ADVISOR SERVICE
 *
 * Client-side service to call the departure-advisor edge function
 * and manage departure advisory data.
 */

import { supabase } from '@/lib/supabase/client';
import { invokeEdgeFn } from '@/utils/retry';

// ============================================
// TYPES
// ============================================

export interface DepartureBreakdown {
  driveTime: number;
  trafficBuffer: number;
  parkingAndTransfer: number;
  checkinCutoff: number;
  securityEstimate: number;
  gateWalkTime: number;
  comfortBuffer: number;
  totalMinutes: number;
}

export interface TransportOption {
  mode: 'drive' | 'rideshare' | 'transit';
  durationMinutes: number;
  distanceKm: number;
  estimatedCost?: { min: number; max: number; currency: string };
  trafficLevel: 'light' | 'moderate' | 'heavy';
  departBy: string;
}

export interface RiskLevel {
  category: string;
  level: 'low' | 'moderate' | 'high';
  detail: string;
}

export interface DepartureAdvisory {
  advisoryId: string | null;
  leaveByTime: string;
  boardingTime: string;
  totalMinutesNeeded: number;
  breakdown: DepartureBreakdown;
  transport: TransportOption[];
  risks: RiskLevel[];
  reasoning: string;
  flightStatus?: {
    status: string;
    delay?: number;
    gate?: string;
    terminal?: string;
  };
  confidence: 'high' | 'medium' | 'low';
}

export interface CalculateParams {
  tripId?: string;
  bookingId?: string;
  flightNumber: string;
  departureAirport: string;
  departureTime: string;
  isInternational: boolean;
  userLocation: {
    latitude: number;
    longitude: number;
  };
  preferences?: {
    tsaPrecheck?: boolean;
    clearMe?: boolean;
    parkingType?: 'self' | 'valet' | 'rideshare' | 'dropoff';
    comfortBuffer?: 'minimal' | 'standard' | 'generous';
  };
}

// ============================================
// AIRPORT DATA (mirrors edge function)
// ============================================

const AIRPORT_DATA: Record<string, { domestic_security_min: number; intl_security_min: number; size: 'large' | 'medium' | 'small' }> = {
  LAX: { domestic_security_min: 20, intl_security_min: 35, size: 'large' },
  JFK: { domestic_security_min: 25, intl_security_min: 40, size: 'large' },
  ORD: { domestic_security_min: 25, intl_security_min: 35, size: 'large' },
  SFO: { domestic_security_min: 20, intl_security_min: 30, size: 'medium' },
  ATL: { domestic_security_min: 25, intl_security_min: 40, size: 'large' },
  DFW: { domestic_security_min: 20, intl_security_min: 30, size: 'large' },
  DEN: { domestic_security_min: 20, intl_security_min: 30, size: 'large' },
  SEA: { domestic_security_min: 20, intl_security_min: 30, size: 'medium' },
  MIA: { domestic_security_min: 25, intl_security_min: 40, size: 'medium' },
  EWR: { domestic_security_min: 25, intl_security_min: 40, size: 'medium' },
  BOS: { domestic_security_min: 20, intl_security_min: 30, size: 'medium' },
  LHR: { domestic_security_min: 25, intl_security_min: 40, size: 'large' },
  CDG: { domestic_security_min: 25, intl_security_min: 40, size: 'large' },
  DXB: { domestic_security_min: 20, intl_security_min: 35, size: 'large' },
  NRT: { domestic_security_min: 20, intl_security_min: 30, size: 'large' },
  SIN: { domestic_security_min: 15, intl_security_min: 25, size: 'medium' },
  FRA: { domestic_security_min: 20, intl_security_min: 35, size: 'large' },
  AMS: { domestic_security_min: 20, intl_security_min: 35, size: 'medium' },
  HKG: { domestic_security_min: 15, intl_security_min: 25, size: 'medium' },
  ICN: { domestic_security_min: 15, intl_security_min: 25, size: 'large' },
};

// ============================================
// LOCAL FALLBACK CALCULATOR
// ============================================

function estimateSecurityLocal(
  airportCode: string,
  departureTime: Date,
  isInternational: boolean,
  tsaPrecheck: boolean,
  clearMe: boolean,
): number {
  const code = airportCode.toUpperCase();
  const airport = AIRPORT_DATA[code];
  let baseWait = isInternational
    ? (airport?.intl_security_min || 30)
    : (airport?.domestic_security_min || 20);

  const hour = departureTime.getHours();
  const dayOfWeek = departureTime.getDay();
  const month = departureTime.getMonth();

  // Time-of-day multiplier
  let timeMul = 1.0;
  if (hour >= 5 && hour <= 8) timeMul = 1.5;
  else if (hour >= 15 && hour <= 18) timeMul = 1.3;
  else if (hour >= 9 && hour <= 11) timeMul = 1.1;
  else if (hour >= 19 && hour <= 22) timeMul = 0.9;
  else if (hour >= 23 || hour <= 4) timeMul = 0.6;

  // Day-of-week multiplier
  let dayMul = 1.0;
  if (dayOfWeek === 0) dayMul = 1.3;
  else if (dayOfWeek === 1) dayMul = 1.2;
  else if (dayOfWeek === 4) dayMul = 1.2;
  else if (dayOfWeek === 5) dayMul = 1.4;
  else if (dayOfWeek === 6) dayMul = 0.9;

  // Season multiplier
  let seasonMul = 1.0;
  if (month >= 5 && month <= 7) seasonMul = 1.3;
  else if (month === 11) seasonMul = 1.4;
  else if (month === 2) seasonMul = 1.2;

  let wait = Math.round(baseWait * timeMul * dayMul * seasonMul);

  if (clearMe) wait = Math.max(5, Math.round(wait * 0.25));
  else if (tsaPrecheck) wait = Math.max(5, Math.round(wait * 0.4));

  return Math.max(5, Math.min(90, wait));
}

function getGateWalkTime(airportCode: string): number {
  const airport = AIRPORT_DATA[airportCode.toUpperCase()];
  if (!airport) return 10;
  if (airport.size === 'large') return 15;
  if (airport.size === 'medium') return 10;
  return 8;
}

function getParkingTransfer(parkingType: string): number {
  switch (parkingType) {
    case 'valet': return 5;
    case 'self': return 15;
    case 'dropoff': return 5;
    case 'rideshare': return 10;
    default: return 12;
  }
}

function getComfortBufferMin(pref: string): number {
  switch (pref) {
    case 'minimal': return 10;
    case 'standard': return 20;
    case 'generous': return 35;
    default: return 20;
  }
}

function calculateLocalFallback(params: CalculateParams): DepartureAdvisory {
  const departureTime = new Date(params.departureTime);
  const prefs = params.preferences || {};
  const parkingType = prefs.parkingType || 'rideshare';
  const comfortPref = prefs.comfortBuffer || 'standard';
  const tsaPrecheck = prefs.tsaPrecheck || false;
  const clearMe = prefs.clearMe || false;

  const driveTime = 45; // Fallback: assume 45 min drive
  const trafficBuffer = 10;
  const parkingTransfer = getParkingTransfer(parkingType);
  const checkinCutoff = params.isInternational ? 60 : 45;
  const securityWait = estimateSecurityLocal(
    params.departureAirport, departureTime, params.isInternational, tsaPrecheck, clearMe
  );
  const gateWalk = getGateWalkTime(params.departureAirport);
  const comfortBuffer = getComfortBufferMin(comfortPref);

  const totalMinutes = Math.max(60,
    driveTime + trafficBuffer + parkingTransfer + checkinCutoff + securityWait + gateWalk + comfortBuffer
  );

  const boardingMinBefore = params.isInternational ? 45 : 30;
  const boardingTime = new Date(departureTime.getTime() - boardingMinBefore * 60000);
  const leaveByTime = new Date(boardingTime.getTime() - totalMinutes * 60000);

  const breakdown: DepartureBreakdown = {
    driveTime,
    trafficBuffer,
    parkingAndTransfer: parkingTransfer,
    checkinCutoff,
    securityEstimate: securityWait,
    gateWalkTime: gateWalk,
    comfortBuffer,
    totalMinutes,
  };

  const transport: TransportOption[] = [
    {
      mode: 'drive',
      durationMinutes: driveTime + trafficBuffer,
      distanceKm: 40,
      trafficLevel: 'moderate',
      departBy: new Date(boardingTime.getTime() - (driveTime + trafficBuffer + parkingTransfer + checkinCutoff + securityWait + gateWalk) * 60000).toISOString(),
    },
    {
      mode: 'rideshare',
      durationMinutes: driveTime + trafficBuffer + 8,
      distanceKm: 40,
      estimatedCost: { min: 25, max: 45, currency: 'USD' },
      trafficLevel: 'moderate',
      departBy: new Date(boardingTime.getTime() - (driveTime + trafficBuffer + 8 + 10 + checkinCutoff + securityWait + gateWalk) * 60000).toISOString(),
    },
  ];

  const risks: RiskLevel[] = [
    { category: 'Traffic', level: 'moderate', detail: 'Drive time estimated without live traffic data.' },
    {
      category: 'Security',
      level: securityWait > 35 ? 'high' : securityWait > 20 ? 'moderate' : 'low',
      detail: `TSA estimated at ${securityWait} min${tsaPrecheck ? ' (PreCheck)' : ''}.`,
    },
    { category: 'Flight', level: 'low', detail: 'Flight status not available offline. We assume on time.' },
  ];

  const reasoning = `Estimated ${driveTime} min drive to ${params.departureAirport} (without live traffic). ` +
    `Security estimated at ${securityWait} min based on airport size and time of day. ` +
    `${params.isInternational ? 'International' : 'Domestic'} flights require check-in at least ${checkinCutoff} min before departure. ` +
    `We added a ${comfortBuffer} min comfort buffer. ` +
    `Note: This is an offline estimate — connect to get real-time traffic and flight data.`;

  return {
    advisoryId: null,
    leaveByTime: leaveByTime.toISOString(),
    boardingTime: boardingTime.toISOString(),
    totalMinutesNeeded: totalMinutes,
    breakdown,
    transport,
    risks,
    reasoning,
    confidence: 'low',
  };
}

// ============================================
// SERVICE
// ============================================

class DepartureAdvisorService {
  /**
   * Calculate departure advisory for a flight.
   * Tries the edge function first, falls back to local calculation.
   */
  async calculate(params: CalculateParams): Promise<DepartureAdvisory> {
    try {
      const { data, error } = await invokeEdgeFn(supabase, 'departure-advisor', {
          action: 'calculate',
          ...params,
      }, 'fast');

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Calculation failed');

      return {
        advisoryId: data.advisoryId,
        leaveByTime: data.leaveByTime,
        boardingTime: data.boardingTime,
        totalMinutesNeeded: data.totalMinutesNeeded,
        breakdown: data.breakdown,
        transport: data.transport,
        risks: data.risks,
        reasoning: data.reasoning,
        flightStatus: data.flightStatus,
        confidence: data.confidence,
      };
    } catch (err) {
      if (__DEV__) console.warn('Edge function unavailable, using local calculation:', err);
      return calculateLocalFallback(params);
    }
  }

  /**
   * Submit feedback on advisory accuracy
   */
  async submitFeedback(
    advisoryId: string,
    rating: 'perfect' | 'too_early' | 'too_late' | 'didnt_go'
  ): Promise<void> {
    const { error } = await invokeEdgeFn(supabase, 'departure-advisor', {
        action: 'feedback',
        advisoryId,
        rating,
    }, 'fast');

    if (error) {
      console.error('Failed to submit feedback:', error);
    }
  }

  /**
   * Check if a trip's departure is within the advisory window (same day or day before)
   */
  isDepartureDay(departureTime: Date | string): boolean {
    const dep = typeof departureTime === 'string' ? new Date(departureTime) : departureTime;
    const now = new Date();
    const hoursUntil = (dep.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursUntil > 0 && hoursUntil <= 36; // Within 36 hours
  }

  /**
   * Check if departure is too far away for accurate advisory
   */
  isTooEarlyForAdvisory(departureTime: Date | string): boolean {
    const dep = typeof departureTime === 'string' ? new Date(departureTime) : departureTime;
    const now = new Date();
    const hoursUntil = (dep.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursUntil > 36;
  }

  /**
   * Format minutes into human-readable duration
   */
  formatDuration(minutes: number): string {
    if (minutes < 60) return `${minutes} min`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }

  /**
   * Format time for display
   */
  formatTime(isoString: string): string {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }

  /**
   * Get time until leave-by in human-readable format
   */
  getTimeUntilLeave(leaveByTime: string): { text: string; urgent: boolean } {
    const leaveBy = new Date(leaveByTime);
    const now = new Date();
    const diffMs = leaveBy.getTime() - now.getTime();

    if (diffMs <= 0) {
      return { text: 'You should have left already!', urgent: true };
    }

    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 60) {
      return { text: `Leave in ${diffMin} min`, urgent: diffMin < 15 };
    }

    const hours = Math.floor(diffMin / 60);
    const mins = diffMin % 60;
    return {
      text: `Leave in ${hours}h ${mins}m`,
      urgent: false,
    };
  }
}

export const departureAdvisorService = new DepartureAdvisorService();
