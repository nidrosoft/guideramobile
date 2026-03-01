/**
 * DELETE ACCOUNT SCREEN
 * 
 * Allows users to permanently delete their account.
 * Requires typing "delete" to confirm.
 */

import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  ArrowLeft, 
  Trash,
  Warning2,
  TickCircle,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, typography, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase/client';

const CONFIRMATION_TEXT = 'delete';

export default function DeleteAccountScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors: tc } = useTheme();
  const { user, signOut } = useAuth();
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [understood, setUnderstood] = useState(false);

  const isConfirmValid = confirmText.toLowerCase() === CONFIRMATION_TEXT;

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleDeleteAccount = async () => {
    if (!isConfirmValid || !understood) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    
    Alert.alert(
      'Final Confirmation',
      'This action cannot be undone. Your account and all associated data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Forever',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              // Delete user data from database
              if (user?.id) {
                // Delete profile and related data (cascade should handle most)
                await supabase.from('profiles').delete().eq('id', user.id);
                
                // Delete auth user (this will sign them out)
                const { error } = await supabase.auth.admin.deleteUser(user.id);
                
                if (error) {
                  // If admin delete fails, try regular signout and mark for deletion
                  await supabase.from('account_deletion_requests').insert({
                    user_id: user.id,
                    requested_at: new Date().toISOString(),
                    status: 'pending',
                  });
                }
              }
              
              // Sign out
              await signOut();
              
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              
              // Navigate to landing
              router.replace('/(auth)/landing' as any);
            } catch (error) {
              console.error('Error deleting account:', error);
              Alert.alert(
                'Error',
                'Failed to delete account. Please contact support at support@guidera.app'
              );
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: tc.background }]}>
      <StatusBar style={tc.textPrimary === colors.textPrimary ? "light" : "dark"} />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ArrowLeft size={24} color={tc.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Delete Account</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + spacing.xl }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Warning Icon */}
        <View style={styles.warningSection}>
          <View style={styles.warningIcon}>
            <Warning2 size={48} color={colors.error} variant="Bold" />
          </View>
          <Text style={styles.warningTitle}>Delete Your Account?</Text>
          <Text style={styles.warningText}>
            This action is permanent and cannot be undone. All your data will be permanently removed.
          </Text>
        </View>

        {/* What will be deleted */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>What will be deleted:</Text>
          <View style={styles.infoList}>
            <Text style={styles.infoItem}>• Your profile and personal information</Text>
            <Text style={styles.infoItem}>• All your trips and itineraries</Text>
            <Text style={styles.infoItem}>• Your saved items and collections</Text>
            <Text style={styles.infoItem}>• Community posts, reviews, and comments</Text>
            <Text style={styles.infoItem}>• Booking history and preferences</Text>
            <Text style={styles.infoItem}>• All connected accounts and data</Text>
          </View>
        </View>

        {/* What will NOT be deleted */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>What will NOT be deleted:</Text>
          <View style={styles.infoList}>
            <Text style={styles.infoItem}>• Active bookings (contact providers directly)</Text>
            <Text style={styles.infoItem}>• Transaction records (required by law)</Text>
          </View>
        </View>

        {/* Understand checkbox */}
        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setUnderstood(!understood);
          }}
          activeOpacity={0.7}
        >
          <View style={[styles.checkbox, understood && styles.checkboxChecked]}>
            {understood && <TickCircle size={20} color={colors.white} variant="Bold" />}
          </View>
          <Text style={styles.checkboxText}>
            I understand that this action is permanent and all my data will be deleted.
          </Text>
        </TouchableOpacity>

        {/* Confirmation Input */}
        <View style={styles.confirmSection}>
          <Text style={styles.confirmLabel}>
            Type <Text style={styles.confirmHighlight}>delete</Text> to confirm:
          </Text>
          <TextInput
            style={[
              styles.confirmInput,
              isConfirmValid && styles.confirmInputValid,
            ]}
            placeholder="Type 'delete' here"
            placeholderTextColor={colors.gray400}
            value={confirmText}
            onChangeText={setConfirmText}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* Delete Button */}
        <TouchableOpacity
          style={[
            styles.deleteButton,
            (!isConfirmValid || !understood) && styles.deleteButtonDisabled,
          ]}
          onPress={handleDeleteAccount}
          disabled={!isConfirmValid || !understood || isDeleting}
          activeOpacity={0.8}
        >
          {isDeleting ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <>
              <Trash size={20} color={colors.white} variant="Bold" />
              <Text style={styles.deleteButtonText}>Delete My Account</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Cancel Link */}
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={handleBack}
          activeOpacity={0.7}
        >
          <Text style={styles.cancelButtonText}>Cancel and keep my account</Text>
        </TouchableOpacity>
      </ScrollView>
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
    color: colors.error,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
  },
  warningSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  warningIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.error + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  warningTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.error,
    marginBottom: spacing.sm,
  },
  warningText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  infoSection: {
    backgroundColor: colors.gray50,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  infoTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  infoList: {
    gap: spacing.xs,
  },
  infoItem: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
    marginTop: spacing.sm,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: borderRadius.sm,
    borderWidth: 2,
    borderColor: colors.gray300,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  checkboxChecked: {
    backgroundColor: colors.error,
    borderColor: colors.error,
  },
  checkboxText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  confirmSection: {
    marginBottom: spacing.lg,
  },
  confirmLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  confirmHighlight: {
    fontWeight: typography.fontWeight.bold,
    color: colors.error,
  },
  confirmInput: {
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.borderSubtle,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
  confirmInputValid: {
    borderColor: colors.error,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.error,
    borderRadius: borderRadius.md,
    height: 52,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  deleteButtonDisabled: {
    backgroundColor: colors.gray300,
  },
  deleteButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  cancelButtonText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: typography.fontWeight.medium,
  },
});
