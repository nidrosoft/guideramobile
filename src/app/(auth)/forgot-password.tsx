import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import * as Haptics from 'expo-haptics';
import { Lock } from 'iconsax-react-native';
import CloseIcon from '@/components/common/icons/CloseIcon';
import { colors, typography, spacing, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { useSignIn } from '@clerk/clerk-expo';

export default function ForgotPassword() {
  const router = useRouter();
  const { colors: tc, isDark } = useTheme();
  const { isLoaded, signIn } = useSignIn();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [pendingReset, setPendingReset] = useState(false);
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');

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
    setError('');
    return true;
  };

  const handleResetPassword = async () => {
    if (!validateForm() || !isLoaded) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsLoading(true);
    setError('');

    try {
      await signIn.create({
        strategy: 'reset_password_email_code',
        identifier: email,
      });
      
      setPendingReset(true);
    } catch (err: any) {
      const clerkError = err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || err.message || 'Failed to send reset email';
      setError(clerkError);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmReset = async () => {
    if (!isLoaded || !code || !newPassword) return;

    setIsLoading(true);
    setError('');

    try {
      const attempt = await signIn.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code,
        password: newPassword,
      });

      if (attempt.status === 'complete') {
        setShowSuccess(true);
      } else {
        setError('Password reset incomplete. Please try again.');
      }
    } catch (err: any) {
      const clerkError = err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || err.message || 'Failed to reset password';
      setError(clerkError);
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = email.trim() && email.includes('@');

  if (pendingReset) {
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
            <Lock size={32} color={tc.textPrimary} variant="Outline" />
          </View>

          <Text style={[styles.title, { color: tc.textPrimary }]}>Reset your password</Text>
          <Text style={[styles.subtitle, { color: tc.textSecondary }]}>
            Enter the code sent to {email} and your new password.
          </Text>

          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: tc.textSecondary }]}>Verification Code</Text>
            <TextInput
              style={[styles.input, { borderColor: tc.borderMedium, color: tc.textPrimary, backgroundColor: tc.bgElevated }]}
              placeholder="Enter 6-digit code"
              placeholderTextColor={tc.textTertiary}
              keyboardType="number-pad"
              value={code}
              onChangeText={(text) => {
                setCode(text);
                setError('');
              }}
              autoFocus
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: tc.textSecondary }]}>New Password</Text>
            <TextInput
              style={[styles.input, { borderColor: tc.borderMedium, color: tc.textPrimary, backgroundColor: tc.bgElevated }]}
              placeholder="At least 8 characters"
              placeholderTextColor={tc.textTertiary}
              secureTextEntry
              value={newPassword}
              onChangeText={(text) => {
                setNewPassword(text);
                setError('');
              }}
            />
          </View>

          {error ? <Text style={[styles.errorText, { color: tc.error }]}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.resetButton, { backgroundColor: tc.primary }, (!code || !newPassword || isLoading) && { backgroundColor: tc.gray300 }]}
            onPress={handleConfirmReset}
            disabled={!code || !newPassword || isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color={tc.white} />
            ) : (
              <Text style={[styles.resetButtonText, { color: tc.white }]}>Reset Password</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  if (showSuccess) {
    return (
      <View style={[styles.container, { backgroundColor: tc.background }]}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        
        <TouchableOpacity style={styles.closeButton} onPress={handleBack}>
          <CloseIcon size={24} color={tc.textPrimary} />
        </TouchableOpacity>

        <View style={styles.successContainer}>
          <View style={[styles.successIconContainer, { backgroundColor: `${tc.primary}15` }]}>
            <Lock size={48} color={tc.primary} variant="Bold" />
          </View>
          <Text style={[styles.successTitle, { color: tc.textPrimary }]}>Check your email</Text>
          <Text style={[styles.successText, { color: tc.textSecondary }]}>
            We've sent password reset instructions to{'\n'}
            <Text style={[styles.emailHighlight, { color: tc.textPrimary }]}>{email}</Text>
          </Text>
          <Text style={[styles.successSubtext, { color: tc.textTertiary }]}>
            Click the link in the email to reset your password.
          </Text>
          <TouchableOpacity
            style={[styles.backToLoginButton, { backgroundColor: tc.primary }]}
            onPress={() => router.push('/(auth)/email-signin' as any)}
          >
            <Text style={[styles.backToLoginText, { color: tc.white }]}>Back to Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

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
          <Lock size={32} color={tc.textPrimary} variant="Outline" />
        </View>

        <Text style={[styles.title, { color: tc.textPrimary }]}>Forgot password?</Text>
        <Text style={[styles.subtitle, { color: tc.textSecondary }]}>
          Enter your email address and we'll send you instructions to reset your password.
        </Text>

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

        {error ? <Text style={[styles.errorText, { color: tc.error }]}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.resetButton, { backgroundColor: tc.primary }, (!isFormValid || isLoading) && { backgroundColor: tc.gray300 }]}
          onPress={handleResetPassword}
          disabled={!isFormValid || isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color={tc.white} />
          ) : (
            <Text style={[styles.resetButtonText, { color: tc.white }]}>Send Reset Link</Text>
          )}
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: tc.textSecondary }]}>Remember your password? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/email-signin' as any)}>
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
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    marginBottom: spacing.xl,
    lineHeight: typography.fontSize.base * 1.5,
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
  errorText: {
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.md,
  },
  resetButton: {
    height: 52,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  resetButtonText: {
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
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  successIconContainer: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  successTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.md,
  },
  successText: {
    fontSize: typography.fontSize.base,
    textAlign: 'center',
    lineHeight: typography.fontSize.base * 1.5,
  },
  emailHighlight: {
    fontWeight: typography.fontWeight.semibold,
  },
  successSubtext: {
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  backToLoginButton: {
    marginTop: spacing['2xl'],
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
  },
  backToLoginText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
});
