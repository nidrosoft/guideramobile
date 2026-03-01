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
  ArrowLeft,
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
    
    setIsSubmitting(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    // Simulate API call
    setTimeout(() => {
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
    }, 1000);
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
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <ArrowLeft size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{getTitle()}</Text>
        <View style={{ width: 40 }} />
      </View>
      
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Flag size={24} color={colors.warning} />
          <View style={styles.infoBannerContent}>
            <Text style={styles.infoBannerTitle}>Help us understand the issue</Text>
            <Text style={styles.infoBannerText}>
              Your report is anonymous. The reported {type || 'content'} won't know who reported them.
            </Text>
          </View>
        </View>
        
        {/* Reasons */}
        <Text style={styles.sectionTitle}>What's the issue?</Text>
        
        {REPORT_REASONS.map(reason => {
          const Icon = reason.icon;
          const isSelected = selectedReason === reason.id;
          
          return (
            <TouchableOpacity
              key={reason.id}
              style={[styles.reasonCard, isSelected && styles.reasonCardSelected]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedReason(reason.id);
              }}
            >
              <View style={[styles.reasonIcon, isSelected && styles.reasonIconSelected]}>
                <Icon size={20} color={isSelected ? colors.white : colors.bgElevated0} />
              </View>
              <View style={styles.reasonContent}>
                <Text style={[styles.reasonLabel, isSelected && styles.reasonLabelSelected]}>
                  {reason.label}
                </Text>
                <Text style={styles.reasonDescription}>{reason.description}</Text>
              </View>
              {isSelected && (
                <TickCircle size={24} color={colors.error} variant="Bold" />
              )}
            </TouchableOpacity>
          );
        })}
        
        {/* Additional Info */}
        <Text style={styles.sectionTitle}>Additional details (optional)</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Provide any additional context that might help us understand the issue..."
          placeholderTextColor={colors.gray400}
          value={additionalInfo}
          onChangeText={setAdditionalInfo}
          multiline
          numberOfLines={4}
          maxLength={500}
          textAlignVertical="top"
        />
        <Text style={styles.charCount}>{additionalInfo.length}/500</Text>
        
        {/* Block Option (for users) */}
        {type === 'user' && (
          <TouchableOpacity
            style={styles.blockOption}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setBlockUser(!blockUser);
            }}
          >
            <View style={[styles.checkbox, blockUser && styles.checkboxChecked]}>
              {blockUser && <TickCircle size={16} color={colors.white} variant="Bold" />}
            </View>
            <View style={styles.blockOptionContent}>
              <Text style={styles.blockOptionTitle}>Also block this user</Text>
              <Text style={styles.blockOptionDescription}>
                They won't be able to message you or see your profile
              </Text>
            </View>
          </TouchableOpacity>
        )}
        
        <View style={{ height: 100 }} />
      </ScrollView>
      
      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom || spacing.md }]}>
        <TouchableOpacity
          style={[styles.submitButton, (!selectedReason || isSubmitting) && styles.submitButtonDisabled]}
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
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
  },
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: colors.warning + '15',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  infoBannerContent: {
    flex: 1,
  },
  infoBannerTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.warning,
  },
  infoBannerText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  reasonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    padding: spacing.md,
    borderRadius: 20,
    marginBottom: spacing.sm,
    borderWidth: 2,
    borderColor: colors.borderSubtle,
  },
  reasonCardSelected: {
    borderColor: colors.error,
    backgroundColor: colors.error + '05',
  },
  reasonIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.borderSubtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reasonIconSelected: {
    backgroundColor: colors.error,
  },
  reasonContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  reasonLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  reasonLabelSelected: {
    color: colors.error,
  },
  reasonDescription: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  textArea: {
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    height: 120,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  charCount: {
    fontSize: typography.fontSize.xs,
    color: colors.gray400,
    textAlign: 'right',
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
  },
  blockOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    padding: spacing.md,
    borderRadius: 20,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.textTertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.error,
    borderColor: colors.error,
  },
  blockOptionContent: {
    flex: 1,
  },
  blockOptionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  blockOptionDescription: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  footer: {
    padding: spacing.lg,
    backgroundColor: colors.bgElevated,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  submitButton: {
    backgroundColor: colors.error,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
});
