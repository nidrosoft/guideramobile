/**
 * CITY NAVIGATOR OVERLAY
 * 
 * Main overlay component for the City Navigator plugin.
 * Combines camera/map views with POI markers and navigation.
 * 
 * NOTE: This plugin does NOT render its own search bar.
 * The main AR screen provides the search bar.
 * This plugin only adds a bottom toggle for Camera/Map views.
 */

import React, { useState, useCallback, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import MapView from 'react-native-maps';
import * as Haptics from 'expo-haptics';
import { spacing } from '@/styles';
import { ARContext } from '../../../types/ar-plugin.types';
import { useCityNavigator } from '../hooks/useCityNavigator';

// Components
import CityMapView from './CityMapView';
import CameraARView from './CameraARView';
import BottomViewToggle from './BottomViewToggle';
import NavigationSheet from './NavigationSheet';
import POICard from './POICard';

interface CityNavigatorOverlayProps {
  arContext: ARContext;
}

export default function CityNavigatorOverlay({ arContext }: CityNavigatorOverlayProps) {
  const {
    viewMode,
    transportMode,
    userLocation,
    selectedPOI,
    route,
    filteredPOIs,
    dangerZones,
    setViewMode,
    setTransportMode,
    selectPOI,
    startNavigation,
  } = useCityNavigator();

  const mapRef = useRef<MapView>(null);
  const [showPOICard, setShowPOICard] = useState(false);

  // Handle POI selection
  const handleSelectPOI = useCallback((poi: any) => {
    selectPOI(poi);
    setShowPOICard(true);
    // Hide search bar when POI is selected
    arContext.setHideSearch?.(true);
  }, [selectPOI, arContext]);

  // Handle navigation start
  const handleNavigate = useCallback(() => {
    if (selectedPOI) {
      startNavigation(selectedPOI);
      setShowPOICard(false);
    }
  }, [selectedPOI, startNavigation]);

  // Handle close POI card
  const handleClosePOICard = useCallback(() => {
    selectPOI(null);
    setShowPOICard(false);
    arContext.setHideSearch?.(false);
  }, [selectPOI, arContext]);

  // Center map on user location
  const handleCenterLocation = useCallback(() => {
    console.log('📍 handleCenterLocation called, userLocation:', userLocation);
    console.log('📍 mapRef.current:', mapRef.current);
    
    if (userLocation && mapRef.current) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      mapRef.current.animateToRegion({
        ...userLocation,
        latitudeDelta: 0.015,
        longitudeDelta: 0.015,
      }, 500);
      console.log('📍 Animating to user location');
    } else {
      console.log('📍 Cannot center - missing userLocation or mapRef');
    }
  }, [userLocation]);

  // Check if there are danger zones nearby
  const hasDangerNearby = dangerZones.some(zone => {
    if (!userLocation) return false;
    const distance = calculateDistance(userLocation, zone.coordinates);
    return distance < zone.radius * 2;
  });

  // Debug logging
  console.log('🏙️ CityNavigatorOverlay - viewMode:', viewMode, 'POIs:', filteredPOIs.length);

  return (
    <View style={styles.container}>
      {/* Map or Camera View */}
      {viewMode === 'map' ? (
        <CityMapView
          userLocation={userLocation}
          pois={filteredPOIs}
          selectedPOI={selectedPOI}
          route={route}
          dangerZones={dangerZones}
          showDangerZones={true}
          onSelectPOI={handleSelectPOI}
          onCenterLocation={handleCenterLocation}
        />
      ) : (
        <CameraARView
          pois={filteredPOIs}
          userLocation={userLocation}
          onSelectPOI={handleSelectPOI}
        />
      )}

      {/* Bottom View Toggle - Camera/Map switch */}
      {!showPOICard && (
        <BottomViewToggle
          viewMode={viewMode}
          onToggleView={setViewMode}
          onCenterLocation={handleCenterLocation}
          hasDangerNearby={hasDangerNearby}
        />
      )}

      {/* Floating POI Card - Shows when POI is selected in camera mode */}
      {selectedPOI && showPOICard && viewMode === 'camera' && (
        <View style={styles.floatingCardContainer}>
          <POICard
            poi={selectedPOI}
            compact
            onPress={handleNavigate}
            onChat={() => console.log('Chat with AI about', selectedPOI.name)}
          />
        </View>
      )}

      {/* Navigation Sheet - Shows when POI is selected */}
      {selectedPOI && showPOICard && (
        <NavigationSheet
          poi={selectedPOI}
          transportMode={transportMode}
          onTransportModeChange={setTransportMode}
          onNavigate={handleNavigate}
          onClose={handleClosePOICard}
        />
      )}
    </View>
  );
}

// Helper: Calculate distance between two coordinates
function calculateDistance(
  coord1: { latitude: number; longitude: number },
  coord2: { latitude: number; longitude: number }
): number {
  const R = 6371e3;
  const φ1 = (coord1.latitude * Math.PI) / 180;
  const φ2 = (coord2.latitude * Math.PI) / 180;
  const Δφ = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
  const Δλ = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  floatingCardContainer: {
    position: 'absolute',
    bottom: 200,
    right: spacing.md,
    left: spacing.md,
    zIndex: 50,
  },
});
