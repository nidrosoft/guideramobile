/**
 * TRIP GROUPS SECTION
 *
 * Groups contextual to the user's upcoming trip destination.
 * Horizontal scroll inside DiscoverFeed.
 */

import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { spacing } from '@/styles';
import CommunityCard from '../CommunityCard';
import SectionHeader from '../SectionHeader';
import { CommunityPreview } from '../../types/community.types';

interface TripGroupsSectionProps {
  onGroupPress: (groupId: string) => void;
}

const MOCK_TRIP_GROUPS: CommunityPreview[] = [
  {
    id: 'grp-4',
    name: 'Tokyo Foodies',
    avatar: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=200',
    coverImage: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400',
    memberCount: 2800,
    isVerified: false,
    type: 'destination',
    privacy: 'public',
    tags: ['Tokyo', 'Food', 'Ramen'],
    isMember: false,
    destination: { city: 'Tokyo', country: 'Japan' },
  },
  {
    id: 'grp-5',
    name: 'Tokyo Nightlife',
    avatar: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=200',
    coverImage: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=400',
    memberCount: 1560,
    isVerified: false,
    type: 'destination',
    privacy: 'public',
    tags: ['Tokyo', 'Nightlife', 'Bars'],
    isMember: false,
    destination: { city: 'Tokyo', country: 'Japan' },
  },
];

export default function TripGroupsSection({ onGroupPress }: TripGroupsSectionProps) {
  return (
    <View style={styles.section}>
      <SectionHeader title="Groups for Your Next Trip" subtitle="Tokyo" />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalScroll}
      >
        {MOCK_TRIP_GROUPS.map((group) => (
          <View key={group.id} style={styles.cardWrapper}>
            <CommunityCard
              community={group}
              variant="horizontal"
              onPress={() => onGroupPress(group.id)}
              showJoinButton
            />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: spacing.lg,
  },
  horizontalScroll: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  cardWrapper: {
    width: 260,
  },
});
