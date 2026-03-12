/**
 * OPTION CARD
 * 
 * Reusable card component for displaying import options.
 * Uses design system tokens — no hardcoded colors.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { spacing, typography, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';

interface OptionCardProps {
  icon: React.ReactNode;
  iconBackground?: string;
  title: string;
  description: string;
  onPress: () => void;
  selected?: boolean;
}

export default function OptionCard({
  icon,
  iconBackground,
  title,
  description,
  onPress,
  selected = false,
}: OptionCardProps) {
  const { colors: tc } = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle },
        selected && { backgroundColor: tc.primary + '08', borderColor: tc.primary },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: iconBackground || (tc.primary + '12') }]}>
        {icon}
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, { color: tc.textPrimary }, selected && { color: tc.primary }]}>
          {title}
        </Text>
        <Text style={[styles.description, { color: tc.textSecondary }]}>
          {description}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderRadius: borderRadius['2xl'],
    padding: spacing.md,
    gap: spacing.md,
    borderWidth: 1.5,
    marginBottom: spacing.sm,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    marginBottom: 2,
  },
  description: {
    fontSize: typography.fontSize.xs,
    lineHeight: 16,
  },
});
