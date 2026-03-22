import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Platform, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Video, ResizeMode } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useEffect, useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import { colors, typography, spacing, borderRadius, shadows } from '@/styles';
import PrimaryButton from '@/components/common/buttons/PrimaryButton';
import TypingAnimation from '@/components/common/TypingAnimation';
import DSButton from '@/components/ds/DSButton';
import { useSSO, useUser } from '@clerk/clerk-expo';
import { syncClerkUserToSupabase } from '@/lib/clerk/profileSync';
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
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { startSSOFlow } = useSSO();
  const { user: clerkUser } = useUser();
  const [error, setError] = useState('');
  const [ssoLoading, setSsoLoading] = useState('');

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

    try {
      const { createdSessionId, setActive, signIn, signUp } = await startSSOFlow({
        strategy,
        redirectUrl: AuthSession.makeRedirectUri(),
      });

      if (__DEV__) console.log('[Landing SSO] Response:', {
        createdSessionId: createdSessionId ? 'YES' : 'NULL',
        hasSetActive: !!setActive,
        signUpStatus: signUp?.status,
        signInStatus: signIn?.status,
        signUpId: signUp?.id,
        signInId: signIn?.id,
      });

      if (createdSessionId) {
        if (__DEV__) console.log('[Landing SSO] Session created, activating...');
        await setActive?.({ session: createdSessionId });
        if (__DEV__) console.log('[Landing SSO] Session activated, navigating...');
        router.replace('/');
        return;
      }

      // No session created — log full details for debugging
      if (__DEV__) console.log('[Landing SSO] No session. signUp:', JSON.stringify({
        status: signUp?.status,
        missingFields: (signUp as any)?.missingFields,
        unverifiedFields: (signUp as any)?.unverifiedFields,
        phoneNumber: (signUp as any)?.phoneNumber,
      }));
      if (__DEV__) console.log('[Landing SSO] signIn verification:', JSON.stringify({
        status: (signIn as any)?.firstFactorVerification?.status,
        errorCode: (signIn as any)?.firstFactorVerification?.error?.code,
      }));
      
      // The most common cause: Clerk requires phone_number but SSO doesn't provide one.
      // Fix: In Clerk Dashboard → Configure → Email, Phone, Username → make Phone "Optional"
      if ((signIn?.status as string) === 'needs_client_trust') {
        setError('Additional verification needed. Please sign in with email or phone.');
      } else {
        setError('Could not complete sign up. Please check Clerk Dashboard settings or try email sign up.');
      }
    } catch (err: any) {
      const clerkError = err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || err.message || 'Sign up failed';
      setError(clerkError);
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
          />
        </View>

        {/* Bottom Actions */}
        <View style={styles.bottomContainer}>
          {/* Social SSO Buttons Row */}
          <View style={styles.ssoRow}>
            <TouchableOpacity
              style={styles.ssoButton}
              onPress={() => handleSSOSignUp('oauth_apple')}
              activeOpacity={0.8}
              disabled={!!ssoLoading}
              accessibilityRole="button"
              accessibilityLabel="Sign up with Apple"
              accessibilityState={{ disabled: !!ssoLoading }}
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
              disabled={!!ssoLoading}
              accessibilityRole="button"
              accessibilityLabel="Sign up with Google"
              accessibilityState={{ disabled: !!ssoLoading }}
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
              disabled={!!ssoLoading}
              accessibilityRole="button"
              accessibilityLabel="Sign up with Facebook"
              accessibilityState={{ disabled: !!ssoLoading }}
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
                <Text style={styles.signUpButtonText}>Email</Text>
              </TouchableOpacity>
            </LinearGradient>

            <DSButton
              title="Phone"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push('/(auth)/phone-signup');
              }}
              variant="secondary"
              size="xl"
              haptic={false}
              style={{ flex: 1, borderColor: colors.white, borderRadius: borderRadius.lg }}
              textStyle={{ color: colors.white, fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold }}
            />
          </View>

          {error ? <Text style={styles.errorBadge}>{error}</Text> : null}

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
    justifyContent: 'center',
    alignItems: 'center',
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
    justifyContent: 'center',
    alignItems: 'center',
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
