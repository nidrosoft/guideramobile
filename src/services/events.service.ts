/**
 * EVENTS DISCOVERY SERVICE
 *
 * Client-side service for discovering and fetching events
 * from the event-discovery Edge Function (backed by Gemini 2.0 Flash
 * with Google Search grounding).
 */

import { supabase } from '@/lib/supabase/client';
import { invokeWithRetry } from '@/utils/retry';

// ─── Types ──────────────────────────────────────

export interface DiscoveredEvent {
  id: string;
  city: string;
  country: string;
  event_name: string;
  category: string;
  description: string | null;
  venue: string | null;
  date_start: string | null;
  date_end: string | null;
  time_info: string | null;
  ticket_price: string | null;
  ticket_url: string | null;
  image_url: string | null;
  source_url: string | null;
  is_free: boolean;
  is_recurring: boolean;
  recurrence_info: string | null;
  estimated_attendees: string | null;
  highlights: string[];
  rating: number | null;
  tags: string[];
  fetched_at: string;
  expires_at: string;
}

export const EVENT_CATEGORIES = [
  'Music & Concerts',
  'Festivals & Carnivals',
  'Food & Drink',
  'Art & Culture',
  'Sports & Marathons',
  'Conferences & Expos',
  'Markets & Fairs',
  'Nightlife & Entertainment',
  'Outdoor & Adventure',
  'Religious & Spiritual',
  'Theater & Performing Arts',
  'Family & Kids',
  'Community & Local',
  'Parades & Celebrations',
] as const;

export type EventCategory = (typeof EVENT_CATEGORIES)[number];

interface DiscoverEventsParams {
  city: string;
  country: string;
  category?: string;
  month?: string;
  forceRefresh?: boolean;
  metro_area?: string;
}

interface EventDiscoveryResponse {
  success: boolean;
  events: DiscoveredEvent[];
  cached: boolean;
  eventsDiscovered?: number;
  city: string;
  country: string;
  error?: string;
}

// ─── Service ────────────────────────────────────

class EventsService {
  /**
   * Discover events for a city. Launch-safe path is DB-first and avoids
   * client-triggered AI discovery in production.
   */
  async discoverEvents(params: DiscoverEventsParams): Promise<DiscoveredEvent[]> {
    try {
      const cached = await this.getEventsFromDB(params.city, params.country, params.category);
      if (cached.length > 0 || !params.forceRefresh || !__DEV__) {
        return cached;
      }

      const data = await invokeWithRetry(
        supabase,
        'event-discovery',
        {
          action: 'refresh',
          city: params.city,
          country: params.country,
          category: params.category,
          month: params.month,
          metro_area: params.metro_area,
        },
        'fast'
      );

      const response = data as EventDiscoveryResponse;
      if (!response.success) {
        console.error('[EventsService] Discovery failed:', response.error);
        return [];
      }

      return response.events || [];
    } catch (err) {
      console.error('[EventsService] discoverEvents error:', err);
      return [];
    }
  }

  /**
   * Get cached events for a city (no AI call, cache only).
   */
  async getCachedEvents(
    city: string,
    country: string,
    category?: string
  ): Promise<DiscoveredEvent[]> {
    return this.getEventsFromDB(city, country, category);
  }

  /**
   * Get events directly from the database (faster, no EF call).
   */
  async getEventsFromDB(
    city: string,
    country: string,
    category?: string
  ): Promise<DiscoveredEvent[]> {
    try {
      let query = supabase
        .from('destination_events')
        .select('*')
        .ilike('city', city)
        .ilike('country', country)
        .gt('expires_at', new Date().toISOString())
        .order('date_start', { ascending: true, nullsFirst: false });

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[EventsService] getEventsFromDB error:', error);
        return [];
      }

      return (data as DiscoveredEvent[]) || [];
    } catch (err) {
      console.error('[EventsService] getEventsFromDB error:', err);
      return [];
    }
  }

  /**
   * Format a date string for display (e.g., "Mar 14, 2026")
   */
  formatEventDate(dateStr: string | null): string {
    if (!dateStr) return 'TBD';
    try {
      const date = new Date(dateStr + 'T00:00:00');
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  }

  /**
   * Format a date range for display
   */
  formatDateRange(start: string | null, end: string | null): string {
    if (!start) return 'Date TBD';
    const startFormatted = this.formatEventDate(start);
    if (!end || end === start) return startFormatted;
    const endFormatted = this.formatEventDate(end);
    return `${startFormatted} - ${endFormatted}`;
  }

  /**
   * Trigger background image repair for events with missing images.
   * Fires and forgets — doesn't block the UI.
   */
  async repairMissingImages(events: DiscoveredEvent[]): Promise<void> {
    const missing = events.filter((e) => !e.image_url || e.image_url.trim().length === 0);
    if (missing.length === 0) return;

    if (__DEV__)
      console.log(
        `[EventsService] ${missing.length} events missing images; repair is cron/admin controlled.`
      );
  }

  /**
   * Get category icon name (maps to iconsax)
   */
  getCategoryIcon(category: string): string {
    const map: Record<string, string> = {
      'Music & Concerts': 'music',
      'Festivals & Carnivals': 'star',
      'Food & Drink': 'coffee',
      'Art & Culture': 'brush',
      'Sports & Marathons': 'activity',
      'Conferences & Expos': 'briefcase',
      'Markets & Fairs': 'shop',
      'Nightlife & Entertainment': 'moon',
      'Outdoor & Adventure': 'tree',
      'Religious & Spiritual': 'building',
      'Theater & Performing Arts': 'mask',
      'Family & Kids': 'people',
      'Community & Local': 'flag',
      'Parades & Celebrations': 'party',
    };
    return map[category] || 'calendar';
  }
}

export const eventsService = new EventsService();
