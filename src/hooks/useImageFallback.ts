/**
 * useImageFallback
 * 
 * Runtime fallback hook for destination images.
 * If an imageUrl is null/empty, fetches a proper city photo
 * from Google Places API via fetchDestinationCoverImage.
 * Results are cached in-memory to avoid redundant API calls.
 */

import { useState, useEffect } from 'react';
import { fetchDestinationCoverImage } from '@/utils/destinationImage';

const imageCache = new Map<string, string>();

export function useImageFallback(imageUrl: string | undefined | null, cityName: string): string {
  const [resolvedUrl, setResolvedUrl] = useState<string>(imageUrl || '');

  useEffect(() => {
    // If we have a valid image URL, use it directly
    if (imageUrl && imageUrl.trim().length > 10) {
      setResolvedUrl(imageUrl);
      return;
    }

    // No valid image — try Google Places fallback
    if (!cityName?.trim()) return;

    const cacheKey = cityName.trim().toLowerCase();

    // Check in-memory cache first
    if (imageCache.has(cacheKey)) {
      setResolvedUrl(imageCache.get(cacheKey)!);
      return;
    }

    let cancelled = false;

    fetchDestinationCoverImage(cityName).then(url => {
      if (cancelled) return;
      if (url) {
        imageCache.set(cacheKey, url);
        setResolvedUrl(url);
      }
    });

    return () => { cancelled = true; };
  }, [imageUrl, cityName]);

  return resolvedUrl;
}

/**
 * Resolve an image URL synchronously from cache, or return the original.
 * Use this for list items where a hook per-item isn't practical.
 * Call prefetchImages() first to warm the cache.
 */
export function getCachedImageUrl(imageUrl: string | undefined | null, cityName: string): string {
  if (imageUrl && imageUrl.trim().length > 10) return imageUrl;
  const cacheKey = cityName?.trim().toLowerCase();
  if (cacheKey && imageCache.has(cacheKey)) return imageCache.get(cacheKey)!;
  return imageUrl || '';
}

/**
 * Prefetch and cache images for a batch of destinations.
 * Call this once when data loads to warm the cache for items with missing images.
 */
export async function prefetchMissingImages(
  items: { imageUrl?: string | null; cityName: string }[]
): Promise<void> {
  const missing = items.filter(
    item => !item.imageUrl || item.imageUrl.trim().length <= 10
  );

  await Promise.allSettled(
    missing.map(async (item) => {
      const cacheKey = item.cityName.trim().toLowerCase();
      if (imageCache.has(cacheKey)) return;

      const url = await fetchDestinationCoverImage(item.cityName);
      if (url) imageCache.set(cacheKey, url);
    })
  );
}
