/**
 * DANGER MAP VIEW
 * 
 * Dark-themed map showing danger zones and incidents.
 * Premium design with smooth animations.
 */

import React, { useRef, useEffect, useCallback } from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Haptics from 'expo-haptics';
import { Gps } from 'iconsax-react-native';
import { colors } from '@/styles';
import { DangerZone, Incident, Coordinates } from '../types/dangerAlerts.types';
import { getDangerColor } from '../data/mockDangerData';
import DangerMarker from './DangerMarker';
import IncidentMarker from './IncidentMarker';

const { width, height } = Dimensions.get('window');

interface DangerMapViewProps {
  userLocation: Coordinates | null;
  dangerZones: DangerZone[];
  incidents: Incident[];
  selectedZone: DangerZone | null;
  selectedIncident: Incident | null;
  onSelectZone: (zone: DangerZone) => void;
  onSelectIncident: (incident: Incident) => void;
}

// Dark map style for danger alerts
const DARK_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#1a1a2e' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1a1a2e' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d59563' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#2d2d44' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#1a1a2e' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#3d3d5c' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#1f1f3d' }],
  },
  {
    featureType: 'transit',
    elementType: 'geometry',
    stylers: [{ color: '#2f2f4f' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#0e1626' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#515c6d' }],
  },
];

export default function DangerMapView({
  userLocation,
  dangerZones,
  incidents,
  selectedZone,
  selectedIncident,
  onSelectZone,
  onSelectIncident,
}: DangerMapViewProps) {
  const mapRef = useRef<MapView>(null);

  // Center on user location
  const handleCenterOnUser = useCallback(() => {
    if (userLocation && mapRef.current) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      mapRef.current.animateToRegion({
        ...userLocation,
        latitudeDelta: 0.015,
        longitudeDelta: 0.015,
      }, 500);
    }
  }, [userLocation]);

  // Initial center on user
  useEffect(() => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        ...userLocation,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      }, 1000);
    }
  }, [userLocation]);

  const initialRegion = userLocation
    ? { ...userLocation, latitudeDelta: 0.02, longitudeDelta: 0.02 }
    : { latitude: 32.7767, longitude: -117.0713, latitudeDelta: 0.02, longitudeDelta: 0.02 };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={initialRegion}
        customMapStyle={DARK_MAP_STYLE}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
      >
        {/* Danger Zone Circles */}
        {dangerZones.map(zone => (
          <React.Fragment key={zone.id}>
            {/* Outer glow */}
            <Circle
              center={zone.coordinates}
              radius={zone.radius * 1.2}
              fillColor={getDangerColor(zone.level) + '15'}
              strokeColor="transparent"
            />
            {/* Main zone */}
            <Circle
              center={zone.coordinates}
              radius={zone.radius}
              fillColor={getDangerColor(zone.level) + '35'}
              strokeColor={getDangerColor(zone.level)}
              strokeWidth={2}
            />
            {/* Center marker */}
            <Marker
              coordinate={zone.coordinates}
              onPress={() => onSelectZone(zone)}
              anchor={{ x: 0.5, y: 0.5 }}
            >
              <DangerMarker 
                zone={zone} 
                isSelected={selectedZone?.id === zone.id}
              />
            </Marker>
          </React.Fragment>
        ))}

        {/* Incident Markers */}
        {incidents.map(incident => (
          <Marker
            key={incident.id}
            coordinate={incident.coordinates}
            onPress={() => onSelectIncident(incident)}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <IncidentMarker
              incident={incident}
              isSelected={selectedIncident?.id === incident.id}
            />
          </Marker>
        ))}

        {/* User Location */}
        {userLocation && (
          <Marker
            coordinate={userLocation}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={styles.userMarker}>
              <View style={styles.userMarkerPulse} />
              <View style={styles.userMarkerDot} />
            </View>
          </Marker>
        )}
      </MapView>

      {/* GPS Button */}
      <TouchableOpacity
        style={styles.gpsButton}
        onPress={handleCenterOnUser}
        activeOpacity={0.8}
      >
        <Gps size={22} color={colors.primary} variant="Bold" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: width,
    height: height,
  },
  userMarker: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  userMarkerPulse: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '30',
  },
  userMarkerDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.primary,
    borderWidth: 3,
    borderColor: colors.white,
  },
  gpsButton: {
    position: 'absolute',
    top: 100,
    right: 16,
    width: 48,
    height: 48,
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
