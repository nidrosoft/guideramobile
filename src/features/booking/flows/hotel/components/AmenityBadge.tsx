/**
 * AMENITY BADGE
 * 
 * Small badge displaying an amenity with icon
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  Wifi,
  Car,
  Coffee,
  Wind,
  Lovely,
  Weight,
  Reserve,
  SecurityUser,
  Pet,
  Drop,
} from 'iconsax-react-native';
import { colors, spacing, typography, borderRadius } from '@/styles';

// Amenity icon mapping
const AMENITY_ICONS: Record<string, React.ComponentType<any>> = {
  wifi: Wifi,
  parking: Car,
  breakfast: Coffee,
  ac: Wind,
  spa: Lovely,
  pool: Drop,
  gym: Weight,
  restaurant: Reserve,
  security: SecurityUser,
  pets: Pet,
};

interface AmenityBadgeProps {
  amenity: string;
  showLabel?: boolean;
  size?: 'small' | 'medium';
}

export default function AmenityBadge({
  amenity,
  showLabel = true,
  size = 'small',
}: AmenityBadgeProps) {
  const amenityKey = amenity.toLowerCase().replace(/\s+/g, '');
  const IconComponent = AMENITY_ICONS[amenityKey] || Wifi;
  const iconSize = size === 'small' ? 14 : 18;
  
  // Format label
  const label = amenity.charAt(0).toUpperCase() + amenity.slice(1);

  return (
    <View style={[styles.container, size === 'medium' && styles.containerMedium]}>
      <IconComponent size={iconSize} color={colors.textSecondary} />
      {showLabel && (
        <Text style={[styles.label, size === 'medium' && styles.labelMedium]}>
          {label}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray50,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    gap: 4,
  },
  containerMedium: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  label: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  labelMedium: {
    fontSize: typography.fontSize.sm,
  },
});
