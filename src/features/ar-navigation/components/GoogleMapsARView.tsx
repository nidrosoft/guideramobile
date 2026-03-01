/**
 * GOOGLE MAPS AR VIEW
 * 
 * AR navigation view using Google Maps Navigation SDK.
 * Combines Google Maps positioning with Skia UI overlay.
 */

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { googleMapsService, GoogleMapsLocation, GoogleMapsRoute } from '../services/GoogleMapsService';
import { GOOGLE_MAPS_CONFIG } from '@/config/google-maps.config';
import { colors } from '@/styles';

interface GoogleMapsARViewProps {
  origin: GoogleMapsLocation;
  destination: GoogleMapsLocation;
  onRouteReady?: (route: GoogleMapsRoute) => void;
  onLocationUpdate?: (location: GoogleMapsLocation) => void;
}

export default function GoogleMapsARView({
  origin,
  destination,
  onRouteReady,
  onLocationUpdate,
}: GoogleMapsARViewProps) {
  const [route, setRoute] = useState<GoogleMapsRoute | null>(null);
  const [userLocation, setUserLocation] = useState<GoogleMapsLocation>(origin);
  const [mapReady, setMapReady] = useState(false);

  // Initialize and get route
  useEffect(() => {
    const initializeNavigation = async () => {
      try {
        await googleMapsService.initialize();
        
        // Get directions
        const directions = await googleMapsService.getDirections(
          origin,
          destination,
          'walking'
        );

        if (directions) {
          setRoute(directions);
          onRouteReady?.(directions);
          console.log('✅ Route calculated:', {
            distance: `${directions.distance}m`,
            duration: `${Math.round(directions.duration / 60)}min`,
            steps: directions.steps.length,
          });
        }
      } catch (error) {
        console.error('❌ Navigation initialization failed:', error);
      }
    };

    initializeNavigation();
  }, [origin, destination]);

  // Decode polyline to coordinates
  const decodePolyline = (encoded: string): GoogleMapsLocation[] => {
    const points: GoogleMapsLocation[] = [];
    let index = 0;
    let lat = 0;
    let lng = 0;

    while (index < encoded.length) {
      let b;
      let shift = 0;
      let result = 0;

      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);

      const dlat = result & 1 ? ~(result >> 1) : result >> 1;
      lat += dlat;

      shift = 0;
      result = 0;

      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);

      const dlng = result & 1 ? ~(result >> 1) : result >> 1;
      lng += dlng;

      points.push({
        latitude: lat / 1e5,
        longitude: lng / 1e5,
      });
    }

    return points;
  };

  const routeCoordinates = route ? decodePolyline(route.polyline) : [];

  return (
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          latitude: origin.latitude,
          longitude: origin.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        showsUserLocation={true}
        showsMyLocationButton={true}
        showsCompass={true}
        showsIndoorLevelPicker={true}
        showsIndoors={true}
        onMapReady={() => setMapReady(true)}
        onUserLocationChange={(event) => {
          if (event.nativeEvent.coordinate) {
            const location = {
              latitude: event.nativeEvent.coordinate.latitude,
              longitude: event.nativeEvent.coordinate.longitude,
              accuracy: event.nativeEvent.coordinate.accuracy,
            };
            setUserLocation(location);
            onLocationUpdate?.(location);
          }
        }}
      >
        {/* Route polyline */}
        {routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor={colors.primary}
            strokeWidth={6}
            lineCap="round"
            lineJoin="round"
          />
        )}

        {/* Destination marker */}
        <Marker
          coordinate={destination}
          title="Destination"
          pinColor={colors.primary}
        />

        {/* Route steps markers */}
        {route?.steps.map((step, index) => (
          <Marker
            key={index}
            coordinate={step.startLocation}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={styles.stepMarker}>
              <View style={styles.stepDot} />
            </View>
          </Marker>
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  stepMarker: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.bgModal,
    borderWidth: 2,
    borderColor: colors.primary,
  },
});
