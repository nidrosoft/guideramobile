/**
 * DESIGN SYSTEM — DIVIDER
 *
 * Thin horizontal line using borderSubtle.
 * Supports vertical orientation and custom spacing.
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '@/styles/colors';

interface DSDividerProps {
  vertical?: boolean;
  spacing?: number;
  color?: string;
  style?: ViewStyle;
}

export default function DSDivider({
  vertical = false,
  spacing = 0,
  color = colors.borderSubtle,
  style,
}: DSDividerProps) {
  return (
    <View
      style={[
        vertical ? styles.vertical : styles.horizontal,
        { backgroundColor: color },
        spacing > 0 && (vertical
          ? { marginHorizontal: spacing }
          : { marginVertical: spacing }),
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  horizontal: {
    height: 1,
    width: '100%',
  },
  vertical: {
    width: 1,
    alignSelf: 'stretch',
  },
});
