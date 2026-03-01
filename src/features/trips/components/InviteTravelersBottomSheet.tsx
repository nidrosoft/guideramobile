/**
 * INVITE TRAVELERS BOTTOM SHEET
 * 
 * Allows users to invite others to join their trip via email.
 * Supports inviting multiple travelers at once.
 * 
 * AI TODO:
 * - Send email invitations with trip details
 * - Generate unique invitation links
 * - Track invitation status (pending, accepted, declined)
 * - Send push notifications when invitation is accepted
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
} from 'react-native';
import { Add, CloseCircle, Sms, TickCircle } from 'iconsax-react-native';
import { colors, spacing, typography, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import * as Haptics from 'expo-haptics';

interface InviteTravelersBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  tripName: string;
  tripDestination: string;
  onInvite: (emails: string[]) => void;
}

export default function InviteTravelersBottomSheet({
  visible,
  onClose,
  tripName,
  tripDestination,
  onInvite,
}: InviteTravelersBottomSheetProps) {
  const { colors: tc } = useTheme();
  const [emails, setEmails] = useState<string[]>(['']);
  const [currentEmail, setCurrentEmail] = useState('');

  const handleAddEmail = () => {
    if (currentEmail.trim() && isValidEmail(currentEmail.trim())) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setEmails([...emails, '']);
      setCurrentEmail('');
    }
  };

  const handleRemoveEmail = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newEmails = emails.filter((_, i) => i !== index);
    setEmails(newEmails.length === 0 ? [''] : newEmails);
  };

  const handleEmailChange = (text: string, index: number) => {
    const newEmails = [...emails];
    newEmails[index] = text;
    setEmails(newEmails);
    if (index === emails.length - 1) {
      setCurrentEmail(text);
    }
  };

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSendInvites = () => {
    const validEmails = emails.filter(email => email.trim() && isValidEmail(email.trim()));
    
    if (validEmails.length === 0) {
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onInvite(validEmails);
    
    // Reset form
    setEmails(['']);
    setCurrentEmail('');
    onClose();
  };

  const validEmailCount = emails.filter(email => email.trim() && isValidEmail(email.trim())).length;
  const canSend = validEmailCount > 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <TouchableOpacity 
        style={styles.overlay} 
        activeOpacity={1} 
        onPress={onClose}
      >
        <View style={styles.bottomSheet} onStartShouldSetResponder={() => true}>
          {/* Handle Bar */}
          <View style={styles.handleBar} />

          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Invite Travelers</Text>
              <Text style={styles.subtitle}>
                Invite friends to join {tripName}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <CloseCircle size={28} color={colors.gray400} variant="Bold" />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Trip Info Card */}
            <View style={styles.tripInfoCard}>
              <Sms size={24} color={colors.primary} variant="Bold" />
              <View style={styles.tripInfoText}>
                <Text style={styles.tripInfoTitle}>Email Invitation</Text>
                <Text style={styles.tripInfoDescription}>
                  Invitees will receive an email to join your trip to {tripDestination}
                </Text>
              </View>
            </View>

            {/* Email Inputs */}
            <View style={styles.emailsSection}>
              <Text style={styles.sectionLabel}>Email Addresses</Text>
              
              {emails.map((email, index) => (
                <View key={index} style={styles.emailInputContainer}>
                  <View style={styles.emailInputWrapper}>
                    <TextInput
                      style={styles.emailInput}
                      placeholder="traveler@example.com"
                      placeholderTextColor={colors.gray400}
                      value={email}
                      onChangeText={(text) => handleEmailChange(text, index)}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      returnKeyType={index === emails.length - 1 ? 'done' : 'next'}
                      onSubmitEditing={() => {
                        if (index === emails.length - 1 && email.trim() && isValidEmail(email.trim())) {
                          handleAddEmail();
                        }
                      }}
                    />
                    {email.trim() && isValidEmail(email.trim()) && (
                      <TickCircle size={20} color={colors.success} variant="Bold" />
                    )}
                  </View>
                  
                  {emails.length > 1 && (
                    <TouchableOpacity
                      onPress={() => handleRemoveEmail(index)}
                      style={styles.removeButton}
                    >
                      <CloseCircle size={24} color={colors.gray400} variant="Bold" />
                    </TouchableOpacity>
                  )}
                </View>
              ))}

              {/* Add Another Email Button */}
              {currentEmail.trim() && isValidEmail(currentEmail.trim()) && (
                <TouchableOpacity
                  style={styles.addEmailButton}
                  onPress={handleAddEmail}
                >
                  <Add size={20} color={colors.primary} variant="Bold" />
                  <Text style={styles.addEmailButtonText}>Add another email</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Preview Message */}
            <View style={styles.previewSection}>
              <Text style={styles.sectionLabel}>Invitation Preview</Text>
              <View style={styles.previewCard}>
                <Text style={styles.previewTitle}>
                  You're invited to join {tripName}!
                </Text>
                <Text style={styles.previewMessage}>
                  You've been invited to join an upcoming trip to {tripDestination}. 
                  Accept the invitation to view trip details, collaborate on planning, 
                  and stay connected with your travel companions.
                </Text>
                <View style={styles.previewButton}>
                  <Text style={styles.previewButtonText}>Accept Invitation</Text>
                </View>
              </View>
            </View>

            {/* Info Note */}
            <View style={styles.infoNote}>
              <Text style={styles.infoNoteText}>
                💡 Invitees will be able to view trip details, add to the itinerary, 
                and collaborate on planning once they accept.
              </Text>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
              onPress={handleSendInvites}
              disabled={!canSend}
            >
              <Sms size={20} color={colors.white} variant="Bold" />
              <Text style={styles.sendButtonText}>
                Send {validEmailCount > 0 ? `(${validEmailCount})` : 'Invites'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.bgModal,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing['2xl'],
    maxHeight: '90%',
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: colors.gray300,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: '700',
    color: colors.gray900,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.gray600,
  },
  closeButton: {
    padding: spacing.xs,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  tripInfoCard: {
    flexDirection: 'row',
    backgroundColor: `${colors.primary}10`,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
  },
  tripInfoText: {
    flex: 1,
    marginLeft: spacing.md,
  },
  tripInfoTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.gray900,
    marginBottom: spacing.xs,
  },
  tripInfoDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.gray600,
    lineHeight: 20,
  },
  emailsSection: {
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.gray700,
    marginBottom: spacing.md,
  },
  emailInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  emailInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray50,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  emailInput: {
    flex: 1,
    fontSize: typography.fontSize.base,
    color: colors.gray900,
    paddingVertical: spacing.sm,
  },
  removeButton: {
    padding: spacing.xs,
  },
  addEmailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderStyle: 'dashed',
  },
  addEmailButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.primary,
  },
  previewSection: {
    marginBottom: spacing.lg,
  },
  previewCard: {
    backgroundColor: colors.gray50,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  previewTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    color: colors.gray900,
    marginBottom: spacing.md,
  },
  previewMessage: {
    fontSize: typography.fontSize.sm,
    color: colors.gray700,
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  previewButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  previewButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.white,
  },
  infoNote: {
    backgroundColor: `${colors.warning}10`,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
  },
  infoNoteText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray700,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
    borderColor: colors.gray300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.gray700,
  },
  sendButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
  },
  sendButtonDisabled: {
    backgroundColor: colors.gray300,
  },
  sendButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: '700',
    color: colors.white,
  },
});
