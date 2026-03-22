import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import * as Haptics from 'expo-haptics';
import { Lock } from 'iconsax-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import CloseIcon from '@/components/common/icons/CloseIcon';
import { colors, typography, spacing, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { useSignIn } from '@clerk/clerk-expo';

export default function ForgotPassword() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors: tc, isDark } = useTheme();
  const insets = useSafeAreaInsets();
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
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      setError('Password must include uppercase, lowercase, and a number');
      return;
    }

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
        
        <TouchableOpacity style={[styles.closeButton, { top: insets.top + 10 }]} onPress={handleBack}>
          <CloseIcon size={24} color={tc.textPrimary} />
        </TouchableOpacity>

        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.content, { paddingTop: insets.top + 80 }]}>
            <View style={[styles.iconContainer, { borderColor: tc.textPrimary }]}>
              <Lock size={32} color={tc.textPrimary} variant="Outline" />
            </View>

            <Text style={[styles.title, { color: tc.textPrimary }]}>{t('auth.forgotPassword.resetTitle')}</Text>
            <Text style={[styles.subtitle, { color: tc.textSecondary }]}>
              {t('auth.forgotPassword.resetSubtitle', { email })}
            </Text>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: tc.textSecondary }]}>{t('auth.forgotPassword.verificationCode')}</Text>
              <TextInput
                style={[styles.input, { borderColor: tc.borderMedium, color: tc.textPrimary, backgroundColor: tc.bgElevated }]}
                placeholder={t('auth.forgotPassword.codePlaceholder')}
                placeholderTextColor={tc.textTertiary}
                keyboardType="number-pad"
                accessibilityLabel="Verification code"
                value={code}
                onChangeText={(text) => {
                  setCode(text);
                  setError('');
                }}
                autoFocus
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: tc.textSecondary }]}>{t('auth.forgotPassword.newPassword')}</Text>
              <TextInput
                style={[styles.input, { borderColor: tc.borderMedium, color: tc.textPrimary, backgroundColor: tc.bgElevated }]}
                placeholder={t('auth.forgotPassword.passwordPlaceholder')}
                placeholderTextColor={tc.textTertiary}
                secureTextEntry
                accessibilityLabel="New password"
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
              accessibilityRole="button"
              accessibilityLabel="Reset password"
            >
              {isLoading ? (
                <ActivityIndicator color={tc.white} />
              ) : (
                <Text style={[styles.resetButtonText, { color: tc.white }]}>{t('auth.forgotPassword.resetButton')}</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  if (showSuccess) {
    return (
      <View style={[styles.container, { backgroundColor: tc.background }]}>
        <StatusBar style={isDark ? 'light' : 'dark'} />

        <TouchableOpacity style={[styles.closeButton, { top: insets.top + 10 }]} onPress={handleBack}>
          <CloseIcon size={24} color={tc.textPrimary} />
        </TouchableOpacity>

        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.successContainer}>
            <View style={[styles.successIconContainer, { backgroundColor: `${tc.primary}15` }]}>
              <Lock size={48} color={tc.primary} variant="Bold" />
            </View>
            <Text style={[styles.successTitle, { color: tc.textPrimary }]}>{t('auth.forgotPassword.successTitle')}</Text>
            <Text style={[styles.successText, { color: tc.textSecondary }]}>
              {t('auth.forgotPassword.successText')}
            </Text>
            <TouchableOpacity
              style={[styles.backToLoginButton, { backgroundColor: tc.primary }]}
              onPress={() => router.push('/(auth)/sign-in')}
            >
              <Text style={[styles.backToLoginText, { color: tc.white }]}>{t('auth.forgotPassword.backToSignIn')}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: tc.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      <TouchableOpacity style={[styles.closeButton, { top: insets.top + 10 }]} onPress={handleBack}>
        <CloseIcon size={24} color={tc.textPrimary} />
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.content, { paddingTop: insets.top + 80 }]}>
          <View style={[styles.iconContainer, { borderColor: tc.textPrimary }]}>
            <Lock size={32} color={tc.textPrimary} variant="Outline" />
          </View>

          <Text style={[styles.title, { color: tc.textPrimary }]}>{t('auth.forgotPassword.title')}</Text>
          <Text style={[styles.subtitle, { color: tc.textSecondary }]}>
            {t('auth.forgotPassword.subtitle')}
          </Text>

          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: tc.textSecondary }]}>{t('auth.forgotPassword.email')}</Text>
            <TextInput
              style={[styles.input, { borderColor: tc.borderMedium, color: tc.textPrimary, backgroundColor: tc.bgElevated }]}
              placeholder={t('auth.forgotPassword.emailPlaceholder')}
              placeholderTextColor={tc.textTertiary}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              accessibilityLabel="Email address"
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
            accessibilityRole="button"
            accessibilityLabel="Send reset link"
          >
            {isLoading ? (
              <ActivityIndicator color={tc.white} />
            ) : (
              <Text style={[styles.resetButtonText, { color: tc.white }]}>{t('auth.forgotPassword.sendResetLink')}</Text>
            )}
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: tc.textSecondary }]}>{t('auth.forgotPassword.rememberPassword')} </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/sign-in')} accessibilityRole="button" accessibilityLabel="Sign in">
              <Text style={[styles.footerLink, { color: tc.primary }]}>{t('auth.forgotPassword.signIn')}</Text>
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
