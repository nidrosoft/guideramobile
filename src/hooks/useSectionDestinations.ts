/**
 * useSectionDestinations
 *
 * Fetches curated_destinations from Supabase filtered by section config.
 * Each homepage section maps to a filter on curated_destinations fields.
 * Returns loading state, destinations, and continent-based filter counts.
 */

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase/client';
import { VIEW_ALL_SECTION_CACHE_SLUGS } from '@/features/homepage/services/homepageService';
import type { ContentItem } from '@/features/homepage/types/homepage.types';

export interface CuratedDestination {
  id: string;
  title: string;
  slug: string;
  city: string;
  country: string;
  continent: string;
  hero_image_url: string;
  thumbnail_url: string;
  short_description: string;
  description: string;
  editor_rating: number;
  popularity_score: number;
  estimated_daily_budget_usd: number;
  budget_level: number;
  primary_category: string;
  seasons: string[];
  tags: string[];
  best_for: string[];
  is_trending: boolean;
  is_featured: boolean;
  safety_rating: number;
  latitude: number;
  longitude: number;
  gallery_urls: string[];
  estimated_flight_price_usd: number;
  estimated_hotel_price_usd: number;
  language_spoken: string[];
  currency_code: string;
  travel_style: string[];
  secondary_categories: string[];
}

export interface SectionFilter {
  id: string;
  label: string;
  count?: number;
}

/** Maps a section slug (from SECTIONS_CONFIG.viewAllRoute) to a DB query filter */
function getSectionQuery(sectionSlug: string) {
  switch (sectionSlug) {
    case 'destinations':
      return { field: 'primary_category', value: 'popular', sort: 'popularity_score' };
    case 'places':
      return { field: 'primary_category', value: 'popular', sort: 'editor_rating' };
    case 'must-see':
      return { field: 'is_featured', value: true, sort: 'editor_rating' };
    case 'editor-choices':
      return { field: 'is_featured', value: true, sort: 'editor_rating' };
    case 'trending-locations':
      return { field: 'is_trending', value: true, sort: 'popularity_score' };
    case 'best-discover':
      return {
        field: 'primary_category',
        value: 'off_beaten_path',
        sort: 'editor_rating',
        fallback: true,
      };
    case 'budget-friendly':
      return { field: 'budget_level_max', value: 2, sort: 'estimated_daily_budget_usd_asc' };
    case 'luxury-escapes':
      return { field: 'budget_level_min', value: 4, sort: 'editor_rating' };
    case 'local-experiences':
      return { field: null, value: null, sort: 'popularity_score' }; // all destinations
    case 'family-friendly':
      return { field: 'best_for_includes', value: 'families', sort: 'safety_rating' };
    default:
      return { field: null, value: null, sort: 'popularity_score' };
  }
}

function mapCacheItemToDestination(item: ContentItem): CuratedDestination {
  return {
    id: item.id,
    title: item.title,
    slug: item.slug || item.id,
    city: item.location?.city || '',
    country: item.location?.country || '',
    continent: '',
    hero_image_url: item.imageUrl || '',
    thumbnail_url: item.thumbnailUrl || item.imageUrl || '',
    short_description: item.subtitle || '',
    description: item.subtitle || '',
    editor_rating: item.rating || 4.5,
    popularity_score: item.matchScore || 0,
    estimated_daily_budget_usd: item.price?.amount || 0,
    budget_level: item.budgetLevel || 3,
    primary_category: '',
    seasons: [],
    tags: item.tags || [],
    best_for: item.bestFor || [],
    is_trending: item.badges?.some((badge) => badge.type === 'trending') || false,
    is_featured: item.badges?.some((badge) => badge.type === 'editors_choice') || false,
    safety_rating: item.safetyRating || 4,
    latitude: 0,
    longitude: 0,
    gallery_urls: [],
    estimated_flight_price_usd: 0,
    estimated_hotel_price_usd: 0,
    language_spoken: [],
    currency_code: '',
    travel_style: [],
    secondary_categories: [],
  };
}

export function useSectionDestinations(sectionSlug: string) {
  const [destinations, setDestinations] = useState<CuratedDestination[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setIsLoading(true);
      setError(null);

      try {
        const cacheSlug = VIEW_ALL_SECTION_CACHE_SLUGS[sectionSlug] || sectionSlug;
        const { data: cachedSection } = await supabase
          .from('section_cache')
          .select('data, item_count, expires_at')
          .eq('section_slug', cacheSlug)
          .gt('item_count', 0)
          .gt('expires_at', new Date().toISOString())
          .maybeSingle();

        if (cachedSection?.data && Array.isArray(cachedSection.data)) {
          if (!cancelled) {
            setDestinations(cachedSection.data.map(mapCacheItemToDestination));
          }
          return;
        }

        const config = getSectionQuery(sectionSlug);

        let query = supabase.from('curated_destinations').select('*').eq('status', 'published');

        // Apply section-specific filters
        if (config.field === 'primary_category' && config.value) {
          query = query.eq('primary_category', config.value);
        } else if (config.field === 'is_featured') {
          query = query.eq('is_featured', true);
        } else if (config.field === 'is_trending') {
          query = query.eq('is_trending', true);
        } else if (config.field === 'budget_level_max') {
          query = query.lte('budget_level', config.value as number);
        } else if (config.field === 'budget_level_min') {
          query = query.gte('budget_level', config.value as number);
        } else if (config.field === 'best_for_includes') {
          query = query.contains('best_for', [config.value as string]);
        }

        // Apply sorting
        if (config.sort === 'estimated_daily_budget_usd_asc') {
          query = query.order('estimated_daily_budget_usd', { ascending: true });
        } else if (config.sort) {
          query = query.order(config.sort, { ascending: false });
        }

        query = query.limit(50);

        const { data, error: dbError } = await query;

        if (dbError) throw dbError;

        // If a niche section returned too few results, fetch all as fallback
        if ((!data || data.length < 3) && (config as any).fallback) {
          const { data: fallbackData } = await supabase
            .from('curated_destinations')
            .select('*')
            .eq('status', 'published')
            .order('editor_rating', { ascending: false })
            .limit(50);

          if (!cancelled) {
            setDestinations(fallbackData || []);
          }
        } else if (!cancelled) {
          setDestinations(data || []);
        }
      } catch (err: any) {
        if (!cancelled) {
          console.error(`useSectionDestinations(${sectionSlug}) error:`, err);
          setError(err.message || 'Failed to load destinations');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [sectionSlug]);

  // Build continent-based filters from the fetched data
  const filters: SectionFilter[] = useMemo(() => {
    const continentCounts: Record<string, number> = {};
    destinations.forEach((d) => {
      const c = d.continent || 'Other';
      continentCounts[c] = (continentCounts[c] || 0) + 1;
    });

    const pills: SectionFilter[] = [{ id: 'all', label: 'All', count: destinations.length }];

    Object.entries(continentCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([continent, count]) => {
        pills.push({ id: continent, label: continent, count });
      });

    return pills;
  }, [destinations]);

  return { destinations, isLoading, error, filters };
}
