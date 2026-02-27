/**
 * FILTER OPTION ROW
 * 
 * Reusable row component for filter options.
 * Used in price range and sort by sections.
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';
import { TickCircle } from 'iconsax-react-native';
import { typography, spacing, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';

interface FilterOptionRowProps {
  label: string;
  subtitle?: string;
  isSelected: boolean;
  onPress: () => void;
  icon?: React.ReactNode;
}

export default function FilterOptionRow({
  label,
  subtitle,
  isSelected,
  onPress,
  icon,
}: FilterOptionRowProps) {
  const { colors } = useTheme();

  const dynamicStyles = useMemo(() => ({
    row: {
      backgroundColor: isSelected ? colors.primary + '10' : colors.gray50,
      borderColor: isSelected ? colors.primary + '30' : 'transparent',
    },
    label: {
      color: isSelected ? colors.primary : colors.textPrimary,
    },
    subtitle: {
      color: colors.textSecondary,
    },
  }), [colors, isSelected]);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <TouchableOpacity
      style={[styles.row, dynamicStyles.row, isSelected && styles.rowSelected]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        {icon && <View style={styles.iconContainer}>{icon}</View>}
        <View>
          <Text style={[styles.label, dynamicStyles.label]}>{label}</Text>
          {subtitle && (
            <Text style={[styles.subtitle, dynamicStyles.subtitle]}>{subtitle}</Text>
          )}
        </View>
      </View>
      {isSelected && (
        <TickCircle size={20} color={colors.primary} variant="Bold" />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  rowSelected: {
    borderWidth: 1,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconContainer: {
    marginRight: spacing.xs,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  subtitle: {
    fontSize: typography.fontSize.xs,
    marginTop: 2,
  },
});
