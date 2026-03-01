/**
 * CREATE POST SCREEN
 * 
 * Full-screen post creation with text input, photo picker,
 * location tag, and post type selector.
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  Camera,
  Location,
  Tag,
  CloseCircle,
  GalleryAdd,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '@/context/ThemeContext';
import { spacing, typography, borderRadius } from '@/styles';
import { PostType, POST_TYPE_CONFIGS } from '../types/feed.types';

export default function CreatePostScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors: tc, isDark } = useTheme();
  const { groupId, postType: initialType } = useLocalSearchParams<{ groupId: string; postType: string }>();

  const [content, setContent] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [postType, setPostType] = useState<PostType>((initialType as PostType) || 'general');
  const [locationName, setLocationName] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const textInputRef = useRef<TextInput>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start();
    setTimeout(() => textInputRef.current?.focus(), 300);
  }, []);

  const canPost = content.trim().length > 0 || photos.length > 0;

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (content.trim() || photos.length > 0) {
      Alert.alert('Discard post?', 'Your changes will be lost.', [
        { text: 'Keep Editing', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: () => router.back() },
      ]);
    } else {
      router.back();
    }
  };

  const handlePost = async () => {
    if (!canPost || isPosting) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsPosting(true);
    // Simulate API call
    await new Promise(r => setTimeout(r, 800));
    setIsPosting(false);
    router.back();
  };

  const handlePickImage = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: 6 - photos.length,
      quality: 0.8,
    });
    if (!result.canceled) {
      setPhotos(prev => [...prev, ...result.assets.map(a => a.uri)].slice(0, 6));
    }
  };

  const handleRemovePhoto = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed) && tags.length < 5) {
      setTags(prev => [...prev, trimmed]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(prev => prev.filter(t => t !== tag));
  };

  const typeConfig = POST_TYPE_CONFIGS[postType];

  const placeholders: Record<string, string> = {
    general: "What's on your mind, traveler?",
    checkin: "Where are you right now?",
    question: "Ask the community a question...",
    tip: "Share a helpful travel tip...",
    buddy_request: "Describe what kind of travel buddy you're looking for...",
    photo_journal: "Tell the story behind your photos...",
    safety_alert: "Describe the safety concern...",
    hidden_gem: "Share a hidden gem you discovered...",
    cost_report: "Break down your travel costs...",
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: tc.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Animated.View style={[styles.inner, { opacity: fadeAnim }]}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 4, borderBottomColor: tc.borderSubtle }]}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <ArrowLeft size={22} color={tc.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: tc.textPrimary }]}>Create Post</Text>
          <TouchableOpacity
            style={[
              styles.postButton,
              { backgroundColor: canPost ? tc.primary : tc.borderMedium },
            ]}
            onPress={handlePost}
            disabled={!canPost || isPosting}
          >
            <Text style={[styles.postButtonText, { color: canPost ? '#121212' : tc.textTertiary }]}>
              {isPosting ? 'Posting...' : 'Post'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Post Type Selector */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={[styles.typeRow, { borderBottomColor: tc.borderSubtle }]}
          contentContainerStyle={styles.typeRowContent}
        >
          {Object.entries(POST_TYPE_CONFIGS).map(([key, config]) => {
            const isActive = postType === key;
            return (
              <TouchableOpacity
                key={key}
                style={[
                  styles.typeChip,
                  {
                    backgroundColor: isActive ? config.color + '18' : tc.bgElevated,
                    borderColor: isActive ? config.color : tc.borderSubtle,
                  },
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setPostType(key as PostType);
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.typeChipText, { color: isActive ? config.color : tc.textSecondary }]}>
                  {config.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Content area */}
        <ScrollView
          style={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <TextInput
            ref={textInputRef}
            style={[styles.textInput, { color: tc.textPrimary }]}
            placeholder={placeholders[postType] || placeholders.general}
            placeholderTextColor={tc.textTertiary}
            multiline
            textAlignVertical="top"
            value={content}
            onChangeText={setContent}
            maxLength={2000}
          />

          {/* Photo previews */}
          {photos.length > 0 && (
            <View style={styles.photosGrid}>
              {photos.map((uri, index) => (
                <View key={index} style={styles.photoWrapper}>
                  <Image source={{ uri }} style={styles.photoPreview} />
                  <TouchableOpacity
                    style={styles.removePhotoButton}
                    onPress={() => handleRemovePhoto(index)}
                  >
                    <CloseCircle size={22} color="#FFFFFF" variant="Bold" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* Location input */}
          {locationName !== '' && (
            <View style={[styles.locationRow, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle }]}>
              <Location size={15} color="#3B82F6" variant="Bold" />
              <TextInput
                style={[styles.locationInput, { color: tc.textPrimary }]}
                placeholder="Location name"
                placeholderTextColor={tc.textTertiary}
                value={locationName}
                onChangeText={setLocationName}
              />
              <TouchableOpacity onPress={() => setLocationName('')}>
                <CloseCircle size={16} color={tc.textTertiary} variant="Linear" />
              </TouchableOpacity>
            </View>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <View style={styles.tagsRow}>
              {tags.map((tag) => (
                <TouchableOpacity
                  key={tag}
                  style={[styles.tagChip, { backgroundColor: tc.primarySubtle }]}
                  onPress={() => handleRemoveTag(tag)}
                >
                  <Text style={[styles.tagChipText, { color: tc.primary }]}>{tag}</Text>
                  <CloseCircle size={12} color={tc.primary} variant="Linear" />
                </TouchableOpacity>
              ))}
              {tags.length < 5 && (
                <View style={[styles.tagInputWrapper, { borderColor: tc.borderSubtle }]}>
                  <TextInput
                    style={[styles.tagInputInline, { color: tc.textPrimary }]}
                    placeholder="Add tag..."
                    placeholderTextColor={tc.textTertiary}
                    value={tagInput}
                    onChangeText={setTagInput}
                    onSubmitEditing={handleAddTag}
                    returnKeyType="done"
                  />
                </View>
              )}
            </View>
          )}

          {/* Character count */}
          <Text style={[styles.charCount, { color: tc.textTertiary }]}>
            {content.length}/2000
          </Text>
        </ScrollView>

        {/* Bottom toolbar */}
        <View style={[styles.toolbar, { backgroundColor: tc.bgElevated, borderTopColor: tc.borderSubtle, paddingBottom: insets.bottom || spacing.md }]}>
          <TouchableOpacity style={styles.toolbarButton} onPress={handlePickImage}>
            <GalleryAdd size={22} color={photos.length >= 6 ? tc.textTertiary : '#06B6D4'} variant="Bold" />
            {photos.length > 0 && (
              <View style={styles.photoBadge}>
                <Text style={styles.photoBadgeText}>{photos.length}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.toolbarButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setLocationName(locationName || ' ');
            }}
          >
            <Location
              size={22}
              color={locationName ? '#3B82F6' : tc.textSecondary}
              variant={locationName ? 'Bold' : 'Linear'}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.toolbarButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              if (tags.length === 0) setTags(['']);
              handleAddTag();
            }}
          >
            <Tag
              size={22}
              color={tags.length > 0 ? tc.primary : tc.textSecondary}
              variant={tags.length > 0 ? 'Bold' : 'Linear'}
            />
          </TouchableOpacity>
        </View>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inner: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...typography.heading2,
    flex: 1,
    textAlign: 'center',
  },
  postButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 8,
    borderRadius: borderRadius.full,
  },
  postButtonText: {
    fontSize: 13,
    fontWeight: '700',
  },
  typeRow: {
    maxHeight: 50,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  typeRowContent: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  typeChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  typeChipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  textInput: {
    ...typography.bodyLg,
    lineHeight: 24,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  photoWrapper: {
    position: 'relative',
  },
  photoPreview: {
    width: 100,
    height: 100,
    borderRadius: borderRadius.lg,
  },
  removePhotoButton: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    marginTop: spacing.md,
  },
  locationInput: {
    flex: 1,
    ...typography.bodySm,
    paddingVertical: 0,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  tagChipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  tagInputWrapper: {
    borderBottomWidth: 1,
    minWidth: 80,
  },
  tagInputInline: {
    ...typography.bodySm,
    paddingVertical: 4,
  },
  charCount: {
    fontSize: 11,
    textAlign: 'right',
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  toolbar: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    gap: spacing.xl,
  },
  toolbarButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  photoBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#06B6D4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
