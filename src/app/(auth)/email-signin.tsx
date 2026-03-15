import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState, useCallback, useEffect } from 'react';
import * as Haptics from 'expo-haptics';
import { Sms } from 'iconsax-react-native';
import CloseIcon from '@/components/common/icons/CloseIcon';
import { colors, typography, spacing, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { useSignIn, useSSO } from '@clerk/clerk-expo';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';

WebBrowser.maybeCompleteAuthSession();

const useWarmUpBrowser = () => {
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    void WebBrowser.warmUpAsync();
    return () => { void WebBrowser.coolDownAsync(); };
  }, []);
};

export default function EmailSignIn() {
  useWarmUpBrowser();
  const router = useRouter();
  const { colors: tc, isDark } = useTheme();
  const { signIn, setActive, isLoaded } = useSignIn();
  const { startSSOFlow } = useSSO();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

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
    if (!password) {
      setError('Password is required');
      return false;
    }
    setError('');
    return true;
  };

  const handleSignIn = useCallback(async () => {
    if (!validateForm() || !isLoaded) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsLoading(true);
    setError('');

    try {
      const signInAttempt = await signIn.create({
        identifier: email,
        password,
      });

      if (signInAttempt.status === 'complete') {
        await setActive({ session: signInAttempt.createdSessionId });
        // AuthGuard will handle redirect based on onboarding status
      } else if ((signInAttempt.status as string) === 'needs_client_trust') {
        // Clerk v3: New client needs trust verification
        // Attempt to prepare a second factor challenge
        const factors = signInAttempt.supportedFirstFactors;
        const emailFactor = factors?.find((f: any) => f.strategy === 'email_code');
        if (emailFactor && 'emailAddressId' in emailFactor) {
          await signIn.prepareFirstFactor({
            strategy: 'email_code',
            emailAddressId: emailFactor.emailAddressId,
          });
          setError('For security, we sent a verification code to your email. Please check and enter it.');
        } else {
          setError('Additional verification required from this device. Please try again.');
        }
      } else {
        console.error(JSON.stringify(signInAttempt, null, 2));
        setError('Sign in incomplete. Please try again.');
      }
    } catch (err: any) {
      const clerkError = err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || err.message || 'Failed to sign in';
      setError(clerkError);
    } finally {
      setIsLoading(false);
    }
  }, [isLoaded, signIn, setActive, email, password]);

  const isFormValid = email.includes('@') && password.length > 0;

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

        <Text style={[styles.title, { color: tc.textPrimary }]}>Welcome back</Text>

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
            onChangeText={(text) => {
              setEmail(text);
              setError('');
            }}
            autoFocus
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={[styles.inputLabel, { color: tc.textSecondary }]}>Password</Text>
          <TextInput
            style={[styles.input, { borderColor: tc.borderMedium, color: tc.textPrimary, backgroundColor: tc.bgElevated }]}
            placeholder="Enter your password"
            placeholderTextColor={tc.textTertiary}
            secureTextEntry
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setError('');
            }}
          />
        </View>

        <TouchableOpacity 
          style={styles.forgotPassword}
          onPress={() => router.push('/(auth)/forgot-password')}
        >
          <Text style={[styles.forgotPasswordText, { color: tc.primary }]}>Forgot your password?</Text>
        </TouchableOpacity>

        {error ? <Text style={[styles.errorText, { color: tc.error }]}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.signInButton, { backgroundColor: tc.primary }, (!isFormValid || isLoading) && { backgroundColor: tc.gray300 }]}
          onPress={handleSignIn}
          disabled={!isFormValid || isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color={tc.white} />
          ) : (
            <Text style={[styles.signInButtonText, { color: tc.white }]}>Sign In</Text>
          )}
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={[styles.dividerLine, { backgroundColor: tc.borderMedium }]} />
          <Text style={[styles.dividerText, { color: tc.textSecondary }]}>or</Text>
          <View style={[styles.dividerLine, { backgroundColor: tc.borderMedium }]} />
        </View>

        <TouchableOpacity
          style={[styles.googleButton, { backgroundColor: tc.bgElevated, borderColor: tc.borderMedium }]}
          onPress={async () => {
            try {
              const { createdSessionId, setActive: ssoSetActive } = await startSSOFlow({
                strategy: 'oauth_google',
                redirectUrl: AuthSession.makeRedirectUri(),
              });
              if (createdSessionId && ssoSetActive) {
                await ssoSetActive({ session: createdSessionId });
              }
            } catch (err: any) {
              const msg = err?.errors?.[0]?.longMessage || err?.message || 'Google sign in failed';
              setError(msg);
            }
          }}
          activeOpacity={0.8}
        >
          <Text style={[styles.googleButtonText, { color: tc.textPrimary }]}>Sign in with Google</Text>
        </TouchableOpacity>

        <View style={styles.signUpContainer}>
          <Text style={[styles.signUpText, { color: tc.textSecondary }]}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/email-signup' as any)}>
            <Text style={[styles.signUpLink, { color: tc.primary }]}>Sign Up</Text>
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
    paddingTop: 140,
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
    height: 48,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    fontSize: typography.fontSize.base,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: spacing.md,
  },
  forgotPasswordText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  errorText: {
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.md,
  },
  signInButton: {
    height: 52,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  signInButtonText: {
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
  googleButton: {
    height: 56,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  googleButtonText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  signUpText: {
    fontSize: typography.fontSize.base,
  },
  signUpLink: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
});
