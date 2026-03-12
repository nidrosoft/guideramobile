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
  originAirport?: string;    // IATA code
  currency?: string;
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
  };
  currency: string;
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
   * The edge function calls Amadeus, Viator, event-discovery,
   * and Claude Sonnet 4 / Gemini 2.5 Flash in parallel.
   */
  async generateSnapshot(params: TripSnapshotRequest): Promise<TripSnapshot> {
    const { data, error } = await supabase.functions.invoke('trip-snapshot', {
      body: params,
    });

    if (error) throw new Error(`Snapshot failed: ${error.message}`);
    if (data?.error) throw new Error(data.error);

    return data as TripSnapshot;
  }
}

export const tripSnapshotService = new TripSnapshotService();
