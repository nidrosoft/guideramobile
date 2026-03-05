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
}

export function useEvents({
  city,
  country,
  category,
  enabled = true,
  autoDiscover = true,
}: UseEventsOptions): UseEventsReturn {
  const [events, setEvents] = useState<DiscoveredEvent[]>([]);
  const [allEvents, setAllEvents] = useState<DiscoveredEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(category);
  const hasFetched = useRef(false);

  // Fetch events (check cache first, then discover)
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
      setAllEvents(result);
      // Apply category filter if set
      if (selectedCategory) {
        setEvents(result.filter(e => e.category === selectedCategory));
      } else {
        setEvents(result);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [city, country, selectedCategory]);

  // Force refresh (bypasses cache)
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
      setAllEvents(result);
      if (selectedCategory) {
        setEvents(result.filter(e => e.category === selectedCategory));
      } else {
        setEvents(result);
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

  // Auto-discover on mount
  useEffect(() => {
    if (enabled && autoDiscover && city && country && !hasFetched.current) {
      hasFetched.current = true;
      discover();
    }
  }, [enabled, autoDiscover, city, country, discover]);

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
  };
}
