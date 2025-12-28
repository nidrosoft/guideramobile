/**
 * CLASS FIELD
 * 
 * Tappable field for cabin class selection with pink/rose color theme
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Crown, ArrowDown2 } from 'iconsax-react-native';
import { colors, spacing, typography, borderRadius } from '@/styles';

// Pink/Rose color theme for class
const THEME = {
  icon: '#EC4899', // Pink
  background: '#FCE7F3', // Light pink
};

interface ClassFieldProps {
  value: string;
  onPress: () => void;
}

export default function ClassField({ value, onPress }: ClassFieldProps) {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: THEME.background }]}>
        <Crown size={20} color={THEME.icon} variant="Bold" />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.label}>Cabin Class</Text>
        <Text style={styles.value}>{value}</Text>
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
