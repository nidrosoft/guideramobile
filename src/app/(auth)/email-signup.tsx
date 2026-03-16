import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import * as Haptics from 'expo-haptics';
import { Sms, Eye, EyeSlash } from 'iconsax-react-native';
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
    if (!email.includes('@') || !email.includes('.')) {
      setError('Please enter a valid email');
      return false;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
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
        console.error('[EmailSignup] Status:', JSON.stringify(signUpAttempt, null, 2));
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
      const { createdSessionId, setActive: ssoSetActive } = await startSSOFlow({
        strategy: 'oauth_google',
        redirectUrl: AuthSession.makeRedirectUri(),
      });
      if (createdSessionId && ssoSetActive) {
        await ssoSetActive({ session: createdSessionId });
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
        
        <TouchableOpacity style={styles.closeButton} onPress={handleBack}>
          <CloseIcon size={24} color={tc.textPrimary} />
        </TouchableOpacity>

        <View style={styles.content}>
          <View style={[styles.iconContainer, { borderColor: tc.textPrimary }]}>
            <Sms size={32} color={tc.textPrimary} variant="Outline" />
          </View>

          <Text style={[styles.title, { color: tc.textPrimary }]}>Check your email</Text>
          <Text style={[styles.subtitle, { color: tc.textSecondary }]}>
            We sent a verification code to{'\n'}
            <Text style={{ fontWeight: typography.fontWeight.semibold, color: tc.textPrimary }}>{email}</Text>
          </Text>

          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, { borderColor: tc.borderMedium, color: tc.textPrimary, backgroundColor: tc.bgElevated }]}
              placeholder="Enter 6-digit code"
              placeholderTextColor={tc.textTertiary}
              keyboardType="number-pad"
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
          >
            {isLoading ? (
              <ActivityIndicator color={tc.white} />
            ) : (
              <Text style={[styles.primaryButtonText, { color: tc.white }]}>Verify & Continue</Text>
            )}
          </TouchableOpacity>
        </View>
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
      
      <TouchableOpacity style={styles.closeButton} onPress={handleBack}>
        <CloseIcon size={24} color={tc.textPrimary} />
      </TouchableOpacity>

      <View style={styles.content}>
        <View style={[styles.iconContainer, { borderColor: tc.textPrimary }]}>
          <Sms size={32} color={tc.textPrimary} variant="Outline" />
        </View>

        <Text style={[styles.title, { color: tc.textPrimary }]}>Create your account</Text>
        <Text style={[styles.subtitle, { color: tc.textSecondary }]}>
          Just an email and password to get started. We'll personalize your experience next.
        </Text>

        {/* Email */}
        <View style={styles.inputContainer}>
          <Text style={[styles.inputLabel, { color: tc.textSecondary }]}>Email</Text>
          <TextInput
            style={[styles.input, { borderColor: tc.borderMedium, color: tc.textPrimary, backgroundColor: tc.bgElevated }]}
            placeholder="you@example.com"
            placeholderTextColor={tc.textTertiary}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={email}
            onChangeText={(text) => { setEmail(text); setError(''); }}
            autoFocus
          />
        </View>

        {/* Password with show/hide */}
        <View style={styles.inputContainer}>
          <Text style={[styles.inputLabel, { color: tc.textSecondary }]}>Password</Text>
          <View style={[styles.passwordRow, { borderColor: tc.borderMedium, backgroundColor: tc.bgElevated }]}>
            <TextInput
              style={[styles.passwordInput, { color: tc.textPrimary }]}
              placeholder="At least 8 characters"
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

        {error ? <Text style={[styles.errorText, { color: tc.error }]}>{error}</Text> : null}

        {/* Create Account Button */}
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: tc.primary }, (!isFormValid || isLoading) && { opacity: 0.5 }]}
          onPress={handleSignUp}
          disabled={!isFormValid || isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color={tc.white} />
          ) : (
            <Text style={[styles.primaryButtonText, { color: tc.white }]}>Create Account</Text>
          )}
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={[styles.dividerLine, { backgroundColor: tc.borderMedium }]} />
          <Text style={[styles.dividerText, { color: tc.textTertiary }]}>or</Text>
          <View style={[styles.dividerLine, { backgroundColor: tc.borderMedium }]} />
        </View>

        {/* Google Sign Up */}
        <TouchableOpacity
          style={[styles.secondaryButton, { backgroundColor: tc.bgElevated, borderColor: tc.borderMedium }]}
          onPress={handleGoogleSignUp}
          activeOpacity={0.8}
        >
          <Text style={[styles.secondaryButtonText, { color: tc.textPrimary }]}>Continue with Google</Text>
        </TouchableOpacity>

        {/* Sign In Link */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: tc.textSecondary }]}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/sign-in')}>
            <Text style={[styles.footerLink, { color: tc.primary }]}>Sign In</Text>
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
