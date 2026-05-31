import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSignUp, useClerk } from '@clerk/clerk-expo';
import CloseIcon from '@/components/common/icons/CloseIcon';
import { typography, spacing, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { parseClerkError } from '@/lib/clerk/errors';

/**
 * Completes a Clerk sign-up that came out of an SSO transfer in
 * `missing_requirements` state. Reads `signUp.missingFields` at runtime and
 * renders the matching inputs. Handles any future Clerk dashboard changes
 * without code edits.
 */
export default function CompleteSignUp() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors: tc, isDark } = useTheme();
  const { signUp, setActive, isLoaded } = useSignUp();
  const { signOut } = useClerk();

  const missingFields: string[] = (signUp as any)?.missingFields ?? [];

  const [firstName, setFirstName] = useState((signUp as any)?.firstName ?? '');
  const [lastName, setLastName] = useState((signUp as any)?.lastName ?? '');
  const [emailAddress, setEmailAddress] = useState((signUp as any)?.emailAddress ?? '');
  const [phoneNumber, setPhoneNumber] = useState((signUp as any)?.phoneNumber ?? '');
  const [username, setUsername] = useState((signUp as any)?.username ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const needs = useMemo(() => ({
    firstName: missingFields.includes('first_name'),
    lastName: missingFields.includes('last_name'),
    email: missingFields.includes('email_address'),
    phone: missingFields.includes('phone_number'),
    username: missingFields.includes('username'),
  }), [missingFields]);

  const canSubmit = useMemo(() => {
    if (needs.firstName && !firstName.trim()) return false;
    if (needs.lastName && !lastName.trim()) return false;
    if (needs.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(emailAddress.trim())) return false;
    if (needs.phone && phoneNumber.replace(/[\s\-()]/g, '').length < 7) return false;
    if (needs.username && username.trim().length < 4) return false;
    return true;
  }, [needs, firstName, lastName, emailAddress, phoneNumber, username]);

  const handleCancel = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Clear the pending sign-up so the user isn't trapped in it
    try { await signOut(); } catch { /* ignore */ }
    router.replace('/(auth)/landing');
  };

  const handleSubmit = async () => {
    if (!isLoaded || !signUp || !canSubmit) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsSubmitting(true);
    setError('');

    try {
      const updates: Record<string, string> = {};
      if (needs.firstName) updates.firstName = firstName.trim();
      if (needs.lastName) updates.lastName = lastName.trim();
      if (needs.email) updates.emailAddress = emailAddress.trim();
      if (needs.phone) {
        const p = phoneNumber.trim();
        updates.phoneNumber = p.startsWith('+') ? p : `+${p.replace(/[^\d]/g, '')}`;
      }
      if (needs.username) updates.username = username.trim();

      const updated = await signUp.update(updates);

      if (updated.status === 'complete' && updated.createdSessionId) {
        await setActive({ session: updated.createdSessionId });
        router.replace('/');
        return;
      }

      // Still not complete — verification may be required for email/phone
      if ((updated as any).unverifiedFields?.includes('email_address')) {
        await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
        router.replace({ pathname: '/(auth)/verify-otp', params: { mode: 'signup-email' } });
        return;
      }
      if ((updated as any).unverifiedFields?.includes('phone_number')) {
        await signUp.preparePhoneNumberVerification({ strategy: 'phone_code' });
        router.replace({ pathname: '/(auth)/verify-otp', params: { mode: 'signup-phone', phone: updates.phoneNumber } });
        return;
      }

      setError('Sign up could not be completed. Please try again.');
    } catch (err) {
      const parsed = parseClerkError(err);
      if (__DEV__) console.warn('[CompleteSignUp] Error:', parsed);
      setError(parsed.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // If there's no pending sign-up we shouldn't be here
  if (isLoaded && !signUp) {
    router.replace('/(auth)/landing');
    return null;
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: tc.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <TouchableOpacity
        style={[styles.closeButton, { top: insets.top + 10 }]}
        onPress={handleCancel}
        accessibilityRole="button"
        accessibilityLabel="Cancel and go back"
      >
        <CloseIcon size={24} color={tc.textPrimary} />
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.content, { paddingTop: insets.top + 60 }]}>
          <Text style={[styles.title, { color: tc.textPrimary }]}>Just a few more details</Text>
          <Text style={[styles.subtitle, { color: tc.textSecondary }]}>
            Your social sign-in didn't share everything we need. Please fill these in to finish creating your account.
          </Text>

          {needs.firstName && (
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: tc.textSecondary }]}>First name</Text>
              <TextInput
                style={[styles.input, { borderColor: tc.borderMedium, color: tc.textPrimary, backgroundColor: tc.bgElevated }]}
                placeholder="Your first name"
                placeholderTextColor={tc.textTertiary}
                value={firstName}
                onChangeText={(t) => { setFirstName(t); setError(''); }}
                autoCapitalize="words"
                autoComplete="given-name"
                accessibilityLabel="First name"
              />
            </View>
          )}

          {needs.lastName && (
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: tc.textSecondary }]}>Last name</Text>
              <TextInput
                style={[styles.input, { borderColor: tc.borderMedium, color: tc.textPrimary, backgroundColor: tc.bgElevated }]}
                placeholder="Your last name"
                placeholderTextColor={tc.textTertiary}
                value={lastName}
                onChangeText={(t) => { setLastName(t); setError(''); }}
                autoCapitalize="words"
                autoComplete="family-name"
                accessibilityLabel="Last name"
              />
            </View>
          )}

          {needs.email && (
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: tc.textSecondary }]}>Email address</Text>
              <TextInput
                style={[styles.input, { borderColor: tc.borderMedium, color: tc.textPrimary, backgroundColor: tc.bgElevated }]}
                placeholder="you@example.com"
                placeholderTextColor={tc.textTertiary}
                value={emailAddress}
                onChangeText={(t) => { setEmailAddress(t); setError(''); }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                accessibilityLabel="Email address"
              />
            </View>
          )}

          {needs.phone && (
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: tc.textSecondary }]}>Phone number</Text>
              <TextInput
                style={[styles.input, { borderColor: tc.borderMedium, color: tc.textPrimary, backgroundColor: tc.bgElevated }]}
                placeholder="+1 555 123 4567"
                placeholderTextColor={tc.textTertiary}
                value={phoneNumber}
                onChangeText={(t) => { setPhoneNumber(t); setError(''); }}
                keyboardType="phone-pad"
                autoComplete="tel"
                accessibilityLabel="Phone number"
              />
            </View>
          )}

          {needs.username && (
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: tc.textSecondary }]}>Username</Text>
              <TextInput
                style={[styles.input, { borderColor: tc.borderMedium, color: tc.textPrimary, backgroundColor: tc.bgElevated }]}
                placeholder="Pick a username"
                placeholderTextColor={tc.textTertiary}
                value={username}
                onChangeText={(t) => { setUsername(t); setError(''); }}
                autoCapitalize="none"
                autoCorrect={false}
                accessibilityLabel="Username"
              />
            </View>
          )}

          {missingFields.length === 0 && (
            <Text style={[styles.subtitle, { color: tc.textSecondary }]}>
              Almost done — tap Continue to finish.
            </Text>
          )}

          {error ? <Text style={[styles.errorText, { color: tc.error }]}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: tc.primary }, (!canSubmit || isSubmitting) && { opacity: 0.5 }]}
            onPress={handleSubmit}
            disabled={!canSubmit || isSubmitting}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Continue"
          >
            {isSubmitting ? (
              <ActivityIndicator color={tc.white} />
            ) : (
              <Text style={[styles.primaryButtonText, { color: tc.white }]}>Continue</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancel}
            accessibilityRole="button"
            accessibilityLabel="Cancel and start over"
          >
            <Text style={[styles.cancelText, { color: tc.textTertiary }]}>Cancel and start over</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  closeButton: {
    position: 'absolute',
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
    paddingBottom: spacing.xl,
  },
  title: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    lineHeight: typography.fontSize.base * 1.5,
    marginBottom: spacing.xl,
  },
  inputContainer: { marginBottom: spacing.md },
  inputLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    marginBottom: spacing.xs,
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    fontSize: typography.fontSize.base,
  },
  errorText: {
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.md,
  },
  primaryButton: {
    height: 52,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  primaryButtonText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
  },
  cancelButton: {
    alignItems: 'center',
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  cancelText: {
    fontSize: typography.fontSize.sm,
    textDecorationLine: 'underline',
  },
});
