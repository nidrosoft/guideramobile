import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import * as Haptics from 'expo-haptics';
import { Lock } from 'iconsax-react-native';
import CloseIcon from '@/components/common/icons/CloseIcon';
import { colors, typography, spacing, borderRadius } from '@/styles';
import { useSignIn } from '@clerk/clerk-expo';

export default function ForgotPassword() {
  const router = useRouter();
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
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <StatusBar style="dark" />
        
        <TouchableOpacity style={styles.closeButton} onPress={handleBack}>
          <CloseIcon size={24} color={colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Lock size={32} color={colors.textPrimary} variant="Outline" />
          </View>

          <Text style={styles.title}>Reset your password</Text>
          <Text style={styles.subtitle}>
            Enter the code sent to {email} and your new password.
          </Text>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Verification Code</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter 6-digit code"
              placeholderTextColor={colors.textTertiary}
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
            <Text style={styles.inputLabel}>New Password</Text>
            <TextInput
              style={styles.input}
              placeholder="At least 8 characters"
              placeholderTextColor={colors.textTertiary}
              secureTextEntry
              value={newPassword}
              onChangeText={(text) => {
                setNewPassword(text);
                setError('');
              }}
            />
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.resetButton, (!code || !newPassword || isLoading) && styles.resetButtonDisabled]}
            onPress={handleConfirmReset}
            disabled={!code || !newPassword || isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.resetButtonText}>Reset Password</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  if (showSuccess) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        
        <TouchableOpacity style={styles.closeButton} onPress={handleBack}>
          <CloseIcon size={24} color={colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.successContainer}>
          <View style={styles.successIconContainer}>
            <Lock size={48} color={colors.primary} variant="Bold" />
          </View>
          <Text style={styles.successTitle}>Check your email</Text>
          <Text style={styles.successText}>
            We've sent password reset instructions to{'\n'}
            <Text style={styles.emailHighlight}>{email}</Text>
          </Text>
          <Text style={styles.successSubtext}>
            Click the link in the email to reset your password.
          </Text>
          <TouchableOpacity
            style={styles.backToLoginButton}
            onPress={() => router.push('/(auth)/email-signin' as any)}
          >
            <Text style={styles.backToLoginText}>Back to Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="dark" />
      
      <TouchableOpacity style={styles.closeButton} onPress={handleBack}>
        <CloseIcon size={24} color={colors.textPrimary} />
      </TouchableOpacity>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Lock size={32} color={colors.textPrimary} variant="Outline" />
        </View>

        <Text style={styles.title}>Forgot password?</Text>
        <Text style={styles.subtitle}>
          Enter your email address and we'll send you instructions to reset your password.
        </Text>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="you@example.com"
            placeholderTextColor={colors.textTertiary}
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

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.resetButton, (!isFormValid || isLoading) && styles.resetButtonDisabled]}
          onPress={handleResetPassword}
          disabled={!isFormValid || isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.resetButtonText}>Send Reset Link</Text>
          )}
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Remember your password? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/email-signin' as any)}>
            <Text style={styles.footerLink}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    borderRadius: 32,
    borderWidth: 2,
    borderColor: colors.textPrimary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
    lineHeight: typography.fontSize.base * 1.5,
  },
  inputContainer: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    backgroundColor: colors.bgElevated,
  },
  errorText: {
    fontSize: typography.fontSize.sm,
    color: '#EF4444',
    marginBottom: spacing.md,
  },
  resetButton: {
    height: 52,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  resetButtonDisabled: {
    backgroundColor: colors.gray300,
  },
  resetButtonText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
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
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  successIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  successTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  successText: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: typography.fontSize.base * 1.5,
  },
  emailHighlight: {
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  successSubtext: {
    fontSize: typography.fontSize.sm,
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  backToLoginButton: {
    marginTop: spacing['2xl'],
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
  },
  backToLoginText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
});
