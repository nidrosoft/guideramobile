import { View, Text, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState, useEffect } from 'react';
import * as Haptics from 'expo-haptics';
import CountryPicker, { Country, CountryCode } from 'react-native-country-picker-modal';
import PhoneIcon from '@/components/common/icons/PhoneIcon';
import CloseIcon from '@/components/common/icons/CloseIcon';
import { colors, typography, spacing, borderRadius, shadows } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { useSignIn, useSSO } from '@clerk/clerk-expo';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';

const useWarmUpBrowser = () => {
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);
};

WebBrowser.maybeCompleteAuthSession();

export default function SignIn() {
  useWarmUpBrowser();
  const router = useRouter();
  const { isLoaded, signIn, setActive } = useSignIn();
  const { startSSOFlow } = useSSO();
  const [countryCode, setCountryCode] = useState<CountryCode>('US');
  const [callingCode, setCallingCode] = useState('1');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const onSelectCountry = (country: Country) => {
    setCountryCode(country.cca2);
    setCallingCode(country.callingCode[0]);
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleGoogleSignIn = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setError('');

    try {
      const { createdSessionId, setActive: ssoSetActive, signIn: ssoSignIn, signUp: ssoSignUp } = await startSSOFlow({
        strategy: 'oauth_google',
        redirectUrl: AuthSession.makeRedirectUri(),
      });

      if (createdSessionId && ssoSetActive) {
        await ssoSetActive({ session: createdSessionId });
        // AuthGuard will handle redirect
      } else {
        console.log('[SignIn SSO] No session created. signUp status:', ssoSignUp?.status, 'signIn status:', ssoSignIn?.status);
      }
    } catch (err: any) {
      const clerkError = err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || err.message || 'Google sign in failed';
      setError(clerkError);
    }
  };

  const handleEmailSignIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/(auth)/email-signin' as any);
  };

  const handleContinue = async () => {
    if (phoneNumber.length < 10 || !isLoaded || isLoading) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsLoading(true);
    setError('');

    try {
      const fullPhone = `+${callingCode}${phoneNumber}`;

      // Create sign-in with phone number
      const { supportedFirstFactors } = await signIn.create({
        identifier: fullPhone,
      });

      // Find the phone_code factor
      const phoneFactor = supportedFirstFactors?.find(
        (f: any) => f.strategy === 'phone_code'
      );

      if (phoneFactor && 'phoneNumberId' in phoneFactor) {
        await signIn.prepareFirstFactor({
          strategy: 'phone_code',
          phoneNumberId: phoneFactor.phoneNumberId,
        });

        // Navigate to OTP screen (replace to prevent double-stack)
        router.replace({
          pathname: '/(auth)/verify-otp',
          params: {
            phone: fullPhone,
            mode: 'signin',
          },
        });
      } else {
        setError('Phone sign-in not available. Try email or Google.');
      }
    } catch (err: any) {
      const errCode = err?.errors?.[0]?.code;
      if (errCode === 'form_identifier_not_found') {
        // Account doesn't exist — redirect to sign-up
        router.push('/(auth)/email-signup' as any);
        return;
      }
      const clerkError = err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || err.message || 'Failed to sign in';
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
      <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
        <CloseIcon size={24} color={colors.textPrimary} />
      </TouchableOpacity>

      <View style={styles.content}>
        {/* Phone Icon */}
        <View style={styles.iconContainer}>
          <PhoneIcon size={32} color={colors.textPrimary} />
        </View>

        {/* Header */}
        <Text style={styles.title}>Let's get you back in...</Text>

        {/* Phone Input */}
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
          We'll send you a text with a verification code to sign you back in.
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

        {/* Google Sign In Button */}
        <TouchableOpacity
          style={styles.googleButton}
          onPress={handleGoogleSignIn}
          activeOpacity={0.8}
        >
          <Text style={styles.googleButtonText}>Sign in with Google</Text>
        </TouchableOpacity>

        {/* Email Sign In Button */}
        <TouchableOpacity
          style={styles.emailButton}
          onPress={handleEmailSignIn}
          activeOpacity={0.8}
        >
          <Text style={styles.emailButtonText}>Sign in with Email</Text>
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
    ...shadows.sm,
  },
  googleButtonText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  emailButton: {
    height: 56,
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.gray300,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  emailButtonText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
});
