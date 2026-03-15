/**
 * TRIP GROUPS SECTION
 *
 * Groups contextual to the user's upcoming trip destination.
 * Horizontal scroll inside DiscoverFeed. Data provided via props.
 */

import React from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { spacing } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import CommunityCard from '../CommunityCard';
import SectionHeader from '../SectionHeader';
import { CommunityPreview } from '../../types/community.types';

interface TripGroupsSectionProps {
  groups: CommunityPreview[];
  destinationName?: string;
  loading?: boolean;
  onGroupPress: (groupId: string) => void;
}

export default function TripGroupsSection({
  groups,
  destinationName,
  loading = false,
  onGroupPress,
}: TripGroupsSectionProps) {
  const { colors: tc } = useTheme();

  if (!loading && groups.length === 0) return null;

  return (
    <View style={styles.section}>
      <SectionHeader
        title="Groups for Your Next Trip"
        subtitle={destinationName}
      />
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
