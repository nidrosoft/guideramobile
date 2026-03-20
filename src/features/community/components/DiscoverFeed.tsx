/**
 * DISCOVER FEED
 *
 * Curated scrollable feed for the Discover tab.
 * Fetches real data from Supabase services and passes to child sections.
 * Shows trending groups, travelers, events, and popular destinations.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Discover } from 'iconsax-react-native';
import { useRouter } from 'expo-router';
import { spacing } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { groupService } from '@/services/community/group.service';
import { buddyService } from '@/services/community/buddy.service';
import { notifyNewFollower } from '@/services/notifications/community-notifications';
import { eventService } from '@/services/community/event.service';
import { activityService } from '@/services/community/activity.service';
import { supabase } from '@/lib/supabase/client';
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

/** Map a Group from groupService to CommunityPreview for CommunityCard */
function mapGroupToPreview(g: any, memberGroupIds: Set<string>): CommunityPreview {
  return {
    id: g.id,
    name: g.name,
    avatar: g.groupPhotoUrl || g.coverPhotoUrl || '',
    coverImage: g.coverPhotoUrl || g.groupPhotoUrl || '',
    memberCount: g.memberCount || 0,
    isVerified: g.isVerified || false,
    type: (g.category as any) || 'interest',
    privacy: g.privacy || 'public',
    tags: g.tags || [],
    description: g.description,
    destination: g.destinationName
      ? { city: g.destinationName, country: g.destinationCountry || '' }
      : undefined,
    isMember: memberGroupIds.has(g.id),
  };
}

/** Map CommunityEvent to EventPreview for EventCard */
function mapEventToPreview(e: any): EventPreview {
  return {
    id: e.id,
    communityId: e.groupId || '',
    title: e.title,
    coverImage: e.coverImageUrl,
    type: (e.type === 'other' ? 'meetup' : e.type) as any,
    status: e.status as any,
    location: {
      city: e.locationName || 'Online',
      country: '',
      isVirtual: e.locationType === 'virtual',
    },
    startDate: e.startDate instanceof Date ? e.startDate : new Date(e.startDate),
    attendeeCount: e.attendeeCount || 0,
    myRSVP: 'none',
  };
}

/** Map BuddySuggestion to BuddyMatch for BuddyMatchCard */
function mapSuggestionToBuddyMatch(s: any): BuddyMatch {
  return {
    id: s.user.id,
    userId: s.user.id,
    firstName: s.user.firstName || '',
    lastName: s.user.lastName || '',
    avatar: s.user.avatarUrl || '',
    bio: s.user.bio || '',
    matchScore: s.matchScore || 0,
    matchReasons: (s.matchReasons || []).map((r: any) => r.label || r),
    travelStyles: s.user.travelStyles || [],
    languages: s.user.languages || [],
    verificationLevel: s.user.isVerified ? 'id' : 'none',
    countriesVisited: s.user.countryCount || 0,
    rating: s.user.averageRating || 0,
    connectionStatus: s.connectionStatus || s.status || 'none',
    sharedTrip: s.tripOverlap
      ? {
          destination: s.tripOverlap.destination,
          dates: `${new Date(s.tripOverlap.yourDates.start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(s.tripOverlap.yourDates.end).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
        }
      : undefined,
  };
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

  const fetchAllData = useCallback(async () => {
    // Get user's joined group IDs for isMember flag
    let memberGroupIds = new Set<string>();
    if (userId) {
      try {
        const userGroups = await groupService.getUserGroups(userId);
        memberGroupIds = new Set(userGroups.map(ug => ug.group.id));
      } catch { /* ignore */ }
    }

    // Fetch all sections in parallel
    const [
      trendingResult,
      tripResult,
      travelersResult,
      eventsResult,
      activitiesResult,
      destinationsResult,
    ] = await Promise.allSettled([
      // Trending groups — top by member count
      groupService.discoverGroups({ limit: 6 }),

      // Trip groups — based on user's next trip destination
      (async () => {
        if (!userId) return { groups: [], destination: undefined };
        const { data: nextTrip } = await supabase
          .from('trips')
          .select('primary_destination_name, primary_destination_code')
          .eq('user_id', userId)
          .gt('start_date', new Date().toISOString())
          .in('status', ['confirmed', 'planning', 'upcoming'])
          .order('start_date', { ascending: true })
          .limit(1)
          .maybeSingle();

        if (!nextTrip?.primary_destination_name) return { groups: [], destination: undefined };

        const groups = await groupService.discoverGroups({
          destination: nextTrip.primary_destination_code,
          limit: 5,
        });
        return { groups, destination: nextTrip.primary_destination_name };
      })(),

      // Buddy suggestions
      userId ? buddyService.getSuggestions(userId, 5) : Promise.resolve([]),

      // Upcoming events
      eventService.getUpcomingEvents({ limit: 5 }),

      // Nearby meetup activities — use profile location or skip
      (async () => {
        if (!userId) return [];
        const { data: prof } = await supabase
          .from('profiles')
          .select('latitude, longitude, city')
          .eq('id', userId)
          .single();
        if (!prof?.latitude) return [];
        return activityService.getNearbyActivities(
          userId,
          parseFloat(prof.latitude),
          parseFloat(prof.longitude),
          { city: prof.city || undefined }
        );
      })(),

      // Popular destinations from curated_destinations
      (async () => {
        const { data } = await supabase
          .from('curated_destinations')
          .select('id, name, country, gallery_images, popularity_score')
          .eq('status', 'active')
          .order('popularity_score', { ascending: false })
          .limit(8);

        return (data || []).map((d: any) => ({
          id: d.id,
          name: d.name,
          country: d.country,
          image: d.gallery_images?.[0] || '',
          travelerCount: Math.round(d.popularity_score || 0),
        }));
      })(),
    ]);

    // Process results
    if (trendingResult.status === 'fulfilled') {
      setTrendingGroups(trendingResult.value.map(g => mapGroupToPreview(g, memberGroupIds)));
    }

    if (tripResult.status === 'fulfilled') {
      const { groups, destination } = tripResult.value as any;
      setTripGroups((groups || []).map((g: any) => mapGroupToPreview(g, memberGroupIds)));
      setTripDestination(destination);
    }

    if (travelersResult.status === 'fulfilled') {
      setTravelers((travelersResult.value as any[]).map(mapSuggestionToBuddyMatch));
    }

    if (eventsResult.status === 'fulfilled') {
      setEvents((eventsResult.value as any[]).map(mapEventToPreview));
    }

    if (activitiesResult.status === 'fulfilled') {
      setNearbyActivities(activitiesResult.value as Activity[]);
    }

    if (destinationsResult.status === 'fulfilled') {
      setDestinations(destinationsResult.value as DestinationItem[]);
    }
  }, [userId]);

  // Initial load
  useEffect(() => {
    fetchAllData().finally(() => setInitialLoading(false));
  }, [fetchAllData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAllData();
    setRefreshing(false);
  };

  const handleConnect = useCallback(async (targetUserId: string) => {
    if (!userId) return;
    try {
      await buddyService.sendRequest(userId, targetUserId);
      // Update local state to show pending
      setTravelers(prev => prev.map(t =>
        t.userId === targetUserId ? { ...t, connectionStatus: 'pending_sent' as any } : t
      ));
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
        Alert.alert('Error', msg || 'Could not send connection request.');
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
        onActivityPress={(id) => router.push(`/community/activity/${id}` as any)}
        onSeeAll={() => router.push('/community/live-map' as any)}
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
