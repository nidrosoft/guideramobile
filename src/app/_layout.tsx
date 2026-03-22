import { useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import {
  Rubik_300Light,
  Rubik_400Regular,
  Rubik_500Medium,
  Rubik_600SemiBold,
  Rubik_700Bold,
} from '@expo-google-fonts/rubik';
import { HostGrotesk_700Bold } from '@expo-google-fonts/host-grotesk';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
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
import { initNotifications, requestNotificationPermissions } from '@/services/notifications';
import { initAnalytics } from '@/services/analytics/analytics';
import { initDeepLinks } from '@/services/deeplink/deeplinkService';
import '@/lib/i18n'; // Initialize i18n
import { loadSavedLanguage } from '@/lib/i18n';
// Mapbox SDK — only initialize if native module is available (dev build, not Expo Go)
let MapboxGL: any = null;
try {
  MapboxGL = require('@rnmapbox/maps').default;
} catch { /* @rnmapbox/maps not linked — running in Expo Go */ }

// Clerk publishable key
const CLERK_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || '';

// Initialize Mapbox SDK if available
const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN || '';
if (MapboxGL && MAPBOX_TOKEN) {
  MapboxGL.setAccessToken(MAPBOX_TOKEN);
}

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
  const [fontsLoaded] = useFonts({
    'Rubik-Light': Rubik_300Light,
    'Rubik-Regular': Rubik_400Regular,
    'Rubik-Medium': Rubik_500Medium,
    'Rubik-SemiBold': Rubik_600SemiBold,
    'Rubik-Bold': Rubik_700Bold,
    'HostGrotesk-Bold': HostGrotesk_700Bold,
  });

  useEffect(() => {
    // Initialize app services
    logger.info('App started');
    
    // Load saved language preference
    loadSavedLanguage();
    
    // Initialize analytics (Mixpanel — falls back to mock if no token)
    initAnalytics('mixpanel').catch(err => logger.warn('Analytics init failed', err));

    // NAV-01: Initialize deep linking service
    initDeepLinks((route, params) => {
      try {
        const { router } = require('expo-router');
        router.push({ pathname: route as any, params });
      } catch (err) {
        logger.warn('Deep link navigation failed', { route, params, error: err });
      }
    });

    // Initialize push notifications
    initNotifications().then(() => {
      requestNotificationPermissions();
    }).catch(err => logger.warn('Notification init failed', err));
    
    // Start periodic health checks (every 60 seconds)
    startHealthChecks(60000);

    return () => {
      stopHealthChecks();
    };
  }, []);

  // Show loading screen while fonts load
  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3FC39E" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <ErrorBoundary level="global">
        <QueryClientProvider client={queryClient}>
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
        </QueryClientProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#202020',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
