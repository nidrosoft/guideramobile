/**
 * USE CITY NAVIGATOR HOOK
 * 
 * Main state management hook for the City Navigator plugin.
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

  // Load POIs around user's location
  const loadPOIs = useCallback(() => {
    if (!state.userLocation) return;
    
    setState(prev => ({ ...prev, isLoading: true }));
    
    // Generate POIs around user's actual location
    setTimeout(() => {
      const generatedPOIs = generatePOIsAroundLocation(state.userLocation!);
      
      // Calculate distance from user for each POI
      const poisWithDistance = generatedPOIs.map((poi: POI) => ({
        ...poi,
        distance: calculateDistance(state.userLocation!, poi.coordinates),
        duration: Math.round(calculateDistance(state.userLocation!, poi.coordinates) / 80), // ~80m/min walking
      }));

      setState(prev => ({
        ...prev,
        pois: poisWithDistance,
        isLoading: false,
      }));
      
      console.log('📍 Loaded', poisWithDistance.length, 'POIs around user location');
    }, 500);
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

  // Start navigation to POI
  const startNavigation = useCallback((poi: POI) => {
    if (!state.userLocation) return;

    // Create mock route
    const route: Route = {
      id: `route-${Date.now()}`,
      origin: state.userLocation,
      destination: poi.coordinates,
      destinationName: poi.name,
      distance: poi.distance || 0,
      duration: poi.duration || 0,
      transportMode: state.transportMode === 'all' ? 'walk' : state.transportMode,
      polyline: generateMockPolyline(state.userLocation, poi.coordinates),
    };

    setState(prev => ({
      ...prev,
      route,
      isNavigating: true,
      selectedPOI: poi,
    }));
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
