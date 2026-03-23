import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { colors } from '@/styles';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, isLoading, hasCompletedOnboarding, profile } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const navigationState = useRootNavigationState();

  useEffect(() => {
    if (!navigationState?.key || isLoading) {
      if (__DEV__) console.log('[AuthGuard] Waiting...', { hasNavKey: !!navigationState?.key, isLoading });
      return;
    }

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboardingGroup = segments[0] === '(onboarding)';
    const inTabsGroup = segments[0] === '(tabs)';

    if (__DEV__) console.log('[AuthGuard] Evaluating:', {
      isAuthenticated,
      hasCompletedOnboarding,
      currentSegment: segments[0],
      inAuthGroup,
      inOnboardingGroup,
    });

    if (!isAuthenticated) {
      if (!inAuthGroup) {
        if (__DEV__) console.log('[AuthGuard] → Redirecting to landing (not authenticated)');
        router.replace('/(auth)/landing');
      }
    } else {
      if (!hasCompletedOnboarding) {
        // Only redirect when profile is loaded — profile being null means it's
        // still syncing, not that onboarding isn't complete.  Avoids a race
        // condition where the user logs back in and gets a spurious redirect.
        if (!inOnboardingGroup && profile) {
          if (__DEV__) console.log('[AuthGuard] → Redirecting to onboarding (authenticated, not onboarded)');
          router.replace('/(onboarding)/intro');
        }
      } else {
        if (inAuthGroup || inOnboardingGroup) {
          if (__DEV__) console.log('[AuthGuard] → Redirecting to tabs (authenticated + onboarded)');
          router.replace('/(tabs)');
        }
      }
    }
  }, [isAuthenticated, hasCompletedOnboarding, segments, isLoading, navigationState?.key]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});
