/**
 * AR CONTAINER
 * 
 * Main container for AR navigation system.
 * Manages camera/map view switching and plugin rendering.
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { ARViewMode, ARPluginId } from '../types/ar-plugin.types';
import ARCamera from './ARCamera';
import ARMapView from './ARMapView';
import ARPluginSelector from './ARPluginSelector';

interface ARContainerProps {
  onClose: () => void;
  initialPlugin?: string;
}

export default function ARContainer({ onClose, initialPlugin }: ARContainerProps) {
  const [viewMode, setViewMode] = useState<ARViewMode>('camera');
  const [activePlugin, setActivePlugin] = useState<ARPluginId | null>(
    (initialPlugin as ARPluginId) || null
  );
  const [sidePanelVisible, setSidePanelVisible] = useState(true);

  // Sync activePlugin when initialPlugin prop changes (e.g., Navigate tab switching)
  useEffect(() => {
    if (initialPlugin) {
      setActivePlugin(initialPlugin as ARPluginId);
    }
  }, [initialPlugin]);

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

      {/* Plugin Selector (Left Sidebar) - Hidden when any plugin is active */}
      {sidePanelVisible && !activePlugin && (
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
