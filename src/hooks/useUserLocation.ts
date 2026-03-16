/**
 * USE USER LOCATION HOOK
 * 
 * Provides the user's current location with city name via reverse geocoding.
 * Uses expo-location for GPS + native reverse geocoding.
 * Caches the result so subsequent calls don't re-request.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import * as Location from 'expo-location';

export interface UserLocation {
  latitude: number;
  longitude: number;
  city: string | null;
  region: string | null;
  country: string | null;
}

// Module-level cache so all consumers share the same resolved location
let cachedLocation: UserLocation | null = null;

export function useUserLocation() {
  const [location, setLocation] = useState<UserLocation | null>(cachedLocation);
  const [isLoading, setIsLoading] = useState(!cachedLocation);
  const [error, setError] = useState<string | null>(null);
  const fetchingRef = useRef(false);

  const fetchLocation = useCallback(async (force = false) => {
    // Return cache unless forced
    if (cachedLocation && !force) {
      setLocation(cachedLocation);
      setIsLoading(false);
      return;
    }

    // Prevent concurrent fetches
    if (fetchingRef.current) return;
    fetchingRef.current = true;

    setIsLoading(true);
    setError(null);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Location permission not granted');
        setIsLoading(false);
        fetchingRef.current = false;
        return;
      }

      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      let city: string | null = null;
      let region: string | null = null;
      let country: string | null = null;

      try {
        const [place] = await Location.reverseGeocodeAsync({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });

        if (place) {
          city = place.city || place.subregion || null;
          region = place.region || null;
          country = place.country || null;
        }
      } catch (geocodeErr) {
        if (__DEV__) console.warn('Reverse geocode failed:', geocodeErr);
      }

      const loc: UserLocation = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        city,
        region,
        country,
      };

      cachedLocation = loc;
      setLocation(loc);
    } catch (err: any) {
      if (__DEV__) console.warn('Location error:', err);
      setError(err.message || 'Failed to get location');
    } finally {
      setIsLoading(false);
      fetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    fetchLocation();
  }, [fetchLocation]);

  const refresh = useCallback(() => fetchLocation(true), [fetchLocation]);

  return { location, isLoading, error, refresh };
}
