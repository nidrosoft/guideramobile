import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { colors, typography, spacing } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { RefreshCircle, Warning2, MessageQuestion } from 'iconsax-react-native';
import { captureException, addBreadcrumb } from '@/services/sentry';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onReset?: () => void;
  showDetails?: boolean;
  level?: 'global' | 'feature' | 'component';
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log to console in development
    if (__DEV__) {
      console.error('ErrorBoundary caught an error:', error);
      console.error('Component stack:', errorInfo.componentStack);
    }

    // Send to Sentry in production
    if (!__DEV__) {
      addBreadcrumb({
        category: 'error-boundary',
        message: `Error caught by ${this.props.level || 'component'} boundary`,
        level: 'error',
        data: { componentStack: errorInfo.componentStack },
      });
      captureException(error, {
        componentStack: errorInfo.componentStack,
        level: this.props.level || 'component',
      });
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });

    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  handleReportIssue = () => {
    // TODO: Implement issue reporting (email, in-app form, etc.)
    console.log('Report issue clicked');
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI based on level
      return (
        <ErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onReset={this.handleReset}
          onReportIssue={this.handleReportIssue}
          showDetails={this.props.showDetails ?? __DEV__}
          level={this.props.level ?? 'component'}
        />
      );
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error: Error | null;
  errorInfo: ErrorInfo | null;
  onReset: () => void;
  onReportIssue: () => void;
  showDetails: boolean;
  level: 'global' | 'feature' | 'component';
}

function ErrorFallback({
  error,
  errorInfo,
  onReset,
  onReportIssue,
  showDetails,
  level,
}: ErrorFallbackProps) {
  const isGlobal = level === 'global';
  const isFeature = level === 'feature';

  return (
    <View style={[styles.container, isGlobal && styles.containerGlobal]}>
      <View style={styles.content}>
        {/* Error Icon */}
        <View style={[styles.iconContainer, isGlobal && styles.iconContainerLarge]}>
          <Warning2
            size={isGlobal ? 64 : 48}
            color={colors.error}
            variant="Bold"
          />
        </View>

        {/* Error Title */}
        <Text style={[styles.title, isGlobal && styles.titleLarge]}>
          {isGlobal
            ? 'Something went wrong'
            : isFeature
            ? 'This feature encountered an error'
            : 'Unable to load this section'}
        </Text>

        {/* Error Description */}
        <Text style={styles.description}>
          {isGlobal
            ? "We're sorry, but something unexpected happened. Please try again or restart the app."
            : "Don't worry, your data is safe. Try refreshing or come back later."}
        </Text>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={onReset}
            activeOpacity={0.8}
          >
            <RefreshCircle size={20} color={colors.white} variant="Bold" />
            <Text style={styles.primaryButtonText}>Try Again</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={onReportIssue}
            activeOpacity={0.8}
          >
            <MessageQuestion size={20} color={colors.primary} variant="Outline" />
            <Text style={styles.secondaryButtonText}>Report Issue</Text>
          </TouchableOpacity>
        </View>

        {/* Error Details (Dev Mode) */}
        {showDetails && error && (
          <View style={styles.detailsContainer}>
            <Text style={styles.detailsTitle}>Error Details</Text>
            <ScrollView
              style={styles.detailsScroll}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.errorName}>{error.name}</Text>
              <Text style={styles.errorMessage}>{error.message}</Text>
              {errorInfo?.componentStack && (
                <Text style={styles.stackTrace}>
                  {errorInfo.componentStack.trim()}
                </Text>
              )}
            </ScrollView>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  containerGlobal: {
    backgroundColor: colors.bgElevated,
  },
  content: {
    alignItems: 'center',
    maxWidth: 320,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${colors.error}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  iconContainerLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  titleLarge: {
    fontSize: typography.fontSize['2xl'],
  },
  description: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  buttonContainer: {
    width: '100%',
    gap: spacing.sm,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: 12,
    gap: spacing.sm,
  },
  primaryButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgElevated,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray200,
    gap: spacing.sm,
  },
  secondaryButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.primary,
  },
  detailsContainer: {
    width: '100%',
    marginTop: spacing.xl,
    backgroundColor: colors.gray50,
    borderRadius: 12,
    padding: spacing.md,
    maxHeight: 200,
  },
  detailsTitle: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailsScroll: {
    maxHeight: 150,
  },
  errorName: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.error,
    marginBottom: spacing.xs,
  },
  errorMessage: {
    fontSize: typography.fontSize.xs,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  stackTrace: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: colors.textSecondary,
    lineHeight: 16,
  },
});

export default ErrorBoundary;
