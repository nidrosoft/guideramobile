/**
 * DESIGN SYSTEM — ICON CONTAINER
 *
 * 36×36 rounded container with subtle colored background.
 * Used for category icons, settings icons, etc.
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '@/styles/colors';

interface DSIconContainerProps {
  children: React.ReactNode;
  color?: string;
  size?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export default function DSIconContainer({
  children,
  color = colors.primary,
  size = 36,
  borderRadius = 10,
  style,
}: DSIconContainerProps) {
  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius,
          backgroundColor: `${color}10`,
          borderColor: `${color}1A`,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});
