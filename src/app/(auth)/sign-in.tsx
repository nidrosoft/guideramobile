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
  const { colors: tc, isDark } = useTheme();
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
      const result = await signIn.create({
        identifier: fullPhone,
      });

      const { supportedFirstFactors, supportedSecondFactors } = result;

      // Log full factor details for debugging
      console.log('[SignIn] Full signIn status:', result.status);
      console.log('[SignIn] supportedFirstFactors:', JSON.stringify(supportedFirstFactors));
      console.log('[SignIn] supportedSecondFactors:', JSON.stringify(supportedSecondFactors));

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
      } else if (result.status === 'needs_client_trust' as any) {
        // Clerk v3: New client trust challenge — prepare phone code for verification
        const trustPhoneFactor = supportedFirstFactors?.find(
          (f: any) => f.strategy === 'phone_code'
        );
        if (trustPhoneFactor && 'phoneNumberId' in trustPhoneFactor) {
          await signIn.prepareFirstFactor({
            strategy: 'phone_code',
            phoneNumberId: trustPhoneFactor.phoneNumberId,
          });
          router.replace({
            pathname: '/(auth)/verify-otp',
            params: { phone: fullPhone, mode: 'signin' },
          });
        } else {
          setError('Additional verification required. Please try signing in with email.');
        }
      } else {
        // Check what factors ARE available and give specific guidance
        const availableStrategies = supportedFirstFactors?.map((f: any) => f.strategy) || [];
        console.log('[SignIn] Phone factor not found. Available strategies:', availableStrategies);
        
        if (availableStrategies.includes('oauth_google')) {
          setError('This account uses Google sign-in. Please use the Google option below.');
        } else if (availableStrategies.includes('email_code')) {
          setError('Phone sign-in not available for this account. Try signing in with email.');
        } else if (availableStrategies.includes('password')) {
          setError('This account uses email & password. Try signing in with email.');
        } else {
          setError('Phone sign-in not available. Check that phone authentication is enabled in Clerk Dashboard → User & Authentication.');
        }
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
      style={[styles.container, { backgroundColor: tc.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      {/* Close Button */}
      <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
        <CloseIcon size={24} color={tc.textPrimary} />
      </TouchableOpacity>

      <View style={styles.content}>
        {/* Phone Icon */}
        <View style={[styles.iconContainer, { borderColor: tc.textPrimary }]}>
          <PhoneIcon size={32} color={tc.textPrimary} />
        </View>

        {/* Header */}
        <Text style={[styles.title, { color: tc.textPrimary }]}>Let's get you back in...</Text>

        {/* Phone Input */}
        <View style={[styles.phoneInputContainer, { borderBottomColor: tc.borderMedium }]}>
          {/* Country Code */}
          <TouchableOpacity 
            style={[styles.countryCodeButton, { borderRightColor: tc.borderMedium }]}
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
            <Text style={[styles.countryCodeText, { color: tc.textPrimary }]}>+{callingCode}</Text>
            <Text style={[styles.dropdownIcon, { color: tc.textSecondary }]}>▼</Text>
          </TouchableOpacity>

          {/* Phone Number */}
          <TextInput
            style={[styles.phoneInput, { color: tc.textPrimary }]}
            placeholder=""
            placeholderTextColor={tc.textTertiary}
            keyboardType="phone-pad"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            maxLength={15}
            autoFocus
          />
        </View>

        {/* Description */}
        <Text style={[styles.description, { color: tc.textSecondary }]}>
          We'll send you a text with a verification code to sign you back in.
        </Text>

        {error ? <Text style={[styles.errorText, { color: tc.error }]}>{error}</Text> : null}

        {/* Continue Button - Always Visible */}
        <TouchableOpacity
          style={[
            styles.continueButton,
            { backgroundColor: isDark ? tc.white : tc.black },
            (phoneNumber.length < 10 || isLoading) && { backgroundColor: tc.bgElevated, borderWidth: 1, borderColor: tc.borderMedium },
          ]}
          onPress={handleContinue}
          disabled={phoneNumber.length < 10 || isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color={isDark ? tc.black : tc.white} size="small" />
          ) : (
            <Text style={[styles.continueIcon, { color: isDark ? tc.black : tc.white }, phoneNumber.length < 10 && { color: tc.textTertiary }]}>→</Text>
          )}
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={[styles.dividerLine, { backgroundColor: tc.borderMedium }]} />
          <Text style={[styles.dividerText, { color: tc.textSecondary }]}>or</Text>
          <View style={[styles.dividerLine, { backgroundColor: tc.borderMedium }]} />
        </View>

        {/* Google Sign In Button */}
        <TouchableOpacity
          style={[styles.googleButton, { backgroundColor: tc.bgElevated, borderColor: tc.borderMedium }]}
          onPress={handleGoogleSignIn}
          activeOpacity={0.8}
        >
          <Text style={[styles.googleButtonText, { color: tc.textPrimary }]}>Sign in with Google</Text>
        </TouchableOpacity>

        {/* Email Sign In Button */}
        <TouchableOpacity
          style={[styles.emailButton, { backgroundColor: tc.bgElevated, borderColor: tc.borderMedium }]}
          onPress={handleEmailSignIn}
          activeOpacity={0.8}
        >
          <Text style={[styles.emailButtonText, { color: tc.textPrimary }]}>Sign in with Email</Text>
        </TouchableOpacity>
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
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: typography.fontSize['4xl'],
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing['2xl'],
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    paddingBottom: spacing.md,
    marginBottom: spacing.lg,
  },
  countryCodeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingRight: spacing.md,
    borderRightWidth: 1,
  },
  flag: {
    fontSize: 24,
  },
  countryCodeText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
  },
  dropdownIcon: {
    fontSize: 10,
  },
  phoneInput: {
    flex: 1,
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.semibold,
    paddingLeft: spacing.lg,
  },
  description: {
    fontSize: typography.fontSize.base,
    lineHeight: typography.fontSize.base * typography.lineHeight.normal,
    marginBottom: spacing['3xl'],
  },
  errorText: {
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.md,
  },
  continueButton: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginTop: spacing.lg,
  },
  continueIcon: {
    fontSize: 28,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: spacing.md,
    fontSize: typography.fontSize.sm,
  },
  googleButton: {
    height: 56,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  googleButtonText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
  },
  emailButton: {
    height: 56,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  emailButtonText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
  },
});
