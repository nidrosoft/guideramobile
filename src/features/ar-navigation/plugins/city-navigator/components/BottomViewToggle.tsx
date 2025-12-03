/**
 * BOTTOM VIEW TOGGLE
 * 
 * Bottom bar for toggling between Camera (AR) and Map views.
 * Similar design to the transport mode selector.
 */

import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import * as Haptics from 'expo-haptics';
import { 
  Camera,
  Map1,
  Gps,
  Warning2,
} from 'iconsax-react-native';
import { colors, spacing, typography } from '@/styles';
import { ViewMode } from '../types/cityNavigator.types';

interface BottomViewToggleProps {
  viewMode: ViewMode;
  onToggleView: (mode: ViewMode) => void;
  onCenterLocation?: () => void;
  hasDangerNearby?: boolean;
}

export default function BottomViewToggle({
  viewMode,
  onToggleView,
  onCenterLocation,
  hasDangerNearby = false,
}: BottomViewToggleProps) {
  
  const handleToggle = (mode: ViewMode) => {
    if (mode !== viewMode) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onToggleView(mode);
    }
  };

  const handleCenterLocation = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    console.log('📍 GPS button pressed - centering on location');
    onCenterLocation?.();
  };

  return (
    <View style={styles.container}>
      <View style={styles.toggleBar}>
        {/* Camera/AR View Button */}
        <TouchableOpacity
          style={[
            styles.toggleButton,
            viewMode === 'camera' && styles.toggleButtonActive,
          ]}
          onPress={() => handleToggle('camera')}
          activeOpacity={0.8}
        >
          <Camera 
            size={20} 
            color={viewMode === 'camera' ? colors.white : colors.gray400} 
            variant="Bold" 
          />
          <Text style={[
            styles.toggleText,
            viewMode === 'camera' && styles.toggleTextActive,
          ]}>
            Camera
          </Text>
        </TouchableOpacity>

        {/* Map View Button */}
        <TouchableOpacity
          style={[
            styles.toggleButton,
            viewMode === 'map' && styles.toggleButtonActive,
          ]}
          onPress={() => handleToggle('map')}
          activeOpacity={0.8}
        >
          <Map1 
            size={20} 
            color={viewMode === 'map' ? colors.white : colors.gray400} 
            variant="Bold" 
          />
          <Text style={[
            styles.toggleText,
            viewMode === 'map' && styles.toggleTextActive,
          ]}>
            Map
          </Text>
        </TouchableOpacity>

        {/* GPS Center Button */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleCenterLocation}
          activeOpacity={0.7}
        >
          <Gps size={20} color={colors.primary} variant="Bold" />
        </TouchableOpacity>

        {/* Danger Alert Indicator */}
        {hasDangerNearby && (
          <View style={styles.dangerIndicator}>
            <Warning2 size={18} color={colors.error} variant="Bold" />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 100,
  },
  toggleBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray900,
    borderRadius: 32,
    padding: 6,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 24,
    gap: 6,
  },
  toggleButtonActive: {
    backgroundColor: colors.primary,
  },
  toggleText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray400,
  },
  toggleTextActive: {
    color: colors.white,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray800,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  dangerIndicator: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.error + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
});
