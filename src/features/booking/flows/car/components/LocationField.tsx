/**
 * LOCATION FIELD COMPONENT
 * 
 * Displays pickup/return location for car rental.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Location, ArrowRight2 } from 'iconsax-react-native';
import { colors, spacing, typography, borderRadius } from '@/styles';

interface LocationFieldProps {
  label: string;
  value: string | null;
  placeholder: string;
  onPress: () => void;
  variant?: 'pickup' | 'return';
}

export default function LocationField({
  label,
  value,
  placeholder,
  onPress,
  variant = 'pickup',
}: LocationFieldProps) {
  const iconColor = variant === 'pickup' ? colors.primary : colors.success;
  const iconBg = variant === 'pickup' ? `${colors.primary}15` : `${colors.success}15`;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity style={styles.field} onPress={onPress} activeOpacity={0.7}>
        <View style={[styles.iconContainer, { backgroundColor: iconBg }]}>
          <Location size={20} color={iconColor} variant="Bold" />
        </View>
        <View style={styles.content}>
          <Text style={[styles.value, !value && styles.placeholder]}>
            {value || placeholder}
          </Text>
        </View>
        <ArrowRight2 size={20} color={colors.gray400} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#E6E9EB',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  content: {
    flex: 1,
  },
  value: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  placeholder: {
    color: colors.gray400,
    fontWeight: typography.fontWeight.regular,
  },
});
