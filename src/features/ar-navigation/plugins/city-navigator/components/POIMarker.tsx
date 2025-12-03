/**
 * POI MARKER
 * 
 * Custom map marker for POIs with category-based styling.
 */

import React from 'react';
import { View, StyleSheet, Text, Image } from 'react-native';
import { 
  Building4,
  Reserve,
  Coffee,
  Building,
  Gallery,
  Tree,
  Bag2,
  Bus,
  Star1,
  Music,
  Hospital,
  Setting2,
  Location,
} from 'iconsax-react-native';
import { colors, spacing, typography } from '@/styles';
import { POI, POICategory } from '../types/cityNavigator.types';
import { getCategoryColor } from '../data/mockPOIs';

interface POIMarkerProps {
  poi: POI;
  isSelected?: boolean;
  showImage?: boolean;
}

function getCategoryIcon(category: POICategory, color: string, size: number = 16) {
  const iconProps = { size, color, variant: 'Bold' as const };
  
  switch (category) {
    case 'landmark':
      return <Building4 {...iconProps} />;
    case 'restaurant':
      return <Reserve {...iconProps} />;
    case 'cafe':
      return <Coffee {...iconProps} />;
    case 'hotel':
      return <Building {...iconProps} />;
    case 'museum':
      return <Gallery {...iconProps} />;
    case 'park':
      return <Tree {...iconProps} />;
    case 'shopping':
      return <Bag2 {...iconProps} />;
    case 'transport':
      return <Bus {...iconProps} />;
    case 'attraction':
      return <Star1 {...iconProps} />;
    case 'nightlife':
      return <Music {...iconProps} />;
    case 'health':
      return <Hospital {...iconProps} />;
    case 'service':
      return <Setting2 {...iconProps} />;
    default:
      return <Location {...iconProps} />;
  }
}

export default function POIMarker({ poi, isSelected = false, showImage = false }: POIMarkerProps) {
  const categoryColor = getCategoryColor(poi.category);

  if (showImage && poi.imageUrl) {
    return (
      <View style={[styles.imageMarkerContainer, isSelected && styles.selectedContainer]}>
        <Image source={{ uri: poi.imageUrl }} style={styles.markerImage} />
        <View style={[styles.imageBadge, { backgroundColor: categoryColor }]}>
          {getCategoryIcon(poi.category, colors.white, 12)}
        </View>
      </View>
    );
  }

  return (
    <View style={[
      styles.markerContainer,
      { backgroundColor: categoryColor },
      isSelected && styles.selectedMarker,
    ]}>
      {getCategoryIcon(poi.category, colors.white, 18)}
      {isSelected && (
        <View style={styles.selectedRing} />
      )}
    </View>
  );
}

// User location marker
export function UserMarker() {
  return (
    <View style={styles.userMarkerContainer}>
      <View style={styles.userMarkerOuter}>
        <View style={styles.userMarkerInner} />
      </View>
      <Text style={styles.userLabel}>You</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  markerContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  selectedMarker: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 4,
  },
  selectedContainer: {
    transform: [{ scale: 1.1 }],
  },
  selectedRing: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: colors.primary,
    opacity: 0.3,
  },
  imageMarkerContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  markerImage: {
    width: '100%',
    height: '100%',
  },
  imageBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  userMarkerContainer: {
    alignItems: 'center',
  },
  userMarkerOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary + '30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userMarkerInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.primary,
    borderWidth: 3,
    borderColor: colors.white,
  },
  userLabel: {
    marginTop: 4,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
  },
});
