/**
 * EMPTY STATE
 * 
 * Reusable empty state component for search results.
 * Shows when no results are found.
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SearchNormal1 } from 'iconsax-react-native';
import { typography, spacing } from '@/styles';
import { useTheme } from '@/context/ThemeContext';

interface EmptyStateProps {
  title?: string;
  message?: string;
  icon?: React.ReactNode;
}

export default function EmptyState({
  title = 'No results found',
  message = 'Try adjusting your search or filters to find what you\'re looking for.',
  icon,
}: EmptyStateProps) {
  const { colors } = useTheme();

  const dynamicStyles = useMemo(() => ({
    title: { color: colors.textPrimary },
    message: { color: colors.textSecondary },
  }), [colors]);

  return (
    <View style={styles.container}>
      {icon || <SearchNormal1 size={64} color={colors.gray300} variant="Bulk" />}
      <Text style={[styles.title, dynamicStyles.title]}>{title}</Text>
      <Text style={[styles.message, dynamicStyles.message]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    marginTop: spacing.md,
  },
  message: {
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
    marginTop: spacing.xs,
    lineHeight: 22,
  },
});
