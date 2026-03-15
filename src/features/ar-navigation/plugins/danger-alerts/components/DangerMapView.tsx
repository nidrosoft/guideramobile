/**
 * SAFETY MAP VIEW
 *
 * Clean dark map with risk zone circles and alert pin markers.
 * Uses Mapbox (dev build) or react-native-maps (Expo Go) — same dual-path as CityMapView.
 * No clutter — just the map, zones, and pins.
 */

import React, { useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Gps } from 'iconsax-react-native';
import { colors, spacing } from '@/styles';
import { DangerZone, Incident, Coordinates, DangerLevel } from '../types/dangerAlerts.types';

// Try Mapbox first, fall back to react-native-maps
let MapboxGL: any = null;
let MAPBOX_AVAILABLE = false;
try { MapboxGL = require('@rnmapbox/maps').default; MAPBOX_AVAILABLE = true; } catch { MAPBOX_AVAILABLE = false; }

let RNMapView: any = null;
let RNMarker: any = null;
let RNCircle: any = null;
try {
  const RNMaps = require('react-native-maps');
  RNMapView = RNMaps.default; RNMarker = RNMaps.Marker; RNCircle = RNMaps.Circle;
} catch {}

function getDangerColor(level: DangerLevel, opacity: number = 1): string {
  const base: Record<DangerLevel, string> = { low: '245,158,11', medium: '249,115,22', high: '239,68,68', critical: '220,38,38' };
  return `rgba(${base[level] || base.low}, ${opacity})`;
}

interface DangerMapViewProps {
  userLocation: Coordinates | null;
  dangerZones: DangerZone[];
  incidents: Incident[];
  selectedZone: DangerZone | null;
  selectedIncident: Incident | null;
  onSelectZone: (zone: DangerZone) => void;
  onSelectIncident: (incident: Incident) => void;
}

export default function DangerMapView({
  userLocation,
  dangerZones,
  incidents,
  selectedZone,
  selectedIncident,
  onSelectZone,
  onSelectIncident,
}: DangerMapViewProps) {
  const cameraRef = useRef<any>(null);
  const rnMapRef = useRef<any>(null);

  const handleCenterOnUser = useCallback(() => {
    if (!userLocation) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (MAPBOX_AVAILABLE && cameraRef.current) {
      cameraRef.current.setCamera({
        centerCoordinate: [userLocation.longitude, userLocation.latitude],
        zoomLevel: 14,
        animationDuration: 800,
      });
    } else if (rnMapRef.current) {
      rnMapRef.current.animateToRegion({ ...userLocation, latitudeDelta: 0.02, longitudeDelta: 0.02 }, 500);
    }
  }, [userLocation]);

  const centerCoords: [number, number] = userLocation
    ? [userLocation.longitude, userLocation.latitude]
    : [-117.0713, 32.7767];

  // ── Mapbox path ──
  if (MAPBOX_AVAILABLE && MapboxGL) {
    // Build GeoJSON circles for danger zones
    const zoneFeatures = dangerZones.map(z => ({
      type: 'Feature' as const,
      id: z.id,
      properties: { level: z.level, title: z.title, radius: z.radius },
      geometry: { type: 'Point' as const, coordinates: [z.coordinates.longitude, z.coordinates.latitude] },
    }));

    return (
      <View style={styles.container}>
        <MapboxGL.MapView
          style={styles.map}
          styleURL={MapboxGL.StyleURL.Dark}
          logoEnabled={false}
          attributionEnabled={false}
          compassEnabled={false}
          scaleBarEnabled={false}
        >
          <MapboxGL.Camera
            ref={cameraRef}
            centerCoordinate={centerCoords}
            zoomLevel={13}
            animationMode="flyTo"
            animationDuration={1000}
          />
          <MapboxGL.UserLocation visible showsUserHeadingIndicator animated />

          {/* Danger zone markers */}
          {dangerZones.map(zone => (
            <MapboxGL.PointAnnotation
              key={zone.id}
              id={`zone-${zone.id}`}
              coordinate={[zone.coordinates.longitude, zone.coordinates.latitude]}
              onSelected={() => onSelectZone(zone)}
            >
              <View style={[styles.zonePin, { backgroundColor: getDangerColor(zone.level, 0.9) }]}>
                <Text style={styles.zonePinText}>!</Text>
              </View>
            </MapboxGL.PointAnnotation>
          ))}

          {/* Incident markers */}
          {incidents.map(inc => (
            <MapboxGL.PointAnnotation
              key={inc.id}
              id={`inc-${inc.id}`}
              coordinate={[inc.coordinates.longitude, inc.coordinates.latitude]}
              onSelected={() => onSelectIncident(inc)}
            >
              <View style={[styles.incidentPin, { borderColor: getDangerColor(inc.level, 0.8) }]}>
                <Text style={styles.incidentPinText}>{String.fromCodePoint(0x26A0)}</Text>
              </View>
            </MapboxGL.PointAnnotation>
          ))}
        </MapboxGL.MapView>

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
    ? { ...userLocation, latitudeDelta: 0.03, longitudeDelta: 0.03 }
    : { latitude: 32.7767, longitude: -117.0713, latitudeDelta: 0.03, longitudeDelta: 0.03 };

  return (
    <View style={styles.container}>
      <RNMapView
        ref={rnMapRef}
        style={styles.map}
        provider={Platform.OS === 'android' ? 'google' : undefined}
        initialRegion={initialRegion}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {dangerZones.map(zone => (
          <React.Fragment key={zone.id}>
            <RNCircle
              center={zone.coordinates}
              radius={zone.radius}
              fillColor={getDangerColor(zone.level, 0.25)}
              strokeColor={getDangerColor(zone.level, 0.7)}
              strokeWidth={2}
            />
            <RNMarker
              coordinate={zone.coordinates}
              onPress={() => onSelectZone(zone)}
              pinColor={zone.level === 'critical' ? 'red' : zone.level === 'high' ? 'orange' : 'yellow'}
            />
          </React.Fragment>
        ))}
        {incidents.map(inc => (
          <RNMarker
            key={inc.id}
            coordinate={inc.coordinates}
            onPress={() => onSelectIncident(inc)}
            pinColor="red"
          />
        ))}
      </RNMapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  zonePin: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#FFFFFF',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.4, shadowRadius: 4, elevation: 5,
  },
  zonePinText: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
  incidentPin: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)', borderWidth: 2,
  },
  incidentPinText: { fontSize: 14 },
  gpsButton: {
    position: 'absolute',
    top: 160, right: 16,
    width: 48, height: 48,
    borderRadius: 24,
    backgroundColor: colors.gray900,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: colors.gray800,
  },
});
