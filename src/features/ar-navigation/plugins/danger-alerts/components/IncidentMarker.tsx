/**
 * INCIDENT MARKER
 * 
 * Custom marker for individual incidents on the map.
 */

import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { 
  Danger,
  Warning2,
  ShieldCross,
  Car,
  Health,
  MessageQuestion,
  InfoCircle,
} from 'iconsax-react-native';
import { colors, typography } from '@/styles';
import { Incident, IncidentType } from '../types/dangerAlerts.types';
import { getDangerColor } from '../data/mockDangerData';

interface IncidentMarkerProps {
  incident: Incident;
  isSelected?: boolean;
}

function getIncidentIcon(type: IncidentType, size: number = 14) {
  const iconProps = { size, color: colors.white, variant: 'Bold' as const };
  
  switch (type) {
    case 'crime':
    case 'assault':
      return <ShieldCross {...iconProps} />;
    case 'theft':
      return <Danger {...iconProps} />;
    case 'scam':
      return <MessageQuestion {...iconProps} />;
    case 'traffic':
      return <Car {...iconProps} />;
    case 'health':
      return <Health {...iconProps} />;
    case 'unsafe_area':
      return <Warning2 {...iconProps} />;
    default:
      return <InfoCircle {...iconProps} />;
  }
}

export default function IncidentMarker({ incident, isSelected = false }: IncidentMarkerProps) {
  const dangerColor = getDangerColor(incident.level);

  return (
    <View style={[styles.container, isSelected && styles.selectedContainer]}>
      {/* Main marker */}
      <View style={[styles.marker, { backgroundColor: dangerColor }, isSelected && styles.selectedMarker]}>
        {getIncidentIcon(incident.type)}
      </View>
      
      {/* Verified badge */}
      {incident.verified && (
        <View style={styles.verifiedBadge}>
          <Text style={styles.verifiedText}>✓</Text>
        </View>
      )}
      
      {/* Pin point */}
      <View style={[styles.pin, { borderTopColor: dangerColor }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  selectedContainer: {
    transform: [{ scale: 1.2 }],
  },
  marker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  selectedMarker: {
    borderWidth: 3,
  },
  verifiedBadge: {
    position: 'absolute',
    top: -2,
    right: -6,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.white,
  },
  verifiedText: {
    fontSize: 8,
    color: colors.white,
    fontWeight: 'bold',
  },
  pin: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -2,
  },
});
