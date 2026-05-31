/**
 * USE EVENTS HOOK
 * 
 * React hook for fetching and managing discovered events
 * for a given city/country. Supports category filtering,
 * pull-to-refresh, and caching.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { eventsService, DiscoveredEvent, EventCategory } from '@/services/events.service';

interface UseEventsOptions {
  city: string;
  country: string;
  category?: EventCategory | string;
  enabled?: boolean;
  autoDiscover?: boolean;
  /** Increment to force a re-fetch (e.g. on pull-to-refresh) */
  refreshKey?: number;
}

interface UseEventsReturn {
  events: DiscoveredEvent[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  discover: () => Promise<void>;
  filterByCategory: (category: string | undefined) => void;
  selectedCategory: string | undefined;
  categories: string[];
  /** The soonest upcoming event (useful for notifications) */
  nextEvent: DiscoveredEvent | null;
}

/**
 * Filters out events whose date_start has already passed (end-of-day).
 * Recurring events are kept regardless of date.
 */
function filterUpcomingEvents(events: DiscoveredEvent[]): DiscoveredEvent[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return events.filter(e => {
    // Keep recurring events always
    if (e.is_recurring) return true;
    // Keep events with no date (can't determine if past)
    if (!e.date_start) return true;
    // Use date_end if available (multi-day events), otherwise date_start
    const relevantDate = e.date_end || e.date_start;
    const eventDate = new Date(relevantDate + 'T23:59:59');
    return eventDate >= today;
  });
}

export function useEvents({
  city,
  country,
  category,
  enabled = true,
  autoDiscover = true,
  refreshKey = 0,
}: UseEventsOptions): UseEventsReturn {
  const [events, setEvents] = useState<DiscoveredEvent[]>([]);
  const [allEvents, setAllEvents] = useState<DiscoveredEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(category);
  const hasFetched = useRef(false);

  // Fetch events (check cache first, then discover) — filters out expired events
  const discover = useCallback(async () => {
    if (!city || !country) return;
    setLoading(true);
    setError(null);
    try {
      const result = await eventsService.discoverEvents({
        city,
        country,
        forceRefresh: false,
      });
      const upcoming = filterUpcomingEvents(result);
      setAllEvents(upcoming);
      if (selectedCategory) {
        setEvents(upcoming.filter(e => e.category === selectedCategory));
      } else {
        setEvents(upcoming);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [city, country, selectedCategory]);

  // Force refresh (bypasses cache) — filters out expired events
  const refresh = useCallback(async () => {
    if (!city || !country) return;
    setLoading(true);
    setError(null);
    try {
      const result = await eventsService.discoverEvents({
        city,
        country,
        forceRefresh: true,
      });
      const upcoming = filterUpcomingEvents(result);
      setAllEvents(upcoming);
      if (selectedCategory) {
        setEvents(upcoming.filter(e => e.category === selectedCategory));
      } else {
        setEvents(upcoming);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [city, country, selectedCategory]);

  // Filter by category (client-side)
  const filterByCategory = useCallback((cat: string | undefined) => {
    setSelectedCategory(cat);
    if (cat) {
      setEvents(allEvents.filter(e => e.category === cat));
    } else {
      setEvents(allEvents);
    }
  }, [allEvents]);

  // Get unique categories from fetched events
  const categories = Array.from(new Set(allEvents.map(e => e.category))).sort();

  // Next upcoming event (soonest date_start in the future)
  const nextEvent = allEvents.length > 0
    ? allEvents.reduce<DiscoveredEvent | null>((closest, e) => {
        if (!e.date_start) return closest;
        if (!closest || !closest.date_start) return e;
        return e.date_start < closest.date_start ? e : closest;
      }, null)
    : null;

  // Auto-discover on mount
  useEffect(() => {
    if (enabled && autoDiscover && city && country && !hasFetched.current) {
      hasFetched.current = true;
      discover();
    }
  }, [enabled, autoDiscover, city, country, discover]);

  // Re-fetch when refreshKey changes (pull-to-refresh)
  useEffect(() => {
    if (refreshKey > 0 && enabled && city && country) {
      discover();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  // Reset when city/country changes
  useEffect(() => {
    hasFetched.current = false;
    setEvents([]);
    setAllEvents([]);
    setSelectedCategory(category);
  }, [city, country, category]);

  return {
    events,
    loading,
    error,
    refresh,
    discover,
    filterByCategory,
    selectedCategory,
    categories,
    nextEvent,
  };
}
