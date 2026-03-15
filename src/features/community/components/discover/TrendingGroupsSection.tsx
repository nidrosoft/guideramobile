/**
 * TRENDING GROUPS SECTION
 *
 * Horizontal scroll of trending/popular community groups.
 * Used inside DiscoverFeed. Data provided via props from parent.
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { People } from 'iconsax-react-native';
import { spacing } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import CommunityCard from '../CommunityCard';
import SectionHeader from '../SectionHeader';
import { CommunityPreview } from '../../types/community.types';

interface TrendingGroupsSectionProps {
  groups: CommunityPreview[];
  loading?: boolean;
  onGroupPress: (groupId: string) => void;
  onSeeAll?: () => void;
}

export default function TrendingGroupsSection({
  groups,
  loading = false,
  onGroupPress,
  onSeeAll,
}: TrendingGroupsSectionProps) {
  const { colors: tc } = useTheme();

  if (!loading && groups.length === 0) return null;

  return (
    <View style={styles.section}>
      <SectionHeader title="Trending Groups" onSeeAll={onSeeAll} />
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={tc.primary} />
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalScroll}
        >
          {groups.map((group) => (
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
  horizontalScroll: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  cardWrapper: {
    width: 260,
  },
});
