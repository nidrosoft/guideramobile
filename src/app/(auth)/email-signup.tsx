import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import * as Haptics from 'expo-haptics';
import { Sms } from 'iconsax-react-native';
import CloseIcon from '@/components/common/icons/CloseIcon';
import { colors, typography, spacing, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { useSignUp } from '@clerk/clerk-expo';
import CountryPicker, { Country, CountryCode } from 'react-native-country-picker-modal';

export default function EmailSignUp() {
  const router = useRouter();
  const { isLoaded, signUp, setActive } = useSignUp();
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
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <StatusBar style="dark" />
        
        <TouchableOpacity style={styles.closeButton} onPress={handleBack}>
          <CloseIcon size={24} color={colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Sms size={32} color={colors.textPrimary} variant="Outline" />
          </View>

          <Text style={styles.title}>Verify your email</Text>
          <Text style={styles.verifyDescription}>
            A verification code has been sent to {email}
          </Text>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Verification Code</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter 6-digit code"
              placeholderTextColor={colors.textTertiary}
              keyboardType="number-pad"
              value={code}
              onChangeText={(text) => {
                setCode(text);
                setError('');
              }}
              autoFocus
            />
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.signUpButton, (!code || isLoading) && styles.signUpButtonDisabled]}
            onPress={handleVerifyEmail}
            disabled={!code || isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.signUpButtonText}>Verify</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="dark" />
      
      <TouchableOpacity style={styles.closeButton} onPress={handleBack}>
        <CloseIcon size={24} color={colors.textPrimary} />
      </TouchableOpacity>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Sms size={32} color={colors.textPrimary} variant="Outline" />
          </View>

          <Text style={styles.title}>Create your account</Text>

          <View style={styles.nameRow}>
            <View style={styles.nameInputContainer}>
              <Text style={styles.inputLabel}>First Name</Text>
              <TextInput
                style={styles.input}
                placeholder="John"
                placeholderTextColor={colors.textTertiary}
                value={firstName}
                onChangeText={(text) => {
                  setFirstName(text);
                  setError('');
                }}
                autoCapitalize="words"
              />
            </View>
            <View style={styles.nameInputContainer}>
              <Text style={styles.inputLabel}>Last Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Doe"
                placeholderTextColor={colors.textTertiary}
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
            <Text style={styles.inputLabel}>Username</Text>
            <TextInput
              style={styles.input}
              placeholder="johndoe"
              placeholderTextColor={colors.textTertiary}
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
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor={colors.textTertiary}
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
            <Text style={styles.inputLabel}>Phone Number</Text>
            <View style={styles.phoneInputRow}>
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
              </TouchableOpacity>
              <TextInput
                style={styles.phoneInput}
                placeholder="Phone number"
                placeholderTextColor={colors.textTertiary}
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
            <Text style={styles.inputLabel}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="At least 6 characters"
              placeholderTextColor={colors.textTertiary}
              secureTextEntry
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setError('');
              }}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Confirm Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Re-enter your password"
              placeholderTextColor={colors.textTertiary}
              secureTextEntry
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                setError('');
              }}
            />
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.signUpButton, (!isFormValid || isLoading) && styles.signUpButtonDisabled]}
            onPress={handleSignUp}
            disabled={!isFormValid || isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.signUpButtonText}>Create Account</Text>
            )}
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={styles.googleButton}
            onPress={() => console.log('Google signup')}
            activeOpacity={0.8}
          >
            <Text style={styles.googleButtonText}>Sign up with Google</Text>
          </TouchableOpacity>

          <View style={styles.signInContainer}>
            <Text style={styles.signInText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/email-signin' as any)}>
              <Text style={styles.signInLink}>Sign In</Text>
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
    borderRadius: 32,
    borderWidth: 2,
    borderColor: colors.textPrimary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
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
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    backgroundColor: colors.bgElevated,
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: borderRadius.md,
    backgroundColor: colors.bgElevated,
    overflow: 'hidden',
  },
  countryCodeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    height: 48,
    borderRightWidth: 1,
    borderRightColor: colors.gray300,
    gap: 4,
  },
  countryCodeText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  phoneInput: {
    flex: 1,
    height: 48,
    paddingHorizontal: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
  errorText: {
    fontSize: typography.fontSize.sm,
    color: '#EF4444',
    marginBottom: spacing.md,
  },
  verifyDescription: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  signUpButton: {
    height: 52,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  signUpButtonDisabled: {
    backgroundColor: colors.gray300,
  },
  signUpButtonText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
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
  signInContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  signInText: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
  },
  signInLink: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
  },
});
