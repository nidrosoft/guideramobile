/**
 * STEP 2: ACTIVITY DETAILS
 *
 * Title + Description inputs for the activity.
 */

import React from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import { spacing, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';

interface StepDetailsProps {
  title: string;
  onTitleChange: (text: string) => void;
  description: string;
  onDescriptionChange: (text: string) => void;
}

export default function StepDetails({
  title,
  onTitleChange,
  description,
  onDescriptionChange,
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
});
