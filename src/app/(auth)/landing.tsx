import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Platform, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { Video, ResizeMode } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useEffect, useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import { colors, typography, spacing, borderRadius, shadows } from '@/styles';
import PrimaryButton from '@/components/common/buttons/PrimaryButton';
import TypingAnimation from '@/components/common/TypingAnimation';
import DSButton from '@/components/ds/DSButton';
import { Sms, Call } from 'iconsax-react-native';
import { useSSO, useUser, useAuth as useClerkAuth, useClerk } from '@clerk/clerk-expo';
import { parseClerkError } from '@/lib/clerk/errors';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';

export const useWarmUpBrowser = () => {
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);
};

WebBrowser.maybeCompleteAuthSession();

export default function Landing() {
  useWarmUpBrowser();
  const isFocused = useIsFocused();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { startSSOFlow } = useSSO();
  const { user: clerkUser } = useUser();
  const { isSignedIn } = useClerkAuth();
  const { signOut } = useClerk();
  const [error, setError] = useState('');
  const [ssoLoading, setSsoLoading] = useState('');
  const [retryCountdown, setRetryCountdown] = useState(0);

  // Countdown timer for rate-limit UX
  useEffect(() => {
    if (retryCountdown <= 0) return;
    const interval = setInterval(() => {
      setRetryCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [retryCountdown]);

  // Escape hatch: if user lands here while still signed in, they're stuck.
  // Sign out clears Clerk session + lets them retry cleanly.
  const handleStartOver = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setError('');
    try {
      await signOut();
    } catch (err) {
      if (__DEV__) console.warn('[Landing] Start over signOut failed:', err);
    }
  }, [signOut]);

  const phrases = [
    "Guidera",
    "Let's explore the world",
    "Let's immerse ourselves",
    "Let's go sightseeing",
    "Let's do some outside stuff",
    "Let's relax and unwind",
    "Let's exchange cultures",
    "Let's seek adventures",
    "Let's connect with nature",
    "Let's create memories",
  ];

  const handleSSOSignUp = async (strategy: 'oauth_google' | 'oauth_apple' | 'oauth_facebook') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setError('');
    setSsoLoading(strategy);

    // If already signed in, a new SSO attempt will error with session_exists
    // and eat into the rate limit. Clear the stale session first.
    if (isSignedIn) {
      if (__DEV__) console.log('[Landing SSO] Clearing stale session before retry');
      try { await signOut(); } catch { /* ignore */ }
    }

    try {
      const { createdSessionId, setActive, signIn, signUp } = await startSSOFlow({
        strategy,
        redirectUrl: AuthSession.makeRedirectUri(),
      });

      if (__DEV__) console.log('[Landing SSO] Response:', {
        createdSessionId: createdSessionId ? 'YES' : 'NULL',
        signUpStatus: signUp?.status,
        signInStatus: signIn?.status,
        signUpMissingFields: (signUp as any)?.missingFields,
      });

      // Happy path — Clerk created a session directly. Let AuthGuard route
      // based on Supabase profile.onboarding_completed (not Clerk state).
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        router.replace('/');
        return;
      }

      // No session yet — per Clerk docs, this is the "transfer flow". Clerk
      // has verified the OAuth identity but is sitting on a pending signUp
      // or signIn object. The right move is to transfer and either complete
      // (if no fields are missing) or guide the user to complete them.
      // See: https://clerk.com/docs/guides/development/custom-flows/authentication/oauth-connections#handle-missing-requirements

      // Case 1: signIn is pending but no first factor verified — transfer to
      // signUp (account may not exist yet or Apple Private Relay gave a new email).
      if (signUp) {
        const missing: string[] = (signUp as any)?.missingFields ?? [];
        if (__DEV__) console.log('[Landing SSO] Transfer path → signUp exists. missing:', missing);

        if (signUp.status === 'complete' && signUp.createdSessionId && setActive) {
          await setActive({ session: signUp.createdSessionId });
          router.replace('/');
          return;
        }

        if (signUp.status === 'missing_requirements') {
          // Route to completion screen; it will read signUp from Clerk context
          // and collect whatever's needed. Cast needed until expo-router's
          // typed-route generation picks up the new file.
          router.push('/(auth)/complete-signup' as any);
          return;
        }
      }

      // Fallback — unexpected Clerk state. Log it so we can diagnose.
      if (__DEV__) console.warn('[Landing SSO] Unhandled state', { signIn, signUp });
      setError('Sign up didn\u2019t complete. Please try email sign up or contact support.');
    } catch (err: unknown) {
      const parsed = parseClerkError(err);
      if (__DEV__) console.warn('[Landing SSO] Error:', parsed);
      if (parsed.isRateLimit && parsed.retryAfterSeconds) {
        setRetryCountdown(parsed.retryAfterSeconds);
      }
      setError(parsed.message);
    } finally {
      setSsoLoading('');
    }
  };

  const handleEmailSignUp = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/(auth)/email-signup');
  };

  const handleSignIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/(auth)/sign-in');
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Background Video */}
      <Video
        source={require('../../../assets/images/landing.mp4')}
        style={[styles.video, { width, height }]}
        resizeMode={ResizeMode.COVER}
        shouldPlay
        isLooping
        isMuted
        accessible={false}
      />

      {/* Gradient Overlay */}
      <LinearGradient
        colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.85)']}
        style={[styles.gradient, { width, height }]}
      />

      {/* Content */}
      <View style={[styles.content, { paddingBottom: insets.bottom + 12 }]}>
        {/* Centered Typing Animation */}
        <View style={styles.centerSection}>
          <TypingAnimation 
            phrases={phrases}
            typingSpeed={80}
            deletingSpeed={50}
            pauseTime={800}
            isActive={isFocused}
          />
        </View>

        {/* Bottom Actions */}
        <View style={styles.bottomContainer}>
          {/* Stuck-state escape hatch: signed in but still on landing */}
          {isSignedIn ? (
            <View style={styles.stuckBanner}>
              <Text style={styles.stuckText}>You have an active session. If you’re stuck, tap below to start over.</Text>
              <TouchableOpacity
                style={styles.stuckButton}
                onPress={handleStartOver}
                accessibilityRole="button"
                accessibilityLabel="Sign out and start over"
              >
                <Text style={styles.stuckButtonText}>Sign Out & Start Over</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {/* Social SSO Buttons Row */}
          <View style={styles.ssoRow}>
            <TouchableOpacity
              style={styles.ssoButton}
              onPress={() => handleSSOSignUp('oauth_apple')}
              activeOpacity={0.8}
              disabled={!!ssoLoading || retryCountdown > 0}
              accessibilityRole="button"
              accessibilityLabel="Sign up with Apple"
              accessibilityState={{ disabled: !!ssoLoading || retryCountdown > 0 }}
            >
              {ssoLoading === 'oauth_apple' ? (
                <ActivityIndicator color={colors.textPrimary} size="small" />
              ) : (
                <Text style={styles.ssoIconApple}></Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.ssoButton}
              onPress={() => handleSSOSignUp('oauth_google')}
              activeOpacity={0.8}
              disabled={!!ssoLoading || retryCountdown > 0}
              accessibilityRole="button"
              accessibilityLabel="Sign up with Google"
              accessibilityState={{ disabled: !!ssoLoading || retryCountdown > 0 }}
            >
              {ssoLoading === 'oauth_google' ? (
                <ActivityIndicator color={colors.textPrimary} size="small" />
              ) : (
                <Text style={styles.ssoIconText}>G</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.ssoButton}
              onPress={() => handleSSOSignUp('oauth_facebook')}
              activeOpacity={0.8}
              disabled={!!ssoLoading || retryCountdown > 0}
              accessibilityRole="button"
              accessibilityLabel="Sign up with Facebook"
              accessibilityState={{ disabled: !!ssoLoading || retryCountdown > 0 }}
            >
              {ssoLoading === 'oauth_facebook' ? (
                <ActivityIndicator color={colors.textPrimary} size="small" />
              ) : (
                <Text style={styles.ssoIconFb}>f</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Sign Up Buttons Row */}
          <View style={styles.signUpRow}>
            <LinearGradient
              colors={[colors.gradientStart, colors.gradientEnd]}
              style={styles.signUpButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <TouchableOpacity
                style={styles.signUpButtonInner}
                onPress={handleEmailSignUp}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Sign up with email"
              >
                <Sms size={20} color={colors.white} variant="Bold" />
                <Text style={styles.signUpButtonText}>Email</Text>
              </TouchableOpacity>
            </LinearGradient>

            <TouchableOpacity
              style={styles.phoneSignUpButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push('/(auth)/phone-signup');
              }}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Sign up with phone"
            >
              <Call size={20} color={colors.white} variant="Bold" />
              <Text style={styles.phoneSignUpButtonText}>Phone</Text>
            </TouchableOpacity>
          </View>

          {retryCountdown > 0 ? (
            <Text style={styles.errorBadge}>Please wait {retryCountdown}s before trying again.</Text>
          ) : error ? (
            <Text style={styles.errorBadge}>{error}</Text>
          ) : null}

          {/* Sign In Link */}
          <View style={styles.signInContainer}>
            <Text style={styles.signInText}>Already have an account? </Text>
            <TouchableOpacity
              onPress={handleSignIn}
              accessibilityRole="link"
              accessibilityLabel="Sign in to existing account"
            >
              <Text style={styles.signInLink}>Sign In</Text>
            </TouchableOpacity>
          </View>

          {/* Terms */}
          <Text style={styles.terms}>
            By signing up, you agree to our{' '}
            <Text style={styles.termsLink} onPress={() => router.push('/account/terms-of-service' as any)} accessibilityRole="link" accessibilityLabel="Terms of Service">Terms</Text>
            . See how we use your data in our{' '}
            <Text style={styles.termsLink} onPress={() => router.push('/account/privacy-policy' as any)} accessibilityRole="link" accessibilityLabel="Privacy Policy">Privacy Policy</Text>.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
  },
  video: {
    position: 'absolute',
    top: 0,
    left: 0,
    // width and height applied inline via useWindowDimensions
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    // width and height applied inline via useWindowDimensions
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.xl,
  },
  centerSection: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  bottomContainer: {
    gap: spacing.sm,
  },
  ssoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.xs,
  },
  ssoButton: {
    flex: 1,
    height: 56,
    borderRadius: borderRadius.lg,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ssoIconApple: {
    fontSize: 28,
    color: colors.white,
  },
  ssoIconText: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: colors.white,
  },
  ssoIconFb: {
    fontSize: 26,
    fontWeight: '700' as const,
    color: colors.white,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  dividerText: {
    marginHorizontal: spacing.md,
    fontSize: typography.fontSize.sm,
    color: colors.white,
    opacity: 0.8,
  },
  signUpRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  signUpButton: {
    flex: 1,
    height: 56,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.md,
  },
  signUpButtonInner: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
  },
  signUpButtonText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
  phoneSignUpButton: {
    flex: 1,
    height: 56,
    borderRadius: borderRadius.lg,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.white,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
  },
  phoneSignUpButtonText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
  errorBadge: {
    fontSize: typography.fontSize.xs,
    color: colors.error,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  stuckBanner: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  stuckText: {
    fontSize: typography.fontSize.sm,
    color: colors.white,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  stuckButton: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  stuckButtonText: {
    color: colors.black,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  signInContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  signInText: {
    fontSize: typography.fontSize.base,
    color: colors.white,
    opacity: 0.9,
  },
  signInLink: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
    textDecorationLine: 'underline',
  },
  terms: {
    fontSize: typography.fontSize.xs,
    color: colors.white,
    opacity: 0.7,
    textAlign: 'center',
    marginTop: spacing.md,
    lineHeight: typography.fontSize.xs * typography.lineHeight.relaxed,
  },
  termsLink: {
    fontWeight: typography.fontWeight.semibold,
    textDecorationLine: 'underline',
  },
});
