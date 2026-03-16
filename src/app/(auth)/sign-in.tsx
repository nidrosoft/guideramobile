import { View, Text, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState, useEffect, useMemo } from 'react';
import * as Haptics from 'expo-haptics';
import { Login, Eye, EyeSlash } from 'iconsax-react-native';
import CloseIcon from '@/components/common/icons/CloseIcon';
import { typography, spacing, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { useSignIn, useSSO } from '@clerk/clerk-expo';
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

export default function SignIn() {
  useWarmUpBrowser();
  const router = useRouter();
  const { colors: tc, isDark } = useTheme();
  const { isLoaded, signIn, setActive } = useSignIn();
  const { startSSOFlow } = useSSO();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Smart detection: is the input an email or phone?
  const inputMode = useMemo(() => {
    const trimmed = identifier.trim();
    if (trimmed.includes('@')) return 'email' as const;
    if (/^\+?\d{7,}$/.test(trimmed.replace(/[\s\-()]/g, ''))) return 'phone' as const;
    return 'unknown' as const;
  }, [identifier]);

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleSSOSignIn = async (strategy: 'oauth_google' | 'oauth_apple' | 'oauth_facebook') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setError('');
    setIsLoading(true);
    try {
      const { createdSessionId, setActive: ssoSetActive, signUp } = await startSSOFlow({
        strategy,
        redirectUrl: AuthSession.makeRedirectUri(),
      });
      if (createdSessionId && ssoSetActive) {
        await ssoSetActive({ session: createdSessionId });
        // Explicit navigation — don't rely on AuthGuard reactivity
        const isNewUser = signUp?.status === 'complete';
        if (isNewUser) {
          router.replace('/(onboarding)/intro');
        } else {
          await new Promise(resolve => setTimeout(resolve, 500));
          router.replace('/(tabs)');
        }
        return;
      }
    } catch (err: any) {
      setError(err?.errors?.[0]?.longMessage || err?.message || 'Sign in failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async () => {
    if (!isLoaded || isLoading) return;
    const trimmed = identifier.trim();
    if (!trimmed) { setError('Enter your email or phone number'); return; }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsLoading(true);
    setError('');

    try {
      if (inputMode === 'email') {
        // Email + password sign-in
        if (!password) { setError('Password is required'); setIsLoading(false); return; }
        const attempt = await signIn.create({ identifier: trimmed, password });

        if (attempt.status === 'complete') {
          await setActive({ session: attempt.createdSessionId });
        } else if ((attempt.status as string) === 'needs_client_trust') {
          setError('For security, additional verification is needed. Please try again.');
        } else {
          setError('Sign in incomplete. Please try again.');
        }
      } else {
        // Phone sign-in — send OTP
        const phoneNum = trimmed.startsWith('+') ? trimmed : `+${trimmed}`;
        const result = await signIn.create({ identifier: phoneNum });

        const phoneFactor = result.supportedFirstFactors?.find(
          (f: any) => f.strategy === 'phone_code'
        );

        if (phoneFactor && 'phoneNumberId' in phoneFactor) {
          await signIn.prepareFirstFactor({
            strategy: 'phone_code',
            phoneNumberId: phoneFactor.phoneNumberId,
          });
          router.replace({
            pathname: '/(auth)/verify-otp',
            params: { phone: phoneNum, mode: 'signin' },
          });
        } else {
          const strategies = result.supportedFirstFactors?.map((f: any) => f.strategy) || [];
          if (strategies.includes('password')) {
            setError('This account uses email & password. Enter your email instead.');
          } else if (strategies.includes('oauth_google')) {
            setError('This account uses Google. Use the Google button below.');
          } else {
            setError('Phone sign-in not available for this account.');
          }
        }
      }
    } catch (err: any) {
      const code = err?.errors?.[0]?.code;
      if (code === 'form_identifier_not_found') {
        setError('No account found. Check your email/phone or sign up.');
      } else if (code === 'form_password_incorrect') {
        setError('Incorrect password. Try again or reset it.');
      } else {
        setError(err?.errors?.[0]?.longMessage || err?.message || 'Sign in failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const canSubmit = inputMode === 'email'
    ? identifier.includes('@') && password.length > 0
    : identifier.trim().replace(/[\s\-()]/g, '').length >= 7;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: tc.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
        <CloseIcon size={24} color={tc.textPrimary} />
      </TouchableOpacity>

      <View style={styles.content}>
        <View style={[styles.iconContainer, { borderColor: tc.textPrimary }]}>
          <Login size={32} color={tc.textPrimary} variant="Outline" />
        </View>

        <Text style={[styles.title, { color: tc.textPrimary }]}>Welcome back</Text>
        <Text style={[styles.subtitle, { color: tc.textSecondary }]}>
          Sign in with your email or phone number
        </Text>

        {/* Smart Identifier Input */}
        <View style={styles.inputContainer}>
          <Text style={[styles.inputLabel, { color: tc.textSecondary }]}>Email or Phone</Text>
          <TextInput
            style={[styles.input, { borderColor: tc.borderMedium, color: tc.textPrimary, backgroundColor: tc.bgElevated }]}
            placeholder="you@example.com or +1234567890"
            placeholderTextColor={tc.textTertiary}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={identifier}
            onChangeText={(text) => { setIdentifier(text); setError(''); }}
            autoFocus
          />
        </View>

        {/* Password field — only shown for email */}
        {inputMode === 'email' && (
          <View style={styles.inputContainer}>
            <View style={styles.passwordLabelRow}>
              <Text style={[styles.inputLabel, { color: tc.textSecondary }]}>Password</Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')}>
                <Text style={[styles.forgotLink, { color: tc.primary }]}>Forgot?</Text>
              </TouchableOpacity>
            </View>
            <View style={[styles.passwordRow, { borderColor: tc.borderMedium, backgroundColor: tc.bgElevated }]}>
              <TextInput
                style={[styles.passwordInput, { color: tc.textPrimary }]}
                placeholder="Enter your password"
                placeholderTextColor={tc.textTertiary}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={(text) => { setPassword(text); setError(''); }}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                {showPassword ? (
                  <EyeSlash size={20} color={tc.textTertiary} variant="Outline" />
                ) : (
                  <Eye size={20} color={tc.textTertiary} variant="Outline" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Phone hint */}
        {inputMode === 'phone' && (
          <Text style={[styles.phoneHint, { color: tc.textTertiary }]}>
            We'll send you a verification code via SMS
          </Text>
        )}

        {error ? <Text style={[styles.errorText, { color: tc.error }]}>{error}</Text> : null}

        {/* Sign In Button */}
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: tc.primary }, (!canSubmit || isLoading) && { opacity: 0.5 }]}
          onPress={handleSignIn}
          disabled={!canSubmit || isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color={tc.white} />
          ) : (
            <Text style={[styles.primaryButtonText, { color: tc.white }]}>
              {inputMode === 'phone' ? 'Send Code' : 'Sign In'}
            </Text>
          )}
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={[styles.dividerLine, { backgroundColor: tc.borderMedium }]} />
          <Text style={[styles.dividerText, { color: tc.textTertiary }]}>or</Text>
          <View style={[styles.dividerLine, { backgroundColor: tc.borderMedium }]} />
        </View>

        {/* Social Sign In — label + 3 buttons in a row */}
        <Text style={[styles.ssoLabel, { color: tc.textTertiary }]}>Continue with</Text>
        <View style={styles.ssoRow}>
          <TouchableOpacity
            style={[styles.ssoButton, { borderColor: tc.borderMedium }]}
            onPress={() => handleSSOSignIn('oauth_apple')}
            activeOpacity={0.8}
          >
            <Text style={[styles.ssoLogoText, { color: '#000000' }]}>{Platform.OS === 'ios' ? '\uF8FF' : 'A'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.ssoButton, { borderColor: tc.borderMedium }]}
            onPress={() => handleSSOSignIn('oauth_google')}
            activeOpacity={0.8}
          >
            <Text style={[styles.ssoLogoText, { color: '#DB4437' }]}>G</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.ssoButton, { borderColor: tc.borderMedium }]}
            onPress={() => handleSSOSignIn('oauth_facebook')}
            activeOpacity={0.8}
          >
            <Text style={[styles.ssoLogoText, { color: '#1877F2' }]}>f</Text>
          </TouchableOpacity>
        </View>

        {/* Sign Up Link */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: tc.textSecondary }]}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/email-signup' as any)}>
            <Text style={[styles.footerLink, { color: tc.primary }]}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    right: spacing.lg,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: 120,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.full,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    lineHeight: typography.fontSize.base * 1.5,
    marginBottom: spacing.xl,
  },
  inputContainer: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    marginBottom: spacing.xs,
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    fontSize: typography.fontSize.base,
  },
  passwordLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  forgotLink: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  passwordInput: {
    flex: 1,
    height: 52,
    paddingHorizontal: spacing.lg,
    fontSize: typography.fontSize.base,
  },
  eyeButton: {
    paddingHorizontal: spacing.md,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  phoneHint: {
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.md,
  },
  errorText: {
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.md,
  },
  primaryButton: {
    height: 52,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  primaryButtonText: {
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
  ssoLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  ssoRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  ssoButton: {
    flex: 1,
    height: 52,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ssoLogoText: {
    fontSize: 24,
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
