/**
 * CREATE GROUP SCREEN
 * 
 * Form for premium users to create a new community/group.
 * Includes name, description, type, privacy, cover image, and tags.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Camera,
  Gallery,
  Location,
  People,
  Lock,
  Global,
  TickCircle,
  CloseCircle,
  Add,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing, typography, borderRadius } from '@/styles';
import { CommunityType, CommunityPrivacy } from '../types/community.types';
import { COMMUNITY_TAGS } from '../config/community.config';

interface GroupFormData {
  name: string;
  description: string;
  type: CommunityType;
  privacy: CommunityPrivacy;
  coverImage: string | null;
  avatar: string | null;
  destination: string;
  tags: string[];
}

const GROUP_TYPES: { id: CommunityType; label: string; icon: any; description: string }[] = [
  { id: 'destination', label: 'Destination', icon: Location, description: 'For travelers heading to a specific place' },
  { id: 'interest', label: 'Interest', icon: People, description: 'Based on travel style or interests' },
  { id: 'trip', label: 'Trip Group', icon: People, description: 'Private group for your travel squad' },
  { id: 'local', label: 'Local Guide', icon: Location, description: 'Connect travelers with locals' },
];

const PRIVACY_OPTIONS: { id: CommunityPrivacy; label: string; icon: any; description: string }[] = [
  { id: 'public', label: 'Public', icon: Global, description: 'Anyone can find and join' },
  { id: 'private', label: 'Private', icon: Lock, description: 'Visible but requires approval to join' },
  { id: 'invite_only', label: 'Invite Only', icon: Lock, description: 'Hidden, join by invite only' },
];

const POPULAR_TAGS = [
  'adventure', 'backpacking', 'luxury', 'budget', 'solo', 
  'couples', 'family', 'foodie', 'photography', 'hiking',
  'beaches', 'cities', 'cultural', 'nightlife', 'digital-nomad',
];

export default function CreateGroupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  
  const [formData, setFormData] = useState<GroupFormData>({
    name: '',
    description: '',
    type: 'destination',
    privacy: 'public',
    coverImage: null,
    avatar: null,
    destination: '',
    tags: [],
  });
  
  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      router.back();
    }
  };
  
  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Validate current step
    if (currentStep === 1 && !formData.name.trim()) {
      Alert.alert('Required', 'Please enter a group name');
      return;
    }
    
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };
  
  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Required', 'Please enter a group name');
      return;
    }
    
    setIsSubmitting(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      Alert.alert(
        'Group Created! 🎉',
        `Your group "${formData.name}" has been created successfully.`,
        [
          {
            text: 'View Group',
            onPress: () => router.replace('/community/new-group-id' as any),
          },
        ]
      );
    }, 1500);
  };
  
  const pickImage = async (type: 'cover' | 'avatar') => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: type === 'cover' ? [16, 9] : [1, 1],
      quality: 0.8,
    });
    
    if (!result.canceled && result.assets[0]) {
      setFormData(prev => ({
        ...prev,
        [type === 'cover' ? 'coverImage' : 'avatar']: result.assets[0].uri,
      }));
    }
  };
  
  const toggleTag = (tag: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : prev.tags.length < 5 ? [...prev.tags, tag] : prev.tags,
    }));
  };
  
  const renderStep1 = () => (
    <>
      {/* Cover Image */}
      <TouchableOpacity 
        style={styles.coverImageContainer}
        onPress={() => pickImage('cover')}
      >
        {formData.coverImage ? (
          <Image source={{ uri: formData.coverImage }} style={styles.coverImage} />
        ) : (
          <View style={styles.coverImagePlaceholder}>
            <Gallery size={32} color={colors.gray400} />
            <Text style={styles.coverImageText}>Add Cover Photo</Text>
          </View>
        )}
        <View style={styles.coverImageOverlay}>
          <Camera size={20} color={colors.white} />
        </View>
      </TouchableOpacity>
      
      {/* Avatar */}
      <View style={styles.avatarSection}>
        <TouchableOpacity 
          style={styles.avatarContainer}
          onPress={() => pickImage('avatar')}
        >
          {formData.avatar ? (
            <Image source={{ uri: formData.avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Camera size={24} color={colors.gray400} />
            </View>
          )}
          <View style={styles.avatarBadge}>
            <Add size={14} color={colors.white} />
          </View>
        </TouchableOpacity>
      </View>
      
      {/* Group Name */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Group Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Tokyo Travelers 2025"
          placeholderTextColor={colors.gray400}
          value={formData.name}
          onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
          maxLength={50}
        />
        <Text style={styles.charCount}>{formData.name.length}/50</Text>
      </View>
      
      {/* Description */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Tell people what your group is about..."
          placeholderTextColor={colors.gray400}
          value={formData.description}
          onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
          multiline
          numberOfLines={4}
          maxLength={500}
          textAlignVertical="top"
        />
        <Text style={styles.charCount}>{formData.description.length}/500</Text>
      </View>
      
      {/* Destination (for destination type) */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Destination (Optional)</Text>
        <View style={styles.inputWithIcon}>
          <Location size={20} color={colors.gray400} />
          <TextInput
            style={styles.inputInner}
            placeholder="e.g., Tokyo, Japan"
            placeholderTextColor={colors.gray400}
            value={formData.destination}
            onChangeText={(text) => setFormData(prev => ({ ...prev, destination: text }))}
          />
        </View>
      </View>
    </>
  );
  
  const renderStep2 = () => (
    <>
      {/* Group Type */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Group Type</Text>
        <Text style={styles.sublabel}>What kind of group is this?</Text>
        
        {GROUP_TYPES.map(type => {
          const Icon = type.icon;
          const isSelected = formData.type === type.id;
          return (
            <TouchableOpacity
              key={type.id}
              style={[styles.optionCard, isSelected && styles.optionCardSelected]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setFormData(prev => ({ ...prev, type: type.id }));
              }}
            >
              <View style={[styles.optionIcon, isSelected && styles.optionIconSelected]}>
                <Icon size={20} color={isSelected ? colors.white : colors.gray500} />
              </View>
              <View style={styles.optionContent}>
                <Text style={[styles.optionTitle, isSelected && styles.optionTitleSelected]}>
                  {type.label}
                </Text>
                <Text style={styles.optionDescription}>{type.description}</Text>
              </View>
              {isSelected && (
                <TickCircle size={24} color={colors.primary} variant="Bold" />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
      
      {/* Privacy */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Privacy</Text>
        <Text style={styles.sublabel}>Who can find and join your group?</Text>
        
        {PRIVACY_OPTIONS.map(option => {
          const Icon = option.icon;
          const isSelected = formData.privacy === option.id;
          return (
            <TouchableOpacity
              key={option.id}
              style={[styles.optionCard, isSelected && styles.optionCardSelected]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setFormData(prev => ({ ...prev, privacy: option.id }));
              }}
            >
              <View style={[styles.optionIcon, isSelected && styles.optionIconSelected]}>
                <Icon size={20} color={isSelected ? colors.white : colors.gray500} />
              </View>
              <View style={styles.optionContent}>
                <Text style={[styles.optionTitle, isSelected && styles.optionTitleSelected]}>
                  {option.label}
                </Text>
                <Text style={styles.optionDescription}>{option.description}</Text>
              </View>
              {isSelected && (
                <TickCircle size={24} color={colors.primary} variant="Bold" />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </>
  );
  
  const renderStep3 = () => (
    <>
      {/* Tags */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Tags</Text>
        <Text style={styles.sublabel}>Add up to 5 tags to help people find your group</Text>
        
        <View style={styles.tagsContainer}>
          {POPULAR_TAGS.map(tag => {
            const isSelected = formData.tags.includes(tag);
            return (
              <TouchableOpacity
                key={tag}
                style={[styles.tag, isSelected && styles.tagSelected]}
                onPress={() => toggleTag(tag)}
              >
                <Text style={[styles.tagText, isSelected && styles.tagTextSelected]}>
                  {tag}
                </Text>
                {isSelected && (
                  <CloseCircle size={14} color={colors.white} variant="Bold" />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
        
        <Text style={styles.tagCount}>
          {formData.tags.length}/5 tags selected
        </Text>
      </View>
      
      {/* Preview */}
      <View style={styles.previewSection}>
        <Text style={styles.label}>Preview</Text>
        <View style={styles.previewCard}>
          {formData.coverImage ? (
            <Image source={{ uri: formData.coverImage }} style={styles.previewCover} />
          ) : (
            <View style={[styles.previewCover, styles.previewCoverPlaceholder]} />
          )}
          <View style={styles.previewContent}>
            <View style={styles.previewHeader}>
              {formData.avatar ? (
                <Image source={{ uri: formData.avatar }} style={styles.previewAvatar} />
              ) : (
                <View style={[styles.previewAvatar, styles.previewAvatarPlaceholder]}>
                  <People size={16} color={colors.gray400} />
                </View>
              )}
              <View style={styles.previewInfo}>
                <Text style={styles.previewName} numberOfLines={1}>
                  {formData.name || 'Group Name'}
                </Text>
                <Text style={styles.previewMeta}>
                  {formData.privacy === 'public' ? '🌐 Public' : '🔒 Private'} • 1 member
                </Text>
              </View>
            </View>
            {formData.tags.length > 0 && (
              <View style={styles.previewTags}>
                {formData.tags.slice(0, 3).map(tag => (
                  <View key={tag} style={styles.previewTag}>
                    <Text style={styles.previewTagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </View>
    </>
  );
  
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <ArrowLeft size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Group</Text>
        <View style={styles.headerRight}>
          <Text style={styles.stepIndicator}>Step {currentStep}/3</Text>
        </View>
      </View>
      
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${(currentStep / 3) * 100}%` }]} />
        </View>
      </View>
      
      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
      </ScrollView>
      
      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom || spacing.md }]}>
        <TouchableOpacity
          style={[styles.nextButton, isSubmitting && styles.nextButtonDisabled]}
          onPress={handleNext}
          disabled={isSubmitting}
        >
          <Text style={styles.nextButtonText}>
            {isSubmitting ? 'Creating...' : currentStep === 3 ? 'Create Group' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
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
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
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
  headerRight: {
    width: 60,
    alignItems: 'flex-end',
  },
  stepIndicator: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  progressContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
  },
  progressTrack: {
    height: 4,
    backgroundColor: colors.gray200,
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
    paddingBottom: spacing['2xl'],
  },
  // Cover Image
  coverImageContainer: {
    height: 160,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    marginBottom: spacing.lg,
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverImageText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray400,
    marginTop: spacing.sm,
  },
  coverImageOverlay: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.sm,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Avatar
  avatarSection: {
    alignItems: 'center',
    marginTop: -50,
    marginBottom: spacing.lg,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: colors.white,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.gray200,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: colors.white,
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  // Input Groups
  inputGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  sublabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  input: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  textArea: {
    height: 100,
    paddingTop: spacing.md,
  },
  charCount: {
    fontSize: typography.fontSize.xs,
    color: colors.gray400,
    textAlign: 'right',
    marginTop: spacing.xs,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray200,
    gap: spacing.sm,
  },
  inputInner: {
    flex: 1,
    paddingVertical: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
  // Option Cards
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
    borderWidth: 2,
    borderColor: colors.gray100,
  },
  optionCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '08',
  },
  optionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionIconSelected: {
    backgroundColor: colors.primary,
  },
  optionContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  optionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  optionTitleSelected: {
    color: colors.primary,
  },
  optionDescription: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  // Tags
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray100,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  tagSelected: {
    backgroundColor: colors.primary,
  },
  tagText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  tagTextSelected: {
    color: colors.white,
  },
  tagCount: {
    fontSize: typography.fontSize.xs,
    color: colors.gray400,
    marginTop: spacing.md,
  },
  // Preview
  previewSection: {
    marginTop: spacing.lg,
  },
  previewCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  previewCover: {
    width: '100%',
    height: 100,
  },
  previewCoverPlaceholder: {
    backgroundColor: colors.gray200,
  },
  previewContent: {
    padding: spacing.md,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  previewAvatarPlaceholder: {
    backgroundColor: colors.gray200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewInfo: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  previewName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  previewMeta: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  previewTags: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  previewTag: {
    backgroundColor: colors.gray100,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  previewTagText: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  // Footer
  footer: {
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
  },
  nextButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  nextButtonDisabled: {
    opacity: 0.6,
  },
  nextButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
});
