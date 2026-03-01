/**
 * OPTION CARD
 * 
 * Reusable card component for displaying import options.
 * Used in method selection and provider selection steps.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, typography, borderRadius } from '@/styles';
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
  iconBackground = `${colors.primary}15`,
  title,
  description,
  onPress,
  selected = false,
}: OptionCardProps) {
  return (
    <TouchableOpacity
      style={[styles.card, selected && styles.selectedCard]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: iconBackground }]}>
        {icon}
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, selected && styles.selectedTitle]}>
          {title}
        </Text>
        <Text style={[styles.description, selected && styles.selectedDescription]}>
          {description}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray200,
    marginBottom: spacing.md,
  },
  selectedCard: {
    backgroundColor: '#F5F3FF',
    borderColor: colors.primary,
    borderWidth: 2,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  selectedTitle: {
    color: colors.primary,
  },
  description: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  selectedDescription: {
    color: '#6B5DD3',
  },
});
