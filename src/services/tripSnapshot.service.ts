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
  async generateSnapshot(params: TripSnapshotRequest, maxRetries = 2): Promise<TripSnapshot> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          // Exponential backoff: 2s, 4s
          const delay = Math.pow(2, attempt) * 1000;
          if (__DEV__) console.log(`[TripSnapshot] Retry ${attempt}/${maxRetries} after ${delay}ms`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }

        const { data, error } = await supabase.functions.invoke('trip-snapshot', {
          body: params,
        });

        if (error) {
          // Network errors are retryable
          if (error.message?.includes('network') || error.message?.includes('fetch') || error.message?.includes('timeout')) {
            lastError = new Error(`Snapshot failed: ${error.message}`);
            continue;
          }
          throw new Error(`Snapshot failed: ${error.message}`);
        }

        if (data?.error) {
          // Server 5xx errors are retryable
          if (data.error.includes?.('500') || data.error.includes?.('timeout')) {
            lastError = new Error(data.error);
            continue;
          }
          throw new Error(data.error);
        }

        return data as TripSnapshot;
      } catch (err: any) {
        lastError = err;
        // Only retry on network/timeout errors
        const isRetryable = err.message?.includes('network') || err.message?.includes('Network') ||
          err.message?.includes('fetch') || err.message?.includes('timeout') ||
          err.message?.includes('non-2xx');
        if (!isRetryable || attempt === maxRetries) {
          throw lastError;
        }
      }
    }

    throw lastError || new Error('Snapshot failed after retries');
  }
}

export const tripSnapshotService = new TripSnapshotService();
