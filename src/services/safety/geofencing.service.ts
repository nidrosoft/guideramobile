/**
 * SAFETY GEOFENCING SERVICE
 *
 * Background location monitoring with 1-mile radius zones.
 * Uses expo-location + expo-task-manager for background geofencing.
 * Triggers safety intelligence checks when user enters new zones.
 */

import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { safetyIntelligenceService } from './safety-intelligence.service';
import { sendSafetyNotification } from './safety-notifications';
import { SafetyZoneResult } from './types/safety.types';
import { supabase } from '@/lib/supabase/client';

const GEOFENCE_TASK = 'GUIDERA_SAFETY_GEOFENCE';
const LOCATION_TASK = 'GUIDERA_SAFETY_LOCATION';
const ONE_MILE_METERS = 1609;
const CHECK_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes between checks

// Track last check to avoid spamming APIs
let lastCheckTime = 0;
let lastCheckCoords = { lat: 0, lng: 0 };

/**
 * Define the background geofence task.
 * Must be called at module level (outside component).
 */
TaskManager.defineTask(GEOFENCE_TASK, async ({ data, error }: any) => {
  if (error) {
    if (__DEV__) console.warn('Geofence task error:', error);
    return;
  }
  if (!data) return;

  const { eventType, region } = data;
  if (eventType === Location.GeofencingEventType.Enter) {
    if (__DEV__) console.log('📍 Entered safety zone:', region.identifier);
    await checkSafetyForZone(region.latitude, region.longitude, region.identifier);
  }
});

/**
 * Define background location tracking task.
 * This runs periodically even when app is in background.
 */
TaskManager.defineTask(LOCATION_TASK, async ({ data, error }: any) => {
  if (error) {
    if (__DEV__) console.warn('Location task error:', error);
    return;
  }
  if (!data?.locations?.length) return;

  const { latitude, longitude } = data.locations[0].coords;
  const now = Date.now();

  // Throttle: only check every 5 minutes or if moved >500m
  const distFromLast = haversineMeters(lastCheckCoords.lat, lastCheckCoords.lng, latitude, longitude);
  if (now - lastCheckTime < CHECK_INTERVAL_MS && distFromLast < 500) return;

  lastCheckTime = now;
  lastCheckCoords = { lat: latitude, lng: longitude };

  await checkSafetyForZone(latitude, longitude, 'background-check');
});

/**
 * Core safety check — called by both geofence entry and background location
 */
async function checkSafetyForZone(lat: number, lng: number, zoneId: string) {
  try {
    const result = await safetyIntelligenceService.getRiskForLocation(lat, lng, 1);

    // Only notify if risk is caution or higher
    if (result.level !== 'safe') {
      await sendSafetyNotification(result);
    }

    // Save to Supabase (fire and forget)
    saveSafetyAlert(lat, lng, result).catch(console.warn);

  } catch (err) {
    if (__DEV__) console.warn('Safety zone check error:', err);
  }
}

/**
 * Save safety alert to Supabase
 */
async function saveSafetyAlert(lat: number, lng: number, result: SafetyZoneResult) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('safety_zone_alerts').insert({
      user_id: user.id,
      latitude: lat,
      longitude: lng,
      radius_meters: ONE_MILE_METERS,
      risk_level: result.level,
      risk_score: result.score,
      country_code: result.countryCode,
      country_name: result.countryName,
      country_advisory_level: result.countryAdvisoryLevel,
      travel_risk_score: result.travelRiskScore,
      crime_score: result.crimeScore,
      alerts: result.alerts,
      summary: result.summary,
      source: 'geofence',
    });
  } catch (e) {
    if (__DEV__) console.warn('Failed to save safety alert:', e);
  }
}

/**
 * Start background safety monitoring.
 * Call this when user enables safety alerts or starts a trip.
 */
export async function startSafetyMonitoring(): Promise<boolean> {
  try {
    const { status: fg } = await Location.requestForegroundPermissionsAsync();
    if (fg !== 'granted') return false;

    const { status: bg } = await Location.requestBackgroundPermissionsAsync();
    if (bg !== 'granted') {
      if (__DEV__) console.warn('Background location permission denied — safety monitoring limited to foreground');
    }

    // Start background location tracking
    const isTracking = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK).catch(() => false);
    if (!isTracking) {
      await Location.startLocationUpdatesAsync(LOCATION_TASK, {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: CHECK_INTERVAL_MS,
        distanceInterval: 500, // Only update after 500m movement
        showsBackgroundLocationIndicator: true,
        foregroundService: {
          notificationTitle: 'Guidera Safety',
          notificationBody: 'Monitoring your safety in the background',
          notificationColor: '#4ECDC4',
        },
      });
    }

    if (__DEV__) console.log('✅ Safety monitoring started');
    return true;
  } catch (e) {
    if (__DEV__) console.warn('Failed to start safety monitoring:', e);
    return false;
  }
}

/**
 * Stop background safety monitoring.
 */
export async function stopSafetyMonitoring() {
  try {
    const isTracking = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK).catch(() => false);
    if (isTracking) {
      await Location.stopLocationUpdatesAsync(LOCATION_TASK);
    }

    const isGeofencing = await Location.hasStartedGeofencingAsync(GEOFENCE_TASK).catch(() => false);
    if (isGeofencing) {
      await Location.stopGeofencingAsync(GEOFENCE_TASK);
    }

    if (__DEV__) console.log('🛑 Safety monitoring stopped');
  } catch (e) {
    if (__DEV__) console.warn('Failed to stop safety monitoring:', e);
  }
}

/**
 * Check if safety monitoring is currently active.
 */
export async function isSafetyMonitoringActive(): Promise<boolean> {
  try {
    return await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK);
  } catch {
    return false;
  }
}

/**
 * Do a one-time safety check for the current location (foreground use).
 */
export async function checkCurrentLocationSafety(): Promise<SafetyZoneResult | null> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return null;

    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    return await safetyIntelligenceService.getRiskForLocation(
      loc.coords.latitude,
      loc.coords.longitude,
      1
    );
  } catch (e) {
    if (__DEV__) console.warn('Current location safety check error:', e);
    return null;
  }
}

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
