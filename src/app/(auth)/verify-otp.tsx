import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState, useRef, useEffect } from 'react';
import * as Haptics from 'expo-haptics';
import { ShieldTick } from 'iconsax-react-native';
import CloseIcon from '@/components/common/icons/CloseIcon';
import { colors, typography, spacing, borderRadius } from '@/styles';
import { useSignUp, useSignIn } from '@clerk/clerk-expo';

export default function VerifyOTP() {
  const router = useRouter();
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

  // Auto-submit when all digits are filled
  useEffect(() => {
    if (otp.every(d => d !== '') && !isVerifying) {
      handleVerify();
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
          console.log('[VerifyOTP] missing_requirements, missingFields:', JSON.stringify(attempt));
          setError('Sign up incomplete. Please try signing up with email instead.');
        } else {
          setError('Verification incomplete. Please try again.');
          console.error(JSON.stringify(attempt, null, 2));
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
          console.error(JSON.stringify(attempt, null, 2));
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
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Close Button */}
      <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
        <CloseIcon size={24} color={colors.textPrimary} />
      </TouchableOpacity>

      <View style={styles.content}>
        {/* Security Icon */}
        <View style={styles.iconContainer}>
          <ShieldTick size={32} color={colors.textPrimary} variant="Outline" />
        </View>

        {/* Header */}
        <Text style={styles.title}>Enter your verification code</Text>
        
        {/* Phone Number with Edit */}
        <View style={styles.phoneContainer}>
          <Text style={styles.phoneText}>Sent to {phoneNumber}</Text>
          <Text style={styles.editText}> · Edit</Text>
        </View>

        {/* OTP Input - Inline */}
        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <View key={index} style={styles.otpInputWrapper}>
              <TextInput
                ref={(ref) => { inputRefs.current[index] = ref; }}
                style={styles.otpInput}
                value={digit}
                onChangeText={(value) => handleOtpChange(value, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                keyboardType="number-pad"
                maxLength={index === 0 ? 6 : 1}
                selectTextOnFocus
                textContentType={index === 0 ? 'oneTimeCode' : 'none'}
                autoComplete={index === 0 ? 'sms-otp' : 'off'}
              />
            </View>
          ))}
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {/* Timer */}
        <View style={styles.timerContainer}>
          <Text style={styles.timerText}>Didn't get a code?</Text>
          {timer > 0 ? (
            <Text style={styles.timerCount}> ⏱ {timer}s</Text>
          ) : (
            <TouchableOpacity onPress={handleResend}>
              <Text style={styles.resendText}> Resend</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Verify Button - Always Visible */}
        <TouchableOpacity
          style={[styles.verifyButton, (!isComplete || isVerifying) && styles.verifyButtonDisabled]}
          onPress={handleVerify}
          disabled={!isComplete || isVerifying}
          activeOpacity={0.8}
        >
          {isVerifying ? (
            <ActivityIndicator color={colors.white} size="small" />
          ) : (
            <Text style={[styles.verifyButtonText, !isComplete && styles.verifyButtonTextDisabled]}>
              →
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
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
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing['3xl'],
  },
  phoneText: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
  },
  editText: {
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
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
    borderBottomColor: colors.gray300,
    paddingBottom: spacing.xs,
  },
  otpInput: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
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
    color: colors.textSecondary,
  },
  timerCount: {
    fontSize: typography.fontSize.sm,
    color: '#FF4458',
    fontWeight: typography.fontWeight.semibold,
  },
  resendText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: typography.fontWeight.semibold,
  },
  errorText: {
    fontSize: typography.fontSize.sm,
    color: '#EF4444',
    marginBottom: spacing.sm,
  },
  verifyButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.black,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginTop: spacing.xl,
  },
  verifyButtonDisabled: {
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.gray300,
  },
  verifyButtonText: {
    fontSize: 28,
    color: colors.white,
  },
  verifyButtonTextDisabled: {
    color: colors.gray400,
  },
});
