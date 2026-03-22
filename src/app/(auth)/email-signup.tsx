import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import * as Haptics from 'expo-haptics';
import { Sms, Eye, EyeSlash } from 'iconsax-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import CloseIcon from '@/components/common/icons/CloseIcon';
import { typography, spacing, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { useSignUp, useSSO } from '@clerk/clerk-expo';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';

WebBrowser.maybeCompleteAuthSession();

const useWarmUpBrowser = () => {
  React.useEffect(() => {
    if (Platform.OS !== 'android') return;
    void WebBrowser.warmUpAsync();
    return () => { void WebBrowser.coolDownAsync(); };
  }, []);
};

export default function EmailSignUp() {
  useWarmUpBrowser();
  const router = useRouter();
  const { colors: tc, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { isLoaded, signUp, setActive } = useSignUp();
  const { startSSOFlow } = useSSO();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState('');

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const validateForm = () => {
    if (!email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
      setError('Please enter a valid email address');
      return false;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return false;
    }
    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
      setError('Password must include uppercase, lowercase, and a number');
      return false;
    }
    setError('');
    return true;
  };

  const handleSignUp = async () => {
    if (!validateForm() || !isLoaded) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsLoading(true);
    setError('');

    try {
      await signUp.create({
        emailAddress: email,
        password,
      });

      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setPendingVerification(true);
    } catch (err: any) {
      const clerkError = err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || err.message || 'Failed to sign up';
      setError(clerkError);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyEmail = async () => {
    if (!isLoaded || !code) return;

    setIsLoading(true);
    setError('');

    try {
      const signUpAttempt = await signUp.attemptEmailAddressVerification({ code });

      if (signUpAttempt.status === 'complete') {
        await setActive({ session: signUpAttempt.createdSessionId });
        router.replace('/(onboarding)/intro');
      } else {
        if (__DEV__) console.error('[EmailSignup] Status:', JSON.stringify(signUpAttempt, null, 2));
        setError('Verification incomplete. Please try again.');
      }
    } catch (err: any) {
      const clerkError = err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || err.message || 'Verification failed';
      setError(clerkError);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setError('');
    try {
      const { createdSessionId, setActive: ssoSetActive, signUp: ssoSignUp } = await startSSOFlow({
        strategy: 'oauth_google',
        redirectUrl: AuthSession.makeRedirectUri(),
      });
      if (createdSessionId && ssoSetActive) {
        await ssoSetActive({ session: createdSessionId });
        // Navigate after successful SSO
        const isNewUser = ssoSignUp?.status === 'complete';
        if (isNewUser) {
          router.replace('/(onboarding)/intro');
        } else {
          await new Promise(resolve => setTimeout(resolve, 300));
          router.replace('/(tabs)');
        }
      }
    } catch (err: any) {
      const msg = err?.errors?.[0]?.longMessage || err?.message || 'Google sign up failed';
      setError(msg);
    }
  };

  const isFormValid = email.includes('@') && password.length >= 8;

  // ─── Verification Screen ────────────────────────────────────────────
  if (pendingVerification) {
    return (
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: tc.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <StatusBar style={isDark ? 'light' : 'dark'} />
        
        <TouchableOpacity style={[styles.closeButton, { top: insets.top + 10 }]} onPress={handleBack} accessibilityRole="button" accessibilityLabel="Close">
          <CloseIcon size={24} color={tc.textPrimary} />
        </TouchableOpacity>

        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.content, { paddingTop: insets.top + 60 }]}>
            <View style={[styles.iconContainer, { borderColor: tc.textPrimary }]}>
              <Sms size={32} color={tc.textPrimary} variant="Outline" />
            </View>

            <Text style={[styles.title, { color: tc.textPrimary }]}>{t('auth.signUp.checkEmail')}</Text>
            <Text style={[styles.subtitle, { color: tc.textSecondary }]}>
              {t('auth.signUp.verificationSent')}{'\n'}
              <Text style={{ fontWeight: typography.fontWeight.semibold, color: tc.textPrimary }}>{email}</Text>
            </Text>

            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, { borderColor: tc.borderMedium, color: tc.textPrimary, backgroundColor: tc.bgElevated }]}
                placeholder={t('auth.signUp.codePlaceholder')}
                placeholderTextColor={tc.textTertiary}
                keyboardType="number-pad"
                accessibilityLabel="Verification code"
                value={code}
                onChangeText={(text) => { setCode(text); setError(''); }}
                autoFocus
                maxLength={6}
              />
            </View>

            {error ? <Text style={[styles.errorText, { color: tc.error }]}>{error}</Text> : null}

            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: tc.primary }, (!code || isLoading) && { opacity: 0.5 }]}
              onPress={handleVerifyEmail}
              disabled={!code || isLoading}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Verify and continue"
            >
              {isLoading ? (
                <ActivityIndicator color={tc.white} />
              ) : (
                <Text style={[styles.primaryButtonText, { color: tc.white }]}>{t('auth.signUp.verifyAndContinue')}</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // ─── Sign Up Form ───────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: tc.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      <TouchableOpacity style={[styles.closeButton, { top: insets.top + 10 }]} onPress={handleBack} accessibilityRole="button" accessibilityLabel="Close">
        <CloseIcon size={24} color={tc.textPrimary} />
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.content, { paddingTop: insets.top + 60 }]}>
          <View style={[styles.iconContainer, { borderColor: tc.textPrimary }]}>
            <Sms size={32} color={tc.textPrimary} variant="Outline" />
          </View>

          <Text style={[styles.title, { color: tc.textPrimary }]}>{t('auth.signUp.title')}</Text>
          <Text style={[styles.subtitle, { color: tc.textSecondary }]}>
            {t('auth.signUp.subtitle')}
          </Text>

          {/* Email */}
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: tc.textSecondary }]}>{t('auth.signUp.email')}</Text>
            <TextInput
              style={[styles.input, { borderColor: tc.borderMedium, color: tc.textPrimary, backgroundColor: tc.bgElevated }]}
              placeholder={t('auth.signUp.emailPlaceholder')}
              placeholderTextColor={tc.textTertiary}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              accessibilityLabel="Email address"
              value={email}
              onChangeText={(text) => { setEmail(text); setError(''); }}
              autoFocus
            />
          </View>

          {/* Password with show/hide */}
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: tc.textSecondary }]}>{t('auth.signUp.password')}</Text>
            <View style={[styles.passwordRow, { borderColor: tc.borderMedium, backgroundColor: tc.bgElevated }]}>
              <TextInput
                style={[styles.passwordInput, { color: tc.textPrimary }]}
                placeholder={t('auth.signUp.passwordPlaceholder')}
                placeholderTextColor={tc.textTertiary}
                secureTextEntry={!showPassword}
                accessibilityLabel="Password"
                value={password}
                onChangeText={(text) => { setPassword(text); setError(''); }}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityRole="button"
                accessibilityLabel={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeSlash size={20} color={tc.textTertiary} variant="Outline" />
                ) : (
                  <Eye size={20} color={tc.textTertiary} variant="Outline" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {error ? <Text style={[styles.errorText, { color: tc.error }]}>{error}</Text> : null}

          {/* Create Account Button */}
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: tc.primary }, (!isFormValid || isLoading) && { opacity: 0.5 }]}
            onPress={handleSignUp}
            disabled={!isFormValid || isLoading}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Create account"
          >
            {isLoading ? (
              <ActivityIndicator color={tc.white} />
            ) : (
              <Text style={[styles.primaryButtonText, { color: tc.white }]}>{t('auth.signUp.createAccount')}</Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: tc.borderMedium }]} />
            <Text style={[styles.dividerText, { color: tc.textTertiary }]}>{t('auth.signUp.or')}</Text>
            <View style={[styles.dividerLine, { backgroundColor: tc.borderMedium }]} />
          </View>

          {/* Google Sign Up */}
          <TouchableOpacity
            style={[styles.secondaryButton, { backgroundColor: tc.bgElevated, borderColor: tc.borderMedium }]}
            onPress={handleGoogleSignUp}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Continue with Google"
          >
            <Text style={[styles.secondaryButtonText, { color: tc.textPrimary }]}>{t('auth.signUp.continueWithGoogle')}</Text>
          </TouchableOpacity>

          {/* Sign In Link */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: tc.textSecondary }]}>{t('auth.signUp.hasAccount')} </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/sign-in')} accessibilityRole="button" accessibilityLabel="Sign in">
              <Text style={[styles.footerLink, { color: tc.primary }]}>{t('auth.signUp.signIn')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
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
    paddingBottom: spacing.xl,
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
  secondaryButton: {
    height: 52,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
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
