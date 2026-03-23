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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  ArrowLeft2, 
  Trash,
  Warning2,
  TickCircle,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, typography, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useUser } from '@clerk/clerk-expo';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase/client';

const CONFIRMATION_TEXT = 'DELETE';

export default function DeleteAccountScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors: tc, isDark } = useTheme();
  const { t } = useTranslation();
  const { user, profile, signOut } = useAuth();
  const { user: clerkUser } = useUser();
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [understood, setUnderstood] = useState(false);

  const isConfirmValid = confirmText === CONFIRMATION_TEXT;

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleDeleteAccount = async () => {
    if (!understood) return;

    // If the user typed "delete" in lowercase, show an alert
    if (confirmText.toLowerCase() === 'delete' && confirmText !== CONFIRMATION_TEXT) {
      Alert.alert(
        'Uppercase Required',
        'Please type DELETE in uppercase letters to confirm.',
      );
      return;
    }

    if (!isConfirmValid) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    
    Alert.alert(
      t('account.deleteAccount.finalConfirmation'),
      t('account.deleteAccount.cannotBeUndone'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('account.deleteAccount.deleteForever'),
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              const profileId = profile?.id;
              if (!profileId) throw new Error('Profile not found');

              // Cascade delete user data across all tables (GDPR/CCPA compliance)
              // Order matters: delete dependent data first, profile last
              const deletionTables = [
                'ai_chat_messages',
                'ai_chat_sessions',
                'user_saved_items',
                'saved_deals',
                'deal_clicks',
                'price_alerts',
                'user_interactions',
                'trip_invitations',
                'trip_activities',
                'trip_bookings',
                'trip_travelers',
                'trip_imports',
                'itinerary_activities',
                'itinerary_days',
                'packing_items',
                'packing_lists',
                'dos_donts_tips',
                'safety_profiles',
                'language_phrases',
                'language_kits',
                'document_items',
                'document_checklists',
                'compensation_claims',
                'compensation_rights_cards',
                'expenses',
                'journal_entries',
                'trips',
                'post_reactions',
                'post_comments',
                'community_posts',
                'activity_participants',
                'community_activities',
                'group_members',
                'buddy_connections',
                'user_follows',
                'event_attendees',
                'partner_applications',
                'notifications',
                'alerts',
                'user_devices',
                'user_notification_preferences',
                'travel_preferences',
              ];

              for (const table of deletionTables) {
                try {
                  await supabase.from(table).delete().eq('user_id', profileId);
                } catch {
                  // Some tables may not exist or may use different FK column — skip silently
                }
              }

              // Finally, delete the profile itself (hard delete for GDPR compliance)
              await supabase.from('profiles').delete().eq('id', profileId);

              // Delete the Clerk user so the email/phone is freed for re-registration
              try {
                await clerkUser?.delete();
              } catch (clerkErr) {
                if (__DEV__) console.warn('Clerk user deletion failed (will sign out anyway):', clerkErr);
              }

              // Sign out from Clerk
              await signOut();
              
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              
              // Navigate to landing
              router.replace('/(auth)/landing' as any);
            } catch (error) {
              if (__DEV__) console.error('Error deleting account:', error);
              Alert.alert(
                t('common.error'),
                t('account.deleteAccount.deleteFailed')
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
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: tc.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm, backgroundColor: isDark ? '#1A1A1A' : tc.white, borderBottomColor: tc.borderSubtle }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ArrowLeft2 size={24} color={tc.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: tc.error }]}>{t('account.deleteAccount.title')}</Text>
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
          <View style={[styles.warningIcon, { backgroundColor: tc.error + '15' }]}>
            <Warning2 size={48} color={tc.error} variant="Bold" />
          </View>
          <Text style={[styles.warningTitle, { color: tc.error }]}>{t('account.deleteAccount.warningTitle')}</Text>
          <Text style={[styles.warningText, { color: tc.textSecondary }]}>
            {t('account.deleteAccount.warningText')}
          </Text>
        </View>

        {/* What will be deleted */}
        <View style={[styles.infoSection, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : tc.gray50 }]}>
          <Text style={[styles.infoTitle, { color: tc.textPrimary }]}>{t('account.deleteAccount.whatDeleted')}</Text>
          <View style={styles.infoList}>
            <Text style={[styles.infoItem, { color: tc.textSecondary }]}>{t('account.deleteAccount.deleteItem1')}</Text>
            <Text style={[styles.infoItem, { color: tc.textSecondary }]}>{t('account.deleteAccount.deleteItem2')}</Text>
            <Text style={[styles.infoItem, { color: tc.textSecondary }]}>{t('account.deleteAccount.deleteItem3')}</Text>
            <Text style={[styles.infoItem, { color: tc.textSecondary }]}>{t('account.deleteAccount.deleteItem4')}</Text>
            <Text style={[styles.infoItem, { color: tc.textSecondary }]}>{t('account.deleteAccount.deleteItem5')}</Text>
            <Text style={[styles.infoItem, { color: tc.textSecondary }]}>{t('account.deleteAccount.deleteItem6')}</Text>
          </View>
        </View>

        {/* What will NOT be deleted */}
        <View style={[styles.infoSection, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : tc.gray50 }]}>
          <Text style={[styles.infoTitle, { color: tc.textPrimary }]}>{t('account.deleteAccount.whatNotDeleted')}</Text>
          <View style={styles.infoList}>
            <Text style={[styles.infoItem, { color: tc.textSecondary }]}>{t('account.deleteAccount.keepItem1')}</Text>
            <Text style={[styles.infoItem, { color: tc.textSecondary }]}>{t('account.deleteAccount.keepItem2')}</Text>
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
          <View style={[styles.checkbox, { borderColor: tc.borderSubtle }, understood && [styles.checkboxChecked, { backgroundColor: tc.error, borderColor: tc.error }]]}>
            {understood && <TickCircle size={20} color="#FFFFFF" variant="Bold" />}
          </View>
          <Text style={[styles.checkboxText, { color: tc.textSecondary }]}>
            {t('account.deleteAccount.understandPermanent')}
          </Text>
        </TouchableOpacity>

        {/* Confirmation Input */}
        <View style={styles.confirmSection}>
          <Text style={[styles.confirmLabel, { color: tc.textPrimary }]}>
            {t('account.deleteAccount.typeToConfirm')} <Text style={[styles.confirmHighlight, { color: tc.error }]}>DELETE</Text> {t('account.deleteAccount.toConfirm')}:
          </Text>
          <TextInput
            style={[
              styles.confirmInput,
              { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle, color: tc.textPrimary },
              isConfirmValid && { borderColor: tc.error },
            ]}
            placeholder="Type 'DELETE' here"
            placeholderTextColor={tc.textTertiary}
            value={confirmText}
            onChangeText={setConfirmText}
            autoCapitalize="characters"
            autoCorrect={false}
          />
        </View>

        {/* Delete Button */}
        <TouchableOpacity
          style={[
            styles.deleteButton,
            { backgroundColor: tc.error },
            (!isConfirmValid || !understood) && { backgroundColor: isDark ? '#444' : tc.gray300 },
          ]}
          onPress={handleDeleteAccount}
          disabled={!isConfirmValid || !understood || isDeleting}
          activeOpacity={0.8}
        >
          {isDeleting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Trash size={20} color="#FFFFFF" variant="Bold" />
              <Text style={styles.deleteButtonText}>{t('account.deleteAccount.deleteMyAccount')}</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Cancel Link */}
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={handleBack}
          activeOpacity={0.7}
        >
          <Text style={[styles.cancelButtonText, { color: tc.primary }]}>{t('account.deleteAccount.cancelKeep')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
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
