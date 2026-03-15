/**
 * EVENTS PREVIEW SECTION
 *
 * Shows a few upcoming events inside DiscoverFeed.
 * "See All" navigates to the full Events tab. Data provided via props.
 */

import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { spacing } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import EventCard from '../EventCard';
import SectionHeader from '../SectionHeader';
import { EventPreview } from '../../types/event.types';

interface EventsPreviewSectionProps {
  events: EventPreview[];
  loading?: boolean;
  onEventPress: (eventId: string) => void;
  onSeeAll?: () => void;
}

export default function EventsPreviewSection({
  events,
  loading = false,
  onEventPress,
  onSeeAll,
}: EventsPreviewSectionProps) {
  const { colors: tc } = useTheme();

  if (!loading && events.length === 0) return null;

  return (
    <View style={styles.section}>
      <SectionHeader
        title="Happening This Week"
        onSeeAll={onSeeAll}
      />
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={tc.primary} />
        </View>
      ) : (
        <View style={styles.listContainer}>
          {events.slice(0, 3).map((event) => (
            <EventCard
              key={event.id}
              event={event}
              variant="list"
              onPress={() => onEventPress(event.id)}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: spacing.lg,
  },
  loadingContainer: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  listContainer: {
    paddingHorizontal: spacing.lg,
  },
});
