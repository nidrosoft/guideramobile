import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState, useRef, useEffect } from 'react';
import * as Haptics from 'expo-haptics';
import { ShieldTick } from 'iconsax-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CloseIcon from '@/components/common/icons/CloseIcon';
import { colors, typography, spacing, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { useSignUp, useSignIn } from '@clerk/clerk-expo';

export default function VerifyOTP() {
  const router = useRouter();
  const { colors: tc, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ phone: string; mode: 'signup' | 'signin' }>();
  const { isLoaded: isSignUpLoaded, signUp, setActive: setSignUpActive } = useSignUp();
  const { isLoaded: isSignInLoaded, signIn, setActive: setSignInActive } = useSignIn();
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(59);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');
  const phoneNumber = params.phone || '';
  const mode = params.mode || 'signup';
  const inputRefs = useRef<Array<TextInput | null>>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleOtpChange = (value: string, index: number) => {
    // Handle paste of full OTP code (e.g. from SMS auto-fill)
    if (value.length > 1) {
      const digits = value.replace(/\D/g, '').slice(0, 6).split('');
      if (digits.length > 0) {
        const newOtp = ['', '', '', '', '', ''];
        digits.forEach((d, i) => { newOtp[i] = d; });
        setOtp(newOtp);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        // Focus last filled input
        const lastIndex = Math.min(digits.length - 1, 5);
        inputRefs.current[lastIndex]?.focus();
      }
      return;
    }
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Haptic feedback
    if (value) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  // Auto-submit when all digits are filled (debounced to prevent double-fire)
  useEffect(() => {
    if (otp.every(d => d !== '') && !isVerifying) {
      const timer = setTimeout(() => handleVerify(), 300);
      return () => clearTimeout(timer);
    }
  }, [otp]);

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleVerify = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 6) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsVerifying(true);
    setError('');

    try {
      if (mode === 'signup' && isSignUpLoaded) {
        const attempt = await signUp.attemptPhoneNumberVerification({ code: otpCode });
        
        if (attempt.status === 'complete') {
          await setSignUpActive({ session: attempt.createdSessionId });
          router.replace('/(onboarding)/intro');
          return;
        } else if (attempt.status === 'missing_requirements') {
          // Check if there's already a session we can activate
          if (attempt.createdSessionId) {
            await setSignUpActive({ session: attempt.createdSessionId });
            router.replace('/(onboarding)/intro');
            return;
          }
          // Missing fields are optional — try to complete anyway
          if (__DEV__) console.log('[VerifyOTP] missing_requirements, missingFields:', JSON.stringify(attempt));
          setError('Sign up incomplete. Please try signing up with email instead.');
        } else {
          setError('Verification incomplete. Please try again.');
          if (__DEV__) console.error(JSON.stringify(attempt, null, 2));
        }
      } else if (mode === 'signin' && isSignInLoaded) {
        const attempt = await signIn.attemptFirstFactor({
          strategy: 'phone_code',
          code: otpCode,
        });

        if (attempt.status === 'complete') {
          await setSignInActive({ session: attempt.createdSessionId });
          router.replace('/(tabs)');
          return;
        } else {
          setError('Verification incomplete. Please try again.');
          if (__DEV__) console.error(JSON.stringify(attempt, null, 2));
        }
      }
    } catch (err: any) {
      const errCode = err?.errors?.[0]?.code;
      // If already verified, the session is active — just navigate
      if (errCode === 'verification_already_verified') {
        if (mode === 'signup') {
          router.replace('/(onboarding)/intro');
        } else {
          router.replace('/(tabs)');
        }
        return;
      }
      const clerkError = err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || err.message || 'Verification failed';
      setError(clerkError);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setError('');
    
    try {
      if (mode === 'signup' && isSignUpLoaded) {
        await signUp.preparePhoneNumberVerification({ strategy: 'phone_code' });
      } else if (mode === 'signin' && isSignInLoaded && signIn.supportedFirstFactors) {
        const phoneFactor = signIn.supportedFirstFactors.find(
          (f: any) => f.strategy === 'phone_code'
        );
        if (phoneFactor && 'phoneNumberId' in phoneFactor) {
          await signIn.prepareFirstFactor({
            strategy: 'phone_code',
            phoneNumberId: phoneFactor.phoneNumberId,
          });
        }
      }
      setTimer(59);
    } catch (err: any) {
      const clerkError = err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || 'Failed to resend code';
      setError(clerkError);
    }
  };

  const isComplete = otp.every(digit => digit !== '');

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: tc.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Close Button */}
      <TouchableOpacity style={[styles.closeButton, { top: insets.top + 10 }]} onPress={handleClose} accessibilityRole="button" accessibilityLabel="Close">
        <CloseIcon size={24} color={tc.textPrimary} />
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.content, { paddingTop: insets.top + 80 }]}>
          {/* Security Icon */}
          <View style={[styles.iconContainer, { borderColor: tc.textPrimary }]}>
            <ShieldTick size={32} color={tc.textPrimary} variant="Outline" />
          </View>

          {/* Header */}
          <Text style={[styles.title, { color: tc.textPrimary }]}>Enter your verification code</Text>

          {/* Phone Number with Edit */}
          <View style={styles.phoneContainer}>
            <Text style={[styles.phoneText, { color: tc.textSecondary }]}>Sent to {phoneNumber}</Text>
          </View>

          {/* OTP Input - Inline */}
          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <View key={index} style={[styles.otpInputWrapper, { borderBottomColor: tc.borderMedium }]}>
                <TextInput
                  ref={(ref) => { inputRefs.current[index] = ref; }}
                  style={[styles.otpInput, { color: tc.textPrimary }]}
                  value={digit}
                  onChangeText={(value) => handleOtpChange(value, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  keyboardType="number-pad"
                  maxLength={index === 0 ? 6 : 1}
                  selectTextOnFocus
                  accessibilityLabel={`Digit ${index + 1} of 6`}
                  textContentType={index === 0 ? 'oneTimeCode' : 'none'}
                  autoComplete={index === 0 ? 'sms-otp' : 'off'}
                />
              </View>
            ))}
          </View>

          {error ? <Text style={[styles.errorText, { color: tc.error }]}>{error}</Text> : null}

          {/* Timer */}
          <View style={styles.timerContainer}>
            <Text style={[styles.timerText, { color: tc.textSecondary }]}>Didn't get a code?</Text>
            {timer > 0 ? (
              <Text style={[styles.timerCount, { color: tc.error }]}> ⏱ {timer}s</Text>
            ) : (
              <TouchableOpacity onPress={handleResend} accessibilityRole="button" accessibilityLabel="Resend code">
                <Text style={[styles.resendText, { color: tc.primary }]}> Resend</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Verify Button - Always Visible */}
          <TouchableOpacity
            style={[
              styles.verifyButton,
              { backgroundColor: isDark ? tc.white : tc.black },
              (!isComplete || isVerifying) && { backgroundColor: tc.bgElevated, borderWidth: 1, borderColor: tc.borderMedium },
            ]}
            onPress={handleVerify}
            disabled={!isComplete || isVerifying}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Verify code"
          >
            {isVerifying ? (
              <ActivityIndicator color={isDark ? tc.black : tc.white} size="small" />
            ) : (
              <Text style={[styles.verifyButtonText, { color: isDark ? tc.black : tc.white }, !isComplete && { color: tc.textTertiary }]}>
                →
              </Text>
            )}
          </TouchableOpacity>
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
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.md,
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing['3xl'],
  },
  phoneText: {
    fontSize: typography.fontSize.base,
  },
  editText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  otpInputWrapper: {
    flex: 1,
    marginHorizontal: spacing.xs,
    borderBottomWidth: 2,
    paddingBottom: spacing.xs,
  },
  otpInput: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    textAlign: 'center',
    padding: 0,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  timerText: {
    fontSize: typography.fontSize.sm,
  },
  timerCount: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  resendText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  errorText: {
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.sm,
  },
  verifyButton: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginTop: spacing.xl,
  },
  verifyButtonText: {
    fontSize: 28,
  },
});
