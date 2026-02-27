import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StripeProvider } from '@stripe/stripe-react-native';
import { ClerkProvider } from '@clerk/clerk-expo';
import { tokenCache } from '@clerk/clerk-expo/token-cache';
import { ToastProvider } from '@/contexts/ToastContext';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthGuard } from '@/components/auth';
import { ErrorBoundary } from '@/components/common/error';
import { OfflineBanner } from '@/components/common/network';
import { HomepageDataProvider } from '@/features/homepage';
import { startHealthChecks, stopHealthChecks } from '@/services/health';
import { logger } from '@/services/logging';
import { initSentry } from '@/services/sentry';
import '@/lib/i18n'; // Initialize i18n
import { loadSavedLanguage } from '@/lib/i18n';

// Stripe publishable key - replace with your actual key
const STRIPE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder';

// Clerk publishable key
const CLERK_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || '';

// Initialize Sentry as early as possible
initSentry();

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes (garbage collection time)
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

export default function RootLayout() {
  useEffect(() => {
    // Initialize app services
    logger.info('App started');
    
    // Load saved language preference
    loadSavedLanguage();
    
    // Start periodic health checks (every 60 seconds)
    startHealthChecks(60000);

    return () => {
      stopHealthChecks();
    };
  }, []);

  return (
    <ErrorBoundary level="global">
      <QueryClientProvider client={queryClient}>
        <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
          <ThemeProvider>
            <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} tokenCache={tokenCache}>
              <AuthProvider>
                <AuthGuard>
                <HomepageDataProvider>
                  <ToastProvider>
                    <View style={styles.container}>
                      <Stack
                        screenOptions={{
                          headerShown: false,
                          animation: 'slide_from_right',
                          animationDuration: 300,
                        }}
                      />
                      <OfflineBanner />
                    </View>
                  </ToastProvider>
                </HomepageDataProvider>
                </AuthGuard>
              </AuthProvider>
            </ClerkProvider>
          </ThemeProvider>
        </StripeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
