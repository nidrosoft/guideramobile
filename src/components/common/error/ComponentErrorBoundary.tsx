import React, { ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { typography, spacing } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { RefreshCircle } from 'iconsax-react-native';
import { ErrorBoundary } from './ErrorBoundary';

interface ComponentErrorBoundaryProps {
  children: ReactNode;
  onRetry?: () => void;
  fallbackMessage?: string;
}

/**
 * Minimal error boundary for small UI components.
 * Shows a simple inline error state without taking much space.
 */
export function ComponentErrorBoundary({
  children,
  onRetry,
  fallbackMessage = 'Failed to load',
}: ComponentErrorBoundaryProps) {
  return (
    <ErrorBoundary
      level="component"
      fallback={
        <ComponentErrorFallback message={fallbackMessage} onRetry={onRetry} />
      }
    >
      {children}
    </ErrorBoundary>
  );
}

interface ComponentErrorFallbackProps {
  message: string;
  onRetry?: () => void;
}

function ComponentErrorFallback({ message, onRetry }: ComponentErrorFallbackProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.gray100 }]}>
      <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>
      {onRetry && (
        <TouchableOpacity
          style={styles.retryButton}
          onPress={onRetry}
          activeOpacity={0.7}
        >
          <RefreshCircle size={14} color={colors.primary} variant="Bold" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    padding: spacing.sm,
    gap: spacing.xs,
  },
  message: {
    fontSize: typography.fontSize.xs,
  },
  retryButton: {
    padding: 4,
  },
});

export default ComponentErrorBoundary;
