/**
 * CREATE ACTIVITY SCREEN
 * 
 * Allows users to create a meetup activity proposal.
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
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Location, Clock, People } from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, typography, borderRadius } from '@/styles';
import { useAuth } from '@/context/AuthContext';
import { useActivityActions } from '@/hooks/useCommunity';
import type { ActivityType, ActivityTiming } from '@/services/community/types/community.types';

const ACTIVITY_TYPES: { type: ActivityType; emoji: string; label: string }[] = [
  { type: 'coffee', emoji: '☕', label: 'Coffee' },
  { type: 'food', emoji: '🍽️', label: 'Food' },
  { type: 'drinks', emoji: '🍻', label: 'Drinks' },
  { type: 'sightseeing', emoji: '📸', label: 'Sightseeing' },
  { type: 'walking_tour', emoji: '🚶', label: 'Walking Tour' },
  { type: 'museum', emoji: '🏛️', label: 'Museum' },
  { type: 'nightlife', emoji: '🌙', label: 'Nightlife' },
  { type: 'sports', emoji: '⚽', label: 'Sports' },
  { type: 'coworking', emoji: '💻', label: 'Coworking' },
  { type: 'language_exchange', emoji: '🗣️', label: 'Language Exchange' },
  { type: 'other', emoji: '📍', label: 'Other' },
];

const TIMING_OPTIONS: { value: ActivityTiming; label: string; sublabel: string }[] = [
  { value: 'now', label: 'Right Now', sublabel: 'Start immediately' },
  { value: 'today', label: 'Today', sublabel: 'Later today' },
  { value: 'tomorrow', label: 'Tomorrow', sublabel: 'Schedule for tomorrow' },
];

export default function CreateActivityScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const userId = user?.id;
  const { createActivity, loading } = useActivityActions(userId);

  const [activityType, setActivityType] = useState<ActivityType>('coffee');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [locationName, setLocationName] = useState('');
  const [timing, setTiming] = useState<ActivityTiming>('now');
  const [maxParticipants, setMaxParticipants] = useState<string>('');

  const handleBack = () => router.back();

  const handleCreate = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title for your activity');
      return;
    }
    if (!locationName.trim()) {
      Alert.alert('Error', 'Please enter a location');
      return;
    }

    try {
      await createActivity({
        type: activityType,
        title: title.trim(),
        description: description.trim() || undefined,
        location: {
          name: locationName.trim(),
          latitude: 0, // Would be set from location picker
          longitude: 0,
        },
        timing,
        maxParticipants: maxParticipants ? parseInt(maxParticipants, 10) : undefined,
        visibility: 'everyone',
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <ArrowLeft size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Activity</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Activity Type */}
        <Text style={styles.sectionTitle}>What type of activity?</Text>
        <View style={styles.typeGrid}>
          {ACTIVITY_TYPES.map((item) => (
            <TouchableOpacity
              key={item.type}
              style={[
                styles.typeCard,
                activityType === item.type && styles.typeCardActive,
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActivityType(item.type);
              }}
            >
              <Text style={styles.typeEmoji}>{item.emoji}</Text>
              <Text
                style={[
                  styles.typeLabel,
                  activityType === item.type && styles.typeLabelActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Title */}
        <Text style={styles.sectionTitle}>Title</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Coffee and croissant by the Eiffel Tower"
          placeholderTextColor={colors.gray400}
          value={title}
          onChangeText={setTitle}
          maxLength={100}
        />

        {/* Description */}
        <Text style={styles.sectionTitle}>Description (optional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Tell others what you have in mind..."
          placeholderTextColor={colors.gray400}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
          maxLength={300}
        />

        {/* Location */}
        <Text style={styles.sectionTitle}>Location</Text>
        <View style={styles.inputWithIcon}>
          <Location size={20} color={colors.gray400} />
          <TextInput
            style={styles.inputInner}
            placeholder="Where will you meet?"
            placeholderTextColor={colors.gray400}
            value={locationName}
            onChangeText={setLocationName}
          />
        </View>

        {/* Timing */}
        <Text style={styles.sectionTitle}>When?</Text>
        <View style={styles.timingOptions}>
          {TIMING_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.timingCard,
                timing === option.value && styles.timingCardActive,
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setTiming(option.value);
              }}
            >
              <Clock
                size={20}
                color={timing === option.value ? colors.white : colors.textSecondary}
              />
              <View style={styles.timingInfo}>
                <Text
                  style={[
                    styles.timingLabel,
                    timing === option.value && styles.timingLabelActive,
                  ]}
                >
                  {option.label}
                </Text>
                <Text
                  style={[
                    styles.timingSublabel,
                    timing === option.value && styles.timingSublabelActive,
                  ]}
                >
                  {option.sublabel}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Max Participants */}
        <Text style={styles.sectionTitle}>Max participants (optional)</Text>
        <View style={styles.inputWithIcon}>
          <People size={20} color={colors.gray400} />
          <TextInput
            style={styles.inputInner}
            placeholder="Leave empty for unlimited"
            placeholderTextColor={colors.gray400}
            value={maxParticipants}
            onChangeText={setMaxParticipants}
            keyboardType="number-pad"
          />
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Create Button */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <TouchableOpacity
          style={[styles.createButton, loading && styles.createButtonDisabled]}
          onPress={handleCreate}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Text style={styles.createButtonText}>Create Activity</Text>
          )}
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
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.bgElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    marginTop: spacing.lg,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  typeCard: {
    width: '30%',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  typeCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  typeEmoji: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  typeLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  typeLabelActive: {
    color: colors.primary,
    fontWeight: typography.fontWeight.semibold,
  },
  input: {
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  inputInner: {
    flex: 1,
    paddingVertical: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
  timingOptions: {
    gap: spacing.sm,
  },
  timingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  timingCardActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  timingInfo: {
    flex: 1,
  },
  timingLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  timingLabelActive: {
    color: colors.white,
  },
  timingSublabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  timingSublabelActive: {
    color: colors.white + 'CC',
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  createButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  createButtonDisabled: {
    opacity: 0.7,
  },
  createButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
});
