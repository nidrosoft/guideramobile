/**
 * LOCATION FIELD COMPONENT
 *
 * Displays pickup/return location for car rental.
 * Theme-aware for dark/light mode.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Location, ArrowRight2 } from 'iconsax-react-native';
import { spacing, typography, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';

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
  const { colors: tc } = useTheme();
  const iconColor = variant === 'pickup' ? tc.primary : tc.success;
  const iconBg = variant === 'pickup' ? `${tc.primary}15` : `${tc.success}15`;

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: tc.textSecondary }]}>{label}</Text>
      <TouchableOpacity
        style={[styles.field, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle }]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={[styles.iconContainer, { backgroundColor: iconBg }]}>
          <Location size={20} color={iconColor} variant="Bold" />
        </View>
        <View style={styles.content}>
          <Text style={[styles.value, { color: tc.textPrimary }, !value && { color: tc.textTertiary, fontWeight: typography.fontWeight.regular }]}>
            {value || placeholder}
          </Text>
        </View>
        <ArrowRight2 size={20} color={tc.textTertiary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.md },
  label: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium, marginBottom: spacing.xs },
  field: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: borderRadius.lg, padding: spacing.md, borderWidth: 1,
  },
  iconContainer: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center', marginRight: spacing.md,
  },
  content: { flex: 1 },
  value: { fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.medium },
});
