/**
 * CITY MAP VIEW
 *
 * Map view with Mapbox (@rnmapbox/maps) when available (dev build),
 * falls back to react-native-maps (Expo Go compatible).
 * Features: 3D buildings, real route lines, POI markers.
 */

import React, { useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Gps } from 'iconsax-react-native';
import { colors } from '@/styles';
import { POI, Route, Coordinates, DangerZone } from '../types/cityNavigator.types';

// Try to load Mapbox — falls back to null if native module not linked (Expo Go)
let MapboxGL: any = null;
let MAPBOX_AVAILABLE = false;
try {
  MapboxGL = require('@rnmapbox/maps').default;
  MAPBOX_AVAILABLE = true;
} catch {
  MAPBOX_AVAILABLE = false;
}

// Fallback: react-native-maps (always available in Expo Go)
let RNMapView: any = null;
let RNMarker: any = null;
let RNPolyline: any = null;
let PROVIDER_GOOGLE: any = null;
try {
  const RNMaps = require('react-native-maps');
  RNMapView = RNMaps.default;
  RNMarker = RNMaps.Marker;
  RNPolyline = RNMaps.Polyline;
  PROVIDER_GOOGLE = RNMaps.PROVIDER_GOOGLE;
} catch { /* neither available */ }

interface CityMapViewProps {
  userLocation: Coordinates | null;
  pois: POI[];
  selectedPOI: POI | null;
  route: Route | null;
  dangerZones?: DangerZone[];
  showDangerZones?: boolean;
  onSelectPOI: (poi: POI) => void;
  onMapReady?: () => void;
  onCenterLocation?: () => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  landmark: '#9333ea',
  restaurant: '#ef4444',
  cafe: '#f97316',
  hotel: '#3b82f6',
  museum: '#6366f1',
  park: '#22c55e',
  shopping: '#ec4899',
  transport: '#1e3a5f',
  attraction: '#eab308',
  nightlife: '#8b5cf6',
  health: '#14b8a6',
  service: '#6b7280',
};

export default function CityMapView({
  userLocation,
  pois,
  selectedPOI,
  route,
  dangerZones = [],
  showDangerZones = false,
  onSelectPOI,
  onMapReady,
}: CityMapViewProps) {
  const cameraRef = useRef<any>(null);
  const rnMapRef = useRef<any>(null);

  const handleCenterOnUser = useCallback(() => {
    if (!userLocation) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (MAPBOX_AVAILABLE && cameraRef.current) {
      cameraRef.current.setCamera({
        centerCoordinate: [userLocation.longitude, userLocation.latitude],
        zoomLevel: 15,
        pitch: 45,
        animationDuration: 800,
      });
    } else if (rnMapRef.current) {
      rnMapRef.current.animateToRegion({
        ...userLocation,
        latitudeDelta: 0.015,
        longitudeDelta: 0.015,
      }, 500);
    }
  }, [userLocation]);

  // ─── Mapbox path ───
  if (MAPBOX_AVAILABLE && MapboxGL) {
    const centerCoords: [number, number] = userLocation
      ? [userLocation.longitude, userLocation.latitude]
      : [-117.0713, 32.7767];

    const routeGeoJSON = route ? {
      type: 'Feature' as const,
      properties: {},
      geometry: {
        type: 'LineString' as const,
        coordinates: route.polyline.map(c => [c.longitude, c.latitude]),
      },
    } : null;

    return (
      <View style={styles.container}>
        <MapboxGL.MapView
          style={styles.map}
          styleURL={MapboxGL.StyleURL.Dark}
          logoEnabled={false}
          attributionEnabled={false}
          compassEnabled={false}
          scaleBarEnabled={false}
          onDidFinishLoadingMap={() => onMapReady?.()}
        >
          <MapboxGL.Camera
            ref={cameraRef}
            centerCoordinate={centerCoords}
            zoomLevel={14}
            pitch={45}
            animationMode="flyTo"
            animationDuration={1000}
          />
          <MapboxGL.UserLocation visible showsUserHeadingIndicator animated />

          {routeGeoJSON && (
            <MapboxGL.ShapeSource id="route-source" shape={routeGeoJSON}>
              <MapboxGL.LineLayer
                id="route-line"
                style={{ lineColor: colors.primary, lineWidth: 5, lineCap: 'round', lineJoin: 'round', lineOpacity: 0.9 }}
              />
            </MapboxGL.ShapeSource>
          )}

          {pois.map(poi => (
            <MapboxGL.PointAnnotation
              key={poi.id}
              id={poi.id}
              coordinate={[poi.coordinates.longitude, poi.coordinates.latitude]}
              title={poi.name}
              onSelected={() => onSelectPOI(poi)}
            >
              <View style={[styles.poiMarker, { backgroundColor: CATEGORY_COLORS[poi.category] || '#ef4444' }]}>
                <Text style={styles.poiMarkerText}>{poi.name.charAt(0)}</Text>
              </View>
            </MapboxGL.PointAnnotation>
          ))}

          {route && (
            <MapboxGL.PointAnnotation
              id="destination"
              coordinate={[route.destination.longitude, route.destination.latitude]}
              title={route.destinationName}
            >
              <View style={styles.destinationMarker}>
                <View style={styles.destinationPin} />
              </View>
            </MapboxGL.PointAnnotation>
          )}
        </MapboxGL.MapView>

        <TouchableOpacity style={styles.gpsButton} onPress={handleCenterOnUser} activeOpacity={0.8}>
          <Gps size={22} color={colors.primary} variant="Bold" />
        </TouchableOpacity>
      </View>
    );
  }

  // ─── Fallback: react-native-maps ───
  if (!RNMapView) {
    return (
      <View style={[styles.container, styles.fallback]}>
        <Text style={styles.fallbackText}>Map not available</Text>
      </View>
    );
  }

  const initialRegion = userLocation
    ? { ...userLocation, latitudeDelta: 0.02, longitudeDelta: 0.02 }
    : { latitude: 32.7767, longitude: -117.0713, latitudeDelta: 0.02, longitudeDelta: 0.02 };

  return (
    <View style={styles.container}>
      <RNMapView
        ref={rnMapRef}
        style={styles.map}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={initialRegion}
        showsUserLocation
        showsMyLocationButton={false}
        onMapReady={() => onMapReady?.()}
      >
        {route && (
          <RNPolyline
            coordinates={route.polyline}
            strokeColor={colors.primary}
            strokeWidth={5}
          />
        )}
        {pois.map((poi: POI) => (
          <RNMarker
            key={poi.id}
            coordinate={poi.coordinates}
            title={poi.name}
            pinColor={CATEGORY_COLORS[poi.category] || 'red'}
            onPress={() => onSelectPOI(poi)}
          />
        ))}
      </RNMapView>

      <TouchableOpacity style={styles.gpsButton} onPress={handleCenterOnUser} activeOpacity={0.8}>
        <Gps size={22} color={colors.primary} variant="Bold" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  gpsButton: {
    position: 'absolute',
    top: 100,
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(24,24,27,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  poiMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  poiMarkerText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  destinationMarker: {
    alignItems: 'center',
  },
  destinationPin: {
    width: 28,
    height: 28,
    backgroundColor: colors.primary,
    borderRadius: 14,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  fallback: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  fallbackText: {
    color: '#888',
    fontSize: 16,
  },
});
