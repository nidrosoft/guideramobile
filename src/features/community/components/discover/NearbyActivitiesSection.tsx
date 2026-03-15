/**
 * NEARBY ACTIVITIES SECTION
 *
 * Shows up to 3 nearby meetup activities in the Discover feed.
 * Links to Pulse (map) for full view. Hides when no activities.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Clock, Location as LocationIcon } from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { spacing } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import SectionHeader from '../SectionHeader';
import type { Activity } from '@/services/community/types/community.types';
import { getActivityIcon, getTimingLabel } from '../pulse/pulse.utils';

interface NearbyActivitiesSectionProps {
  activities: Activity[];
  loading?: boolean;
  onActivityPress: (activityId: string) => void;
  onSeeAll?: () => void;
}

export default function NearbyActivitiesSection({
  activities,
  loading = false,
  onActivityPress,
  onSeeAll,
}: NearbyActivitiesSectionProps) {
  const { colors: tc } = useTheme();

  if (!loading && activities.length === 0) return null;

  return (
    <View style={styles.section}>
      <SectionHeader title="Happening Near You" onSeeAll={onSeeAll} />
      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="small" color={tc.primary} />
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >
          {activities.slice(0, 4).map(activity => (
            <TouchableOpacity
              key={activity.id}
              style={[styles.card, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onActivityPress(activity.id);
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.iconCircle, { backgroundColor: tc.primary + '12' }]}>
                <Text style={styles.emoji}>{getActivityIcon(activity.type)}</Text>
              </View>
              <Text style={[styles.title, { color: tc.textPrimary }]} numberOfLines={1}>
                {activity.title}
              </Text>
              <View style={styles.metaRow}>
                <Clock size={12} color={tc.primary} />
                <Text style={[styles.metaText, { color: tc.primary }]}>
                  {getTimingLabel(activity)}
                </Text>
              </View>
              <View style={styles.metaRow}>
                <LocationIcon size={12} color={tc.textTertiary} />
                <Text style={[styles.metaText, { color: tc.textSecondary }]} numberOfLines={1}>
                  {activity.locationName || 'Nearby'}
                </Text>
              </View>
              <Text style={[styles.going, { color: tc.textTertiary }]}>
                {activity.participantCount} going
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: spacing.lg,
  },
  loading: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  scroll: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  card: {
    width: 180,
    padding: spacing.md,
    borderRadius: 20,
    borderWidth: 1,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  emoji: {
    fontSize: 20,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 3,
  },
  metaText: {
    fontSize: 12,
    flexShrink: 1,
  },
  going: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 4,
  },
});
