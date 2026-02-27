/**
 * FILTER CHIP
 * 
 * Reusable chip component for filter selections.
 * Used in category, rating, and other filter sections.
 */

import React, { useMemo } from 'react';
import { Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';
import { typography, spacing, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';

interface FilterChipProps {
  label: string;
  isSelected: boolean;
  onPress: () => void;
  icon?: React.ReactNode;
}

export default function FilterChip({
  label,
  isSelected,
  onPress,
  icon,
}: FilterChipProps) {
  const { colors } = useTheme();

  const dynamicStyles = useMemo(() => ({
    chip: {
      backgroundColor: isSelected ? colors.primary : colors.gray100,
    },
    text: {
      color: isSelected ? colors.white : colors.gray600,
    },
  }), [colors, isSelected]);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <TouchableOpacity
      style={[styles.chip, dynamicStyles.chip]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {icon}
      <Text style={[styles.text, dynamicStyles.text]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  text: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
});
