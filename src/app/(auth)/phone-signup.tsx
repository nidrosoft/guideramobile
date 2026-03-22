import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import * as Haptics from 'expo-haptics';
import CountryPicker, { Country, CountryCode } from 'react-native-country-picker-modal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PhoneIcon from '@/components/common/icons/PhoneIcon';
import CloseIcon from '@/components/common/icons/CloseIcon';
import { colors, typography, spacing, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { useSignUp, useSSO } from '@clerk/clerk-expo';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';

WebBrowser.maybeCompleteAuthSession();

const useWarmUpBrowser = () => {
  React.useEffect(() => {
    if (Platform.OS !== 'android') return;
    void WebBrowser.warmUpAsync();
    return () => { void WebBrowser.coolDownAsync(); };
  }, []);
};

export default function PhoneSignUp() {
  useWarmUpBrowser();
  const router = useRouter();
  const { colors: tc, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ phone?: string; callingCode?: string }>();
  const { isLoaded, signUp } = useSignUp();
  const { startSSOFlow } = useSSO();
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
      style={[styles.container, { backgroundColor: tc.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      {/* Close Button */}
      <TouchableOpacity style={[styles.closeButton, { top: insets.top + 10 }]} onPress={handleBack} accessibilityRole="button" accessibilityLabel="Close">
        <CloseIcon size={24} color={tc.textPrimary} />
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.content, { paddingTop: insets.top + 80 }]}>
          {/* Phone Icon */}
          <View style={[styles.iconContainer, { borderColor: tc.textPrimary }]}>
            <PhoneIcon size={32} color={tc.textPrimary} />
          </View>

          {/* Header */}
          <Text style={[styles.title, { color: tc.textPrimary }]}>Sign up with your phone number</Text>

          {/* Phone Input - Inline */}
          <View style={[styles.phoneInputContainer, { borderBottomColor: tc.borderMedium }]}>
            {/* Country Code */}
            <TouchableOpacity
              style={[styles.countryCodeButton, { borderRightColor: tc.borderMedium }]}
              onPress={() => setShowCountryPicker(true)}
              accessibilityRole="button"
              accessibilityLabel={`Country code plus ${callingCode}`}
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
              accessibilityLabel="Phone number"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              maxLength={15}
              autoFocus
            />
          </View>

          {/* Description */}
          <Text style={[styles.description, { color: tc.textSecondary }]}>
            We'll send you a text with a verification code.
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
            accessibilityRole="button"
            accessibilityLabel="Continue"
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

          {/* Google Button */}
          <TouchableOpacity
            style={[styles.googleButton, { backgroundColor: tc.bgElevated, borderColor: tc.borderMedium }]}
            onPress={async () => {
              try {
                const { createdSessionId, setActive: ssoSetActive, signUp: ssoSignUp } = await startSSOFlow({
                  strategy: 'oauth_google',
                  redirectUrl: AuthSession.makeRedirectUri(),
                });
                if (createdSessionId && ssoSetActive) {
                  await ssoSetActive({ session: createdSessionId });
                  const isNewUser = ssoSignUp?.status === 'complete';
                  if (isNewUser) {
                    router.replace('/(onboarding)/intro');
                  } else {
                    await new Promise(resolve => setTimeout(resolve, 300));
                    router.replace('/(tabs)');
                  }
                }
              } catch (err: any) {
                const msg = err?.errors?.[0]?.longMessage || err?.message || 'Google sign up failed';
                setError(msg);
              }
            }}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Sign up with Google"
          >
            <Text style={[styles.googleButtonText, { color: tc.textPrimary }]}>Sign up with Google</Text>
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
});
