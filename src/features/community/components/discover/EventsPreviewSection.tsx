/**
 * EVENTS PREVIEW SECTION
 *
 * Shows a few upcoming events inside DiscoverFeed.
 * "See All" navigates to the full Events tab.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { spacing } from '@/styles';
import EventCard from '../EventCard';
import SectionHeader from '../SectionHeader';
import { EventPreview } from '../../types/event.types';

interface EventsPreviewSectionProps {
  onEventPress: (eventId: string) => void;
  onSeeAll?: () => void;
}

const MOCK_EVENTS: EventPreview[] = [
  {
    id: 'evt-1',
    communityId: 'grp-4',
    title: 'Tokyo Street Food Tour',
    coverImage: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400',
    type: 'food_drink',
    status: 'upcoming',
    location: { city: 'Tokyo', country: 'Japan', isVirtual: false },
    startDate: new Date(Date.now() + 1000 * 60 * 60 * 24),
    attendeeCount: 12,
    myRSVP: 'none',
  },
  {
    id: 'evt-2',
    communityId: 'grp-1',
    title: 'Cherry Blossom Photography Walk',
    coverImage: 'https://images.unsplash.com/photo-1522383225653-ed111181a951?w=400',
    type: 'outdoor',
    status: 'upcoming',
    location: { city: 'Tokyo', country: 'Japan', isVirtual: false },
    startDate: new Date(Date.now() + 1000 * 60 * 60 * 72),
    attendeeCount: 24,
    myRSVP: 'none',
  },
];

export default function EventsPreviewSection({
  onEventPress,
  onSeeAll,
}: EventsPreviewSectionProps) {
  return (
    <View style={styles.section}>
      <SectionHeader
        title="Happening This Week"
        onSeeAll={onSeeAll}
      />
      <View style={styles.listContainer}>
        {MOCK_EVENTS.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            variant="list"
            onPress={() => onEventPress(event.id)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: spacing.lg,
  },
  listContainer: {
    paddingHorizontal: spacing.lg,
  },
});
