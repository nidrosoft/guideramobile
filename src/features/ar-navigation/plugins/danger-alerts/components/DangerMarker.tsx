/**
 * DANGER MARKER
 * 
 * Custom marker for danger zones on the map.
 */

import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { 
  ShieldCross, 
  Warning2,
  Danger,
} from 'iconsax-react-native';
import { colors, typography } from '@/styles';
import { DangerZone } from '../types/dangerAlerts.types';
import { getDangerColor } from '../data/mockDangerData';

interface DangerMarkerProps {
  zone: DangerZone;
  isSelected?: boolean;
}

export default function DangerMarker({ zone, isSelected = false }: DangerMarkerProps) {
  const dangerColor = getDangerColor(zone.level);

  const getIcon = () => {
    if (zone.level === 'critical') {
      return <Danger size={18} color={colors.white} variant="Bold" />;
    } else if (zone.level === 'high') {
      return <ShieldCross size={18} color={colors.white} variant="Bold" />;
    }
    return <Warning2 size={18} color={colors.white} variant="Bold" />;
  };

  return (
    <View style={[styles.container, isSelected && styles.selectedContainer]}>
      {/* Pulse effect for critical zones */}
      {zone.level === 'critical' && (
        <View style={[styles.pulse, { backgroundColor: dangerColor + '40' }]} />
      )}
      
      {/* Main marker */}
      <View style={[styles.marker, { backgroundColor: dangerColor }, isSelected && styles.selectedMarker]}>
        {getIcon()}
      </View>
      
      {/* Report count badge */}
      {zone.reportCount > 0 && (
        <View style={[styles.badge, { backgroundColor: dangerColor }]}>
          <Text style={styles.badgeText}>{zone.reportCount}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedContainer: {
    transform: [{ scale: 1.2 }],
  },
  pulse: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  marker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  selectedMarker: {
    borderWidth: 4,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: colors.white,
  },
  badgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
});
