/**
 * TRENDING GROUPS SECTION
 *
 * Horizontal scroll of trending/popular community groups.
 * Used inside DiscoverFeed.
 */

import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { spacing } from '@/styles';
import CommunityCard from '../CommunityCard';
import SectionHeader from '../SectionHeader';
import { CommunityPreview } from '../../types/community.types';

interface TrendingGroupsSectionProps {
  onGroupPress: (groupId: string) => void;
  onSeeAll?: () => void;
}

const MOCK_TRENDING_GROUPS: CommunityPreview[] = [
  {
    id: 'grp-1',
    name: 'Japan 2025 Travelers',
    avatar: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=200',
    coverImage: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400',
    memberCount: 12400,
    isVerified: true,
    type: 'destination',
    privacy: 'public',
    tags: ['Japan', '2025', 'Travel'],
    isMember: false,
  },
  {
    id: 'grp-2',
    name: 'Solo Female Travelers',
    avatar: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=200',
    coverImage: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400',
    memberCount: 45600,
    isVerified: true,
    type: 'interest',
    privacy: 'public',
    tags: ['Solo', 'Women', 'Safety'],
    isMember: true,
  },
  {
    id: 'grp-3',
    name: 'Digital Nomads Worldwide',
    avatar: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=200',
    coverImage: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400',
    memberCount: 28900,
    isVerified: true,
    type: 'interest',
    privacy: 'public',
    tags: ['Remote Work', 'Nomad', 'Coworking'],
    isMember: false,
  },
];

export default function TrendingGroupsSection({
  onGroupPress,
  onSeeAll,
}: TrendingGroupsSectionProps) {
  return (
    <View style={styles.section}>
      <SectionHeader title="Trending Groups" onSeeAll={onSeeAll} />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalScroll}
      >
        {MOCK_TRENDING_GROUPS.map((group) => (
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
