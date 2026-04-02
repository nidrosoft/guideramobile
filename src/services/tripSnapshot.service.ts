/**
 * TRIP SNAPSHOT SERVICE
 * 
 * Client-side service for the trip-snapshot edge function.
 * Fetches a comprehensive Trip Intelligence Snapshot including
 * flight/hotel/experience previews, events, cost estimate, and AI brief.
 */

import { supabase } from '@/lib/supabase/client';

// ─── Types ──────────────────────────────────────

export interface TripSnapshotRequest {
  destination: string;
  country?: string;
  startDate: string;         // YYYY-MM-DD
  endDate: string;           // YYYY-MM-DD
  travelers: { adults: number; children: number; infants: number };
  originCity?: string;       // User's city for flight search
  originAirport?: string;    // IATA code (resolved from originCity if not provided)
  currency?: string;
  nationality?: string;      // For visa/entry requirements
  userPreferences?: {
    budgetAmount?: number;
    interests?: string[];
    travelStyle?: string;
    accommodationType?: string;
  };
  selectedTopics?: string[];
}

export interface FlightPreview {
  cheapest: { price: number; airline: string; stops: number; duration: string } | null;
  fastest: { price: number; airline: string; stops: number; duration: string } | null;
  avgPrice: number;
  currency: string;
}

export interface HotelTiers {
  budget: { avgPrice: number; stars: number; count: number } | null;
  midRange: { avgPrice: number; stars: number; count: number } | null;
  luxury: { avgPrice: number; stars: number; count: number } | null;
  currency: string;
}

export interface ExperiencePreview {
  id: string;
  title: string;
  rating: number;
  reviewCount: number;
  price: number;
  currency: string;
  duration: string;
  image: string;
  category: string;
  freeCancellation: boolean;
  bookingUrl: string;
}

export interface EventPreview {
  name: string;
  category: string;
  dateRange: string;
  venue?: string;
  isFree: boolean;
  description: string;
}

export interface CostEstimate {
  low: number;
  high: number;
  breakdown: {
    flights: { low: number; high: number };
    hotels: { low: number; high: number };
    experiences: { low: number; high: number };
    food: { low: number; high: number };
    miscellaneous: { low: number; high: number };
  };
  currency: string;
  perDayBudget: { low: number; high: number };
  withinBudget?: boolean;
  budgetAmount?: number;
}

export interface BriefItem {
  label: string;
  detail: string;
}

export interface BriefSection {
  id: string;
  icon: string;
  title: string;
  items: BriefItem[];
}

export interface DestinationIntelligence {
  overview: string;
  sections: BriefSection[];
}

export interface TripSnapshot {
  destination: string;
  country?: string;
  dates: { start: string; end: string; nights: number };
  travelers: { adults: number; children: number; infants: number; total: number };
  flights: FlightPreview | null;
  hotels: HotelTiers | null;
  experiences: ExperiencePreview[];
  events: EventPreview[];
  costEstimate: CostEstimate;
  aiBrief: DestinationIntelligence | null;
  generatedAt: string;
}

// ─── Service ──────────────────────────────────────

class TripSnapshotService {
  /**
   * Generate a full trip intelligence snapshot for a destination + dates.
   * Includes retry logic with exponential backoff for network resilience.
   */
  async generateSnapshot(params: TripSnapshotRequest, maxRetries = 3): Promise<TripSnapshot> {
    let lastError: Error = new Error('Request failed');

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          // Exponential backoff: 2s, 4s, 8s
          const delay = Math.pow(2, attempt) * 1000;
          if (__DEV__) console.log(`[TripSnapshot] Retry ${attempt}/${maxRetries} after ${delay}ms`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }

        const { data, error } = await supabase.functions.invoke('trip-snapshot', {
          body: params,
        });

        if (error) {
          lastError = new Error(error.message || 'Request failed');
          // All invocation errors are retryable (network, edge function boot, etc.)
          if (attempt < maxRetries) continue;
          throw this.friendlyError(lastError);
        }

        if (data?.error) {
          // Rate limit — don't retry, show the message to user
          if (data.error.includes?.('wait') && data.error.includes?.('seconds')) {
            throw new Error(data.error);
          }
          lastError = new Error(data.error);
          // All server errors are retryable (model overload, 5xx, timeouts)
          if (attempt < maxRetries) continue;
          throw this.friendlyError(lastError);
        }

        return data as TripSnapshot;
      } catch (err: any) {
        lastError = err;
        // Rate limit errors should not be retried
        if (err.message?.includes?.('wait') && err.message?.includes?.('seconds')) {
          throw err;
        }
        // On last attempt, throw a friendly error
        if (attempt === maxRetries) {
          throw this.friendlyError(lastError);
        }
      }
    }

    throw this.friendlyError(lastError);
  }

  private friendlyError(err: Error): Error {
    if (__DEV__) console.error('[TripSnapshot] Original error:', err.message);
    // Rate limit messages are already user-friendly
    if (err.message?.includes?.('wait') && err.message?.includes?.('seconds')) {
      return err;
    }
    return new Error(
      "We couldn't generate your trip snapshot right now. Please check your internet connection and try again in a moment."
    );
  }
}

export const tripSnapshotService = new TripSnapshotService();
