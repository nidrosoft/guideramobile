import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState, useEffect } from 'react';
import * as Haptics from 'expo-haptics';
import { colors, typography, spacing, borderRadius, shadows } from '@/styles';
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
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Sign up to start your journey</Text>
        </View>

        {/* Social Sign Up Buttons */}
        <View style={styles.socialButtons}>
          <TouchableOpacity
            style={[styles.socialButton, styles.appleButton]}
            onPress={() => handleSocialSignUp('oauth_apple')}
          >
            <Text style={styles.socialButtonText}>Continue with Apple</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.socialButton, styles.googleButton]}
            onPress={() => handleSocialSignUp('oauth_google')}
          >
            <Text style={[styles.socialButtonText, styles.googleButtonText]}>
              Continue with Google
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.socialButton, styles.facebookButton]}
            onPress={() => handleSocialSignUp('oauth_facebook')}
          >
            <Text style={styles.socialButtonText}>Continue with Facebook</Text>
          </TouchableOpacity>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Phone Number Button - Highlighted */}
        <View style={styles.phoneContainer}>
          <View style={styles.quickBadge}>
            <Text style={styles.quickBadgeText}>⚡ Quick & Easy</Text>
          </View>
          <TouchableOpacity
            style={styles.phoneButton}
            onPress={handlePhoneSignUp}
            activeOpacity={0.8}
          >
            <Text style={styles.phoneButtonText}>Continue with Phone Number</Text>
          </TouchableOpacity>
        </View>

        {/* Sign In Link */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.footerLink}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.fontSize.lg,
    color: colors.textSecondary,
  },
  errorText: {
    fontSize: typography.fontSize.sm,
    color: '#EF4444',
    marginTop: spacing.sm,
  },
  socialButtons: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  socialButton: {
    height: 52,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  appleButton: {
    backgroundColor: colors.black,
  },
  googleButton: {
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.gray300,
  },
  facebookButton: {
    backgroundColor: '#1877F2',
  },
  socialButtonText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
  googleButtonText: {
    color: colors.textPrimary,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.gray300,
  },
  dividerText: {
    marginHorizontal: spacing.md,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  phoneContainer: {
    position: 'relative',
    marginBottom: spacing.xl,
  },
  quickBadge: {
    position: 'absolute',
    top: -12,
    alignSelf: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    zIndex: 1,
    ...shadows.md,
  },
  quickBadgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
  phoneButton: {
    height: 56,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.lg,
  },
  phoneButtonText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  footerText: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
  },
  footerLink: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
  },
});
