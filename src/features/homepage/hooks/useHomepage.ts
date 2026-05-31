/**
 * USE HOMEPAGE HOOK
 *
 * Main hook for fetching and managing homepage data.
 * Provides personalized content, refresh functionality, and interaction tracking.
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import * as Location from 'expo-location';
import { useAuth } from '@/context/AuthContext';
import { homepageService } from '../services/homepageService';
import type { HomepageSection, ContentItem, ResponseMeta } from '../types/homepage.types';

interface UseHomepageResult {
  sections: HomepageSection[];
  meta: ResponseMeta | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  trackInteraction: (
    item: ContentItem,
    action: 'view' | 'detail_view',
    sectionSlug?: string,
    position?: number
  ) => void;
  toggleSaved: (item: ContentItem) => Promise<void>;
}

interface UseHomepageOptions {
  autoFetch?: boolean;
  includeLocation?: boolean;
}

export function useHomepage(options: UseHomepageOptions = {}): UseHomepageResult {
  const { autoFetch = true, includeLocation = true } = options;
  const { profile } = useAuth();
  const profileId = profile?.id;
  const profileLatitude = profile?.latitude;
  const profileLongitude = profile?.longitude;

  const [sections, setSections] = useState<HomepageSection[]>([]);
  const [meta, setMeta] = useState<ResponseMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lastFetchedUserKey = useRef<string | null>(null);
  const locationRef = useRef<{ latitude: number; longitude: number } | null>(null);

  const profileLocation = useMemo(
    () =>
      typeof profileLatitude === 'number' && typeof profileLongitude === 'number'
        ? { latitude: profileLatitude, longitude: profileLongitude }
        : null,
    [profileLatitude, profileLongitude]
  );
  const profileTimezone = profile?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;

  /**
   * Get user's current location
   */
  const getUserLocation = useCallback(async () => {
    if (!includeLocation) return null;

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        if (__DEV__) console.log('Location permission not granted');
        return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      locationRef.current = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      return locationRef.current;
    } catch (err) {
      if (__DEV__) console.warn('Failed to get location:', err);
      return null;
    }
  }, [includeLocation]);

  /**
   * Fetch homepage data
   */
  const fetchHomepage = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setIsRefreshing(true);
        } else {
          setIsLoading(true);
        }
        setError(null);

        // Prefer the onboarding/home profile location so the feed matches the
        // city the user selected at signup. GPS is only a fallback for profiles
        // that do not have saved coordinates yet.
        let location = profileLocation || locationRef.current;
        if (!location && includeLocation) location = await getUserLocation();

        const response = await homepageService.getHomepage({
          userId: profileId,
          latitude: location?.latitude,
          longitude: location?.longitude,
          timezone: profileTimezone,
          refresh: isRefresh,
        });

        if (response.success) {
          setSections(response.data.sections);
          setMeta(response.data.meta);
        } else {
          setError(response.error || 'Failed to load homepage');
        }
      } catch (err: any) {
        console.error('Homepage fetch error:', err);
        setError(err.message || 'Something went wrong');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [profileId, profileLocation, profileTimezone, includeLocation, getUserLocation]
  );

  /**
   * Refresh homepage data
   */
  const refresh = useCallback(async () => {
    await fetchHomepage(true);
  }, [fetchHomepage]);

  /**
   * Track user interaction
   */
  const trackInteraction = useCallback(
    (
      item: ContentItem,
      action: 'view' | 'detail_view',
      sectionSlug?: string,
      position?: number
    ) => {
      if (!profileId) return;

      homepageService
        .trackInteraction({
          userId: profileId,
          itemId: item.id,
          itemType: item.type as 'destination' | 'experience',
          action,
          sectionSlug,
          position,
        })
        .catch(console.error);
    },
    [profileId]
  );

  /**
   * Toggle saved status
   */
  const toggleSaved = useCallback(
    async (item: ContentItem) => {
      if (!profileId) return;

      try {
        const newSavedStatus = await homepageService.toggleSaved(
          profileId,
          item.id,
          item.type as 'destination' | 'experience',
          !item.isSaved
        );

        // Update local state
        setSections((prevSections) =>
          prevSections.map((section) => ({
            ...section,
            items: section.items.map((i) =>
              i.id === item.id ? { ...i, isSaved: newSavedStatus } : i
            ),
          }))
        );
      } catch (err) {
        console.error('Failed to toggle saved:', err);
      }
    },
    [profileId]
  );

  useEffect(() => {
    const fetchKey = profileId || 'anonymous';
    if (autoFetch && lastFetchedUserKey.current !== fetchKey) {
      lastFetchedUserKey.current = fetchKey;
      fetchHomepage();
    }
  }, [autoFetch, profileId, fetchHomepage]);

  return {
    sections,
    meta,
    isLoading,
    isRefreshing,
    error,
    refresh,
    trackInteraction,
    toggleSaved,
  };
}

export default useHomepage;
