import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState, useRef, useEffect } from 'react';
import * as Haptics from 'expo-haptics';
import { ShieldTick } from 'iconsax-react-native';
import CloseIcon from '@/components/common/icons/CloseIcon';
import { colors, typography, spacing, borderRadius } from '@/styles';

export default function VerifyOTP() {
  const router = useRouter();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(59);
  const [phoneNumber] = useState('+16464649944');
  const inputRefs = useRef<Array<TextInput | null>>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleOtpChange = (value: string, index: number) => {
    if (value.length > 1) return;
    
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

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleVerify = () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 6) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // TODO: Verify OTP
    router.push('/(onboarding)/intro' as any);
  };

  const handleResend = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // TODO: Resend OTP
    console.log('Resend OTP');
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
                maxLength={1}
                selectTextOnFocus
              />
            </View>
          ))}
        </View>

        {/* Timer */}
        <View style={styles.timerContainer}>
          <Text style={styles.timerText}>Didn't get a code?</Text>
          <Text style={styles.timerCount}> ⏱ {timer}s</Text>
        </View>

        {/* Verify Button - Always Visible */}
        <TouchableOpacity
          style={[styles.verifyButton, !isComplete && styles.verifyButtonDisabled]}
          onPress={handleVerify}
          disabled={!isComplete}
          activeOpacity={0.8}
        >
          <Text style={[styles.verifyButtonText, !isComplete && styles.verifyButtonTextDisabled]}>
            →
          </Text>
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
    backgroundColor: colors.white,
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
