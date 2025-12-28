/**
 * DATE RANGE FIELD
 * 
 * Tappable field for check-in/check-out date selection with orange color theme
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Calendar, ArrowDown2 } from 'iconsax-react-native';
import { colors, spacing, typography, borderRadius } from '@/styles';

// Orange color theme for dates
const THEME = {
  icon: '#F97316',
  background: '#FFF7ED',
};

interface DateRangeFieldProps {
  label?: string;
  checkInDate: string;
  checkOutDate: string;
  nights?: number;
  onPress: () => void;
}

export default function DateRangeField({
  label = 'Check-in / Check-out',
  checkInDate,
  checkOutDate,
  nights,
  onPress,
}: DateRangeFieldProps) {
  const displayValue = `${checkInDate} - ${checkOutDate}`;
  const nightsText = nights ? ` · ${nights} night${nights > 1 ? 's' : ''}` : '';

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: THEME.background }]}>
        <Calendar size={20} color={THEME.icon} variant="Bold" />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{displayValue}{nightsText}</Text>
      </View>
      <ArrowDown2 size={20} color={colors.gray400} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md + 2,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: '#E6E9EB',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  label: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  value: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
});
