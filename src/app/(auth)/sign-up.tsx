import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState, useEffect } from 'react';
import * as Haptics from 'expo-haptics';
import { colors, typography, spacing, borderRadius, shadows } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { useSSO } from '@clerk/clerk-expo';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';

const useWarmUpBrowser = () => {
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);
};

WebBrowser.maybeCompleteAuthSession();

export default function SignUp() {
  useWarmUpBrowser();
  const router = useRouter();
  const { colors: tc, isDark } = useTheme();
  const { startSSOFlow } = useSSO();
  const [error, setError] = useState('');

  const handleSocialSignUp = async (provider: 'oauth_apple' | 'oauth_google' | 'oauth_facebook') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setError('');

    try {
      const { createdSessionId, setActive, signIn, signUp } = await startSSOFlow({
        strategy: provider,
        redirectUrl: AuthSession.makeRedirectUri(),
      });

      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        // AuthGuard will redirect based on onboarding status
      } else {
        console.log('[SignUp SSO] No session created. signUp status:', signUp?.status, 'signIn status:', signIn?.status);
      }
    } catch (err: any) {
      const clerkError = err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || err.message || 'Social sign up failed';
      setError(clerkError);
    }
  };

  const handlePhoneSignUp = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/(auth)/phone-signup');
  };

  return (
    <View style={[styles.container, { backgroundColor: tc.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: tc.textPrimary }]}>Create Account</Text>
          <Text style={[styles.subtitle, { color: tc.textSecondary }]}>Sign up to start your journey</Text>
        </View>

        {/* Social Sign Up Buttons */}
        <View style={styles.socialButtons}>
          <TouchableOpacity
            style={[styles.socialButton, { backgroundColor: isDark ? tc.white : tc.black }]}
            onPress={() => handleSocialSignUp('oauth_apple')}
          >
            <Text style={[styles.socialButtonText, { color: isDark ? tc.black : tc.white }]}>Continue with Apple</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.socialButton, { backgroundColor: tc.bgElevated, borderWidth: 1, borderColor: tc.borderMedium }]}
            onPress={() => handleSocialSignUp('oauth_google')}
          >
            <Text style={[styles.socialButtonText, { color: tc.textPrimary }]}>
              Continue with Google
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.socialButton, { backgroundColor: '#1877F2' }]}
            onPress={() => handleSocialSignUp('oauth_facebook')}
          >
            <Text style={[styles.socialButtonText, { color: tc.white }]}>Continue with Facebook</Text>
          </TouchableOpacity>
        </View>

        {error ? <Text style={[styles.errorText, { color: tc.error }]}>{error}</Text> : null}

        {/* Divider */}
        <View style={styles.divider}>
          <View style={[styles.dividerLine, { backgroundColor: tc.borderMedium }]} />
          <Text style={[styles.dividerText, { color: tc.textSecondary }]}>or</Text>
          <View style={[styles.dividerLine, { backgroundColor: tc.borderMedium }]} />
        </View>

        {/* Phone Number Button - Highlighted */}
        <View style={styles.phoneContainer}>
          <View style={[styles.quickBadge, { backgroundColor: tc.primary }]}>
            <Text style={[styles.quickBadgeText, { color: tc.white }]}>⚡ Quick & Easy</Text>
          </View>
          <TouchableOpacity
            style={[styles.phoneButton, { backgroundColor: tc.primary }]}
            onPress={handlePhoneSignUp}
            activeOpacity={0.8}
          >
            <Text style={[styles.phoneButtonText, { color: tc.white }]}>Continue with Phone Number</Text>
          </TouchableOpacity>
        </View>

        {/* Sign In Link */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: tc.textSecondary }]}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={[styles.footerLink, { color: tc.primary }]}>Sign In</Text>
          </TouchableOpacity>
        </View>
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
    paddingHorizontal: spacing.xl,
    paddingTop: 100,
    paddingBottom: spacing['2xl'],
  },
  header: {
    marginBottom: spacing['2xl'],
  },
  title: {
    fontSize: typography.fontSize['4xl'],
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.fontSize.lg,
  },
  errorText: {
    fontSize: typography.fontSize.sm,
    marginTop: spacing.sm,
  },
  socialButtons: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  socialButton: {
    height: 52,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  socialButtonText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: spacing.md,
    fontSize: typography.fontSize.sm,
  },
  phoneContainer: {
    position: 'relative',
    marginBottom: spacing.xl,
  },
  quickBadge: {
    position: 'absolute',
    top: -12,
    alignSelf: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    zIndex: 1,
    ...shadows.md,
  },
  quickBadgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },
  phoneButton: {
    height: 56,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.lg,
  },
  phoneButtonText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  footerText: {
    fontSize: typography.fontSize.base,
  },
  footerLink: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
});
