/**
 * GUEST FIELD
 * 
 * Tappable field for rooms & guests selection with blue color theme
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { People, ArrowDown2 } from 'iconsax-react-native';
import { colors, spacing, typography, borderRadius } from '@/styles';

// Blue color theme for guests
const THEME = {
  icon: '#3B82F6',
  background: '#DBEAFE',
};

interface GuestFieldProps {
  label?: string;
  rooms: number;
  adults: number;
  children: number;
  onPress: () => void;
}

export default function GuestField({
  label = 'Guests & Rooms',
  rooms,
  adults,
  children,
  onPress,
}: GuestFieldProps) {
  const formatGuests = (): string => {
    const parts = [];
    parts.push(`${rooms} room${rooms > 1 ? 's' : ''}`);
    parts.push(`${adults} adult${adults > 1 ? 's' : ''}`);
    if (children > 0) {
      parts.push(`${children} child${children > 1 ? 'ren' : ''}`);
    }
    return parts.join(', ');
  };

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
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{formatGuests()}</Text>
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
