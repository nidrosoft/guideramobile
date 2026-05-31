/**
 * DISCOVER FEED
 *
 * Curated scrollable feed for the Discover tab.
 * Fetches real data from Supabase services and passes to child sections.
 * Shows trending groups, travelers, events, and popular destinations.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Discover } from 'iconsax-react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { spacing } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { buddyService } from '@/services/community/buddy.service';
import { notifyNewFollower } from '@/services/notifications/community-notifications';
import { CommunityPreview } from '../types/community.types';
import { BuddyMatch } from '../types/buddy.types';
import { EventPreview } from '../types/event.types';
import TrendingGroupsSection from './discover/TrendingGroupsSection';
import TripGroupsSection from './discover/TripGroupsSection';
import TravelersSection from './discover/TravelersSection';
import EventsPreviewSection from './discover/EventsPreviewSection';
import DestinationsSection from './discover/DestinationsSection';
import NearbyActivitiesSection from './discover/NearbyActivitiesSection';
import type { DestinationItem } from './discover';
import type { Activity } from '@/services/community/types/community.types';
import {
  clearConnectFeedCache,
  getOrSetConnectFeedCache,
} from '@/features/community/services/connectFeedCache';
import {
  getDiscoverCoreFeed,
  getDiscoverSecondaryFeed,
  getUserGroupIds,
} from '@/features/community/services/connectFeed.service';

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
  const router = useRouter();
  const { profile } = useAuth();
  const { showError } = require('@/contexts/ToastContext').useToast();
  const userId = profile?.id;

  const [refreshing, setRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Section data
  const [trendingGroups, setTrendingGroups] = useState<CommunityPreview[]>([]);
  const [tripGroups, setTripGroups] = useState<CommunityPreview[]>([]);
  const [tripDestination, setTripDestination] = useState<string | undefined>();
  const [travelers, setTravelers] = useState<BuddyMatch[]>([]);
  const [events, setEvents] = useState<EventPreview[]>([]);
  const [nearbyActivities, setNearbyActivities] = useState<Activity[]>([]);
  const [destinations, setDestinations] = useState<DestinationItem[]>([]);

  const secondaryRequestedRef = useRef(false);

  const loadCoreFeed = useCallback(async (forceRefresh = false) => {
    const cacheKey = `connect:discover:core:${userId || 'anonymous'}`;
    const data = await getOrSetConnectFeedCache(
      cacheKey,
      async () => {
        const memberGroupIds = await getUserGroupIds(userId);
        return getDiscoverCoreFeed({ userId, memberGroupIds });
      },
      { forceRefresh }
    );
    setTrendingGroups(data.trendingGroups);
    setEvents(data.events);
    setDestinations(data.destinations);
  }, [userId]);

  const loadSecondaryFeed = useCallback(async (forceRefresh = false) => {
    if (!userId && !forceRefresh) return;
    const cacheKey = `connect:discover:secondary:${userId || 'anonymous'}`;
    const data = await getOrSetConnectFeedCache(
      cacheKey,
      async () => {
        const memberGroupIds = await getUserGroupIds(userId);
        return getDiscoverSecondaryFeed({ userId, profile: profile as any, memberGroupIds });
      },
      { forceRefresh }
    );
    setTripGroups(data.tripGroups);
    setTripDestination(data.tripDestination);
    setTravelers(data.travelers);
    setNearbyActivities(data.nearbyActivities);
  }, [profile, userId]);

  const hasLoadedOnce = useRef(false);

  // Initial load
  useEffect(() => {
    loadCoreFeed().finally(() => setInitialLoading(false));
    hasLoadedOnce.current = true;
  }, [loadCoreFeed]);

  // Re-fetch membership state when screen regains focus (e.g. after joining from detail)
  useFocusEffect(
    useCallback(() => {
      if (hasLoadedOnce.current) {
        loadCoreFeed();
      }
    }, [loadCoreFeed])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    if (userId) {
      clearConnectFeedCache(`connect:discover:core:${userId}`);
      clearConnectFeedCache(`connect:discover:secondary:${userId}`);
    }
    secondaryRequestedRef.current = true;
    await Promise.all([loadCoreFeed(true), loadSecondaryFeed(true)]);
    setRefreshing(false);
  };

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (secondaryRequestedRef.current) return;
    if (event.nativeEvent.contentOffset.y < 120) return;
    secondaryRequestedRef.current = true;
    loadSecondaryFeed().catch(() => {});
  }, [loadSecondaryFeed]);

  const handleConnect = useCallback(async (targetUserId: string) => {
    if (!userId) return;
    try {
      await buddyService.sendRequest(userId, targetUserId);
      // Update local state to show pending
      setTravelers(prev => prev.map(t =>
        t.userId === targetUserId ? { ...t, connectionStatus: 'pending_sent' as any } : t
      ));
      if (userId) clearConnectFeedCache(`connect:discover:secondary:${userId}`);
      // Notify target user about the connection request
      const senderName = profile?.first_name ? `${profile.first_name} ${profile.last_name || ''}`.trim() : 'Someone';
      notifyNewFollower(targetUserId, senderName, profile?.avatar_url).catch(() => {});
    } catch (err: any) {
      const msg = err?.message || '';
      if (msg.includes('already pending') || msg.includes('Already buddies')) {
        // Already pending or connected — just update UI, no error
        setTravelers(prev => prev.map(t =>
          t.userId === targetUserId ? { ...t, connectionStatus: 'pending_sent' as any } : t
        ));
      } else {
        showError(msg || 'Could not send connection request.');
      }
    }
  }, [userId, profile]);

  const hasNoContent = !initialLoading &&
    trendingGroups.length === 0 &&
    tripGroups.length === 0 &&
    travelers.length === 0 &&
    events.length === 0 &&
    nearbyActivities.length === 0 &&
    destinations.length === 0;

  // While loading: show a single centered spinner — no section headers, no structure leak
  if (initialLoading) {
    return (
      <View style={[styles.loadingState, { backgroundColor: tc.background }]}>
        <ActivityIndicator size="large" color={tc.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: tc.background }]}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={hasNoContent ? styles.emptyContentContainer : undefined}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={tc.primary}
        />
      }
      onScroll={handleScroll}
      scrollEventThrottle={48}
    >
      {/* Centered welcome state for fresh users */}
      {hasNoContent && (
        <View style={styles.welcomeContainer}>
          <View style={[styles.welcomeIconCircle, { backgroundColor: tc.primary + '15' }]}>
            <Discover size={40} color={tc.primary} variant="Bold" />
          </View>
          <Text style={[styles.welcomeTitle, { color: tc.textPrimary }]}>
            Discover What's Happening
          </Text>
          <Text style={[styles.welcomeSubtitle, { color: tc.textSecondary }]}>
            This is your feed — as travelers join groups, post updates, and create events, everything will show up right here.{'\n\n'}Switch to the Groups or Events tab to start exploring, or check back soon as the network grows.
          </Text>
        </View>
      )}

      <TrendingGroupsSection
        groups={trendingGroups}
        loading={false}
        onGroupPress={onGroupPress}
        onSeeAll={onSeeAllGroups}
      />

      <TripGroupsSection
        groups={tripGroups}
        destinationName={tripDestination}
        loading={false}
        onGroupPress={onGroupPress}
      />

      <TravelersSection
        travelers={travelers}
        loading={false}
        onTravelerPress={onTravelerPress}
        onConnect={handleConnect}
        onSeeAll={onSeeAllTravelers}
        isPremium={isPremium}
      />

      <EventsPreviewSection
        events={events}
        loading={false}
        onEventPress={onEventPress}
        onSeeAll={onSeeAllEvents}
      />

      <NearbyActivitiesSection
        activities={nearbyActivities}
        onActivityPress={(id) => router.push(`/community/activity/${id}`)}
        onSeeAll={() => router.push('/community/live-map')}
      />

      <DestinationsSection
        destinations={destinations}
        loading={false}
        onDestinationPress={onDestinationPress}
      />

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  bottomPadding: {
    height: 100,
  },
  welcomeContainer: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  welcomeIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 10,
  },
  welcomeSubtitle: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    maxWidth: 300,
  },
});
