/**
 * DATE FIELD
 * 
 * Tappable field for date selection with orange color theme
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Calendar, ArrowDown2 } from 'iconsax-react-native';
import { colors, spacing, typography, borderRadius } from '@/styles';

// Orange color theme for dates
const THEME = {
  icon: '#F97316', // Orange
  background: '#FFF7ED', // Light orange
};

interface DateFieldProps {
  label: string;
  departureDate: string;
  returnDate?: string;
  onPress: () => void;
}

export default function DateField({
  label,
  departureDate,
  returnDate,
  onPress,
}: DateFieldProps) {
  const displayValue = returnDate 
    ? `${departureDate} - ${returnDate}`
    : departureDate;

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
        <Text style={styles.label}>Travel Dates</Text>
        <Text style={styles.value}>{displayValue}</Text>
      </View>
      <ArrowDown2 size={20} color={colors.gray400} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md + 2,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
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
