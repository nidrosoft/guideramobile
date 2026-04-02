/**
 * USE LANDMARK SEARCH HOOK
 *
 * POI search with category filtering using Google Places API (via proxy).
 * Returns enriched nearby landmarks/places with photos, ratings, price levels.
 */

import { useState, useCallback } from 'react';
import { mapboxService, MapboxPlace } from '@/features/ar-navigation/services/mapbox.service';

export type POICategory = 'all' | 'food' | 'culture' | 'emergency' | 'transport' | 'shopping';
export type PriceFilter = 0 | 1 | 2 | 3 | 4; // 0 = any, 1-4 = $ to $$$$

// These map to Google Places API 'type' parameter
const CATEGORY_QUERIES: Record<POICategory, string> = {
  all: 'tourist_attraction',
  food: 'restaurant',
  culture: 'museum',
  emergency: 'hospital',
  transport: 'bus_station',
  shopping: 'shopping_mall',
};

// Sub-category type definitions
export interface SubCategory {
  id: string;
  label: string;
  query: string; // Google Places type or keyword
}

export const FOOD_SUBCATEGORIES: SubCategory[] = [
  { id: 'all', label: 'All Food', query: 'restaurant' },
  { id: 'cafe', label: 'Café', query: 'cafe' },
  { id: 'fast_food', label: 'Fast Food', query: 'meal_takeaway' },
  { id: 'bakery', label: 'Bakery', query: 'bakery' },
  { id: 'bar', label: 'Bar & Pub', query: 'bar' },
];

export const CULTURE_SUBCATEGORIES: SubCategory[] = [
  { id: 'all', label: 'All Culture', query: 'museum' },
  { id: 'gallery', label: 'Art Gallery', query: 'art_gallery' },
  { id: 'historic', label: 'Historic Site', query: 'tourist_attraction' },
  { id: 'church', label: 'Place of Worship', query: 'church' },
  { id: 'library', label: 'Library', query: 'library' },
];

export const SHOPPING_SUBCATEGORIES: SubCategory[] = [
  { id: 'all', label: 'All Shops', query: 'shopping_mall' },
  { id: 'clothing', label: 'Clothing', query: 'clothing_store' },
  { id: 'electronics', label: 'Electronics', query: 'electronics_store' },
  { id: 'supermarket', label: 'Supermarket', query: 'supermarket' },
];

export interface EnrichedPlace extends MapboxPlace {
  rating?: number;
  reviewCount?: number;
  priceLevel?: number; // 0-4
  isOpen?: boolean;
  imageUrl?: string;
  types?: string[];
}

export function useLandmarkSearch() {
  const [places, setPlaces] = useState<EnrichedPlace[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState<POICategory>('all');
  const [activeSubCategory, setActiveSubCategory] = useState<string>('all');
  const [priceFilter, setPriceFilter] = useState<PriceFilter>(0);
  const [searchQuery, setSearchQuery] = useState('');

  const searchNearby = useCallback(async (
    latitude: number,
    longitude: number,
    category: POICategory = 'all',
    subCategoryQuery?: string
  ) => {
    setLoading(true);
    setActiveCategory(category);
    if (!subCategoryQuery) setActiveSubCategory('all');
    try {
      const query = subCategoryQuery || CATEGORY_QUERIES[category] || CATEGORY_QUERIES.all;
      const results = await mapboxService.getNearbyPOIs(latitude, longitude, query, 25);

      // Enrich with photo URLs, ratings, price level from raw Google data
      // The proxy already returns these fields in the raw response
      const enriched: EnrichedPlace[] = results.map(p => ({
        ...p,
        // These fields come from the Google Places response if the proxy passes them through
        rating: (p as any).rating,
        reviewCount: (p as any).user_ratings_total,
        priceLevel: (p as any).price_level,
        isOpen: (p as any).opening_hours?.open_now,
        imageUrl: (p as any).imageUrl,
        types: (p as any).types || [],
      }));

      setPlaces(enriched);
    } catch (e) {
      if (__DEV__) console.warn('Landmark search error:', e);
      setPlaces([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const searchByText = useCallback(async (
    query: string,
    latitude: number,
    longitude: number
  ) => {
    if (!query.trim()) return;
    setLoading(true);
    setSearchQuery(query);
    try {
      const results = await mapboxService.geocode(query, { lat: latitude, lng: longitude });
      setPlaces(results);
    } catch (e) {
      if (__DEV__) console.warn('Search error:', e);
      setPlaces([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Filter by price level (client-side)
  const filteredPlaces = priceFilter > 0
    ? places.filter(p => p.priceLevel !== undefined && p.priceLevel <= priceFilter)
    : places;

  return {
    places: filteredPlaces,
    allPlaces: places,
    loading,
    activeCategory,
    activeSubCategory,
    priceFilter,
    searchQuery,
    searchNearby,
    searchByText,
    setActiveCategory,
    setActiveSubCategory,
    setPriceFilter,
  };
}
