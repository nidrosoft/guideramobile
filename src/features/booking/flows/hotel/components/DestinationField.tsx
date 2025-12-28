/**
 * DESTINATION FIELD
 * 
 * Tappable field for city/location selection with purple color theme
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Building } from 'iconsax-react-native';
import { colors, spacing, typography, borderRadius } from '@/styles';

// Purple color theme for destination
const THEME = {
  icon: '#8B5CF6',
  background: '#F3E8FF',
};

interface DestinationFieldProps {
  label?: string;
  value?: string;
  placeholder?: string;
  onPress: () => void;
}

export default function DestinationField({
  label = 'Destination',
  value,
  placeholder = 'Where are you going?',
  onPress,
}: DestinationFieldProps) {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: THEME.background }]}>
        <Building size={20} color={THEME.icon} variant="Bold" />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.label}>{label}</Text>
        <Text style={[styles.value, !value && styles.placeholder]} numberOfLines={1}>
          {value || placeholder}
        </Text>
      </View>
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
  placeholder: {
    color: colors.gray400,
    fontWeight: typography.fontWeight.regular,
  },
});
