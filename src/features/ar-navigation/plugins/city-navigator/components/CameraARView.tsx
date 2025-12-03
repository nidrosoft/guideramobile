/**
 * CAMERA AR VIEW
 * 
 * Camera view with AR-style POI overlays.
 * Shows floating markers for nearby POIs on the camera feed.
 */

import React from 'react';
import { View, StyleSheet, Dimensions, Text, TouchableOpacity } from 'react-native';
import { CameraView } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Location,
  Star1,
} from 'iconsax-react-native';
import { colors, spacing, typography } from '@/styles';
import { POI, Coordinates } from '../types/cityNavigator.types';
import { getCategoryColor } from '../data/mockPOIs';

const { width, height } = Dimensions.get('window');

interface CameraARViewProps {
  pois: POI[];
  userLocation: Coordinates | null;
  onSelectPOI: (poi: POI) => void;
}

export default function CameraARView({ pois, userLocation, onSelectPOI }: CameraARViewProps) {
  // Get nearby POIs (within 500m) and calculate their screen positions
  const nearbyPOIs = pois
    .filter(poi => poi.distance !== undefined && poi.distance < 500)
    .slice(0, 5); // Limit to 5 POIs to avoid clutter

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing="back">
        {/* AR POI Overlays */}
        {nearbyPOIs.map((poi, index) => (
          <ARPOIMarker
            key={poi.id}
            poi={poi}
            index={index}
            onPress={() => onSelectPOI(poi)}
          />
        ))}
      </CameraView>
    </View>
  );
}

interface ARPOIMarkerProps {
  poi: POI;
  index: number;
  onPress: () => void;
}

function ARPOIMarker({ poi, index, onPress }: ARPOIMarkerProps) {
  const categoryColor = getCategoryColor(poi.category);
  
  // Calculate position based on index (simulated AR positioning)
  // Positions are carefully calculated to avoid edges and overlapping
  const positions = [
    { top: height * 0.20, left: width * 0.50 },
    { top: height * 0.30, left: width * 0.10 },
    { top: height * 0.40, left: width * 0.55 },
    { top: height * 0.50, left: width * 0.15 },
    { top: height * 0.35, left: width * 0.35 },
  ];
  
  const position = positions[index % positions.length];
  
  // Ensure card doesn't go off screen
  const cardLeft = Math.min(position.left, width - 180);

  return (
    <TouchableOpacity
      style={[styles.arMarker, { top: position.top, left: cardLeft }]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      {/* Marker Dot with pulse effect */}
      <View style={styles.markerContainer}>
        <View style={[styles.markerPulse, { backgroundColor: categoryColor + '30' }]} />
        <View style={[styles.markerDot, { backgroundColor: categoryColor }]}>
          <View style={styles.markerDotInner} />
        </View>
      </View>
      
      {/* Info Card - Improved design */}
      <View style={styles.arCard}>
        <View style={[styles.arCardIndicator, { backgroundColor: categoryColor }]} />
        <View style={styles.arCardContent}>
          <Text style={styles.arCardName} numberOfLines={1}>{poi.name}</Text>
          <View style={styles.arCardMeta}>
            {poi.rating && (
              <View style={styles.ratingBadge}>
                <Star1 size={12} color={colors.warning} variant="Bold" />
                <Text style={styles.ratingText}>{poi.rating}</Text>
              </View>
            )}
            {poi.distance && (
              <Text style={styles.distanceText}>{formatDistance(poi.distance)}</Text>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${meters}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  arMarker: {
    position: 'absolute',
    alignItems: 'flex-start',
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  markerPulse: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  markerDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  markerDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.white,
  },
  arCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
    minWidth: 140,
    maxWidth: 170,
  },
  arCardIndicator: {
    width: 5,
  },
  arCardContent: {
    padding: spacing.sm,
    paddingVertical: spacing.xs + 2,
    flex: 1,
  },
  arCardName: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  arCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.warning + '20',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
  },
  ratingText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.warning,
  },
  distanceText: {
    fontSize: typography.fontSize.xs,
    color: colors.gray500,
    fontWeight: typography.fontWeight.medium,
  },
});
