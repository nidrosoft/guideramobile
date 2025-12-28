/**
 * Sentry Configuration and Initialization
 * 
 * Provides crash reporting, error tracking, and performance monitoring.
 * 
 * Setup Instructions:
 * 1. Create a Sentry account at https://sentry.io
 * 2. Create a new React Native project
 * 3. Get your DSN from Project Settings > Client Keys
 * 4. Add EXPO_PUBLIC_SENTRY_DSN to your .env file
 */

import * as Sentry from '@sentry/react-native';

// Get DSN from environment variable
const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;

// App version for release tracking
const APP_VERSION = '1.0.0';

// Environment detection
const getEnvironment = (): string => {
  if (__DEV__) return 'development';
  // You can add more logic here for staging vs production
  return 'production';
};

/**
 * Initialize Sentry SDK
 * Call this as early as possible in your app (before RootLayout)
 */
export function initSentry(): void {
  if (!SENTRY_DSN) {
    if (__DEV__) {
      console.warn(
        '[Sentry] DSN not configured. Add EXPO_PUBLIC_SENTRY_DSN to your .env file.'
      );
    }
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    
    // Environment and release info
    environment: getEnvironment(),
    release: `guidera@${APP_VERSION}`,
    
    // Enable in production only (or set to true for testing)
    enabled: !__DEV__,
    
    // Debug mode for development
    debug: __DEV__,
    
    // Sample rate for performance monitoring (0.0 to 1.0)
    // Start with 0.2 (20%) and adjust based on volume
    tracesSampleRate: __DEV__ ? 1.0 : 0.2,
    
    // Capture unhandled promise rejections
    enableAutoSessionTracking: true,
    
    // Session tracking
    sessionTrackingIntervalMillis: 30000,
    
    // Attach stack traces to messages
    attachStacktrace: true,
    
    // Filter out known non-issues
    beforeSend(event, hint) {
      // Filter out development errors
      if (__DEV__) {
        return null;
      }

      // Filter out specific errors you want to ignore
      const error = hint.originalException;
      if (error instanceof Error) {
        // Example: Ignore network errors that are expected
        if (error.message.includes('Network request failed')) {
          // Still log but don't send to Sentry
          return null;
        }
      }

      return event;
    },
    
    // Breadcrumb filtering
    beforeBreadcrumb(breadcrumb) {
      // Filter out noisy breadcrumbs
      if (breadcrumb.category === 'console' && breadcrumb.level === 'debug') {
        return null;
      }
      return breadcrumb;
    },
  });

  console.log('[Sentry] Initialized successfully');
}

/**
 * Set user context for error tracking
 * Call this after user logs in
 */
export function setUser(user: {
  id: string;
  email?: string;
  username?: string;
}): void {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.username,
  });
}

/**
 * Clear user context
 * Call this when user logs out
 */
export function clearUser(): void {
  Sentry.setUser(null);
}

/**
 * Set additional context for errors
 */
export function setContext(name: string, context: Record<string, any>): void {
  Sentry.setContext(name, context);
}

/**
 * Add a breadcrumb for debugging
 */
export function addBreadcrumb(breadcrumb: {
  category: string;
  message: string;
  level?: 'debug' | 'info' | 'warning' | 'error';
  data?: Record<string, any>;
}): void {
  Sentry.addBreadcrumb({
    category: breadcrumb.category,
    message: breadcrumb.message,
    level: breadcrumb.level || 'info',
    data: breadcrumb.data,
  });
}

/**
 * Capture an exception manually
 */
export function captureException(
  error: Error,
  context?: Record<string, any>
): string {
  return Sentry.captureException(error, {
    extra: context,
  });
}

/**
 * Capture a message (non-error event)
 */
export function captureMessage(
  message: string,
  level: 'debug' | 'info' | 'warning' | 'error' = 'info'
): string {
  return Sentry.captureMessage(message, level);
}

/**
 * Set a tag for filtering in Sentry dashboard
 */
export function setTag(key: string, value: string): void {
  Sentry.setTag(key, value);
}

/**
 * Wrap a component with Sentry error boundary
 * Use this for feature-level error tracking
 */
export const withSentryErrorBoundary = Sentry.withErrorBoundary;

/**
 * HOC to wrap screens with performance monitoring
 */
export const withSentryPerformance = Sentry.withProfiler;

// Export Sentry for advanced usage
export { Sentry };

export default {
  init: initSentry,
  setUser,
  clearUser,
  setContext,
  addBreadcrumb,
  captureException,
  captureMessage,
  setTag,
};
