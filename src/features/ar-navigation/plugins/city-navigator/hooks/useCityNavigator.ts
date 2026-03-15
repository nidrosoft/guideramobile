/**
 * USE CITY NAVIGATOR HOOK
 * 
 * Main state management hook for the City Navigator plugin.
 * Now wired to real Mapbox Directions + Geocoding APIs.
 * Falls back to mock data if Mapbox token is not configured.
 */

import { useState, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';
import {
  ViewMode,
  TransportMode,
  POI,
  Route,
  Coordinates,
  CityNavigatorState,
  DangerZone,
} from '../types/cityNavigator.types';
import { generatePOIsAroundLocation, generateDangerZonesAroundLocation } from '../data/mockPOIs';
import { mapboxService, MapboxService } from '../../../services/mapbox.service';
import type { POICategory } from '../types/cityNavigator.types';

// Map Mapbox category strings to our POICategory type
function mapMapboxCategory(raw: string): POICategory {
  const lower = (raw || '').toLowerCase();
  if (lower.includes('restaurant') || lower.includes('food')) return 'restaurant';
  if (lower.includes('cafe') || lower.includes('coffee')) return 'cafe';
  if (lower.includes('hotel') || lower.includes('lodging')) return 'hotel';
  if (lower.includes('museum') || lower.includes('gallery')) return 'museum';
  if (lower.includes('park') || lower.includes('garden')) return 'park';
  if (lower.includes('shop') || lower.includes('store') || lower.includes('mall')) return 'shopping';
  if (lower.includes('station') || lower.includes('transit') || lower.includes('bus')) return 'transport';
  if (lower.includes('bar') || lower.includes('club') || lower.includes('night')) return 'nightlife';
  if (lower.includes('hospital') || lower.includes('pharmacy') || lower.includes('doctor')) return 'health';
  if (lower.includes('landmark') || lower.includes('monument') || lower.includes('historic')) return 'landmark';
  if (lower.includes('attraction') || lower.includes('tourism')) return 'attraction';
  return 'service';
}

const INITIAL_STATE: CityNavigatorState = {
  viewMode: 'map', // Default to map view so POIs are visible immediately
  transportMode: 'walk',
  userLocation: null,
  selectedPOI: null,
  route: null,
  isNavigating: false,
  isLoading: false,
  searchQuery: '',
  pois: [],
  dangerZones: [],
};

export function useCityNavigator() {
  const [state, setState] = useState<CityNavigatorState>(INITIAL_STATE);

  // Get user location on mount
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.log('Location permission denied');
          return;
        }

        const location = await Location.getCurrentPositionAsync({});
        setState(prev => ({
          ...prev,
          userLocation: {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          },
        }));
      } catch (error) {
        console.error('Error getting location:', error);
        // Use mock location (Paris) if location fails
        setState(prev => ({
          ...prev,
          userLocation: { latitude: 48.8566, longitude: 2.3522 },
        }));
      }
    })();
  }, []);

  // Load POIs when location is available
  useEffect(() => {
    if (state.userLocation) {
      loadPOIs();
      loadDangerZones();
    }
  }, [state.userLocation]);

  // Load POIs around user's location — uses Mapbox if configured, falls back to mock
  const loadPOIs = useCallback(async () => {
    if (!state.userLocation) return;
    
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      if (mapboxService.isConfigured) {
        // Real Mapbox POI search
        const places = await mapboxService.getNearbyPOIs(
          state.userLocation.latitude,
          state.userLocation.longitude,
          undefined, // all categories
          15
        );

        const mappedPOIs: POI[] = places.map((p, i) => {
          const coords = { latitude: p.coordinates.latitude, longitude: p.coordinates.longitude };
          const dist = calculateDistance(state.userLocation!, coords);
          return {
            id: p.id || `poi-${i}`,
            name: p.name,
            category: mapMapboxCategory(p.category),
            coordinates: coords,
            address: p.address || '',
            city: '',
            country: '',
            description: p.address,
            distance: dist,
            duration: Math.round(dist / 80),
          };
        });

        setState(prev => ({ ...prev, pois: mappedPOIs, isLoading: false }));
        console.log('📍 Loaded', mappedPOIs.length, 'real POIs from Mapbox');
      } else {
        // Mapbox not configured — show empty state
        setState(prev => ({ ...prev, pois: [], isLoading: false }));
        console.log('📍 Mapbox not configured — no POIs to show');
      }
    } catch (err) {
      console.warn('POI load error:', err);
      setState(prev => ({ ...prev, pois: [], isLoading: false }));
    }
  }, [state.userLocation]);

  // Load danger zones around user's location
  const loadDangerZones = useCallback(() => {
    if (!state.userLocation) return;
    
    const zones = generateDangerZonesAroundLocation(state.userLocation);
    setState(prev => ({
      ...prev,
      dangerZones: zones,
    }));
    
    console.log('⚠️ Loaded', zones.length, 'danger zones');
  }, [state.userLocation]);

  // Toggle view mode
  const toggleViewMode = useCallback(() => {
    setState(prev => ({
      ...prev,
      viewMode: prev.viewMode === 'camera' ? 'map' : 'camera',
    }));
  }, []);

  // Set view mode directly
  const setViewMode = useCallback((mode: ViewMode) => {
    setState(prev => ({ ...prev, viewMode: mode }));
  }, []);

  // Set transport mode
  const setTransportMode = useCallback((mode: TransportMode) => {
    setState(prev => ({ ...prev, transportMode: mode }));
  }, []);

  // Select a POI
  const selectPOI = useCallback((poi: POI | null) => {
    setState(prev => ({ ...prev, selectedPOI: poi }));
  }, []);

  // Start navigation to POI — uses Mapbox Directions if configured, falls back to mock
  const startNavigation = useCallback(async (poi: POI) => {
    if (!state.userLocation) return;

    setState(prev => ({ ...prev, isLoading: true }));

    const modeMap: Record<string, 'walking' | 'driving' | 'cycling'> = {
      walk: 'walking', car: 'driving', bike: 'cycling', scooter: 'cycling', all: 'walking',
    };
    const profile = modeMap[state.transportMode] || 'walking';

    try {
      if (mapboxService.isConfigured) {
        const mbRoute = await mapboxService.getDirections(
          { lat: state.userLocation.latitude, lng: state.userLocation.longitude },
          { lat: poi.coordinates.latitude, lng: poi.coordinates.longitude },
          profile
        );

        if (mbRoute) {
          const route: Route = {
            id: `route-${Date.now()}`,
            origin: state.userLocation,
            destination: poi.coordinates,
            destinationName: poi.name,
            distance: Math.round(mbRoute.distance),
            duration: Math.round(mbRoute.duration / 60),
            transportMode: state.transportMode === 'all' ? 'walk' : state.transportMode,
            polyline: MapboxService.decodeRouteCoordinates(mbRoute.geometry),
            steps: mbRoute.steps.map(s => ({
              instruction: s.instruction,
              distance: s.distance,
              duration: s.duration,
              maneuver: s.maneuver.type,
            })),
          };

          setState(prev => ({ ...prev, route, isNavigating: true, selectedPOI: poi, isLoading: false }));
          console.log('🗺️ Real Mapbox route:', Math.round(mbRoute.distance), 'm,', Math.round(mbRoute.duration / 60), 'min');
          return;
        }
      }
    } catch (err) {
      console.warn('Mapbox directions error:', err);
    }

    // If Mapbox failed or not configured, create a simple straight-line route (not mock data)
    const dist = calculateDistance(state.userLocation, poi.coordinates);
    const route: Route = {
      id: `route-${Date.now()}`,
      origin: state.userLocation,
      destination: poi.coordinates,
      destinationName: poi.name,
      distance: dist,
      duration: Math.round(dist / 80),
      transportMode: state.transportMode === 'all' ? 'walk' : state.transportMode,
      polyline: [state.userLocation, poi.coordinates],
    };
    setState(prev => ({ ...prev, route, isNavigating: true, selectedPOI: poi, isLoading: false }));
  }, [state.userLocation, state.transportMode]);

  // Stop navigation
  const stopNavigation = useCallback(() => {
    setState(prev => ({
      ...prev,
      route: null,
      isNavigating: false,
    }));
  }, []);

  // Search POIs
  const searchPOIs = useCallback((query: string) => {
    setState(prev => ({ ...prev, searchQuery: query }));
  }, []);

  // Get filtered POIs based on search
  const filteredPOIs = state.searchQuery
    ? state.pois.filter(poi =>
        poi.name.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
        poi.category.toLowerCase().includes(state.searchQuery.toLowerCase())
      )
    : state.pois;

  return {
    ...state,
    filteredPOIs,
    toggleViewMode,
    setViewMode,
    setTransportMode,
    selectPOI,
    startNavigation,
    stopNavigation,
    searchPOIs,
    loadPOIs,
  };
}

// Helper: Calculate distance between two coordinates (Haversine formula)
function calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (coord1.latitude * Math.PI) / 180;
  const φ2 = (coord2.latitude * Math.PI) / 180;
  const Δφ = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
  const Δλ = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c); // Distance in meters
}

// Helper: Generate mock polyline between two points
function generateMockPolyline(start: Coordinates, end: Coordinates): Coordinates[] {
  const points: Coordinates[] = [start];
  const steps = 10;
  
  for (let i = 1; i < steps; i++) {
    const ratio = i / steps;
    // Add some randomness to make it look like a real route
    const jitter = (Math.random() - 0.5) * 0.001;
    points.push({
      latitude: start.latitude + (end.latitude - start.latitude) * ratio + jitter,
      longitude: start.longitude + (end.longitude - start.longitude) * ratio + jitter,
    });
  }
  
  points.push(end);
  return points;
}
