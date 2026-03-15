/**
 * STEP 5: WHO CAN JOIN
 *
 * Open/Private visibility toggle + Max participants input.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { UserAdd, Lock, People } from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { spacing, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';

interface StepWhoProps {
  visibility: 'everyone' | 'selected';
  onVisibilityChange: (v: 'everyone' | 'selected') => void;
  maxParticipants: string;
  onMaxParticipantsChange: (v: string) => void;
}

export default function StepWho({
  visibility,
  onVisibilityChange,
  maxParticipants,
  onMaxParticipantsChange,
}: StepWhoProps) {
  const { colors: tc } = useTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.heading, { color: tc.textPrimary }]}>
        Who can join?
      </Text>
      <Text style={[styles.subheading, { color: tc.textSecondary }]}>
        Choose whether anyone can join or if you want to approve people first
      </Text>

      <View style={styles.row}>
        <TouchableOpacity
          style={[
            styles.card,
            { backgroundColor: tc.bgElevated, borderColor: visibility === 'everyone' ? tc.primary : tc.borderSubtle },
          ]}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onVisibilityChange('everyone'); }}
          activeOpacity={0.7}
        >
          <UserAdd size={28} color={visibility === 'everyone' ? tc.primary : tc.textTertiary} variant="Bold" />
          <Text style={[styles.cardTitle, { color: visibility === 'everyone' ? tc.primary : tc.textPrimary }]}>
            Open
          </Text>
          <Text style={[styles.cardSub, { color: tc.textSecondary }]}>Anyone can join</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.card,
            { backgroundColor: tc.bgElevated, borderColor: visibility === 'selected' ? tc.primary : tc.borderSubtle },
          ]}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onVisibilityChange('selected'); }}
          activeOpacity={0.7}
        >
          <Lock size={28} color={visibility === 'selected' ? tc.primary : tc.textTertiary} variant="Bold" />
          <Text style={[styles.cardTitle, { color: visibility === 'selected' ? tc.primary : tc.textPrimary }]}>
            Private
          </Text>
          <Text style={[styles.cardSub, { color: tc.textSecondary }]}>Approval required</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.label, { color: tc.textPrimary }]}>
        Max participants (optional)
      </Text>
      <View style={[styles.inputRow, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle }]}>
        <People size={20} color={tc.textTertiary} />
        <TextInput
          style={[styles.input, { color: tc.textPrimary }]}
          placeholder="Leave empty for unlimited"
          placeholderTextColor={tc.textTertiary}
          value={maxParticipants}
          onChangeText={onMaxParticipantsChange}
          keyboardType="number-pad"
        />
      </View>
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
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  card: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    gap: 6,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 4,
  },
  cardSub: {
    fontSize: 13,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    paddingVertical: spacing.md,
    fontSize: 16,
  },
});
