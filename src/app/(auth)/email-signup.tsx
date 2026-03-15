import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { Sms } from 'iconsax-react-native';
import CloseIcon from '@/components/common/icons/CloseIcon';
import { colors, typography, spacing, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { useSignUp, useSSO } from '@clerk/clerk-expo';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import CountryPicker, { Country, CountryCode } from 'react-native-country-picker-modal';

WebBrowser.maybeCompleteAuthSession();

const useWarmUpBrowser = () => {
  React.useEffect(() => {
    if (Platform.OS !== 'android') return;
    void WebBrowser.warmUpAsync();
    return () => { void WebBrowser.coolDownAsync(); };
  }, []);
};

export default function EmailSignUp() {
  useWarmUpBrowser();
  const router = useRouter();
  const { colors: tc, isDark } = useTheme();
  const { isLoaded, signUp, setActive } = useSignUp();
  const { startSSOFlow } = useSSO();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState<CountryCode>('US');
  const [callingCode, setCallingCode] = useState('1');
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState('');

  const onSelectCountry = (country: Country) => {
    setCountryCode(country.cca2);
    setCallingCode(country.callingCode[0]);
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const validateForm = () => {
    if (!firstName.trim()) {
      setError('First name is required');
      return false;
    }
    if (!email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!email.includes('@') || !email.includes('.')) {
      setError('Please enter a valid email');
      return false;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    setError('');
    return true;
  };

  const handleSignUp = async () => {
    if (!validateForm() || !isLoaded) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsLoading(true);
    setError('');

    try {
      const createParams: Record<string, string> = {
        emailAddress: email,
        password,
        firstName,
      };
      if (lastName.trim()) createParams.lastName = lastName;
      if (username.trim()) createParams.username = username;
      if (phoneNumber.length >= 7) {
        createParams.phoneNumber = `+${callingCode}${phoneNumber}`;
      }

      await signUp.create(createParams);

      // Send email verification code
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setPendingVerification(true);
    } catch (err: any) {
      const clerkError = err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || err.message || 'Failed to sign up';
      setError(clerkError);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyEmail = async () => {
    if (!isLoaded || !code) return;

    setIsLoading(true);
    setError('');

    try {
      const signUpAttempt = await signUp.attemptEmailAddressVerification({ code });

      if (signUpAttempt.status === 'complete') {
        await setActive({ session: signUpAttempt.createdSessionId });
        router.replace('/(onboarding)/intro');
      } else if (signUpAttempt.status === 'missing_requirements') {
        // Phone verification might still be needed if user provided a phone number
        if (phoneNumber.length >= 7) {
          try {
            await signUp.preparePhoneNumberVerification({ strategy: 'phone_code' });
            const fullPhone = `+${callingCode}${phoneNumber}`;
            router.push({
              pathname: '/(auth)/verify-otp',
              params: { phone: fullPhone, mode: 'signup' },
            });
          } catch (prepErr: any) {
            console.error('[EmailSignup] Phone verification prep failed:', prepErr);
            setError('Additional verification required. Please try again.');
          }
        } else {
          console.error('[EmailSignup] Missing requirements:', JSON.stringify(signUpAttempt, null, 2));
          setError('Sign up incomplete. Please try again.');
        }
      } else {
        setError('Verification incomplete. Please try again.');
        console.error(JSON.stringify(signUpAttempt, null, 2));
      }
    } catch (err: any) {
      const clerkError = err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || err.message || 'Verification failed';
      setError(clerkError);
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = firstName.trim() && email.includes('@') && password.length >= 6 && password === confirmPassword;

  if (pendingVerification) {
    return (
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: tc.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <StatusBar style={isDark ? 'light' : 'dark'} />
        
        <TouchableOpacity style={styles.closeButton} onPress={handleBack}>
          <CloseIcon size={24} color={tc.textPrimary} />
        </TouchableOpacity>

        <View style={styles.content}>
          <View style={[styles.iconContainer, { borderColor: tc.textPrimary }]}>
            <Sms size={32} color={tc.textPrimary} variant="Outline" />
          </View>

          <Text style={[styles.title, { color: tc.textPrimary }]}>Verify your email</Text>
          <Text style={[styles.verifyDescription, { color: tc.textSecondary }]}>
            A verification code has been sent to {email}
          </Text>

          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: tc.textSecondary }]}>Verification Code</Text>
            <TextInput
              style={[styles.input, { borderColor: tc.borderMedium, color: tc.textPrimary, backgroundColor: tc.bgElevated }]}
              placeholder="Enter 6-digit code"
              placeholderTextColor={tc.textTertiary}
              keyboardType="number-pad"
              value={code}
              onChangeText={(text) => {
                setCode(text);
                setError('');
              }}
              autoFocus
            />
          </View>

          {error ? <Text style={[styles.errorText, { color: tc.error }]}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.signUpButton, { backgroundColor: tc.primary }, (!code || isLoading) && { backgroundColor: tc.gray300 }]}
            onPress={handleVerifyEmail}
            disabled={!code || isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color={tc.white} />
            ) : (
              <Text style={[styles.signUpButtonText, { color: tc.white }]}>Verify</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: tc.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      <TouchableOpacity style={styles.closeButton} onPress={handleBack}>
        <CloseIcon size={24} color={tc.textPrimary} />
      </TouchableOpacity>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <View style={[styles.iconContainer, { borderColor: tc.textPrimary }]}>
            <Sms size={32} color={tc.textPrimary} variant="Outline" />
          </View>

          <Text style={[styles.title, { color: tc.textPrimary }]}>Create your account</Text>

          <View style={styles.nameRow}>
            <View style={styles.nameInputContainer}>
              <Text style={[styles.inputLabel, { color: tc.textSecondary }]}>First Name</Text>
              <TextInput
                style={[styles.input, { borderColor: tc.borderMedium, color: tc.textPrimary, backgroundColor: tc.bgElevated }]}
                placeholder="John"
                placeholderTextColor={tc.textTertiary}
                value={firstName}
                onChangeText={(text) => {
                  setFirstName(text);
                  setError('');
                }}
                autoCapitalize="words"
              />
            </View>
            <View style={styles.nameInputContainer}>
              <Text style={[styles.inputLabel, { color: tc.textSecondary }]}>Last Name</Text>
              <TextInput
                style={[styles.input, { borderColor: tc.borderMedium, color: tc.textPrimary, backgroundColor: tc.bgElevated }]}
                placeholder="Doe"
                placeholderTextColor={tc.textTertiary}
                value={lastName}
                onChangeText={(text) => {
                  setLastName(text);
                  setError('');
                }}
                autoCapitalize="words"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: tc.textSecondary }]}>Username</Text>
            <TextInput
              style={[styles.input, { borderColor: tc.borderMedium, color: tc.textPrimary, backgroundColor: tc.bgElevated }]}
              placeholder="johndoe"
              placeholderTextColor={tc.textTertiary}
              autoCapitalize="none"
              autoCorrect={false}
              value={username}
              onChangeText={(text) => {
                setUsername(text.toLowerCase().replace(/[^a-z0-9_]/g, ''));
                setError('');
              }}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: tc.textSecondary }]}>Email</Text>
            <TextInput
              style={[styles.input, { borderColor: tc.borderMedium, color: tc.textPrimary, backgroundColor: tc.bgElevated }]}
              placeholder="you@example.com"
              placeholderTextColor={tc.textTertiary}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setError('');
              }}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: tc.textSecondary }]}>Phone Number</Text>
            <View style={[styles.phoneInputRow, { borderColor: tc.borderMedium, backgroundColor: tc.bgElevated }]}>
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
              </TouchableOpacity>
              <TextInput
                style={[styles.phoneInput, { color: tc.textPrimary }]}
                placeholder="Phone number"
                placeholderTextColor={tc.textTertiary}
                keyboardType="phone-pad"
                value={phoneNumber}
                onChangeText={(text) => {
                  setPhoneNumber(text);
                  setError('');
                }}
                maxLength={15}
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: tc.textSecondary }]}>Password</Text>
            <TextInput
              style={[styles.input, { borderColor: tc.borderMedium, color: tc.textPrimary, backgroundColor: tc.bgElevated }]}
              placeholder="At least 6 characters"
              placeholderTextColor={tc.textTertiary}
              secureTextEntry
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setError('');
              }}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: tc.textSecondary }]}>Confirm Password</Text>
            <TextInput
              style={[styles.input, { borderColor: tc.borderMedium, color: tc.textPrimary, backgroundColor: tc.bgElevated }]}
              placeholder="Re-enter your password"
              placeholderTextColor={tc.textTertiary}
              secureTextEntry
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                setError('');
              }}
            />
          </View>

          {error ? <Text style={[styles.errorText, { color: tc.error }]}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.signUpButton, { backgroundColor: tc.primary }, (!isFormValid || isLoading) && { backgroundColor: tc.gray300 }]}
            onPress={handleSignUp}
            disabled={!isFormValid || isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color={tc.white} />
            ) : (
              <Text style={[styles.signUpButtonText, { color: tc.white }]}>Create Account</Text>
            )}
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: tc.borderMedium }]} />
            <Text style={[styles.dividerText, { color: tc.textSecondary }]}>or</Text>
            <View style={[styles.dividerLine, { backgroundColor: tc.borderMedium }]} />
          </View>

          <TouchableOpacity
            style={[styles.googleButton, { backgroundColor: tc.bgElevated, borderColor: tc.borderMedium }]}
            onPress={async () => {
              try {
                const { createdSessionId, setActive: ssoSetActive } = await startSSOFlow({
                  strategy: 'oauth_google',
                  redirectUrl: AuthSession.makeRedirectUri(),
                });
                if (createdSessionId && ssoSetActive) {
                  await ssoSetActive({ session: createdSessionId });
                }
              } catch (err: any) {
                const msg = err?.errors?.[0]?.longMessage || err?.message || 'Google sign up failed';
                setError(msg);
              }
            }}
            activeOpacity={0.8}
          >
            <Text style={[styles.googleButtonText, { color: tc.textPrimary }]}>Sign up with Google</Text>
          </TouchableOpacity>

          <View style={styles.signInContainer}>
            <Text style={[styles.signInText, { color: tc.textSecondary }]}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/email-signin' as any)}>
              <Text style={[styles.signInLink, { color: tc.primary }]}>Sign In</Text>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: 120,
    paddingBottom: spacing.xl,
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
    marginBottom: spacing.xl,
  },
  nameRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  nameInputContainer: {
    flex: 1,
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
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  countryCodeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    height: 48,
    borderRightWidth: 1,
    gap: 4,
  },
  countryCodeText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
  phoneInput: {
    flex: 1,
    height: 48,
    paddingHorizontal: spacing.md,
    fontSize: typography.fontSize.base,
  },
  errorText: {
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.md,
  },
  verifyDescription: {
    fontSize: typography.fontSize.base,
    marginBottom: spacing.xl,
  },
  signUpButton: {
    height: 52,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  signUpButtonText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
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
  signInContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  signInText: {
    fontSize: typography.fontSize.base,
  },
  signInLink: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
});
