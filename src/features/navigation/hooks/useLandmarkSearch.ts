/**
 * USE LANDMARK SEARCH HOOK
 *
 * POI search with category filtering using Mapbox Geocoding API.
 * Returns nearby landmarks/places that can be navigated to.
 */

import { useState, useCallback } from 'react';
import { mapboxService, MapboxPlace } from '@/features/ar-navigation/services/mapbox.service';

export type POICategory = 'all' | 'food' | 'culture' | 'emergency' | 'transport' | 'shopping';

// These map to Google Places API 'type' parameter
const CATEGORY_QUERIES: Record<POICategory, string> = {
  all: 'tourist_attraction',
  food: 'restaurant',
  culture: 'museum',
  emergency: 'hospital',
  transport: 'bus_station',
  shopping: 'shopping_mall',
};

export function useLandmarkSearch() {
  const [places, setPlaces] = useState<MapboxPlace[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState<POICategory>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const searchNearby = useCallback(async (
    latitude: number,
    longitude: number,
    category: POICategory = 'all'
  ) => {
    setLoading(true);
    setActiveCategory(category);
    try {
      const query = CATEGORY_QUERIES[category] || CATEGORY_QUERIES.all;
      const results = await mapboxService.getNearbyPOIs(latitude, longitude, query, 15);
      setPlaces(results);
    } catch (e) {
      console.warn('Landmark search error:', e);
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
      console.warn('Search error:', e);
      setPlaces([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    places,
    loading,
    activeCategory,
    searchQuery,
    searchNearby,
    searchByText,
    setActiveCategory,
  };
}
