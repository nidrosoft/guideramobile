/**
 * INVITE TRAVELERS BOTTOM SHEET
 * 
 * Allows users to invite others to join their trip via email.
 * Personalized invitation with sender name + trip details.
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
  ActivityIndicator,
} from 'react-native';
import { Add, CloseCircle, Sms, TickCircle, User } from 'iconsax-react-native';
import { spacing, typography } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { invitationService } from '@/services/invitation.service';
import * as Haptics from 'expo-haptics';

interface InviteTravelersBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  tripId: string;
  tripName: string;
  tripDestination: string;
  onInvite?: (emails: string[]) => void;
}

export default function InviteTravelersBottomSheet({
  visible,
  onClose,
  tripId,
  tripName,
  tripDestination,
  onInvite,
}: InviteTravelersBottomSheetProps) {
  const { colors: tc } = useTheme();
  const { profile } = useAuth();
  const senderName = profile ? [profile.first_name, profile.last_name].filter(Boolean).join(' ') || 'Someone' : 'Someone';

  const MAX_INVITEES = 5;
  const { showSuccess, showError } = useToast();
  const [inviteeName, setInviteeName] = useState('');
  const [emails, setEmails] = useState<string[]>(['']);
  const [currentEmail, setCurrentEmail] = useState('');
  const [sending, setSending] = useState(false);

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

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSendInvites = async () => {
    const validEmails = emails.filter(e => e.trim() && isValidEmail(e.trim()));
    if (validEmails.length === 0) return;

    setSending(true);
    try {
      const invitees = validEmails.map(email => ({
        email: email.trim(),
        name: inviteeName.trim() || undefined,
      }));

      const result = await invitationService.sendInvites(tripId, invitees);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showSuccess(`Invitation${result.sent > 1 ? 's' : ''} sent to ${result.sent} traveler${result.sent > 1 ? 's' : ''}!`);
      onInvite?.(validEmails);

      // Reset form
      setEmails(['']);
      setCurrentEmail('');
      setInviteeName('');
      onClose();
    } catch (err: any) {
      console.warn('[Invite] Failed to send:', err);
      showError(err.message || 'Failed to send invitations. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const validEmailCount = emails.filter(e => e.trim() && isValidEmail(e.trim())).length;
  const canSend = validEmailCount > 0;
  const displayInviteeName = inviteeName.trim() || 'your friend';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={onClose}>
        <View style={[s.sheet, { backgroundColor: tc.bgPrimary }]} onStartShouldSetResponder={() => true}>
          {/* Handle */}
          <View style={s.handleRow}>
            <View style={[s.handle, { backgroundColor: tc.borderSubtle }]} />
          </View>

          {/* Header */}
          <View style={[s.header, { borderBottomColor: tc.borderSubtle }]}>
            <View style={{ flex: 1 }}>
              <Text style={[s.title, { color: tc.textPrimary }]}>Invite Travelers</Text>
              <Text style={[s.subtitle, { color: tc.textSecondary }]}>
                Invite friends to join your trip to {tripDestination}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={{ padding: spacing.xs }}>
              <CloseCircle size={28} color={tc.textTertiary} variant="Bold" />
            </TouchableOpacity>
          </View>

          <ScrollView style={s.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* Info Card */}
            <View style={[s.infoCard, { backgroundColor: tc.primary + '10' }]}>
              <Sms size={22} color={tc.primary} variant="Bold" />
              <View style={{ flex: 1, marginLeft: spacing.sm }}>
                <Text style={[s.infoCardTitle, { color: tc.textPrimary }]}>Email Invitation</Text>
                <Text style={[s.infoCardDesc, { color: tc.textSecondary }]}>
                  They'll receive an email with a link to view and join the trip.
                </Text>
              </View>
            </View>

            {/* Invitee Name */}
            <View style={s.fieldGroup}>
              <Text style={[s.label, { color: tc.textPrimary }]}>Invitee Name</Text>
              <View style={[s.inputWrap, { backgroundColor: tc.bgSunken || tc.bgElevated, borderColor: tc.borderSubtle }]}>
                <User size={18} color={tc.textTertiary} variant="Linear" />
                <TextInput
                  style={[s.input, { color: tc.textPrimary }]}
                  placeholder="John Doe"
                  placeholderTextColor={tc.textTertiary}
                  value={inviteeName}
                  onChangeText={setInviteeName}
                  autoCapitalize="words"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Email Inputs */}
            <View style={s.fieldGroup}>
              <Text style={[s.label, { color: tc.textPrimary }]}>Email Address</Text>
              {emails.map((email, index) => (
                <View key={index} style={s.emailRow}>
                  <View style={[s.inputWrap, { flex: 1, backgroundColor: tc.bgSunken || tc.bgElevated, borderColor: tc.borderSubtle }]}>
                    <TextInput
                      style={[s.input, { color: tc.textPrimary }]}
                      placeholder="traveler@example.com"
                      placeholderTextColor={tc.textTertiary}
                      value={email}
                      onChangeText={(t) => handleEmailChange(t, index)}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      returnKeyType={index === emails.length - 1 ? 'done' : 'next'}
                      onSubmitEditing={() => {
                        if (index === emails.length - 1 && email.trim() && isValidEmail(email.trim())) handleAddEmail();
                      }}
                    />
                    {email.trim() && isValidEmail(email.trim()) && (
                      <TickCircle size={18} color={tc.success} variant="Bold" />
                    )}
                  </View>
                  {emails.length > 1 && (
                    <TouchableOpacity onPress={() => handleRemoveEmail(index)} style={{ padding: 4 }}>
                      <CloseCircle size={22} color={tc.textTertiary} variant="Bold" />
                    </TouchableOpacity>
                  )}
                </View>
              ))}

              {currentEmail.trim() && isValidEmail(currentEmail.trim()) && emails.length < MAX_INVITEES && (
                <TouchableOpacity style={[s.addBtn, { borderColor: tc.primary }]} onPress={handleAddEmail}>
                  <Add size={18} color={tc.primary} variant="Bold" />
                  <Text style={[s.addBtnText, { color: tc.primary }]}>Add another email ({emails.length}/{MAX_INVITEES})</Text>
                </TouchableOpacity>
              )}
              {emails.length >= MAX_INVITEES && (
                <Text style={[s.limitText, { color: tc.textTertiary }]}>Maximum {MAX_INVITEES} invitees per trip</Text>
              )}
            </View>

            {/* Invitation Preview */}
            <View style={s.fieldGroup}>
              <Text style={[s.label, { color: tc.textPrimary }]}>Invitation Preview</Text>
              <View style={[s.previewCard, { backgroundColor: tc.bgSunken || tc.bgElevated, borderColor: tc.borderSubtle }]}>
                <Text style={[s.previewTitle, { color: tc.textPrimary }]}>
                  Hey {displayInviteeName}! 👋
                </Text>
                <Text style={[s.previewMsg, { color: tc.textSecondary }]}>
                  {senderName} is inviting you to join their trip to {tripDestination}. 
                  Accept the invitation to view trip details, collaborate on the itinerary, 
                  and plan together.
                </Text>
                <View style={[s.previewAcceptBtn, { backgroundColor: tc.primary }]}>
                  <Text style={s.previewAcceptText}>Accept Invitation</Text>
                </View>
              </View>
            </View>

            {/* Info Note */}
            <View style={[s.noteBox, { backgroundColor: tc.warning + '10' }]}>
              <Text style={[s.noteText, { color: tc.textSecondary }]}>
                💡 Invitees will be able to view trip details, add to the itinerary, and collaborate on planning once they accept.
              </Text>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={[s.footer, { borderTopColor: tc.borderSubtle }]}>
            <TouchableOpacity style={[s.cancelBtn, { borderColor: tc.borderSubtle }]} onPress={onClose}>
              <Text style={[s.cancelText, { color: tc.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.sendBtn, { backgroundColor: tc.primary }, !canSend && { backgroundColor: tc.textTertiary + '40' }]}
              onPress={handleSendInvites}
              disabled={!canSend}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Sms size={18} color="#FFFFFF" variant="Bold" />
              )}
              <Text style={s.sendText}>{sending ? 'Sending...' : `Send Invite${validEmailCount > 1 ? `s (${validEmailCount})` : ''}`}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: spacing.lg,
    paddingBottom: 34,
    maxHeight: '90%',
  },
  handleRow: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 4,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingBottom: spacing.md,
    marginBottom: spacing.sm,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: '700',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
  },
  content: {
    flex: 1,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: 14,
    marginBottom: spacing.lg,
  },
  infoCardTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    marginBottom: 2,
  },
  infoCardDesc: {
    fontSize: typography.fontSize.xs,
    lineHeight: 18,
  },
  fieldGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    borderWidth: 1,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: typography.fontSize.base,
  },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  addBtnText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
  },
  limitText: {
    fontSize: typography.fontSize.xs,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  previewCard: {
    padding: spacing.lg,
    borderRadius: 14,
    borderWidth: 1,
  },
  previewTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  previewMsg: {
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  previewAcceptBtn: {
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  previewAcceptText: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  noteBox: {
    padding: spacing.md,
    borderRadius: 14,
    marginBottom: spacing.lg,
  },
  noteText: {
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
  },
  sendBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: 14,
    borderRadius: 14,
  },
  sendText: {
    fontSize: typography.fontSize.base,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
