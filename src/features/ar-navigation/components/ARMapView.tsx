/**
 * AR MAP VIEW
 * 
 * Map-based view component for AR navigation.
 * Shows map with markers and plugin-specific overlays.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CloseCircle, SearchNormal } from 'iconsax-react-native';
import { colors, spacing, typography } from '@/styles';
import { ARPluginId } from '../types/ar-plugin.types';

interface ARMapViewProps {
  activePlugin: ARPluginId | null;
  onClose: () => void;
}

export default function ARMapView({ activePlugin, onClose }: ARMapViewProps) {
  return (
    <View style={styles.container}>
      {/* Map Placeholder */}
      <View style={styles.mapView}>
        <Text style={styles.placeholder}>Map View (Mapbox)</Text>
      </View>

      {/* Top Bar with Search and Close */}
      <View style={styles.topBar}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <SearchNormal size={20} color={colors.gray500} variant="Linear" />
          <Text style={styles.searchPlaceholder}>Where to go...</Text>
        </View>

        {/* Close Button */}
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <CloseCircle size={32} color={colors.white} variant="Bold" />
        </TouchableOpacity>
      </View>

      {/* Plugin Overlay will be rendered here */}
      {activePlugin && (
        <View style={styles.pluginOverlay}>
          <Text style={styles.overlayText}>
            {activePlugin} map overlay will render here
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  mapView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  placeholder: {
    color: colors.white,
    fontSize: typography.fontSize.xl,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing['2xl'],
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 24,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: typography.fontSize.base,
    color: colors.gray500,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pluginOverlay: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    padding: spacing.lg,
  },
  overlayText: {
    color: colors.white,
    fontSize: typography.fontSize.base,
    textAlign: 'center',
  },
});
