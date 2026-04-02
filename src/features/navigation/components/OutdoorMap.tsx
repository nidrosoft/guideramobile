/**
 * OUTDOOR MAP
 *
 * Mapbox 3D city navigation map with route rendering, camera follow,
 * and POI pin markers. Core visual component used by MapScreen.
 * Dual-path: Mapbox (dev build) / react-native-maps (Expo Go fallback).
 *
 * Uses MarkerView (not PointAnnotation) to avoid the "max 1 subview" error.
 * All POI markers use the app's primary color in a teardrop pin shape.
 *
 * Theme-aware: map style follows light/dark mode from ThemeContext.
 */

import React, { useRef, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Gps } from 'iconsax-react-native';
import { colors, spacing, borderRadius as br } from '@/styles';
import { shadows } from '@/styles/shadows';
import { useTheme } from '@/context/ThemeContext';
import type { MapboxPlace } from '@/features/ar-navigation/services/mapbox.service';

let MapboxGL: any = null;
let MAPBOX_AVAILABLE = false;
try { MapboxGL = require('@rnmapbox/maps').default; MAPBOX_AVAILABLE = true; } catch { MAPBOX_AVAILABLE = false; }

let RNMapView: any = null;
let RNMarker: any = null;
let RNPolyline: any = null;
try {
  const RNMaps = require('react-native-maps');
  RNMapView = RNMaps.default; RNMarker = RNMaps.Marker; RNPolyline = RNMaps.Polyline;
} catch {}

interface OutdoorMapProps {
  userLocation: { latitude: number; longitude: number } | null;
  routeCoordinates: { latitude: number; longitude: number }[];
  isNavigating: boolean;
  landmarks: MapboxPlace[];
  onLandmarkPress?: (place: MapboxPlace) => void;
  onMapReady?: () => void;
}

/**
 * Teardrop Pin Marker — looks like a classic Google Maps pin.
 * Uses the app's primary color for ALL POIs.
 * The white dot in the center mimics the reference pin the user showed.
 */
function MapPin() {
  return (
    <View style={pinStyles.container}>
      <View style={pinStyles.body}>
        <View style={pinStyles.dot} />
      </View>
      <View style={pinStyles.pointer} />
    </View>
  );
}

export default function OutdoorMap({
  userLocation,
  routeCoordinates,
  isNavigating,
  landmarks,
  onLandmarkPress,
  onMapReady,
}: OutdoorMapProps) {
  const cameraRef = useRef<any>(null);
  const rnMapRef = useRef<any>(null);
  const { isDark, colors: tc } = useTheme();

  const centerCoords: [number, number] = userLocation
    ? [userLocation.longitude, userLocation.latitude]
    : [0, 0];

  // Determine Mapbox style URL based on theme + navigation state
  const getMapStyleURL = useCallback(() => {
    if (isNavigating) {
      return isDark
        ? 'mapbox://styles/mapbox/navigation-night-v1'
        : 'mapbox://styles/mapbox/navigation-day-v1';
    }
    return isDark
      ? (MapboxGL?.StyleURL?.Dark ?? 'mapbox://styles/mapbox/dark-v11')
      : (MapboxGL?.StyleURL?.Light ?? 'mapbox://styles/mapbox/light-v11');
  }, [isDark, isNavigating]);

  const handleRecenter = useCallback(() => {
    if (!userLocation) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (MAPBOX_AVAILABLE && cameraRef.current) {
      cameraRef.current.setCamera({
        centerCoordinate: [userLocation.longitude, userLocation.latitude],
        zoomLevel: isNavigating ? 17 : 14,
        pitch: isNavigating ? 60 : 45,
        animationDuration: 800,
      });
    } else if (rnMapRef.current) {
      rnMapRef.current.animateToRegion({
        ...userLocation, latitudeDelta: 0.01, longitudeDelta: 0.01,
      }, 500);
    }
  }, [userLocation, isNavigating]);

  // Follow user during navigation
  useEffect(() => {
    if (isNavigating && userLocation && MAPBOX_AVAILABLE && cameraRef.current) {
      cameraRef.current.setCamera({
        centerCoordinate: [userLocation.longitude, userLocation.latitude],
        zoomLevel: 17,
        pitch: 60,
        heading: 0,
        animationDuration: 1000,
      });
    }
  }, [userLocation, isNavigating]);

  // ── Mapbox path ──
  if (MAPBOX_AVAILABLE && MapboxGL) {
    const routeGeoJSON = routeCoordinates.length > 1 ? {
      type: 'Feature' as const, properties: {},
      geometry: { type: 'LineString' as const, coordinates: routeCoordinates.map(c => [c.longitude, c.latitude]) },
    } : null;

    return (
      <View style={styles.container}>
        <MapboxGL.MapView
          style={styles.map}
          styleURL={getMapStyleURL()}
          logoEnabled={false} attributionEnabled={false} compassEnabled={false} scaleBarEnabled={false}
          onDidFinishLoadingMap={() => onMapReady?.()}
        >
          <MapboxGL.Camera
            ref={cameraRef}
            centerCoordinate={centerCoords}
            zoomLevel={isNavigating ? 17 : 14}
            pitch={isNavigating ? 60 : 45}
            animationMode="flyTo"
            animationDuration={1000}
            followUserLocation={isNavigating}
            followUserMode={isNavigating ? 'compass' : 'normal'}
          />
          <MapboxGL.UserLocation visible showsUserHeadingIndicator animated />

          {/* Route line */}
          {routeGeoJSON && (
            <MapboxGL.ShapeSource id="nav-route" shape={routeGeoJSON}>
              <MapboxGL.LineLayer
                id="nav-route-line"
                style={{
                  lineColor: tc.primary,
                  lineWidth: isNavigating ? 8 : 5,
                  lineCap: 'round', lineJoin: 'round',
                  lineOpacity: 0.9,
                }}
              />
            </MapboxGL.ShapeSource>
          )}

          {/* POI Pin Markers — using MarkerView to avoid PointAnnotation subview error */}
          {!isNavigating && landmarks.map(place => (
            <MapboxGL.MarkerView
              key={place.id}
              id={`marker-${place.id}`}
              coordinate={[place.coordinates.longitude, place.coordinates.latitude]}
              anchor={{ x: 0.5, y: 1 }}
            >
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => onLandmarkPress?.(place)}
              >
                <MapPin />
              </TouchableOpacity>
            </MapboxGL.MarkerView>
          ))}
        </MapboxGL.MapView>

        <TouchableOpacity
          style={[styles.gpsBtn, { backgroundColor: tc.bgElevated }]}
          onPress={handleRecenter}
          activeOpacity={0.8}
        >
          <Gps size={20} color={tc.primary} variant="Bold" />
        </TouchableOpacity>
      </View>
    );
  }

  // ── Fallback: react-native-maps ──
  if (!RNMapView) {
    return (
      <View style={[styles.container, { backgroundColor: tc.bgSecondary, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: tc.textTertiary, fontSize: 16 }}>Map not available</Text>
      </View>
    );
  }

  const initialRegion = userLocation
    ? { ...userLocation, latitudeDelta: 0.02, longitudeDelta: 0.02 }
    : { latitude: 0, longitude: 0, latitudeDelta: 0.02, longitudeDelta: 0.02 };

  return (
    <View style={styles.container}>
      <RNMapView
        ref={rnMapRef}
        style={styles.map}
        provider={Platform.OS === 'android' ? 'google' : undefined}
        initialRegion={initialRegion}
        showsUserLocation showsMyLocationButton={false}
        onMapReady={() => onMapReady?.()}
        userInterfaceStyle={isDark ? 'dark' : 'light'}
      >
        {routeCoordinates.length > 1 && (
          <RNPolyline coordinates={routeCoordinates} strokeColor={tc.primary} strokeWidth={6} />
        )}
        {!isNavigating && landmarks.map(place => (
          <RNMarker
            key={place.id}
            coordinate={{ latitude: place.coordinates.latitude, longitude: place.coordinates.longitude }}
            title={place.name}
            onPress={() => onLandmarkPress?.(place)}
          >
            <MapPin />
          </RNMarker>
        ))}
      </RNMapView>

      <TouchableOpacity
        style={[styles.gpsBtn, { backgroundColor: tc.bgElevated }]}
        onPress={handleRecenter}
        activeOpacity={0.8}
      >
        <Gps size={20} color={tc.primary} variant="Bold" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  gpsBtn: {
    position: 'absolute', bottom: 180, right: spacing.md,
    width: 44, height: 44, borderRadius: br.lg,  // 14 — matches card inner elements
    alignItems: 'center', justifyContent: 'center',
    ...shadows.card,
  },
});

// Pin styles use static primary color — pin color is always the brand color
const pinStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: 30,
    height: 42,
  },
  body: {
    width: 28,
    height: 28,
    borderRadius: br.lg,  // 14 — half of width for circle
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: colors.white,
    ...shadows.cardLight,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: br.sm,  // 6 — small rounded
    backgroundColor: colors.white,
  },
  pointer: {
    width: 0,
    height: 0,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderTopWidth: 11,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: colors.primary,
    marginTop: -3,
  },
});
