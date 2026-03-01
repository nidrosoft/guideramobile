/**
 * DESIGN SYSTEM — CARD
 *
 * Sizes: sm, md, lg, xl (controls padding)
 * Border: 1.5px borderStandard, borderRadius 22.
 * Background: bgCard (rgba). Hover shadow supported via pressed state.
 */

import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { colors } from '@/styles/colors';
import { shadows } from '@/styles/shadows';

type CardSize = 'sm' | 'md' | 'lg' | 'xl';

interface DSCardProps {
  children: React.ReactNode;
  size?: CardSize;
  onPress?: () => void;
  style?: ViewStyle;
  noBorder?: boolean;
  elevated?: boolean;
}

const PADDING = { sm: 12, md: 16, lg: 20, xl: 24 };

export default function DSCard({
  children,
  size = 'md',
  onPress,
  style,
  noBorder = false,
  elevated = false,
}: DSCardProps) {
  const cardStyle: ViewStyle[] = [
    styles.card,
    { padding: PADDING[size] },
    !noBorder && styles.border,
    elevated && shadows.card,
    style,
  ].filter(Boolean) as ViewStyle[];

  if (onPress) {
    return (
      <TouchableOpacity
        style={cardStyle}
        onPress={onPress}
        activeOpacity={0.85}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: 22,
    overflow: 'hidden',
  },
  border: {
    borderWidth: 1.5,
    borderColor: colors.borderStandard,
  },
});
