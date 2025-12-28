/**
 * LOCATION FIELD
 * 
 * Tappable field for airport selection with color coding
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Airplane } from 'iconsax-react-native';
import { colors, spacing, typography, borderRadius } from '@/styles';

// Color themes for different field types
const FIELD_COLORS = {
  departure: {
    icon: '#22C55E', // Green
    background: '#DCFCE7', // Light green
  },
  arrival: {
    icon: '#3B82F6', // Blue
    background: '#DBEAFE', // Light blue
  },
};

interface LocationFieldProps {
  label: string;
  value?: string;
  placeholder: string;
  type: 'departure' | 'arrival';
  onPress: () => void;
}

export default function LocationField({
  label,
  value,
  placeholder,
  type,
  onPress,
}: LocationFieldProps) {
  const colorTheme = FIELD_COLORS[type];
  const rotation = type === 'departure' ? '-45deg' : '45deg';
  
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: colorTheme.background }]}>
        <Airplane 
          size={20} 
          color={colorTheme.icon} 
          variant="Bold" 
          style={{ transform: [{ rotate: rotation }] }} 
        />
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
