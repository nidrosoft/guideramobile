import React, { ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { typography, spacing } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { RefreshCircle, Warning2 } from 'iconsax-react-native';
import { ErrorBoundary } from './ErrorBoundary';

interface FeatureErrorBoundaryProps {
  children: ReactNode;
  featureName: string;
  onRetry?: () => void;
}

/**
 * Compact error boundary for feature sections within screens.
 * Shows a smaller, inline error state that doesn't take over the whole screen.
 */
export function FeatureErrorBoundary({
  children,
  featureName,
  onRetry,
}: FeatureErrorBoundaryProps) {
  return (
    <ErrorBoundary
      level="feature"
      fallback={
        <FeatureErrorFallback featureName={featureName} onRetry={onRetry} />
      }
      onError={(error, errorInfo) => {
        // Log feature-specific error
        console.error(`[${featureName}] Error:`, error.message);
        // TODO: Send to Sentry with feature context
      }}
    >
      {children}
    </ErrorBoundary>
  );
}

interface FeatureErrorFallbackProps {
  featureName: string;
  onRetry?: () => void;
}

function FeatureErrorFallback({ featureName, onRetry }: FeatureErrorFallbackProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.errorBg, borderColor: colors.errorBorder }]}>
      <View style={[styles.iconContainer, { backgroundColor: colors.errorBg }]}>
        <Warning2 size={24} color={colors.error} variant="Bold" />
      </View>
      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Unable to load {featureName}</Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          Something went wrong. Please try again.
        </Text>
      </View>
      {onRetry && (
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: colors.bgElevated, borderColor: colors.gray200 }]}
          onPress={onRetry}
          activeOpacity={0.7}
        >
          <RefreshCircle size={18} color={colors.primary} variant="Bold" />
          <Text style={[styles.retryText, { color: colors.primary }]}>Retry</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    marginVertical: spacing.sm,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: 2,
  },
  description: {
    fontSize: typography.fontSize.xs,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  retryText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },
});

export default FeatureErrorBoundary;
