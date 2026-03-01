/**
 * DISCOVER FEED
 *
 * Curated scrollable feed for the Discover tab.
 * Shows trending groups, travelers, events, featured guides,
 * and popular destinations in a single-scroll experience.
 * No sub-tabs — just scroll and discover.
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { spacing } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import TrendingGroupsSection from './discover/TrendingGroupsSection';
import TripGroupsSection from './discover/TripGroupsSection';
import TravelersSection from './discover/TravelersSection';
import EventsPreviewSection from './discover/EventsPreviewSection';
import DestinationsSection from './discover/DestinationsSection';

interface DiscoverFeedProps {
  onGroupPress: (groupId: string) => void;
  onTravelerPress: (userId: string) => void;
  onEventPress: (eventId: string) => void;
  onDestinationPress?: (destinationId: string) => void;
  onSeeAllGroups?: () => void;
  onSeeAllTravelers?: () => void;
  onSeeAllEvents?: () => void;
  isPremium?: boolean;
}

export default function DiscoverFeed({
  onGroupPress,
  onTravelerPress,
  onEventPress,
  onDestinationPress,
  onSeeAllGroups,
  onSeeAllTravelers,
  onSeeAllEvents,
  isPremium = false,
}: DiscoverFeedProps) {
  const { colors: tc } = useTheme();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: tc.background }]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={tc.primary}
        />
      }
    >
      <TrendingGroupsSection
        onGroupPress={onGroupPress}
        onSeeAll={onSeeAllGroups}
      />

      <TripGroupsSection onGroupPress={onGroupPress} />

      <TravelersSection
        onTravelerPress={onTravelerPress}
        onSeeAll={onSeeAllTravelers}
        isPremium={isPremium}
      />

      <EventsPreviewSection
        onEventPress={onEventPress}
        onSeeAll={onSeeAllEvents}
      />

      <DestinationsSection onDestinationPress={onDestinationPress} />

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bottomPadding: {
    height: 100,
  },
});
