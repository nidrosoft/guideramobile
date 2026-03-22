/**
 * REPORT SCREEN
 * 
 * Report users, groups, or content for moderation.
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
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft2,
  Flag,
  Warning2,
  Profile2User,
  MessageRemove,
  Danger,
  ShieldCross,
  TickCircle,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, typography, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { supabase } from '@/lib/supabase/client';

type ReportType = 'user' | 'group' | 'message' | 'event';

interface ReportReason {
  id: string;
  label: string;
  description: string;
  icon: any;
}

const REPORT_REASONS: ReportReason[] = [
  {
    id: 'spam',
    label: 'Spam or Scam',
    description: 'Unwanted commercial content or fraudulent activity',
    icon: MessageRemove,
  },
  {
    id: 'harassment',
    label: 'Harassment or Bullying',
    description: 'Threatening, intimidating, or abusive behavior',
    icon: Warning2,
  },
  {
    id: 'hate',
    label: 'Hate Speech',
    description: 'Content promoting hatred against protected groups',
    icon: Danger,
  },
  {
    id: 'inappropriate',
    label: 'Inappropriate Content',
    description: 'Nudity, violence, or other unsuitable material',
    icon: ShieldCross,
  },
  {
    id: 'impersonation',
    label: 'Impersonation',
    description: 'Pretending to be someone else',
    icon: Profile2User,
  },
  {
    id: 'other',
    label: 'Other',
    description: 'Something else not listed above',
    icon: Flag,
  },
];

export default function ReportScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors: tc, isDark } = useTheme();
  const { profile } = useAuth();
  const { showError } = useToast();
  const { type, id } = useLocalSearchParams<{ type: ReportType; id: string }>();
  
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [blockUser, setBlockUser] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };
  
  const handleSubmit = async () => {
    if (!selectedReason) {
      Alert.alert('Required', 'Please select a reason for your report');
      return;
    }
    if (!profile?.id) return;
    
    setIsSubmitting(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    try {
      // Map UI type to content_type column values
      const contentTypeMap: Record<string, string> = {
        user: 'profile',
        group: 'group',
        message: 'message',
        event: 'event',
        post: 'message',
      };

      await supabase.from('content_reports').insert({
        reporter_id: profile.id,
        content_type: contentTypeMap[type || 'message'] || 'message',
        content_id: id,
        report_type: selectedReason,
        description: additionalInfo.trim() || null,
        status: 'pending',
      });

      // Optionally block the user
      if (blockUser && type === 'user' && id) {
        try {
          await supabase.from('user_blocks').insert({
            blocker_id: profile.id,
            blocked_id: id,
          });
        } catch { /* ignore block errors */ }
      }

      setIsSubmitting(false);
      Alert.alert(
        'Report Submitted',
        'Thank you for helping keep our community safe. We\'ll review your report and take appropriate action.',
        [
          {
            text: 'Done',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (err) {
      setIsSubmitting(false);
      if (__DEV__) console.warn('Report submission error:', err);
      showError('Failed to submit report. Please try again.');
    }
  };
  
  const getTitle = () => {
    switch (type) {
      case 'user': return 'Report User';
      case 'group': return 'Report Group';
      case 'message': return 'Report Message';
      case 'event': return 'Report Event';
      default: return 'Report';
    }
  };
  
  return (
    <View style={[styles.container, { backgroundColor: tc.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top, backgroundColor: tc.bgElevated, borderBottomColor: tc.borderSubtle }]}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <ArrowLeft2 size={24} color={tc.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: tc.textPrimary }]}>{getTitle()}</Text>
        <View style={{ width: 40 }} />
      </View>
      
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Info Banner */}
        <View style={[styles.infoBanner, { backgroundColor: tc.warning + '15' }]}>
          <Flag size={24} color={tc.warning} />
          <View style={styles.infoBannerContent}>
            <Text style={[styles.infoBannerTitle, { color: tc.warning }]}>Help us understand the issue</Text>
            <Text style={[styles.infoBannerText, { color: tc.textSecondary }]}>
              Your report is anonymous. The reported {type || 'content'} won't know who reported them.
            </Text>
          </View>
        </View>
        
        {/* Reasons */}
        <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>What's the issue?</Text>
        
        {REPORT_REASONS.map(reason => {
          const Icon = reason.icon;
          const isSelected = selectedReason === reason.id;
          
          return (
            <TouchableOpacity
              key={reason.id}
              style={[
                styles.reasonCard,
                { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle },
                isSelected && { borderColor: tc.error, backgroundColor: tc.error + '05' },
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedReason(reason.id);
              }}
            >
              <View style={[
                styles.reasonIcon,
                { backgroundColor: tc.borderSubtle },
                isSelected && { backgroundColor: tc.error },
              ]}>
                <Icon size={20} color={isSelected ? '#FFFFFF' : tc.textTertiary} />
              </View>
              <View style={styles.reasonContent}>
                <Text style={[
                  styles.reasonLabel,
                  { color: tc.textPrimary },
                  isSelected && { color: tc.error },
                ]}>
                  {reason.label}
                </Text>
                <Text style={[styles.reasonDescription, { color: tc.textSecondary }]}>{reason.description}</Text>
              </View>
              {isSelected && (
                <TickCircle size={24} color={tc.error} variant="Bold" />
              )}
            </TouchableOpacity>
          );
        })}
        
        {/* Additional Info */}
        <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>Additional details (optional)</Text>
        <TextInput
          style={[styles.textArea, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle, color: tc.textPrimary }]}
          placeholder="Provide any additional context that might help us understand the issue..."
          placeholderTextColor={tc.textTertiary}
          value={additionalInfo}
          onChangeText={setAdditionalInfo}
          multiline
          numberOfLines={4}
          maxLength={500}
          textAlignVertical="top"
        />
        <Text style={[styles.charCount, { color: tc.textTertiary }]}>{additionalInfo.length}/500</Text>
        
        {/* Block Option (for users) */}
        {type === 'user' && (
          <TouchableOpacity
            style={[styles.blockOption, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setBlockUser(!blockUser);
            }}
          >
            <View style={[
              styles.checkbox,
              { borderColor: tc.textTertiary },
              blockUser && { backgroundColor: tc.error, borderColor: tc.error },
            ]}>
              {blockUser && <TickCircle size={16} color="#FFFFFF" variant="Bold" />}
            </View>
            <View style={styles.blockOptionContent}>
              <Text style={[styles.blockOptionTitle, { color: tc.textPrimary }]}>Also block this user</Text>
              <Text style={[styles.blockOptionDescription, { color: tc.textSecondary }]}>
                They won't be able to message you or see your profile
              </Text>
            </View>
          </TouchableOpacity>
        )}
        
        <View style={{ height: 100 }} />
      </ScrollView>
      
      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom || spacing.md, backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF', borderTopColor: tc.borderSubtle }]}>
        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: tc.error }, (!selectedReason || isSubmitting) && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={!selectedReason || isSubmitting}
        >
          <Text style={styles.submitButtonText}>
            {isSubmitting ? 'Submitting...' : 'Submit Report'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
  },
  infoBanner: {
    flexDirection: 'row',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  infoBannerContent: {
    flex: 1,
  },
  infoBannerTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  infoBannerText: {
    fontSize: 12,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  reasonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: 20,
    marginBottom: spacing.sm,
    borderWidth: 2,
  },
  reasonIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reasonContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  reasonLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  reasonDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  textArea: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    fontSize: 15,
    height: 120,
    borderWidth: 1,
  },
  charCount: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
  },
  blockOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: 20,
    gap: spacing.md,
    borderWidth: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  blockOptionContent: {
    flex: 1,
  },
  blockOptionTitle: {
    fontSize: 15,
    fontWeight: '500',
  },
  blockOptionDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
  },
  submitButton: {
    paddingVertical: 14,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
