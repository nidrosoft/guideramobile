/**
 * AR CONTAINER
 * 
 * Main container for AR navigation system.
 * Manages camera/map view switching and plugin rendering.
 */

import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { ARViewMode, ARPluginId } from '../types/ar-plugin.types';
import ARCamera from './ARCamera';
import ARMapView from './ARMapView';
import ARPluginSelector from './ARPluginSelector';

interface ARContainerProps {
  onClose: () => void;
}

export default function ARContainer({ onClose }: ARContainerProps) {
  const [viewMode, setViewMode] = useState<ARViewMode>('camera');
  const [activePlugin, setActivePlugin] = useState<ARPluginId | null>(null);
  const [sidePanelVisible, setSidePanelVisible] = useState(true);

  const handlePluginSelect = (pluginId: ARPluginId) => {
    setActivePlugin(pluginId);
  };

  const handleViewModeToggle = () => {
    setViewMode(prev => prev === 'camera' ? 'map' : 'camera');
  };

  return (
    <View style={styles.container}>
      {/* Camera or Map View */}
      {viewMode === 'camera' ? (
        <ARCamera 
          activePlugin={activePlugin} 
          onClose={onClose}
          sidePanelVisible={sidePanelVisible}
          onToggleSidePanel={() => setSidePanelVisible(!sidePanelVisible)}
        />
      ) : (
        <ARMapView activePlugin={activePlugin} onClose={onClose} />
      )}

      {/* Plugin Selector (Left Sidebar) - Conditionally visible */}
      {sidePanelVisible && (
        <ARPluginSelector
          activePlugin={activePlugin}
          onPluginSelect={handlePluginSelect}
        />
      )}

      {/* TODO: Add view mode toggle button */}
      {/* TODO: Add search bar at top */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
});
