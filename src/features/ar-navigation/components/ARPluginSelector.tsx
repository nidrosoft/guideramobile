/**
 * AR PLUGIN SELECTOR
 * 
 * Left sidebar with plugin icons.
 * Allows user to switch between different AR features.
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { 
  Building, 
  Book, 
  Airplane, 
  Danger, 
  Map1 
} from 'iconsax-react-native';
import { colors, spacing } from '@/styles';
import { ARPluginId } from '../types/ar-plugin.types';

interface ARPluginSelectorProps {
  activePlugin: ARPluginId | null;
  onPluginSelect: (pluginId: ARPluginId) => void;
}

const plugins: Array<{ id: ARPluginId; icon: any }> = [
  { id: 'landmark-scanner', icon: Building },
  { id: 'menu-translator', icon: Book },
  { id: 'airport-navigator', icon: Airplane },
  { id: 'danger-alerts', icon: Danger },
  { id: 'city-navigator', icon: Map1 },
];

export default function ARPluginSelector({ 
  activePlugin, 
  onPluginSelect 
}: ARPluginSelectorProps) {
  return (
    <View style={styles.container}>
      {plugins.map(({ id, icon: Icon }) => {
        const isActive = activePlugin === id;
        return (
          <TouchableOpacity
            key={id}
            style={[styles.pluginButton, isActive && styles.pluginButtonActive]}
            onPress={() => onPluginSelect(id)}
          >
            <Icon 
              size={24} 
              color={isActive ? colors.primary : colors.white} 
              variant={isActive ? 'Bold' : 'Linear'}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: spacing.md,
    top: '30%',
    gap: spacing.md,
  },
  pluginButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  pluginButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderColor: colors.primary,
  },
});
