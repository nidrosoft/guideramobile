/**
 * USE LOCAL EXPERIENCES HOOK
 * 
 * Manages fetching and state for local experiences from Viator.
 * Integrates with useUserLocation for automatic city detection.
 * Supports category filtering and caching per city+category combo.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  localExperiencesService,
  type LocalExperience,
  type ExperienceCategory,
} from '@/services/localExperiences.service';
import { useUserLocation } from './useUserLocation';

interface UseLocalExperiencesOptions {
  /** Number of experiences to fetch */
  limit?: number;
  /** Override auto-detected city */
  cityOverride?: string;
  /** Whether to auto-fetch on mount (default: true) */
  autoFetch?: boolean;
}

interface UseLocalExperiencesResult {
  experiences: LocalExperience[];
  categories: ExperienceCategory[];
  selectedCategory: number | null;
  setSelectedCategory: (tagId: number | null) => void;
  /** The city where experiences were actually found (may differ from detected city) */
  city: string | null;
  /** Whether a nearby city was used instead of the detected one */
  usedFallback: boolean;
  isLoading: boolean;
  isCategoriesLoading: boolean;
  isLocationLoading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useLocalExperiences(
  options: UseLocalExperiencesOptions = {}
): UseLocalExperiencesResult {
  const { limit = 15, cityOverride, autoFetch = true } = options;
  const { location, isLoading: locationLoading } = useUserLocation();

  const [experiences, setExperiences] = useState<LocalExperience[]>([]);
  const [categories, setCategories] = useState<ExperienceCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchedCity, setSearchedCity] = useState<string | null>(null);
  const [usedFallback, setUsedFallback] = useState(false);

  // Per-city+category cache for instant switching
  const cache = useRef<Map<string, { experiences: LocalExperience[]; searchedCity: string; usedFallback: boolean }>>(new Map());

  const detectedCity = cityOverride || location?.city || null;

  // Fetch categories once on mount
  useEffect(() => {
    let cancelled = false;

    localExperiencesService
      .getCategories()
      .then((cats) => {
        if (!cancelled) setCategories(cats);
      })
      .catch((err) => {
        console.warn('Failed to fetch experience categories:', err);
      })
      .finally(() => {
        if (!cancelled) setIsCategoriesLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  // Fetch experiences when city or category changes
  const fetchExperiences = useCallback(async () => {
    if (!detectedCity) return;

    const cacheKey = `${detectedCity.toLowerCase()}-${selectedCategory || 'all'}`;
    const cached = cache.current.get(cacheKey);
    if (cached) {
      setExperiences(cached.experiences);
      setSearchedCity(cached.searchedCity);
      setUsedFallback(cached.usedFallback);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await localExperiencesService.searchExperiences({
        city: detectedCity,
        lat: location?.latitude,
        lng: location?.longitude,
        tagId: selectedCategory,
        limit,
      });

      cache.current.set(cacheKey, {
        experiences: result.experiences,
        searchedCity: result.searchedCity,
        usedFallback: result.usedFallback,
      });
      setExperiences(result.experiences);
      setSearchedCity(result.searchedCity);
      setUsedFallback(result.usedFallback);
    } catch (err: any) {
      console.error('Local experiences fetch error:', err);
      setError(err.message || 'Failed to load experiences');
    } finally {
      setIsLoading(false);
    }
  }, [detectedCity, location?.latitude, location?.longitude, selectedCategory, limit]);

  useEffect(() => {
    if (!autoFetch) return;

    if (detectedCity) {
      fetchExperiences();
    } else if (!locationLoading) {
      setIsLoading(false);
    }
  }, [detectedCity, autoFetch, fetchExperiences, locationLoading]);

  const refresh = useCallback(() => {
    cache.current.clear();
    fetchExperiences();
  }, [fetchExperiences]);

  return {
    experiences,
    categories,
    selectedCategory,
    setSelectedCategory,
    city: searchedCity || detectedCity,
    usedFallback,
    isLoading: isLoading || (locationLoading && !detectedCity),
    isCategoriesLoading,
    isLocationLoading: locationLoading,
    error,
    refresh,
  };
}
