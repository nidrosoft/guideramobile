/**
 * TWO-FACTOR AUTHENTICATION SETUP SCREEN
 * 
 * Enable 2FA via SMS or Authenticator App.
 */

import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  ArrowLeft2, 
  Sms,
  Key,
  ShieldTick,
  TickCircle,
  InfoCircle,
  Copy,
} from 'iconsax-react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { colors, spacing, typography, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useUser } from '@clerk/clerk-expo';
import { supabase } from '@/lib/supabase/client';

type TwoFactorMethod = 'sms' | 'authenticator';
type SetupStep = 'select' | 'verify' | 'success';

export default function TwoFactorAuthScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors: tc, isDark } = useTheme();
  const { user, profile } = useAuth();
  const { user: clerkUser } = useUser();
  const { showError, showSuccess } = require('@/contexts/ToastContext').useToast();
  const [step, setStep] = useState<SetupStep>('select');
  const [method, setMethod] = useState<TwoFactorMethod | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totpUri, setTotpUri] = useState<string>('');
  const [totpSecret, setTotpSecret] = useState<string>('');

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step === 'verify') {
      setStep('select');
      setMethod(null);
      setVerificationCode('');
      setError(null);
    } else {
      router.back();
    }
  };

  const handleSelectMethod = (selectedMethod: TwoFactorMethod) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setMethod(selectedMethod);
    setStep('verify');
    
    if (selectedMethod === 'authenticator') {
      setupTOTP();
    }
  };

  const setupTOTP = async () => {
    setIsLoading(true);
    try {
      if (!clerkUser) throw new Error('Not authenticated');
      const totp = await clerkUser.createTOTP();
      setTotpUri(totp.uri || '');
      setTotpSecret(totp.secret || '');
    } catch (err: any) {
      if (__DEV__) console.error('TOTP setup error:', err);
      showError(err?.errors?.[0]?.longMessage || 'Failed to set up authenticator. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    if (verificationCode.length !== 6) {
      setError('Please enter a 6-digit code');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      if (!clerkUser) throw new Error('Not authenticated');

      // Verify TOTP code with Clerk
      await clerkUser.verifyTOTP({ code: verificationCode });

      // Save 2FA settings to profile
      if (profile?.id) {
        await supabase
          .from('profiles')
          .update({
            security_settings: {
              two_factor_enabled: true,
              two_factor_method: method,
              login_alerts: true,
            }
          })
          .eq('id', profile.id);
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setStep('success');
    } catch (err: any) {
      if (__DEV__) console.error('TOTP verify error:', err);
      const msg = err?.errors?.[0]?.longMessage || 'Invalid verification code. Please try again.';
      setError(msg);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDone = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const renderSelectMethod = () => (
    <>
      <View style={styles.introSection}>
        <View style={[styles.introIcon, { backgroundColor: tc.primary + '15' }]}>
          <ShieldTick size={40} color={tc.primary} variant="Bold" />
        </View>
        <Text style={[styles.introTitle, { color: tc.textPrimary }]}>Add Extra Security</Text>
        <Text style={[styles.introText, { color: tc.textSecondary }]}>
          Two-factor authentication adds an extra layer of security to your account.
          Choose how you'd like to receive verification codes.
        </Text>
      </View>

      <View style={styles.methodsSection}>
        <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>Choose a Method</Text>

        {/* Authenticator App Option - Recommended */}
        <TouchableOpacity
          style={[styles.methodCard, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle }]}
          onPress={() => handleSelectMethod('authenticator')}
          activeOpacity={0.7}
        >
          <View style={[styles.methodIcon, { backgroundColor: tc.primary + '10' }]}>
            <Key size={24} color={tc.primary} variant="Bold" />
          </View>
          <View style={styles.methodContent}>
            <Text style={[styles.methodTitle, { color: tc.textPrimary }]}>Authenticator App</Text>
            <Text style={[styles.methodDescription, { color: tc.textSecondary }]}>
              Use Google Authenticator, Authy, or similar apps
            </Text>
          </View>
          <ArrowLeft2 size={18} color={tc.textTertiary} style={{ transform: [{ rotate: '180deg' }] }} />
        </TouchableOpacity>
      </View>

      {/* Info Card */}
      <View style={[styles.infoCard, { backgroundColor: tc.info + '10', borderColor: tc.info + '20' }]}>
        <InfoCircle size={18} color={tc.info} variant="Bold" />
        <Text style={[styles.infoText, { color: tc.textSecondary }]}>
          We recommend using an authenticator app for the most secure experience.
        </Text>
      </View>
    </>
  );

  const renderVerify = () => (
    <>
      <View style={styles.verifySection}>
        <View style={[styles.verifyIcon, { backgroundColor: tc.primary + '15' }]}>
          {method === 'sms' ? (
            <Sms size={40} color={tc.primary} variant="Bold" />
          ) : (
            <Key size={40} color={tc.primary} variant="Bold" />
          )}
        </View>
        <Text style={[styles.verifyTitle, { color: tc.textPrimary }]}>
          {method === 'sms' ? 'Enter SMS Code' : 'Enter Authenticator Code'}
        </Text>
        <Text style={[styles.verifyText, { color: tc.textSecondary }]}>
          {method === 'sms'
            ? `We've sent a 6-digit code to your phone number ending in ${profile?.phone?.slice(-4) || '****'}`
            : 'Enter the 6-digit code from your authenticator app'
          }
        </Text>
      </View>

      {/* Code Input */}
      <View style={styles.codeInputSection}>
        <TextInput
          style={[styles.codeInput, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle, color: tc.textPrimary }, error && styles.codeInputError]}
          value={verificationCode}
          onChangeText={(text) => {
            setVerificationCode(text.replace(/[^0-9]/g, '').slice(0, 6));
            if (error) setError(null);
          }}
          placeholder="000000"
          placeholderTextColor={tc.textTertiary}
          keyboardType="number-pad"
          maxLength={6}
          autoFocus
        />
        {error && <Text style={[styles.errorText, { color: tc.error }]}>{error}</Text>}
      </View>

      {/* Resend Code (SMS only -- currently disabled, SMS 2FA is Coming Soon) */}

      {/* Authenticator Setup Instructions */}
      {method === 'authenticator' && (
        <View style={[styles.authenticatorInstructions, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : tc.gray50 }]}>
          <Text style={[styles.instructionsTitle, { color: tc.textPrimary }]}>Setup Instructions</Text>
          <Text style={[styles.instructionStep, { color: tc.textSecondary }]}>1. Download an authenticator app (Google Authenticator, Authy)</Text>
          <Text style={[styles.instructionStep, { color: tc.textSecondary }]}>2. Copy the setup key below into your authenticator app</Text>
          <Text style={[styles.instructionStep, { color: tc.textSecondary }]}>3. Enter the 6-digit code shown in the app</Text>

          {/* Setup Key from Clerk */}
          <View style={[styles.setupKeyContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#FFFFFF', borderColor: tc.borderSubtle }]}>
            {isLoading && !totpSecret ? (
              <ActivityIndicator size="small" color={tc.primary} />
            ) : totpSecret ? (
              <>
                <Text style={[styles.setupKeyLabel, { color: tc.textSecondary }]}>Setup Key</Text>
                <View style={styles.setupKeyRow}>
                  <Text style={[styles.setupKey, { color: tc.textPrimary }]} selectable>{totpSecret}</Text>
                  <TouchableOpacity
                    onPress={async () => {
                      await Clipboard.setStringAsync(totpSecret);
                      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                      showSuccess('Setup key copied to clipboard');
                    }}
                    style={[styles.copyButton, { backgroundColor: tc.primary + '10' }]}
                    activeOpacity={0.7}
                  >
                    <Copy size={16} color={tc.primary} variant="Bold" />
                  </TouchableOpacity>
                </View>
                {totpUri ? (
                  <TouchableOpacity
                    onPress={async () => {
                      await Clipboard.setStringAsync(totpUri);
                      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                      showSuccess('TOTP URI copied to clipboard');
                    }}
                    style={styles.copyUriButton}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.copyUriText, { color: tc.primary }]}>Copy full URI for app import</Text>
                  </TouchableOpacity>
                ) : null}
              </>
            ) : (
              <Text style={[styles.setupKeyError, { color: tc.error }]}>Failed to generate setup key. Tap back and try again.</Text>
            )}
          </View>
        </View>
      )}

      {/* Verify Button */}
      <TouchableOpacity
        style={[styles.verifyButton, { backgroundColor: tc.primary }, verificationCode.length !== 6 && { backgroundColor: tc.textTertiary }]}
        onPress={handleVerify}
        disabled={verificationCode.length !== 6 || isLoading}
        activeOpacity={0.8}
      >
        {isLoading ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={styles.verifyButtonText}>Verify & Enable</Text>
        )}
      </TouchableOpacity>
    </>
  );

  const renderSuccess = () => (
    <View style={styles.successSection}>
      <View style={styles.successIcon}>
        <TickCircle size={64} color={colors.success} variant="Bold" />
      </View>
      <Text style={[styles.successTitle, { color: tc.textPrimary }]}>2FA Enabled!</Text>
      <Text style={[styles.successText, { color: tc.textSecondary }]}>
        Two-factor authentication has been successfully enabled on your account.
        You'll now need to enter a verification code when signing in.
      </Text>

      <View style={[styles.successInfo, { backgroundColor: colors.success + '10' }]}>
        <Text style={[styles.successInfoTitle, { color: tc.textSecondary }]}>Method:</Text>
        <Text style={styles.successInfoValue}>
          {method === 'sms' ? 'Text Message (SMS)' : 'Authenticator App'}
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.doneButton, { backgroundColor: tc.primary }]}
        onPress={handleDone}
        activeOpacity={0.8}
      >
        <Text style={styles.doneButtonText}>Done</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: tc.background }]}>
      <StatusBar style={isDark ? "light" : "dark"} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm, backgroundColor: tc.bgElevated, borderBottomColor: tc.borderSubtle }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ArrowLeft2 size={24} color={tc.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: tc.textPrimary }]}>Two-Factor Authentication</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          style={styles.content}
          contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + spacing.xl }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {step === 'select' && renderSelectMethod()}
          {step === 'verify' && renderVerify()}
          {step === 'success' && renderSuccess()}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    backgroundColor: colors.bgElevated,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  headerSpacer: {
    width: 40,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
  },
  introSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  introIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  introTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  introText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  methodsSection: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  methodIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  methodContent: {
    flex: 1,
  },
  methodTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  methodDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  methodPhone: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    marginTop: 4,
    fontWeight: typography.fontWeight.medium,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: colors.info + '10',
    borderRadius: 20,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.info + '20',
  },
  infoText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
    lineHeight: 20,
  },
  verifySection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  verifyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  verifyTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  verifyText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  codeInputSection: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  codeInput: {
    width: '100%',
    height: 60,
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.borderSubtle,
    fontSize: 32,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    letterSpacing: 8,
  },
  codeInputError: {
    borderColor: colors.error,
  },
  errorText: {
    fontSize: typography.fontSize.sm,
    color: colors.error,
    marginTop: spacing.sm,
  },
  resendButton: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  resendText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: typography.fontWeight.medium,
  },
  authenticatorInstructions: {
    backgroundColor: colors.gray50,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  instructionsTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  instructionStep: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: 4,
  },
  setupKeyContainer: {
    alignItems: 'center',
    borderRadius: 16,
    padding: spacing.md,
    marginTop: spacing.md,
    borderWidth: 1,
  },
  setupKeyLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    marginBottom: spacing.xs,
  },
  setupKeyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  setupKey: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    flex: 1,
    textAlign: 'center',
  },
  copyButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  copyUriButton: {
    marginTop: spacing.sm,
    paddingVertical: spacing.xs,
  },
  copyUriText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    textDecorationLine: 'underline',
  },
  setupKeyError: {
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
  },
  verifyButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifyButtonDisabled: {
    backgroundColor: colors.gray300,
  },
  verifyButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
  successSection: {
    alignItems: 'center',
    paddingTop: spacing.xl,
  },
  successIcon: {
    marginBottom: spacing.lg,
  },
  successTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  successText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  successInfo: {
    flexDirection: 'row',
    backgroundColor: colors.success + '10',
    borderRadius: 20,
    padding: spacing.md,
    width: '100%',
    marginBottom: spacing.xl,
  },
  successInfoTitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginRight: spacing.sm,
  },
  successInfoValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.success,
  },
  doneButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  doneButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
  methodCardDisabled: {
    opacity: 0.6,
  },
});
