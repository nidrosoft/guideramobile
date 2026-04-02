/**
 * EDIT GROUP SCREEN
 *
 * Allows owners / admins to update name, description, cover image and profile photo.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft2, Camera, Gallery, CloseCircle } from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing, typography, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { groupService } from '@/services/community';
import { supabase } from '@/lib/supabase/client';

export default function EditGroupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors: tc } = useTheme();
  const { profile } = useAuth();
  const { showSuccess, showError } = useToast();
  const { groupId } = useLocalSearchParams<{ groupId: string }>();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [coverUri, setCoverUri] = useState('');
  const [coverBase64, setCoverBase64] = useState<string | null>(null);
  const [avatarUri, setAvatarUri] = useState('');
  const [avatarBase64, setAvatarBase64] = useState<string | null>(null);

  const [originalName, setOriginalName] = useState('');
  const [originalDesc, setOriginalDesc] = useState('');

  useEffect(() => {
    (async () => {
      if (!groupId) return;
      try {
        const g = await groupService.getGroup(groupId);
        if (g) {
          setName(g.name);
          setDescription(g.description || '');
          setCoverUri(g.coverPhotoUrl || '');
          setAvatarUri(g.groupPhotoUrl || '');
          setOriginalName(g.name);
          setOriginalDesc(g.description || '');
        }
      } catch (err) {
        if (__DEV__) console.warn('[EditGroup] load error:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [groupId]);

  const pickImage = async (type: 'cover' | 'avatar') => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: type === 'cover' ? [16, 9] : [1, 1],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      if (type === 'cover') {
        setCoverUri(asset.uri);
        setCoverBase64(asset.base64 || null);
      } else {
        setAvatarUri(asset.uri);
        setAvatarBase64(asset.base64 || null);
      }
    }
  };

  const uploadImage = async (base64Data: string, folder: string, fileExt: string = 'jpg'): Promise<string | undefined> => {
    try {
      const mimeType = fileExt === 'png' ? 'image/png' : 'image/jpeg';
      const path = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;

      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const { error: uploadErr } = await supabase.storage
        .from('community')
        .upload(path, bytes, { contentType: mimeType, upsert: true });

      if (uploadErr) {
        if (__DEV__) console.warn('[EditGroup] upload error:', uploadErr);
        return undefined;
      }
      const { data: publicUrl } = supabase.storage.from('community').getPublicUrl(path);
      return publicUrl.publicUrl;
    } catch (err) {
      if (__DEV__) console.warn('[EditGroup] upload exception:', err);
      return undefined;
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      showError('Group name is required');
      return;
    }
    if (!profile?.id || !groupId) return;

    setSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const updates: { name?: string; description?: string; coverPhotoUrl?: string; groupPhotoUrl?: string } = {};

      if (name.trim() !== originalName) updates.name = name.trim();
      if (description.trim() !== originalDesc) updates.description = description.trim();

      if (coverBase64) {
        const ext = coverUri.split('.').pop()?.toLowerCase() || 'jpg';
        const url = await uploadImage(coverBase64, 'group-covers', ext);
        if (url) updates.coverPhotoUrl = url;
      }

      if (avatarBase64) {
        const ext = avatarUri.split('.').pop()?.toLowerCase() || 'jpg';
        const url = await uploadImage(avatarBase64, 'group-avatars', ext);
        if (url) updates.groupPhotoUrl = url;
      }

      if (Object.keys(updates).length === 0) {
        showSuccess('No changes to save');
        router.back();
        return;
      }

      await groupService.updateGroup(groupId, profile.id, updates);
      showSuccess('Group updated!');
      router.back();
    } catch (err: any) {
      if (__DEV__) console.warn('[EditGroup] save error:', err);
      showError(err?.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: tc.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={tc.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: tc.background }]}>
      <StatusBar style="auto" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.xs, borderBottomColor: tc.borderSubtle }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <ArrowLeft2 size={22} color={tc.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: tc.textPrimary }]}>Edit Group</Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          style={[styles.saveBtn, { backgroundColor: tc.primary, opacity: saving ? 0.6 : 1 }]}
          activeOpacity={0.8}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Text style={styles.saveBtnText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={insets.top + 56}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + spacing.xl }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Cover Image */}
          <Text style={[styles.label, { color: tc.textPrimary }]}>Cover Photo</Text>
          <TouchableOpacity style={styles.coverContainer} onPress={() => pickImage('cover')} activeOpacity={0.8}>
            {coverUri ? (
              <Image source={{ uri: coverUri }} style={styles.coverImage} />
            ) : (
              <View style={[styles.coverPlaceholder, { backgroundColor: tc.bgElevated }]}>
                <Gallery size={32} color={tc.textTertiary} />
                <Text style={[styles.placeholderText, { color: tc.textTertiary }]}>Tap to add cover photo</Text>
              </View>
            )}
            <View style={[styles.cameraBadge, { backgroundColor: tc.primary }]}>
              <Camera size={16} color={colors.white} />
            </View>
          </TouchableOpacity>

          {/* Profile Photo */}
          <Text style={[styles.label, { color: tc.textPrimary, marginTop: spacing.xl }]}>Group Photo</Text>
          <View style={styles.avatarRow}>
            <TouchableOpacity style={styles.avatarContainer} onPress={() => pickImage('avatar')} activeOpacity={0.8}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
              ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle }]}>
                  <Camera size={24} color={tc.textTertiary} />
                </View>
              )}
              <View style={[styles.avatarBadge, { backgroundColor: tc.primary }]}>
                <Camera size={12} color={colors.white} />
              </View>
            </TouchableOpacity>
            <Text style={[styles.avatarHint, { color: tc.textTertiary }]}>
              Tap to change the group's profile photo
            </Text>
          </View>

          {/* Name */}
          <Text style={[styles.label, { color: tc.textPrimary, marginTop: spacing.xl }]}>Group Name</Text>
          <TextInput
            style={[styles.input, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle, color: tc.textPrimary }]}
            value={name}
            onChangeText={setName}
            placeholder="Group name"
            placeholderTextColor={tc.textTertiary}
            maxLength={80}
          />
          <Text style={[styles.charCount, { color: tc.textTertiary }]}>{name.length}/80</Text>

          {/* Description */}
          <Text style={[styles.label, { color: tc.textPrimary, marginTop: spacing.lg }]}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle, color: tc.textPrimary }]}
            value={description}
            onChangeText={setDescription}
            placeholder="What is this group about?"
            placeholderTextColor={tc.textTertiary}
            multiline
            numberOfLines={5}
            maxLength={500}
            textAlignVertical="top"
          />
          <Text style={[styles.charCount, { color: tc.textTertiary }]}>{description.length}/500</Text>
        </ScrollView>
      </KeyboardAvoidingView>
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
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontFamily: 'Rubik-SemiBold',
    textAlign: 'center',
    marginRight: -40,
  },
  saveBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 8,
    borderRadius: borderRadius.full,
    minWidth: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontSize: 14,
    fontFamily: 'Rubik-SemiBold',
    color: '#FFFFFF',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Rubik-Medium',
    marginBottom: spacing.sm,
  },
  coverContainer: {
    height: 160,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: borderRadius.xl,
  },
  placeholderText: {
    fontSize: 13,
    marginTop: spacing.xs,
    fontFamily: 'Rubik-Regular',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.sm,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarImage: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  avatarPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarHint: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Rubik-Regular',
    lineHeight: 17,
  },
  input: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    fontSize: 15,
    fontFamily: 'Rubik-Regular',
    borderWidth: 1,
  },
  textArea: {
    minHeight: 120,
    paddingTop: spacing.md,
  },
  charCount: {
    fontSize: 11,
    textAlign: 'right',
    marginTop: 4,
    fontFamily: 'Rubik-Regular',
  },
});
