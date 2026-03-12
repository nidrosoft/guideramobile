/**
 * DEPARTURE ADVISOR SERVICE
 *
 * Client-side service to call the departure-advisor edge function
 * and manage departure advisory data.
 */

import { supabase } from '@/lib/supabase/client';

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
// SERVICE
// ============================================

class DepartureAdvisorService {
  /**
   * Calculate departure advisory for a flight
   */
  async calculate(params: CalculateParams): Promise<DepartureAdvisory> {
    const { data, error } = await supabase.functions.invoke('departure-advisor', {
      body: {
        action: 'calculate',
        ...params,
      },
    });

    if (error) {
      throw new Error(error.message || 'Failed to calculate departure advisory');
    }

    if (!data?.success) {
      throw new Error(data?.error || 'Calculation failed');
    }

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
  }

  /**
   * Submit feedback on advisory accuracy
   */
  async submitFeedback(
    advisoryId: string,
    rating: 'perfect' | 'too_early' | 'too_late' | 'didnt_go'
  ): Promise<void> {
    const { error } = await supabase.functions.invoke('departure-advisor', {
      body: {
        action: 'feedback',
        advisoryId,
        rating,
      },
    });

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
