/**
 * STEP 2: ACTIVITY DETAILS
 *
 * Title + Description inputs for the activity.
 */

import React from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image } from 'react-native';
import { Camera, CloseCircle } from 'iconsax-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { spacing, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';

interface StepDetailsProps {
  title: string;
  onTitleChange: (text: string) => void;
  description: string;
  onDescriptionChange: (text: string) => void;
  coverImageUri?: string;
  onCoverImageChange?: (uri: string | undefined) => void;
}

export default function StepDetails({
  title,
  onTitleChange,
  description,
  onDescriptionChange,
  coverImageUri,
  onCoverImageChange,
}: StepDetailsProps) {
  const { colors: tc } = useTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.heading, { color: tc.textPrimary }]}>
        Give it a name
      </Text>
      <Text style={[styles.subheading, { color: tc.textSecondary }]}>
        A short, catchy title so people know what to expect
      </Text>

      <TextInput
        style={[styles.input, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle, color: tc.textPrimary }]}
        placeholder="e.g., Sunset rooftop drinks"
        placeholderTextColor={tc.textTertiary}
        value={title}
        onChangeText={onTitleChange}
        maxLength={80}
        autoFocus
      />
      <Text style={[styles.charCount, { color: tc.textTertiary }]}>
        {title.length}/80
      </Text>

      <Text style={[styles.label, { color: tc.textPrimary }]}>
        Description (optional)
      </Text>
      <TextInput
        style={[styles.input, styles.textArea, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle, color: tc.textPrimary }]}
        placeholder="Tell others what you have in mind, any details they should know..."
        placeholderTextColor={tc.textTertiary}
        value={description}
        onChangeText={onDescriptionChange}
        multiline
        numberOfLines={4}
        maxLength={300}
        textAlignVertical="top"
      />
      <Text style={[styles.charCount, { color: tc.textTertiary }]}>
        {description.length}/300
      </Text>

      <Text style={[styles.label, { color: tc.textPrimary }]}>
        Cover photo (optional)
      </Text>
      {coverImageUri ? (
        <View style={styles.coverPreview}>
          <Image source={{ uri: coverImageUri }} style={styles.coverImage} />
          <TouchableOpacity
            style={[styles.removeCover, { backgroundColor: tc.bgElevated }]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onCoverImageChange?.(undefined); }}
          >
            <CloseCircle size={20} color={tc.error} variant="Bold" />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.coverPicker, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle }]}
          onPress={async () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [16, 9],
              quality: 0.8,
            });
            if (!result.canceled && result.assets[0]) {
              onCoverImageChange?.(result.assets[0].uri);
            }
          }}
          activeOpacity={0.7}
        >
          <Camera size={28} color={tc.textTertiary} />
          <Text style={[styles.coverPickerText, { color: tc.textTertiary }]}>Add a photo</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
  },
  heading: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 6,
  },
  subheading: {
    fontSize: 14,
    marginBottom: spacing.xl,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  input: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    fontSize: 16,
    borderWidth: 1,
  },
  textArea: {
    minHeight: 120,
  },
  charCount: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
  },
  coverPicker: {
    height: 120,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  coverPickerText: {
    fontSize: 14,
    fontWeight: '500',
  },
  coverPreview: {
    height: 160,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  removeCover: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
