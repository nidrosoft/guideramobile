/**
 * TRAVELER FIELD
 * 
 * Tappable field for passenger selection with purple color theme
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { People, Add } from 'iconsax-react-native';
import { colors, spacing, typography, borderRadius } from '@/styles';

// Purple color theme for travelers
const THEME = {
  icon: '#8B5CF6', // Purple
  background: '#F3E8FF', // Light purple
};

interface TravelerFieldProps {
  value: string;
  onPress: () => void;
}

export default function TravelerField({ value, onPress }: TravelerFieldProps) {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: THEME.background }]}>
        <People size={20} color={THEME.icon} variant="Bold" />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.label}>Travelers</Text>
        <Text style={styles.value}>{value}</Text>
      </View>
      <Add size={20} color={colors.gray400} />
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
