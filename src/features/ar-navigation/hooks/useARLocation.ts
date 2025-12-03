/**
 * USE AR LOCATION HOOK
 * 
 * Hook for GPS and location tracking.
 */

import { useState, useEffect } from 'react';
import { UserLocation } from '../types/ar-navigation.types';

export function useARLocation() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [isTracking, setIsTracking] = useState(false);

  const requestPermission = async () => {
    // TODO: Implement location permission request
    // Using expo-location
    setHasPermission(true);
  };

  const startTracking = async () => {
    // TODO: Start location tracking
    setIsTracking(true);
  };

  const stopTracking = () => {
    // TODO: Stop location tracking
    setIsTracking(false);
  };

  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, []);

  return {
    hasPermission,
    location,
    isTracking,
    requestPermission,
    startTracking,
    stopTracking,
  };
}
