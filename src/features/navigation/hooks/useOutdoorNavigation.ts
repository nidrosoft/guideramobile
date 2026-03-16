/**
 * USE OUTDOOR NAVIGATION HOOK
 *
 * Manages Mapbox-powered outdoor navigation:
 * - Route calculation via Mapbox Directions API
 * - Real-time position tracking
 * - Auto-rerouting when user deviates
 * - Voice guidance via expo-speech
 * - ETA and distance tracking
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import * as Location from 'expo-location';
import { mapboxService, MapboxRoute, MapboxService } from '@/features/ar-navigation/services/mapbox.service';
import { voiceService } from '../services/voice.service';

export type NavigationProfile = 'walking' | 'driving' | 'cycling';

export interface NavigationState {
  isNavigating: boolean;
  isLoading: boolean;
  route: MapboxRoute | null;
  routeCoordinates: { latitude: number; longitude: number }[];
  currentStepIndex: number;
  distanceRemaining: number; // meters
  durationRemaining: number; // seconds
  nextInstruction: string;
  profile: NavigationProfile;
  destination: { latitude: number; longitude: number; name: string } | null;
  userLocation: { latitude: number; longitude: number } | null;
  error: string | null;
}

const REROUTE_THRESHOLD_METERS = 50; // reroute if user is >50m from route
const STEP_ADVANCE_METERS = 30; // advance to next step when within 30m

export function useOutdoorNavigation() {
  const [state, setState] = useState<NavigationState>({
    isNavigating: false,
    isLoading: false,
    route: null,
    routeCoordinates: [],
    currentStepIndex: 0,
    distanceRemaining: 0,
    durationRemaining: 0,
    nextInstruction: '',
    profile: 'walking',
    destination: null,
    userLocation: null,
    error: null,
  });

  const locationSub = useRef<Location.LocationSubscription | null>(null);
  const lastSpokenStep = useRef(-1);

  // Start watching user location
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setState(prev => ({ ...prev, userLocation: { latitude: loc.coords.latitude, longitude: loc.coords.longitude } }));
    })();
  }, []);

  // Start live tracking when navigating
  useEffect(() => {
    if (!state.isNavigating) {
      if (locationSub.current) {
        locationSub.current.remove();
        locationSub.current = null;
      }
      return;
    }

    (async () => {
      locationSub.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.BestForNavigation, distanceInterval: 5, timeInterval: 2000 },
        (loc) => {
          const newLoc = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
          setState(prev => ({ ...prev, userLocation: newLoc }));
        }
      );
    })();

    return () => {
      if (locationSub.current) {
        locationSub.current.remove();
        locationSub.current = null;
      }
    };
  }, [state.isNavigating]);

  // Check step advancement + rerouting when location changes during navigation
  useEffect(() => {
    if (!state.isNavigating || !state.userLocation || !state.route) return;

    const { steps } = state.route;
    const { currentStepIndex, userLocation } = state;

    // Check if we should advance to next step
    if (currentStepIndex < steps.length - 1) {
      // Simple check: if total remaining distance decreased significantly, advance
      const currentStep = steps[currentStepIndex];
      if (currentStep && currentStep.distance < STEP_ADVANCE_METERS) {
        const nextIdx = currentStepIndex + 1;
        const nextStep = steps[nextIdx];
        if (nextStep) {
          setState(prev => ({
            ...prev,
            currentStepIndex: nextIdx,
            nextInstruction: nextStep.instruction,
            distanceRemaining: prev.distanceRemaining - currentStep.distance,
            durationRemaining: prev.durationRemaining - currentStep.duration,
          }));

          // Voice guidance for new step
          if (nextIdx !== lastSpokenStep.current) {
            lastSpokenStep.current = nextIdx;
            voiceService.speak(nextStep.instruction);
          }
        }
      }
    }

    // Check if arrived
    if (state.destination) {
      const distToDest = haversine(
        userLocation.latitude, userLocation.longitude,
        state.destination.latitude, state.destination.longitude
      );
      if (distToDest < 20) {
        voiceService.speak('You have arrived at your destination.');
        stopNavigation();
      }
    }
  }, [state.userLocation, state.isNavigating]);

  // Start navigation to a destination
  const startNavigation = useCallback(async (
    destination: { latitude: number; longitude: number; name: string },
    profile: NavigationProfile = 'walking'
  ) => {
    if (!state.userLocation) {
      setState(prev => ({ ...prev, error: 'Location not available' }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null, destination, profile }));

    try {
      const route = await mapboxService.getDirections(
        { lat: state.userLocation.latitude, lng: state.userLocation.longitude },
        { lat: destination.latitude, lng: destination.longitude },
        profile
      );

      if (!route) {
        setState(prev => ({ ...prev, isLoading: false, error: 'Could not calculate route' }));
        return;
      }

      const coords = MapboxService.decodeRouteCoordinates(route.geometry);
      const firstStep = route.steps[0];

      setState(prev => ({
        ...prev,
        isNavigating: true,
        isLoading: false,
        route,
        routeCoordinates: coords,
        currentStepIndex: 0,
        distanceRemaining: route.distance,
        durationRemaining: route.duration,
        nextInstruction: firstStep?.instruction || 'Start navigating',
        error: null,
      }));

      lastSpokenStep.current = 0;
      voiceService.speak(firstStep?.instruction || `Navigating to ${destination.name}`);

    } catch (err: any) {
      setState(prev => ({ ...prev, isLoading: false, error: err?.message || 'Navigation failed' }));
    }
  }, [state.userLocation]);

  // Reroute from current position
  const reroute = useCallback(async () => {
    if (!state.userLocation || !state.destination) return;
    await startNavigation(state.destination, state.profile);
  }, [state.userLocation, state.destination, state.profile, startNavigation]);

  // Stop navigation
  const stopNavigation = useCallback(() => {
    voiceService.stop();
    lastSpokenStep.current = -1;
    setState(prev => ({
      ...prev,
      isNavigating: false,
      route: null,
      routeCoordinates: [],
      currentStepIndex: 0,
      distanceRemaining: 0,
      durationRemaining: 0,
      nextInstruction: '',
      destination: null,
      error: null,
    }));
  }, []);

  // Set navigation profile
  const setProfile = useCallback((profile: NavigationProfile) => {
    setState(prev => ({ ...prev, profile }));
    // If currently navigating, recalculate route with new profile
    if (state.isNavigating && state.destination) {
      startNavigation(state.destination, profile);
    }
  }, [state.isNavigating, state.destination, startNavigation]);

  // Toggle voice
  const toggleVoice = useCallback(() => {
    voiceService.setEnabled(!voiceService.isEnabled);
  }, []);

  return {
    ...state,
    voiceEnabled: voiceService.isEnabled,
    startNavigation,
    stopNavigation,
    reroute,
    setProfile,
    toggleVoice,
  };
}

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
