import React, { Component, ErrorInfo, ReactNode, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { typography, spacing, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { RefreshCircle, Warning2, Send2, TickCircle } from 'iconsax-react-native';
import { captureException, addBreadcrumb } from '@/services/sentry';
import { supabase } from '@/lib/supabase/client';

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

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    if (__DEV__) {
      console.error('ErrorBoundary caught an error:', error);
      console.error('Component stack:', errorInfo.componentStack);
    }

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

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onReset={this.handleReset}
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
  level: 'global' | 'feature' | 'component';
}

function ErrorFallback({ error, errorInfo, onReset, level }: ErrorFallbackProps) {
  // Safely access theme — fall back to static colors if ThemeProvider isn't available
  let tc: Record<string, string>;
  let isDark = false;
  try {
    const theme = useTheme();
    tc = theme.colors as unknown as Record<string, string>;
    isDark = theme.isDark;
  } catch {
    // Fallback colors when ErrorBoundary is outside ThemeProvider
    tc = {
      background: '#1A1A2E', textPrimary: '#FFFFFF', textSecondary: '#A0A0B0',
      textTertiary: '#707080', primary: '#3FC39E', error: '#EF4444', success: '#22C55E',
      white: '#FFFFFF', black: '#000000', bgElevated: '#252540', bgCard: '#202035',
      borderSubtle: '#333350', borderMedium: '#444460',
    };
    isDark = true;
  }
  const isGlobal = level === 'global';
  const [userEmail, setUserEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [reportSent, setReportSent] = useState(false);

  const handleReportIssue = async () => {
    setIsSending(true);
    try {
      const deviceInfo = `${Platform.OS} ${Platform.Version} | ${__DEV__ ? 'DEV' : 'PROD'}`;
      
      await supabase.functions.invoke('send-crash-report', {
        body: {
          errorName: error?.name || 'Unknown',
          errorMessage: error?.message || 'No message',
          componentStack: errorInfo?.componentStack?.trim() || '',
          userEmail: userEmail.trim() || undefined,
          deviceInfo,
        },
      });
      
      setReportSent(true);
    } catch (err) {
      console.error('[CrashReport] Failed to send:', err);
      // Still mark as sent to avoid frustrating the user
      setReportSent(true);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: tc.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Error Icon */}
        <View style={[styles.iconContainer, { backgroundColor: `${tc.error}15` }]}>
          <Warning2 size={isGlobal ? 48 : 36} color={tc.error} variant="Bold" />
        </View>

        {/* Title */}
        <Text style={[styles.title, { color: tc.textPrimary }]}>
          {isGlobal ? 'Something went wrong' : 'This section crashed'}
        </Text>

        {/* Description */}
        <Text style={[styles.description, { color: tc.textSecondary }]}>
          {isGlobal
            ? "We're sorry about this. You can try again or send us a crash report so we can fix it."
            : "Don't worry, your data is safe. Try refreshing or report this issue."}
        </Text>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: tc.primary }]}
            onPress={onReset}
            activeOpacity={0.8}
          >
            <RefreshCircle size={20} color={tc.white} variant="Bold" />
            <Text style={[styles.primaryButtonText, { color: tc.white }]}>Try Again</Text>
          </TouchableOpacity>
        </View>

        {/* Error Details — always shown */}
        {error && (
          <View style={[styles.detailsContainer, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle }]}>
            <Text style={[styles.detailsTitle, { color: tc.textTertiary }]}>CRASH DETAILS</Text>
            <ScrollView style={styles.detailsScroll} showsVerticalScrollIndicator={false} nestedScrollEnabled>
              <Text style={[styles.errorName, { color: tc.error }]}>{error.name}</Text>
              <Text style={[styles.errorMessage, { color: tc.textPrimary }]}>{error.message}</Text>
              {errorInfo?.componentStack && (
                <Text style={[styles.stackTrace, { color: tc.textTertiary }]}>
                  {errorInfo.componentStack.trim()}
                </Text>
              )}
            </ScrollView>
          </View>
        )}

        {/* Report Section */}
        {reportSent ? (
          <View style={[styles.reportSentCard, { backgroundColor: `${tc.success}12`, borderColor: `${tc.success}30` }]}>
            <TickCircle size={24} color={tc.success} variant="Bold" />
            <View style={{ flex: 1, marginLeft: spacing.sm }}>
              <Text style={[styles.reportSentTitle, { color: tc.success }]}>Report Sent</Text>
              <Text style={[styles.reportSentText, { color: tc.textSecondary }]}>
                Thank you! Our team will look into this.
              </Text>
            </View>
          </View>
        ) : (
          <View style={[styles.reportSection, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle }]}>
            <Text style={[styles.reportTitle, { color: tc.textPrimary }]}>Help us fix this</Text>
            <Text style={[styles.reportSubtitle, { color: tc.textTertiary }]}>
              The crash details above will be included automatically.
            </Text>

            {/* Optional email */}
            <TextInput
              style={[styles.emailInput, { borderColor: tc.borderMedium, color: tc.textPrimary, backgroundColor: tc.bgCard }]}
              placeholder="Your email (optional)"
              placeholderTextColor={tc.textTertiary}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={userEmail}
              onChangeText={setUserEmail}
            />

            <TouchableOpacity
              style={[styles.reportButton, { backgroundColor: isDark ? tc.white : tc.black }, isSending && { opacity: 0.6 }]}
              onPress={handleReportIssue}
              disabled={isSending}
              activeOpacity={0.8}
            >
              {isSending ? (
                <ActivityIndicator color={isDark ? tc.black : tc.white} size="small" />
              ) : (
                <>
                  <Send2 size={18} color={isDark ? tc.black : tc.white} variant="Bold" />
                  <Text style={[styles.reportButtonText, { color: isDark ? tc.black : tc.white }]}>
                    Report This Issue
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    paddingTop: 80,
    paddingBottom: 40,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  description: {
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
    maxWidth: 300,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 320,
    marginBottom: spacing.lg,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  primaryButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
  detailsContainer: {
    width: '100%',
    maxWidth: 320,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    padding: spacing.md,
    maxHeight: 180,
    marginBottom: spacing.lg,
  },
  detailsTitle: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailsScroll: {
    maxHeight: 130,
  },
  errorName: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.xs,
  },
  errorMessage: {
    fontSize: typography.fontSize.xs,
    marginBottom: spacing.sm,
  },
  stackTrace: {
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    lineHeight: 16,
  },
  reportSection: {
    width: '100%',
    maxWidth: 320,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    padding: spacing.lg,
  },
  reportTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.xs,
  },
  reportSubtitle: {
    fontSize: typography.fontSize.xs,
    marginBottom: spacing.md,
    lineHeight: 18,
  },
  emailInput: {
    height: 44,
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.md,
  },
  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  reportButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
  reportSentCard: {
    width: '100%',
    maxWidth: 320,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    padding: spacing.lg,
  },
  reportSentTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: 2,
  },
  reportSentText: {
    fontSize: typography.fontSize.sm,
  },
});

export default ErrorBoundary;
