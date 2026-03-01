/**
 * CHANGE PASSWORD SCREEN
 * 
 * Allow users to update their password.
 */

import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  ArrowLeft, 
  Lock,
  Eye,
  EyeSlash,
  TickCircle,
  CloseCircle,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, typography, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { supabase } from '@/lib/supabase/client';

interface PasswordRequirement {
  label: string;
  test: (password: string) => boolean;
}

const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
  { label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { label: 'One uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { label: 'One lowercase letter', test: (p) => /[a-z]/.test(p) },
  { label: 'One number', test: (p) => /[0-9]/.test(p) },
  { label: 'One special character', test: (p) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
];

export default function ChangePasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors: tc } = useTheme();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ current?: string; new?: string; confirm?: string }>({});

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (!currentPassword) {
      newErrors.current = 'Current password is required';
    }

    if (!newPassword) {
      newErrors.new = 'New password is required';
    } else {
      const failedRequirements = PASSWORD_REQUIREMENTS.filter(req => !req.test(newPassword));
      if (failedRequirements.length > 0) {
        newErrors.new = 'Password does not meet requirements';
      }
    }

    if (!confirmPassword) {
      newErrors.confirm = 'Please confirm your new password';
    } else if (newPassword !== confirmPassword) {
      newErrors.confirm = 'Passwords do not match';
    }

    if (currentPassword === newPassword) {
      newErrors.new = 'New password must be different from current password';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChangePassword = async () => {
    if (!validateForm()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setIsLoading(true);
    try {
      // Update password using Supabase
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        'Password Changed',
        'Your password has been updated successfully.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error: any) {
      console.error('Error changing password:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
      if (error.message?.includes('incorrect') || error.message?.includes('Invalid')) {
        setErrors({ current: 'Current password is incorrect' });
      } else {
        Alert.alert('Error', error.message || 'Failed to change password. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = currentPassword && newPassword && confirmPassword && 
    PASSWORD_REQUIREMENTS.every(req => req.test(newPassword)) &&
    newPassword === confirmPassword;

  return (
    <View style={[styles.container, { backgroundColor: tc.background }]}>
      <StatusBar style={tc.textPrimary === colors.textPrimary ? "light" : "dark"} />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ArrowLeft size={24} color={tc.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Change Password</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          style={styles.content}
          contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + spacing.xl }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Current Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Current Password</Text>
            <View style={[styles.inputContainer, errors.current && styles.inputError]}>
              <Lock size={20} color={colors.gray400} variant="Bold" />
              <TextInput
                style={styles.input}
                value={currentPassword}
                onChangeText={(text) => {
                  setCurrentPassword(text);
                  if (errors.current) setErrors({ ...errors, current: undefined });
                }}
                placeholder="Enter current password"
                placeholderTextColor={colors.gray400}
                secureTextEntry={!showCurrentPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity onPress={() => setShowCurrentPassword(!showCurrentPassword)}>
                {showCurrentPassword ? (
                  <EyeSlash size={20} color={colors.gray400} />
                ) : (
                  <Eye size={20} color={colors.gray400} />
                )}
              </TouchableOpacity>
            </View>
            {errors.current && <Text style={styles.errorText}>{errors.current}</Text>}
          </View>

          {/* New Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>New Password</Text>
            <View style={[styles.inputContainer, errors.new && styles.inputError]}>
              <Lock size={20} color={colors.gray400} variant="Bold" />
              <TextInput
                style={styles.input}
                value={newPassword}
                onChangeText={(text) => {
                  setNewPassword(text);
                  if (errors.new) setErrors({ ...errors, new: undefined });
                }}
                placeholder="Enter new password"
                placeholderTextColor={colors.gray400}
                secureTextEntry={!showNewPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
                {showNewPassword ? (
                  <EyeSlash size={20} color={colors.gray400} />
                ) : (
                  <Eye size={20} color={colors.gray400} />
                )}
              </TouchableOpacity>
            </View>
            {errors.new && <Text style={styles.errorText}>{errors.new}</Text>}
          </View>

          {/* Password Requirements */}
          <View style={styles.requirementsCard}>
            <Text style={styles.requirementsTitle}>Password Requirements</Text>
            {PASSWORD_REQUIREMENTS.map((req, index) => {
              const isMet = req.test(newPassword);
              return (
                <View key={index} style={styles.requirementItem}>
                  {isMet ? (
                    <TickCircle size={16} color={colors.success} variant="Bold" />
                  ) : (
                    <CloseCircle size={16} color={colors.gray300} variant="Bold" />
                  )}
                  <Text style={[styles.requirementText, isMet && styles.requirementMet]}>
                    {req.label}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Confirm Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Confirm New Password</Text>
            <View style={[styles.inputContainer, errors.confirm && styles.inputError]}>
              <Lock size={20} color={colors.gray400} variant="Bold" />
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  if (errors.confirm) setErrors({ ...errors, confirm: undefined });
                }}
                placeholder="Confirm new password"
                placeholderTextColor={colors.gray400}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                {showConfirmPassword ? (
                  <EyeSlash size={20} color={colors.gray400} />
                ) : (
                  <Eye size={20} color={colors.gray400} />
                )}
              </TouchableOpacity>
            </View>
            {errors.confirm && <Text style={styles.errorText}>{errors.confirm}</Text>}
            {confirmPassword && newPassword === confirmPassword && (
              <View style={styles.matchIndicator}>
                <TickCircle size={14} color={colors.success} variant="Bold" />
                <Text style={styles.matchText}>Passwords match</Text>
              </View>
            )}
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, !isFormValid && styles.submitButtonDisabled]}
            onPress={handleChangePassword}
            disabled={!isFormValid || isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.submitButtonText}>Update Password</Text>
            )}
          </TouchableOpacity>

          {/* Forgot Password Link */}
          <TouchableOpacity 
            style={styles.forgotLink}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/(auth)/forgot-password' as any);
            }}
          >
            <Text style={styles.forgotLinkText}>Forgot your current password?</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    backgroundColor: colors.bgElevated,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  headerSpacer: {
    width: 40,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    paddingHorizontal: spacing.md,
    height: 52,
  },
  inputError: {
    borderColor: colors.error,
  },
  input: {
    flex: 1,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    marginLeft: spacing.sm,
  },
  errorText: {
    fontSize: typography.fontSize.xs,
    color: colors.error,
    marginTop: spacing.xs,
  },
  requirementsCard: {
    backgroundColor: colors.gray50,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  requirementsTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  requirementText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray400,
    marginLeft: spacing.sm,
  },
  requirementMet: {
    color: colors.success,
  },
  matchIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  matchText: {
    fontSize: typography.fontSize.xs,
    color: colors.success,
    marginLeft: 4,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  submitButtonDisabled: {
    backgroundColor: colors.gray300,
  },
  submitButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
  forgotLink: {
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  forgotLinkText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: typography.fontWeight.medium,
  },
});
