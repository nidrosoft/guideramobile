/**
 * FEED COMPOSER
 * 
 * Compose bar at the top of the feed with user avatar,
 * placeholder text, and quick post type chips.
 */

import React, { memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import {
  Camera,
  Location,
  MessageQuestion,
  People,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/context/ThemeContext';
import { spacing, typography, borderRadius } from '@/styles';

interface FeedComposerProps {
  userAvatar: string;
  onPress: () => void;
  onQuickType?: (type: string) => void;
}

const QUICK_TYPES = [
  { id: 'photo', label: 'Photo', icon: Camera, color: '#06B6D4' },
  { id: 'checkin', label: 'Check-in', icon: Location, color: '#3B82F6' },
  { id: 'question', label: 'Question', icon: MessageQuestion, color: '#8B5CF6' },
  { id: 'buddy', label: 'Find Buddy', icon: People, color: '#EC4899' },
];

function FeedComposer({ userAvatar, onPress, onQuickType }: FeedComposerProps) {
  const { colors: tc } = useTheme();

  const handleQuickType = (type: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onQuickType?.(type);
  };

  return (
    <View style={[styles.container, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle }]}>
      {/* Compose row */}
      <TouchableOpacity
        style={styles.composeRow}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <Image source={{ uri: userAvatar }} style={styles.avatar} />
        <View style={[styles.inputPlaceholder, { backgroundColor: tc.bgInput, borderColor: tc.borderSubtle }]}>
          <Text style={[styles.placeholderText, { color: tc.textTertiary }]}>
            What's on your mind, traveler?
          </Text>
        </View>
      </TouchableOpacity>

      {/* Quick type chips */}
      <View style={[styles.chipRow, { borderTopColor: tc.borderSubtle }]}>
        {QUICK_TYPES.map((type) => {
          const Icon = type.icon;
          return (
            <TouchableOpacity
              key={type.id}
              style={styles.chip}
              onPress={() => handleQuickType(type.id)}
              activeOpacity={0.7}
            >
              <Icon size={15} color={type.color} variant="Bold" />
              <Text style={[styles.chipText, { color: tc.textSecondary }]}>
                {type.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default memo(FeedComposer);

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius['2xl'],
    borderWidth: 1,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  composeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.sm,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  inputPlaceholder: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  placeholderText: {
    ...typography.bodySm,
  },
  chipRow: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  chip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: spacing.xs,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '500',
  },
});
