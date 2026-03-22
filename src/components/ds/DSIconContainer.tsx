/**
 * DESIGN SYSTEM — ICON CONTAINER
 *
 * 36x36 rounded container with subtle colored background.
 * Used for category icons, settings icons, etc.
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

interface DSIconContainerProps {
  children: React.ReactNode;
  color?: string;
  size?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export default function DSIconContainer({
  children,
  color,
  size = 36,
  borderRadius = 10,
  style,
}: DSIconContainerProps) {
  const { colors } = useTheme();
  const iconColor = color ?? colors.primary;

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius,
          backgroundColor: `${iconColor}10`,
          borderColor: `${iconColor}1A`,
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
