/**
 * REPORT ISSUE SCREEN
 * 
 * Easy and comprehensive issue reporting with categories and attachments.
 */

import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  ArrowLeft, 
  Warning2,
  Airplane,
  Card,
  Profile2User,
  Mobile,
  ShieldTick,
  TickCircle,
  Camera,
  Gallery,
  CloseCircle,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing, typography, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase/client';

interface IssueCategory {
  id: string;
  label: string;
  icon: any;
  description: string;
}

const ISSUE_CATEGORIES: IssueCategory[] = [
  { id: 'booking', label: 'Booking Issue', icon: Card, description: 'Problems with reservations or payments' },
  { id: 'trip', label: 'Trip Planning', icon: Airplane, description: 'Issues with itineraries or recommendations' },
  { id: 'community', label: 'Community', icon: Profile2User, description: 'Report users, content, or safety concerns' },
  { id: 'app', label: 'App Problem', icon: Mobile, description: 'Crashes, bugs, or performance issues' },
  { id: 'account', label: 'Account Issue', icon: ShieldTick, description: 'Login, security, or profile problems' },
  { id: 'other', label: 'Other', icon: Warning2, description: 'Something else not listed above' },
];


export default function ReportIssueScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors: tc, isDark } = useTheme();
  const { user, profile } = useAuth();

  const PRIORITY_LEVELS = [
    { id: 'low', label: 'Low', color: tc.success, description: 'Minor inconvenience' },
    { id: 'medium', label: 'Medium', color: tc.warning, description: 'Affects my experience' },
    { id: 'high', label: 'High', color: tc.error, description: 'Urgent - blocking issue' },
  ];

  const [step, setStep] = useState<'category' | 'details' | 'success'>('category');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [priority, setPriority] = useState<string>('medium');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [attachments, setAttachments] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step === 'details') {
      setStep('category');
    } else {
      router.back();
    }
  };

  const handleCategorySelect = (categoryId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedCategory(categoryId);
    setStep('details');
  };

  const handleAddAttachment = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    Alert.alert(
      'Add Attachment',
      'Choose how to add a screenshot or photo',
      [
        {
          text: 'Take Photo',
          onPress: async () => {
            const permission = await ImagePicker.requestCameraPermissionsAsync();
            if (permission.granted) {
              const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                quality: 0.8,
              });
              if (!result.canceled && result.assets[0]) {
                setAttachments(prev => [...prev, result.assets[0].uri]);
              }
            }
          },
        },
        {
          text: 'Choose from Library',
          onPress: async () => {
            const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (permission.granted) {
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                quality: 0.8,
                allowsMultipleSelection: true,
                selectionLimit: 3 - attachments.length,
              });
              if (!result.canceled) {
                const newUris = result.assets.map(asset => asset.uri);
                setAttachments(prev => [...prev, ...newUris].slice(0, 3));
              }
            }
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleRemoveAttachment = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert('Missing Information', 'Please provide a title and description for your issue.');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setIsSubmitting(true);

    try {
      // Create issue report in database
      const { error } = await supabase.from('issue_reports').insert({
        user_id: profile?.id,
        category: selectedCategory,
        priority: priority,
        title: title.trim(),
        description: description.trim(),
        attachments: attachments,
        status: 'open',
        device_info: {
          platform: Platform.OS,
          version: Platform.Version,
        },
        user_email: profile?.email,
      });

      if (error) throw error;

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setStep('success');
    } catch (error) {
      console.error('Error submitting issue:', error);
      Alert.alert('Error', 'Failed to submit your report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDone = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const renderCategorySelection = () => (
    <>
      <View style={styles.introSection}>
        <Text style={[styles.introTitle, { color: tc.textPrimary }]}>What's the issue about?</Text>
        <Text style={[styles.introText, { color: tc.textSecondary }]}>
          Select a category to help us route your report to the right team.
        </Text>
      </View>

      <View style={styles.categoriesSection}>
        {ISSUE_CATEGORIES.map((category) => {
          const Icon = category.icon;
          return (
            <TouchableOpacity
              key={category.id}
              style={[styles.categoryCard, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle }]}
              onPress={() => handleCategorySelect(category.id)}
              activeOpacity={0.7}
            >
              <View style={[styles.categoryIcon, { backgroundColor: tc.primary + '10' }]}>
                <Icon size={24} color={tc.primary} variant="Bold" />
              </View>
              <View style={styles.categoryContent}>
                <Text style={[styles.categoryLabel, { color: tc.textPrimary }]}>{category.label}</Text>
                <Text style={[styles.categoryDescription, { color: tc.textSecondary }]}>{category.description}</Text>
              </View>
              <ArrowLeft size={18} color={tc.textTertiary} style={{ transform: [{ rotate: '180deg' }] }} />
            </TouchableOpacity>
          );
        })}
      </View>
    </>
  );

  const renderDetailsForm = () => (
    <>
      {/* Selected Category */}
      <TouchableOpacity 
        style={styles.selectedCategory}
        onPress={() => setStep('category')}
        activeOpacity={0.7}
      >
        <ArrowLeft size={16} color={tc.primary} />
        <Text style={[styles.selectedCategoryText, { color: tc.primary }]}>
          {ISSUE_CATEGORIES.find(c => c.id === selectedCategory)?.label}
        </Text>
      </TouchableOpacity>

      {/* Priority Selection */}
      <View style={styles.formSection}>
        <Text style={[styles.formLabel, { color: tc.textPrimary }]}>Priority Level</Text>
        <View style={styles.priorityRow}>
          {PRIORITY_LEVELS.map((level) => (
            <TouchableOpacity
              key={level.id}
              style={[
                styles.priorityButton,
                { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle },
                priority === level.id && { borderColor: level.color, backgroundColor: level.color + '10' },
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setPriority(level.id);
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.priorityDot, { backgroundColor: level.color }]} />
              <Text style={[
                styles.priorityLabel,
                { color: tc.textSecondary },
                priority === level.id && { color: level.color, fontWeight: typography.fontWeight.semibold },
              ]}>
                {level.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Title Input */}
      <View style={styles.formSection}>
        <Text style={[styles.formLabel, { color: tc.textPrimary }]}>Issue Title</Text>
        <TextInput
          style={[styles.titleInput, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle, color: tc.textPrimary }]}
          placeholder="Brief summary of the issue"
          placeholderTextColor={tc.textTertiary}
          value={title}
          onChangeText={setTitle}
          maxLength={100}
        />
        <Text style={[styles.charCount, { color: tc.textSecondary }]}>{title.length}/100</Text>
      </View>

      {/* Description Input */}
      <View style={styles.formSection}>
        <Text style={[styles.formLabel, { color: tc.textPrimary }]}>Description</Text>
        <TextInput
          style={[styles.descriptionInput, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle, color: tc.textPrimary }]}
          placeholder="Please describe the issue in detail. Include steps to reproduce if applicable."
          placeholderTextColor={tc.textTertiary}
          value={description}
          onChangeText={setDescription}
          multiline
          textAlignVertical="top"
          maxLength={1000}
        />
        <Text style={[styles.charCount, { color: tc.textSecondary }]}>{description.length}/1000</Text>
      </View>

      {/* Attachments */}
      <View style={styles.formSection}>
        <Text style={[styles.formLabel, { color: tc.textPrimary }]}>Attachments (Optional)</Text>
        <Text style={[styles.formHint, { color: tc.textSecondary }]}>Add screenshots to help us understand the issue</Text>
        
        <View style={styles.attachmentsRow}>
          {attachments.map((uri, index) => (
            <View key={index} style={styles.attachmentPreview}>
              <View style={[styles.attachmentPlaceholder, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : colors.gray100 }]}>
                <Gallery size={24} color={tc.textTertiary} variant="Bold" />
              </View>
              <TouchableOpacity
                style={[styles.removeAttachment, { backgroundColor: tc.bgElevated }]}
                onPress={() => handleRemoveAttachment(index)}
              >
                <CloseCircle size={20} color={tc.error} variant="Bold" />
              </TouchableOpacity>
            </View>
          ))}
          
          {attachments.length < 3 && (
            <TouchableOpacity
              style={[styles.addAttachmentButton, { borderColor: tc.primary }]}
              onPress={handleAddAttachment}
              activeOpacity={0.7}
            >
              <Camera size={24} color={tc.primary} variant="Bold" />
              <Text style={[styles.addAttachmentText, { color: tc.primary }]}>Add</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        style={[styles.submitButton, { backgroundColor: tc.primary }, (!title.trim() || !description.trim()) && { backgroundColor: isDark ? '#444' : colors.gray300 }]}
        onPress={handleSubmit}
        disabled={!title.trim() || !description.trim() || isSubmitting}
        activeOpacity={0.8}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.submitButtonText}>Submit Report</Text>
        )}
      </TouchableOpacity>
    </>
  );

  const renderSuccess = () => (
    <View style={styles.successSection}>
      <View style={styles.successIcon}>
        <TickCircle size={64} color={tc.success} variant="Bold" />
      </View>
      <Text style={[styles.successTitle, { color: tc.textPrimary }]}>Report Submitted!</Text>
      <Text style={[styles.successText, { color: tc.textSecondary }]}>
        Thank you for reporting this issue. Our team will review it and get back to you 
        within 24-48 hours if we need more information.
      </Text>
      
      <View style={[styles.successInfo, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : colors.gray50 }]}>
        <Text style={[styles.successInfoLabel, { color: tc.textPrimary }]}>What happens next?</Text>
        <Text style={[styles.successInfoItem, { color: tc.textSecondary }]}>• Our team will investigate the issue</Text>
        <Text style={[styles.successInfoItem, { color: tc.textSecondary }]}>• You'll receive updates via email</Text>
        <Text style={[styles.successInfoItem, { color: tc.textSecondary }]}>• We may reach out for more details</Text>
      </View>

      <TouchableOpacity
        style={[styles.doneButton, { backgroundColor: tc.primary }]}
        onPress={handleDone}
        activeOpacity={0.8}
      >
        <Text style={styles.doneButtonText}>Done</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: tc.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm, backgroundColor: isDark ? '#1A1A1A' : tc.white, borderBottomColor: tc.borderSubtle }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ArrowLeft size={24} color={tc.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: tc.textPrimary }]}>Report an Issue</Text>
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
          {step === 'category' && renderCategorySelection()}
          {step === 'details' && renderDetailsForm()}
          {step === 'success' && renderSuccess()}
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
  introSection: {
    marginBottom: spacing.lg,
  },
  introTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  introText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  categoriesSection: {
    gap: spacing.sm,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius['2xl'],
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  categoryContent: {
    flex: 1,
  },
  categoryLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  categoryDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  selectedCategory: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  selectedCategoryText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
    marginLeft: spacing.xs,
  },
  formSection: {
    marginBottom: spacing.lg,
  },
  formLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  formHint: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  priorityRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  priorityButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.xs,
  },
  priorityLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  titleInput: {
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  descriptionInput: {
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    minHeight: 120,
  },
  charCount: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    textAlign: 'right',
    marginTop: spacing.xs,
  },
  attachmentsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  attachmentPreview: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    position: 'relative',
  },
  attachmentPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeAttachment: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: colors.bgElevated,
    borderRadius: 10,
  },
  addAttachmentButton: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addAttachmentText: {
    fontSize: typography.fontSize.xs,
    color: colors.primary,
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
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
  successSection: {
    alignItems: 'center',
    paddingTop: spacing.xl,
  },
  successIcon: {
    marginBottom: spacing.lg,
  },
  successTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  successText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  successInfo: {
    backgroundColor: colors.gray50,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    width: '100%',
    marginBottom: spacing.xl,
  },
  successInfoLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  successInfoItem: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  doneButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  doneButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
});
