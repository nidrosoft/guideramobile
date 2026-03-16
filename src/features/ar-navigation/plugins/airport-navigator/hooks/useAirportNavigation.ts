/**
 * AIRPORT NAVIGATION HOOK
 *
 * Indoor airport navigation. Currently uses Mapbox Directions API
 * for walking routes between airport coordinates.
 * Real indoor positioning (BLE/Wi-Fi) requires future infrastructure.
 *
 * No mock data — shows real walking directions or "not available" state.
 */

import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { NavigationRoute, NavigationStep } from '../types/navigation.types';
import { mapboxService, MapboxService } from '../../../services/mapbox.service';

export function useAirportNavigation() {
  const [isNavigating, setIsNavigating] = useState(false);
  const [route, setRoute] = useState<NavigationRoute | null>(null);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState<NavigationStep | null>(null);
  const [remainingDistance, setRemainingDistance] = useState(0);
  const [currentFloor, setCurrentFloor] = useState(1);
  const [floorChanged, setFloorChanged] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  // Get user location on mount
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        const loc = await Location.getCurrentPositionAsync({});
        setUserLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      } catch {}
    })();
  }, []);

  const startNavigation = async (destination: string, type: 'gate' | 'flight' | 'poi') => {
    setError(null);

    if (!userLocation) {
      setError('Location not available. Please enable location services.');
      return;
    }

    if (!mapboxService.isConfigured) {
      setError('Navigation service not configured. Mapbox API required.');
      return;
    }

    try {
      // Search for the destination near the user (airport context)
      const results = await mapboxService.geocode(
        `${destination} airport`,
        { lat: userLocation.latitude, lng: userLocation.longitude }
      );

      if (results.length === 0) {
        setError(`Could not find "${destination}" nearby. Try a different gate or location.`);
        return;
      }

      const dest = results[0];

      // Get walking directions from Mapbox
      const mbRoute = await mapboxService.getDirections(
        { lat: userLocation.latitude, lng: userLocation.longitude },
        { lat: dest.coordinates.latitude, lng: dest.coordinates.longitude },
        'walking'
      );

      if (!mbRoute) {
        setError('Could not calculate route. Try again.');
        return;
      }

      // Map Mapbox route to our NavigationRoute format
      const steps: NavigationStep[] = mbRoute.steps.map((s, i) => ({
        id: String(i + 1),
        instruction: s.instruction || `Step ${i + 1}`,
        distance: Math.round(s.distance),
        direction: mapManeuverToDirection(s.maneuver.type, s.maneuver.modifier),
      }));

      const navRoute: NavigationRoute = {
        destination: dest.name || destination,
        destinationType: type === 'gate' ? 'gate' : type === 'flight' ? 'gate' : 'restroom',
        currentStep: 1,
        totalSteps: steps.length,
        totalDistance: Math.round(mbRoute.distance),
        estimatedTime: Math.round(mbRoute.duration / 60),
        steps,
      };

      setRoute(navRoute);
      setCurrentStep(steps[0] || null);
      setIsNavigating(true);
      setProgress(0);
      setRemainingDistance(navRoute.totalDistance);

    } catch (err: any) {
      setError(err?.message || 'Navigation failed. Try again.');
      if (__DEV__) console.warn('Airport navigation error:', err);
    }
  };

  const stopNavigation = () => {
    setIsNavigating(false);
    setRoute(null);
    setCurrentStep(null);
    setProgress(0);
    setRemainingDistance(0);
    setCurrentFloor(1);
    setFloorChanged(false);
    setError(null);
  };

  return {
    isNavigating,
    route,
    progress,
    currentStep,
    remainingDistance,
    currentFloor,
    floorChanged,
    error,
    startNavigation,
    stopNavigation,
  };
}

// Map Mapbox maneuver types to our direction format
function mapManeuverToDirection(type: string, modifier?: string): any {
  if (type === 'turn') {
    if (modifier?.includes('left')) return 'left';
    if (modifier?.includes('right')) return 'right';
  }
  if (type === 'arrive') return 'straight';
  if (type === 'depart') return 'straight';
  if (modifier?.includes('slight_left')) return 'slight_left';
  if (modifier?.includes('slight_right')) return 'slight_right';
  return 'straight';
}
