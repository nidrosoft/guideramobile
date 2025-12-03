/**
 * NAVIGATION SHEET
 * 
 * Bottom sheet showing destination info and navigation controls.
 * Beautiful card design with transport mode selector.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { 
  Location,
  Clock,
  Star1,
  Send2,
  CloseCircle,
} from 'iconsax-react-native';
import { colors, spacing, typography } from '@/styles';
import { POI, TransportMode } from '../types/cityNavigator.types';
import TransportModeSelector from './TransportModeSelector';

interface NavigationSheetProps {
  poi: POI;
  transportMode: TransportMode;
  onTransportModeChange: (mode: TransportMode) => void;
  onNavigate: () => void;
  onClose: () => void;
}

export default function NavigationSheet({
  poi,
  transportMode,
  onTransportModeChange,
  onNavigate,
  onClose,
}: NavigationSheetProps) {
  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  return (
    <View style={styles.container}>
      {/* Close Button */}
      <TouchableOpacity 
        style={styles.closeButton} 
        onPress={handleClose}
        activeOpacity={0.7}
      >
        <CloseCircle size={28} color={colors.gray400} variant="Bold" />
      </TouchableOpacity>

      {/* Handle */}
      <TouchableOpacity 
        style={styles.handleContainer} 
        onPress={handleClose}
        activeOpacity={0.8}
      >
        <View style={styles.handle} />
      </TouchableOpacity>

      {/* Transport Mode Selector */}
      <View style={styles.transportContainer}>
        <TransportModeSelector
          selectedMode={transportMode}
          onSelectMode={onTransportModeChange}
        />
      </View>

      {/* Destination Card */}
      <View style={styles.destinationCard}>
        {/* POI Image */}
        {poi.imageUrl && (
          <Image source={{ uri: poi.imageUrl }} style={styles.poiImage} />
        )}
        
        {/* POI Info */}
        <View style={styles.poiInfo}>
          <Text style={styles.poiName} numberOfLines={1}>{poi.name}</Text>
          <View style={styles.locationRow}>
            <Location size={14} color={colors.gray500} variant="Bold" />
            <Text style={styles.locationText}>{poi.city}, {poi.country}</Text>
          </View>
          
          {/* Stats */}
          <View style={styles.statsRow}>
            {poi.distance !== undefined && (
              <View style={styles.stat}>
                <Text style={styles.statValue}>{formatDistance(poi.distance)}</Text>
                <Text style={styles.statLabel}>Miles</Text>
              </View>
            )}
            {poi.duration !== undefined && (
              <View style={styles.stat}>
                <Clock size={14} color={colors.primary} variant="Bold" />
                <Text style={styles.statValue}>{formatDuration(poi.duration)}</Text>
              </View>
            )}
            {poi.rating && (
              <View style={styles.stat}>
                <Star1 size={14} color={colors.warning} variant="Bold" />
                <Text style={styles.statValue}>{poi.rating}</Text>
                {poi.reviewCount && (
                  <Text style={styles.reviewText}>({formatNumber(poi.reviewCount)} Review)</Text>
                )}
              </View>
            )}
          </View>
        </View>

        {/* Navigate Button */}
        <TouchableOpacity style={styles.navigateButton} onPress={onNavigate}>
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            style={styles.navigateGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Send2 size={22} color={colors.white} variant="Bold" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Helper functions
function formatDistance(meters: number): string {
  const miles = meters / 1609.34;
  return miles.toFixed(1);
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

function formatNumber(num: number): string {
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k';
  }
  return num.toString();
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing['2xl'],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 20,
  },
  closeButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.md,
    zIndex: 10,
    padding: 4,
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.gray300,
    borderRadius: 2,
  },
  transportContainer: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  destinationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  poiImage: {
    width: 56,
    height: 56,
    borderRadius: 16,
  },
  poiInfo: {
    flex: 1,
  },
  poiName: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: spacing.xs,
  },
  locationText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray500,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.gray500,
  },
  reviewText: {
    fontSize: typography.fontSize.xs,
    color: colors.gray500,
  },
  navigateButton: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  navigateGradient: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
