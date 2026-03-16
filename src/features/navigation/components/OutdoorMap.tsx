/**
 * OUTDOOR MAP
 *
 * Mapbox 3D city navigation map with route rendering, camera follow,
 * and POI markers. Core visual component used by MapScreen.
 * Dual-path: Mapbox (dev build) / react-native-maps (Expo Go fallback).
 */

import React, { useRef, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Gps } from 'iconsax-react-native';
import { colors, spacing } from '@/styles';
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

  const centerCoords: [number, number] = userLocation
    ? [userLocation.longitude, userLocation.latitude]
    : [-117.0713, 32.7767];

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
          styleURL={isNavigating ? 'mapbox://styles/mapbox/navigation-night-v1' : MapboxGL.StyleURL.Dark}
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
                  lineColor: colors.primary,
                  lineWidth: isNavigating ? 8 : 5,
                  lineCap: 'round', lineJoin: 'round',
                  lineOpacity: 0.9,
                }}
              />
            </MapboxGL.ShapeSource>
          )}

          {/* Landmark markers */}
          {!isNavigating && landmarks.map(place => (
            <MapboxGL.PointAnnotation
              key={place.id}
              id={place.id}
              coordinate={[place.coordinates.longitude, place.coordinates.latitude]}
              title={place.name}
              onSelected={() => onLandmarkPress?.(place)}
            >
              <View style={styles.landmarkPin}>
                <Text style={styles.landmarkPinText}>{place.name.charAt(0)}</Text>
              </View>
            </MapboxGL.PointAnnotation>
          ))}
        </MapboxGL.MapView>

        <TouchableOpacity style={styles.gpsBtn} onPress={handleRecenter} activeOpacity={0.8}>
          <Gps size={20} color={colors.primary} variant="Bold" />
        </TouchableOpacity>
      </View>
    );
  }

  // ── Fallback: react-native-maps ──
  if (!RNMapView) {
    return <View style={[styles.container, { backgroundColor: '#1a1a2e', justifyContent: 'center', alignItems: 'center' }]}>
      <Text style={{ color: '#666', fontSize: 16 }}>Map not available</Text>
    </View>;
  }

  const initialRegion = userLocation
    ? { ...userLocation, latitudeDelta: 0.02, longitudeDelta: 0.02 }
    : { latitude: 32.7767, longitude: -117.0713, latitudeDelta: 0.02, longitudeDelta: 0.02 };

  return (
    <View style={styles.container}>
      <RNMapView
        ref={rnMapRef}
        style={styles.map}
        provider={Platform.OS === 'android' ? 'google' : undefined}
        initialRegion={initialRegion}
        showsUserLocation showsMyLocationButton={false}
        onMapReady={() => onMapReady?.()}
      >
        {routeCoordinates.length > 1 && (
          <RNPolyline coordinates={routeCoordinates} strokeColor={colors.primary} strokeWidth={6} />
        )}
        {!isNavigating && landmarks.map(place => (
          <RNMarker
            key={place.id}
            coordinate={{ latitude: place.coordinates.latitude, longitude: place.coordinates.longitude }}
            title={place.name}
            onPress={() => onLandmarkPress?.(place)}
            pinColor={colors.primary}
          />
        ))}
      </RNMapView>

      <TouchableOpacity style={styles.gpsBtn} onPress={handleRecenter} activeOpacity={0.8}>
        <Gps size={20} color={colors.primary} variant="Bold" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  gpsBtn: {
    position: 'absolute', bottom: 180, right: 16,
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(24,24,40,0.9)',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 6,
  },
  landmarkPin: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#FFFFFF',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 4,
  },
  landmarkPinText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
});
