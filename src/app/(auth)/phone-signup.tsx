import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import * as Haptics from 'expo-haptics';
import CountryPicker, { Country, CountryCode } from 'react-native-country-picker-modal';
import PhoneIcon from '@/components/common/icons/PhoneIcon';
import CloseIcon from '@/components/common/icons/CloseIcon';
import { colors, typography, spacing, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { useSignUp } from '@clerk/clerk-expo';

export default function PhoneSignUp() {
  const router = useRouter();
  const params = useLocalSearchParams<{ phone?: string; callingCode?: string }>();
  const { isLoaded, signUp } = useSignUp();
  const [countryCode, setCountryCode] = useState<CountryCode>('US');
  const [callingCode, setCallingCode] = useState(params.callingCode || '1');
  const [phoneNumber, setPhoneNumber] = useState(params.phone || '');
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const onSelectCountry = (country: Country) => {
    setCountryCode(country.cca2);
    setCallingCode(country.callingCode[0]);
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleContinue = async () => {
    if (phoneNumber.length < 10 || !isLoaded) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsLoading(true);
    setError('');

    try {
      const fullPhone = `+${callingCode}${phoneNumber}`;
      
      // Create sign-up with phone number
      await signUp.create({
        phoneNumber: fullPhone,
      });

      // Send phone verification code
      await signUp.preparePhoneNumberVerification({ strategy: 'phone_code' });

      // Navigate to OTP screen with phone data
      router.push({
        pathname: '/(auth)/verify-otp',
        params: { 
          phone: fullPhone,
          mode: 'signup',
        },
      });
    } catch (err: any) {
      const clerkError = err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || err.message || 'Failed to send verification code';
      setError(clerkError);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="dark" />
      
      {/* Close Button */}
      <TouchableOpacity style={styles.closeButton} onPress={handleBack}>
        <CloseIcon size={24} color={colors.textPrimary} />
      </TouchableOpacity>

      <View style={styles.content}>
        {/* Phone Icon */}
        <View style={styles.iconContainer}>
          <PhoneIcon size={32} color={colors.textPrimary} />
        </View>

        {/* Header */}
        <Text style={styles.title}>Sign up with your phone number</Text>

        {/* Phone Input - Inline */}
        <View style={styles.phoneInputContainer}>
          {/* Country Code */}
          <TouchableOpacity 
            style={styles.countryCodeButton}
            onPress={() => setShowCountryPicker(true)}
          >
            <CountryPicker
              countryCode={countryCode}
              withFilter
              withFlag
              withCallingCode
              withEmoji
              onSelect={onSelectCountry}
              visible={showCountryPicker}
              onClose={() => setShowCountryPicker(false)}
            />
            <Text style={styles.countryCodeText}>+{callingCode}</Text>
            <Text style={styles.dropdownIcon}>▼</Text>
          </TouchableOpacity>

          {/* Phone Number */}
          <TextInput
            style={styles.phoneInput}
            placeholder=""
            placeholderTextColor={colors.textTertiary}
            keyboardType="phone-pad"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            maxLength={15}
            autoFocus
          />
        </View>

        {/* Description */}
        <Text style={styles.description}>
          We'll send you a text with a verification code.
        </Text>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {/* Continue Button - Always Visible */}
        <TouchableOpacity
          style={[styles.continueButton, (phoneNumber.length < 10 || isLoading) && styles.continueButtonDisabled]}
          onPress={handleContinue}
          disabled={phoneNumber.length < 10 || isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color={colors.white} size="small" />
          ) : (
            <Text style={[styles.continueIcon, phoneNumber.length < 10 && styles.continueIconDisabled]}>→</Text>
          )}
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Google Button */}
        <TouchableOpacity
          style={styles.googleButton}
          onPress={() => console.log('Google signup')}
          activeOpacity={0.8}
        >
          <Text style={styles.googleButtonText}>Sign up with Google</Text>
        </TouchableOpacity>
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
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: typography.fontSize['4xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing['2xl'],
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.gray300,
    paddingBottom: spacing.md,
    marginBottom: spacing.lg,
  },
  countryCodeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingRight: spacing.md,
    borderRightWidth: 1,
    borderRightColor: colors.gray300,
  },
  flag: {
    fontSize: 24,
  },
  countryCodeText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  dropdownIcon: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  phoneInput: {
    flex: 1,
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    paddingLeft: spacing.lg,
  },
  description: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    lineHeight: typography.fontSize.base * typography.lineHeight.normal,
    marginBottom: spacing['3xl'],
  },
  errorText: {
    fontSize: typography.fontSize.sm,
    color: '#EF4444',
    marginBottom: spacing.md,
  },
  continueButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.black,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginTop: spacing.lg,
  },
  continueButtonDisabled: {
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.gray300,
  },
  continueIcon: {
    fontSize: 28,
    color: colors.white,
  },
  continueIconDisabled: {
    color: colors.gray400,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.gray300,
  },
  dividerText: {
    marginHorizontal: spacing.md,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  googleButton: {
    height: 56,
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.gray300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  googleButtonText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
});
