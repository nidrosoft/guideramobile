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
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  ArrowLeft, 
  Sms,
  Key,
  ShieldTick,
  TickCircle,
  InfoCircle,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, typography, borderRadius } from '@/styles';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase/client';

type TwoFactorMethod = 'sms' | 'authenticator';
type SetupStep = 'select' | 'verify' | 'success';

export default function TwoFactorAuthScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, profile } = useAuth();
  const [step, setStep] = useState<SetupStep>('select');
  const [method, setMethod] = useState<TwoFactorMethod | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    
    if (selectedMethod === 'sms') {
      // Send verification code to phone
      sendSMSCode();
    }
  };

  const sendSMSCode = async () => {
    setIsLoading(true);
    try {
      // TODO: Implement SMS sending via Supabase or Twilio
      await new Promise(resolve => setTimeout(resolve, 1000));
      // Mock success
    } catch (error) {
      console.error('Error sending SMS:', error);
      Alert.alert('Error', 'Failed to send verification code. Please try again.');
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
      // TODO: Verify code with backend
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Save 2FA settings
      if (user?.id) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            security_settings: {
              two_factor_enabled: true,
              two_factor_method: method,
              login_alerts: true,
            }
          })
          .eq('id', user.id);

        if (updateError) throw updateError;
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setStep('success');
    } catch (error: any) {
      console.error('Error verifying code:', error);
      setError('Invalid verification code. Please try again.');
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
        <View style={styles.introIcon}>
          <ShieldTick size={40} color={colors.primary} variant="Bold" />
        </View>
        <Text style={styles.introTitle}>Add Extra Security</Text>
        <Text style={styles.introText}>
          Two-factor authentication adds an extra layer of security to your account. 
          Choose how you'd like to receive verification codes.
        </Text>
      </View>

      <View style={styles.methodsSection}>
        <Text style={styles.sectionTitle}>Choose a Method</Text>
        
        {/* SMS Option - Coming Soon */}
        <TouchableOpacity 
          style={[styles.methodCard, styles.methodCardDisabled]}
          onPress={() => {
            Alert.alert(
              'Coming Soon',
              'SMS-based 2FA will be available in a future update. Please use an Authenticator App for now.',
              [{ text: 'OK' }]
            );
          }}
          activeOpacity={0.7}
        >
          <View style={[styles.methodIcon, styles.methodIconDisabled]}>
            <Sms size={24} color={colors.gray400} variant="Bold" />
          </View>
          <View style={styles.methodContent}>
            <Text style={[styles.methodTitle, styles.methodTitleDisabled]}>Text Message (SMS)</Text>
            <Text style={styles.methodDescription}>
              Coming soon - requires SMS provider integration
            </Text>
          </View>
          <View style={styles.comingSoonBadge}>
            <Text style={styles.comingSoonText}>Soon</Text>
          </View>
        </TouchableOpacity>

        {/* Authenticator App Option */}
        <TouchableOpacity 
          style={styles.methodCard}
          onPress={() => handleSelectMethod('authenticator')}
          activeOpacity={0.7}
        >
          <View style={styles.methodIcon}>
            <Key size={24} color={colors.primary} variant="Bold" />
          </View>
          <View style={styles.methodContent}>
            <Text style={styles.methodTitle}>Authenticator App</Text>
            <Text style={styles.methodDescription}>
              Use Google Authenticator, Authy, or similar apps
            </Text>
          </View>
          <ArrowLeft size={18} color={colors.gray400} style={{ transform: [{ rotate: '180deg' }] }} />
        </TouchableOpacity>
      </View>

      {/* Info Card */}
      <View style={styles.infoCard}>
        <InfoCircle size={18} color={colors.info} variant="Bold" />
        <Text style={styles.infoText}>
          We recommend using an authenticator app for the most secure experience.
        </Text>
      </View>
    </>
  );

  const renderVerify = () => (
    <>
      <View style={styles.verifySection}>
        <View style={styles.verifyIcon}>
          {method === 'sms' ? (
            <Sms size={40} color={colors.primary} variant="Bold" />
          ) : (
            <Key size={40} color={colors.primary} variant="Bold" />
          )}
        </View>
        <Text style={styles.verifyTitle}>
          {method === 'sms' ? 'Enter SMS Code' : 'Enter Authenticator Code'}
        </Text>
        <Text style={styles.verifyText}>
          {method === 'sms' 
            ? `We've sent a 6-digit code to your phone number ending in ${profile?.phone?.slice(-4) || '****'}`
            : 'Enter the 6-digit code from your authenticator app'
          }
        </Text>
      </View>

      {/* Code Input */}
      <View style={styles.codeInputSection}>
        <TextInput
          style={[styles.codeInput, error && styles.codeInputError]}
          value={verificationCode}
          onChangeText={(text) => {
            setVerificationCode(text.replace(/[^0-9]/g, '').slice(0, 6));
            if (error) setError(null);
          }}
          placeholder="000000"
          placeholderTextColor={colors.gray300}
          keyboardType="number-pad"
          maxLength={6}
          autoFocus
        />
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>

      {/* Resend Code (SMS only) */}
      {method === 'sms' && (
        <TouchableOpacity 
          style={styles.resendButton}
          onPress={sendSMSCode}
          disabled={isLoading}
        >
          <Text style={styles.resendText}>Didn't receive a code? Resend</Text>
        </TouchableOpacity>
      )}

      {/* Authenticator Setup Instructions */}
      {method === 'authenticator' && (
        <View style={styles.authenticatorInstructions}>
          <Text style={styles.instructionsTitle}>Setup Instructions</Text>
          <Text style={styles.instructionStep}>1. Download an authenticator app (Google Authenticator, Authy)</Text>
          <Text style={styles.instructionStep}>2. Scan the QR code or enter the setup key</Text>
          <Text style={styles.instructionStep}>3. Enter the 6-digit code shown in the app</Text>
          
          {/* Mock QR Code placeholder */}
          <View style={styles.qrPlaceholder}>
            <Text style={styles.qrPlaceholderText}>QR Code</Text>
            <Text style={styles.setupKey}>Setup Key: ABCD-EFGH-IJKL-MNOP</Text>
          </View>
        </View>
      )}

      {/* Verify Button */}
      <TouchableOpacity
        style={[styles.verifyButton, verificationCode.length !== 6 && styles.verifyButtonDisabled]}
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
      <Text style={styles.successTitle}>2FA Enabled!</Text>
      <Text style={styles.successText}>
        Two-factor authentication has been successfully enabled on your account. 
        You'll now need to enter a verification code when signing in.
      </Text>
      
      <View style={styles.successInfo}>
        <Text style={styles.successInfoTitle}>Method:</Text>
        <Text style={styles.successInfoValue}>
          {method === 'sms' ? 'Text Message (SMS)' : 'Authenticator App'}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.doneButton}
        onPress={handleDone}
        activeOpacity={0.8}
      >
        <Text style={styles.doneButtonText}>Done</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Two-Factor Authentication</Text>
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
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
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
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.gray100,
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
    borderRadius: borderRadius.lg,
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
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.gray200,
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
  qrPlaceholder: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  qrPlaceholderText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray400,
    marginBottom: spacing.sm,
  },
  setupKey: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
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
    borderRadius: borderRadius.lg,
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
  methodIconDisabled: {
    backgroundColor: colors.gray100,
  },
  methodTitleDisabled: {
    color: colors.gray400,
  },
  comingSoonBadge: {
    backgroundColor: colors.warning + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  comingSoonText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.warning,
  },
});
