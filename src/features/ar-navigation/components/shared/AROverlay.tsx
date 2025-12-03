/**
 * AR OVERLAY
 * 
 * Base overlay component for AR plugins.
 * Provides common styling and structure for plugin overlays.
 */

import React, { ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';

interface AROverlayProps {
  children: ReactNode;
  position?: 'top' | 'center' | 'bottom';
}

export default function AROverlay({ children, position = 'center' }: AROverlayProps) {
  return (
    <View style={[styles.container, styles[position]]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  top: {
    top: 100,
  },
  center: {
    top: '40%',
  },
  bottom: {
    bottom: 120,
  },
});
