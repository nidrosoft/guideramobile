import { supabase } from '@/lib/supabase/client';
import { groupService } from '@/services/community/group.service';
import { buddyService } from '@/services/community/buddy.service';
import { activityService } from '@/services/community/activity.service';
import { eventService } from '@/services/community/event.service';
import type { CommunityPreview } from '@/features/community/types/community.types';
import type { BuddyMatch } from '@/features/community/types/buddy.types';
import type { EventPreview } from '@/features/community/types/event.types';
import type { DestinationItem } from '@/features/community/components/discover';
import type { Activity } from '@/services/community/types/community.types';

export interface ConnectFeedCursors {
  groups?: string | null;
  events?: string | null;
  destinations?: string | null;
}

export interface DiscoverCoreFeedData {
  trendingGroups: CommunityPreview[];
  events: EventPreview[];
  destinations: DestinationItem[];
  cursors: ConnectFeedCursors;
}

export interface DiscoverSecondaryFeedData {
  tripGroups: CommunityPreview[];
  tripDestination?: string;
  travelers: BuddyMatch[];
  nearbyActivities: Activity[];
}

export interface DiscoverCoreFeedOptions {
  userId?: string;
  memberGroupIds?: Set<string>;
  limit?: number;
  cursors?: ConnectFeedCursors;
}

export interface DiscoverSecondaryFeedOptions {
  userId?: string;
  profile?: Record<string, any> | null;
  memberGroupIds?: Set<string>;
}

function mapGroupToPreview(g: any, memberGroupIds: Set<string>): CommunityPreview {
  return {
    id: g.id,
    name: g.name,
    avatar: g.groupPhotoUrl || g.group_photo_url || g.coverImage || g.coverPhotoUrl || '',
    coverImage: g.coverImage || g.coverPhotoUrl || g.cover_photo_url || g.groupPhotoUrl || '',
    memberCount: g.memberCount || 0,
    isVerified: Boolean(g.isVerified || g.isOfficial),
    isOfficial: Boolean(g.isOfficial),
    type: g.category || 'interest',
    privacy: g.privacy || 'public',
    tags: g.tags || [],
    description: g.description,
    destination: g.destinationName
      ? { city: g.destinationName, country: g.destinationCountry || '' }
      : undefined,
    isMember: memberGroupIds.has(g.id),
  };
}

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

function mapDestination(d: any): DestinationItem {
  return {
    id: d.id,
    name: d.name,
    country: d.country,
    image: d.image || '',
    travelerCount: Math.round(d.travelerCount || 0),
  };
}

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

export async function getUserGroupIds(userId?: string): Promise<Set<string>> {
  if (!userId) return new Set();

  try {
    const userGroups = await groupService.getUserGroups(userId);
    return new Set(userGroups.map((membership) => membership.group.id));
  } catch {
    return new Set();
  }
}

export async function getDiscoverCoreFeed(
  options: DiscoverCoreFeedOptions = {}
): Promise<DiscoverCoreFeedData> {
  const memberGroupIds = options.memberGroupIds || new Set<string>();
  const { data, error } = await supabase.rpc('connect_discover_feed', {
    p_user_id: options.userId || null,
    p_groups_limit: options.limit ?? 6,
    p_groups_cursor: options.cursors?.groups || null,
    p_events_limit: 5,
    p_events_cursor: options.cursors?.events || null,
    p_destinations_limit: 8,
    p_destinations_cursor: options.cursors?.destinations || null,
  });

  if (error) {
    if (isSchemaCacheRpcMiss(error)) {
      return getDiscoverCoreFeedFallback(options, memberGroupIds);
    }
    throw new Error(error.message);
  }

  return {
    trendingGroups: (data?.groups || []).map((group: any) => mapGroupToPreview(group, memberGroupIds)),
    events: (data?.events || []).map(mapEventToPreview),
    destinations: (data?.destinations || []).map(mapDestination),
    cursors: data?.cursors || {},
  };
}

function isSchemaCacheRpcMiss(error: any): boolean {
  const message = String(error?.message || '');
  return error?.code === 'PGRST202' || (
    message.includes('connect_discover_feed') &&
    message.includes('schema cache')
  );
}

async function getDiscoverCoreFeedFallback(
  options: DiscoverCoreFeedOptions,
  memberGroupIds: Set<string>
): Promise<DiscoverCoreFeedData> {
  const [groupsResult, eventsResult, destinationsResult] = await Promise.allSettled([
    groupService.discoverGroups({ limit: options.limit ?? 6 }),
    eventService.getUpcomingEvents({ limit: 5 }),
    supabase
      .from('curated_destinations')
      .select('id, title, country, hero_image_url, thumbnail_url, gallery_urls, popularity_score')
      .eq('status', 'active')
      .order('popularity_score', { ascending: false })
      .limit(8),
  ]);

  const destinationRows = destinationsResult.status === 'fulfilled' && !destinationsResult.value.error
    ? destinationsResult.value.data || []
    : [];

  return {
    trendingGroups: groupsResult.status === 'fulfilled'
      ? (groupsResult.value as any[]).map((group) => mapGroupToPreview(group, memberGroupIds))
      : [],
    events: eventsResult.status === 'fulfilled'
      ? (eventsResult.value as any[]).map(mapEventToPreview)
      : [],
    destinations: destinationRows.map((destination: any) => mapDestination({
      id: destination.id,
      name: destination.title,
      country: destination.country,
      image: destination.hero_image_url || destination.thumbnail_url || destination.gallery_urls?.[0] || '',
      travelerCount: destination.popularity_score || 0,
    })),
    cursors: {},
  };
}

export async function getDiscoverSecondaryFeed({
  userId,
  profile,
  memberGroupIds = new Set<string>(),
}: DiscoverSecondaryFeedOptions = {}): Promise<DiscoverSecondaryFeedData> {
  const [tripResult, travelersResult, activitiesResult] = await Promise.allSettled([
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
    userId ? buddyService.getSuggestions(userId, 5) : Promise.resolve([]),
    (async () => {
      if (!userId || !profile?.latitude) return [];
      return activityService.getNearbyActivities(
        userId,
        parseFloat(String(profile.latitude)),
        parseFloat(String(profile.longitude)),
        { city: profile.city || undefined }
      );
    })(),
  ]);

  const rawTrip = tripResult.status === 'fulfilled'
    ? (tripResult.value as { groups?: any[]; destination?: string })
    : {};

  return {
    tripGroups: (rawTrip.groups || []).map((group: any) => mapGroupToPreview(group, memberGroupIds)),
    tripDestination: rawTrip.destination,
    travelers: travelersResult.status === 'fulfilled'
      ? (travelersResult.value as any[]).map(mapSuggestionToBuddyMatch)
      : [],
    nearbyActivities: activitiesResult.status === 'fulfilled'
      ? activitiesResult.value as Activity[]
      : [],
  };
}
