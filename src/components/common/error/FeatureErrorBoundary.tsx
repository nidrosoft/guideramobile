import React, { ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, typography, spacing } from '@/styles';
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
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Warning2 size={24} color={colors.error} variant="Bold" />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>Unable to load {featureName}</Text>
        <Text style={styles.description}>
          Something went wrong. Please try again.
        </Text>
      </View>
      {onRetry && (
        <TouchableOpacity
          style={styles.retryButton}
          onPress={onRetry}
          activeOpacity={0.7}
        >
          <RefreshCircle size={18} color={colors.primary} variant="Bold" />
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.error}08`,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: `${colors.error}20`,
    marginVertical: spacing.sm,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${colors.error}15`,
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
    color: colors.textPrimary,
    marginBottom: 2,
  },
  description: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.gray200,
    gap: 4,
  },
  retryText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.primary,
  },
});

export default FeatureErrorBoundary;
