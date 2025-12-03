/**
 * AR CAMERA
 * 
 * Camera view component with AR overlays.
 * Handles camera permissions, stream, and plugin overlay rendering.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CloseCircle, SearchNormal } from 'iconsax-react-native';
import { CameraView } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { colors, spacing, typography } from '@/styles';
import { ARPluginId, ARContext } from '../types/ar-plugin.types';
import { useARPlugins } from '../hooks/useARPlugins';

interface ARCameraProps {
  activePlugin: ARPluginId | null;
  onClose: () => void;
  sidePanelVisible?: boolean;
  onToggleSidePanel?: () => void;
}

export default function ARCamera({ 
  activePlugin, 
  onClose, 
  sidePanelVisible = true,
  onToggleSidePanel 
}: ARCameraProps) {
  const { pluginRegistry } = useARPlugins();
  
  // Get active plugin instance
  const plugin = activePlugin ? pluginRegistry[activePlugin] : null;
  
  // Create AR context with hideSearch callback and sidePanelVisible
  const [hideSearch, setHideSearch] = React.useState(false);
  
  const arContext: ARContext = {
    viewMode: 'camera',
    location: null,
    cameraStream: null,
    selectedPlugin: activePlugin,
    userLocation: null,
    setHideSearch, // Pass callback to plugins
    sidePanelVisible, // Pass side panel visibility from props
    toggleSidePanel: onToggleSidePanel, // Pass toggle callback
  };

  const handleClose = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onClose();
  };

  return (
    <View style={styles.container}>
      {/* Real Camera View */}
      <CameraView 
        style={styles.cameraView}
        facing="back"
      />

      {/* Close Button - LEFT SIDE, near status bar */}
      <TouchableOpacity style={styles.closeButtonLeft} onPress={handleClose}>
        <CloseCircle size={36} color={colors.white} variant="Bold" />
      </TouchableOpacity>

      {/* Top Bar with Search */}
      {!hideSearch && (
        <View style={styles.topBar}>
          <View style={styles.searchContainer}>
            <SearchNormal size={20} color={colors.gray500} variant="Linear" />
            <Text style={styles.searchPlaceholder}>Where to go...</Text>
          </View>
        </View>
      )}

      {/* Plugin Overlay - Render directly without wrapper to allow full-screen bottom sheets */}
      {plugin && plugin.renderOverlay(arContext)}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  cameraView: {
    flex: 1,
  },
  closeButtonLeft: {
    position: 'absolute',
    top: 50, // Closer to status bar
    right: spacing.lg, // RIGHT SIDE (opposite of left)
    zIndex: 1000,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 80, // Move search bar lower from status bar
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.75)', // More transparent
    borderRadius: 28,
    paddingHorizontal: spacing.md,
    paddingVertical: 14, // Slightly taller
    gap: spacing.sm,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: typography.fontSize.base,
    color: colors.gray500,
  },
});
