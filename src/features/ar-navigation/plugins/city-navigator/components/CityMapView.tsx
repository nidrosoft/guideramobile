/**
 * CITY MAP VIEW
 * 
 * Beautiful map view with custom POI markers and route display.
 * Uses react-native-maps for the map rendering.
 */

import React, { useRef, useEffect, useCallback } from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import MapView, { Marker, Polyline, Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Haptics from 'expo-haptics';
import { Gps } from 'iconsax-react-native';
import { colors } from '@/styles';
import { POI, Route, Coordinates, DangerZone } from '../types/cityNavigator.types';
import { UserMarker } from './POIMarker';

const { width, height } = Dimensions.get('window');

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

// Custom map style for a clean, modern look
const MAP_STYLE = [
  {
    featureType: 'poi',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'transit',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.icon',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry.fill',
    stylers: [{ color: '#c9e4f0' }],
  },
  {
    featureType: 'landscape.man_made',
    elementType: 'geometry.fill',
    stylers: [{ color: '#f5f5f5' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.fill',
    stylers: [{ color: '#ffffff' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#e0e0e0' }],
  },
];

export default function CityMapView({
  userLocation,
  pois,
  selectedPOI,
  route,
  dangerZones = [],
  showDangerZones = false,
  onSelectPOI,
  onMapReady,
  onCenterLocation,
}: CityMapViewProps) {
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
      console.log('📍 Map centered on user');
    }
  }, [userLocation]);

  // Center map on user location when it changes
  useEffect(() => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        ...userLocation,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000);
    }
  }, [userLocation]);

  // Fit map to show route when navigating
  useEffect(() => {
    if (route && mapRef.current) {
      const coordinates = [route.origin, route.destination];
      mapRef.current.fitToCoordinates(coordinates, {
        edgePadding: { top: 100, right: 50, bottom: 300, left: 50 },
        animated: true,
      });
    }
  }, [route]);

  const initialRegion = userLocation
    ? {
        ...userLocation,
        latitudeDelta: 0.02, // Slightly larger to show more POIs
        longitudeDelta: 0.02,
      }
    : {
        latitude: 32.7767, // Default to San Diego area if no location
        longitude: -117.0713,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      };

  // Log POIs for debugging
  useEffect(() => {
    console.log('🗺️ CityMapView - POIs count:', pois.length);
    console.log('🗺️ CityMapView - User location:', userLocation);
    if (pois.length > 0) {
      console.log('🗺️ First POI:', pois[0].name, pois[0].coordinates);
    }
  }, [pois, userLocation]);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={initialRegion}
        customMapStyle={MAP_STYLE}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        showsScale={false}
        rotateEnabled={true}
        pitchEnabled={true}
        onMapReady={() => {
          console.log('🗺️ Map is ready');
          onMapReady?.();
        }}
      >
        {/* Danger Zones */}
        {showDangerZones && dangerZones.map(zone => (
          <Circle
            key={zone.id}
            center={zone.coordinates}
            radius={zone.radius}
            fillColor={getDangerColor(zone.level, 0.2)}
            strokeColor={getDangerColor(zone.level, 0.6)}
            strokeWidth={2}
          />
        ))}

        {/* Route Polyline */}
        {route && (
          <Polyline
            coordinates={route.polyline}
            strokeColor={colors.primary}
            strokeWidth={5}
            lineDashPattern={[0]}
            lineCap="round"
            lineJoin="round"
          />
        )}

        {/* User Location Marker */}
        {userLocation && (
          <Marker
            coordinate={userLocation}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <UserMarker />
          </Marker>
        )}

        {/* POI Markers */}
        {pois.map(poi => (
          <Marker
            key={poi.id}
            coordinate={poi.coordinates}
            onPress={() => {
              console.log('📍 POI tapped:', poi.name);
              onSelectPOI(poi);
            }}
            title={poi.name}
            description={`${poi.category} • ${poi.rating ? poi.rating + '⭐' : ''}`}
            pinColor={getCategoryPinColor(poi.category)}
          />
        ))}

        {/* Destination Marker (when navigating) */}
        {route && (
          <Marker
            coordinate={route.destination}
            anchor={{ x: 0.5, y: 1 }}
          >
            <View style={styles.destinationMarker}>
              <View style={styles.destinationPin} />
              <View style={styles.destinationDot} />
            </View>
          </Marker>
        )}
      </MapView>
      
      {/* GPS Center Button */}
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

// Helper to get danger zone color
function getDangerColor(level: 'low' | 'medium' | 'high', opacity: number): string {
  const baseColors = {
    low: '245, 158, 11', // warning
    medium: '249, 115, 22', // orange
    high: '239, 68, 68', // error
  };
  return `rgba(${baseColors[level]}, ${opacity})`;
}

// Helper to get pin color based on category
function getCategoryPinColor(category: string): string {
  const categoryColors: Record<string, string> = {
    landmark: 'purple',
    restaurant: 'red',
    cafe: 'orange',
    hotel: 'blue',
    museum: 'indigo',
    park: 'green',
    shopping: 'pink',
    transport: 'navy',
    attraction: 'gold',
    nightlife: 'violet',
    health: 'teal',
    service: 'gray',
  };
  return categoryColors[category] || 'red';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: width,
    height: height,
  },
  gpsButton: {
    position: 'absolute',
    top: 100,
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  destinationMarker: {
    alignItems: 'center',
  },
  destinationPin: {
    width: 30,
    height: 30,
    backgroundColor: colors.primary,
    borderRadius: 15,
    borderBottomLeftRadius: 0,
    transform: [{ rotate: '-45deg' }],
    borderWidth: 3,
    borderColor: colors.white,
  },
  destinationDot: {
    width: 8,
    height: 8,
    backgroundColor: colors.primary,
    borderRadius: 4,
    marginTop: -4,
  },
});
