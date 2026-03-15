/**
 * PLUGIN ERROR STATE — Shared error state for all trip hub plugin screens.
 *
 * Shows when data fetching fails. Provides a retry button.
 * Matches PluginEmptyState design language.
 * Used by: Language, Documents, Packing, Planner, Do's & Don'ts, Safety, Expenses, Journal, Compensation.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Warning2, Refresh } from 'iconsax-react-native';
import { spacing, typography } from '@/styles';
import { useTheme } from '@/context/ThemeContext';

interface PluginErrorStateProps {
  message?: string;
  onRetry: () => void;
}

export default function PluginErrorState({
  message = 'Something went wrong loading this data.',
  onRetry,
}: PluginErrorStateProps) {
  const { colors: tc } = useTheme();

  return (
    <View style={styles.container}>
      <View style={[styles.iconCircle, { backgroundColor: '#EF444415' }]}>
        <Warning2 size={36} color="#EF4444" variant="Bold" />
      </View>
      <Text style={[styles.title, { color: tc.textPrimary }]}>Failed to Load</Text>
      <Text style={[styles.message, { color: tc.textSecondary }]}>{message}</Text>
      <TouchableOpacity
        style={[styles.retryButton, { backgroundColor: tc.primary }]}
        onPress={onRetry}
        activeOpacity={0.8}
      >
        <Refresh size={18} color="#FFFFFF" />
        <Text style={styles.retryText}>Try Again</Text>
      </TouchableOpacity>
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
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  message: {
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.xl,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  retryText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
