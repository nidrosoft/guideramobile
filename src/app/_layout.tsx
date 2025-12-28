import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from '@/contexts/ToastContext';
import { ErrorBoundary } from '@/components/common/error';
import { OfflineBanner } from '@/components/common/network';
import { startHealthChecks, stopHealthChecks } from '@/services/health';
import { logger } from '@/services/logging';
import { initSentry } from '@/services/sentry';

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
    
    // Start periodic health checks (every 60 seconds)
    startHealthChecks(60000);

    return () => {
      stopHealthChecks();
    };
  }, []);

  return (
    <ErrorBoundary level="global">
      <QueryClientProvider client={queryClient}>
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
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
