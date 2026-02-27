/**
 * Community Hooks
 * React hooks for community features
 */

import { useState, useEffect, useCallback } from 'react';
import { groupService, buddyService, activityService, eventService } from '@/services/community';
import type {
  Group,
  GroupMember,
  GroupJoinRequest,
  CreateGroupInput,
  GroupFilters,
  GroupRole,
  BuddySuggestion,
  BuddyConnection,
  UserProfile,
  Activity,
  CreateActivityInput,
  CommunityEvent,
  CreateEventInput,
  RSVPStatus,
} from '@/services/community/types/community.types';

// ============================================
// GROUP HOOKS
// ============================================

export function useGroups(userId: string | undefined) {
  const [groups, setGroups] = useState<{ group: Group; role: GroupRole; unreadCount: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGroups = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const data = await groupService.getUserGroups(userId);
      setGroups(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  return { groups, loading, error, refetch: fetchGroups };
}

export function useGroup(groupId: string | undefined) {
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!groupId) return;
    setLoading(true);
    groupService.getGroup(groupId)
      .then(setGroup)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [groupId]);

  return { group, loading, error };
}

export function useGroupMembers(groupId: string | undefined) {
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMembers = useCallback(async () => {
    if (!groupId) return;
    setLoading(true);
    try {
      const data = await groupService.getMembers(groupId);
      setMembers(data);
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  return { members, loading, refetch: fetchMembers };
}

export function useGroupJoinRequests(groupId: string | undefined) {
  const [requests, setRequests] = useState<GroupJoinRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = useCallback(async () => {
    if (!groupId) return;
    setLoading(true);
    try {
      const data = await groupService.getJoinRequests(groupId);
      setRequests(data);
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  return { requests, loading, refetch: fetchRequests };
}

export function useDiscoverGroups(filters: GroupFilters) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    groupService.discoverGroups(filters)
      .then(setGroups)
      .finally(() => setLoading(false));
  }, [filters.category, filters.destination, filters.search]);

  return { groups, loading };
}

export function useGroupActions(userId: string | undefined) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createGroup = useCallback(async (data: CreateGroupInput) => {
    if (!userId) throw new Error('Not authenticated');
    setLoading(true);
    setError(null);
    try {
      return await groupService.createGroup(userId, data);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const joinGroup = useCallback(async (groupId: string, message?: string) => {
    if (!userId) throw new Error('Not authenticated');
    setLoading(true);
    setError(null);
    try {
      return await groupService.joinGroup(userId, groupId, message);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const leaveGroup = useCallback(async (groupId: string) => {
    if (!userId) throw new Error('Not authenticated');
    setLoading(true);
    try {
      await groupService.leaveGroup(userId, groupId);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const approveRequest = useCallback(async (requestId: string) => {
    if (!userId) throw new Error('Not authenticated');
    setLoading(true);
    try {
      await groupService.approveRequest(userId, requestId);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const rejectRequest = useCallback(async (requestId: string, reason?: string) => {
    if (!userId) throw new Error('Not authenticated');
    setLoading(true);
    try {
      await groupService.rejectRequest(userId, requestId, reason);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  return { createGroup, joinGroup, leaveGroup, approveRequest, rejectRequest, loading, error };
}

// ============================================
// BUDDY HOOKS
// ============================================

export function useBuddies(userId: string | undefined) {
  const [buddies, setBuddies] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBuddies = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const data = await buddyService.getBuddies(userId);
      setBuddies(data);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchBuddies();
  }, [fetchBuddies]);

  return { buddies, loading, refetch: fetchBuddies };
}

export function useBuddySuggestions(userId: string | undefined) {
  const [suggestions, setSuggestions] = useState<BuddySuggestion[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSuggestions = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const data = await buddyService.getSuggestions(userId);
      setSuggestions(data);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  return { suggestions, loading, refetch: fetchSuggestions };
}

export function usePendingBuddyRequests(userId: string | undefined) {
  const [requests, setRequests] = useState<{ connection: BuddyConnection; user: UserProfile }[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const data = await buddyService.getPendingRequests(userId);
      setRequests(data);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  return { requests, loading, refetch: fetchRequests };
}

export function useBuddyActions(userId: string | undefined) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendRequest = useCallback(async (targetId: string) => {
    if (!userId) throw new Error('Not authenticated');
    setLoading(true);
    setError(null);
    try {
      return await buddyService.sendRequest(userId, targetId);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const acceptRequest = useCallback(async (connectionId: string) => {
    if (!userId) throw new Error('Not authenticated');
    setLoading(true);
    try {
      await buddyService.acceptRequest(userId, connectionId);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const rejectRequest = useCallback(async (connectionId: string) => {
    if (!userId) throw new Error('Not authenticated');
    setLoading(true);
    try {
      await buddyService.rejectRequest(userId, connectionId);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const removeBuddy = useCallback(async (buddyId: string) => {
    if (!userId) throw new Error('Not authenticated');
    setLoading(true);
    try {
      await buddyService.removeBuddy(userId, buddyId);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const blockUser = useCallback(async (blockedId: string, reason?: string) => {
    if (!userId) throw new Error('Not authenticated');
    setLoading(true);
    try {
      await buddyService.blockUser(userId, blockedId, reason);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  return { sendRequest, acceptRequest, rejectRequest, removeBuddy, blockUser, loading, error };
}

// ============================================
// ACTIVITY HOOKS
// ============================================

export function useNearbyActivities(userId: string | undefined, location: { lat: number; lng: number } | null) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActivities = useCallback(async () => {
    if (!userId || !location) return;
    setLoading(true);
    try {
      const data = await activityService.getNearbyActivities(userId, location.lat, location.lng);
      setActivities(data);
    } finally {
      setLoading(false);
    }
  }, [userId, location?.lat, location?.lng]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  return { activities, loading, refetch: fetchActivities };
}

export function useUserActivities(userId: string | undefined) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    activityService.getUserActivities(userId)
      .then(setActivities)
      .finally(() => setLoading(false));
  }, [userId]);

  return { activities, loading };
}

export function useActivityActions(userId: string | undefined) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createActivity = useCallback(async (data: CreateActivityInput) => {
    if (!userId) throw new Error('Not authenticated');
    setLoading(true);
    setError(null);
    try {
      return await activityService.createActivity(userId, data);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const joinActivity = useCallback(async (activityId: string) => {
    if (!userId) throw new Error('Not authenticated');
    setLoading(true);
    try {
      await activityService.joinActivity(userId, activityId);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const leaveActivity = useCallback(async (activityId: string) => {
    if (!userId) throw new Error('Not authenticated');
    setLoading(true);
    try {
      await activityService.leaveActivity(userId, activityId);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const cancelActivity = useCallback(async (activityId: string) => {
    if (!userId) throw new Error('Not authenticated');
    setLoading(true);
    try {
      await activityService.cancelActivity(userId, activityId);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  return { createActivity, joinActivity, leaveActivity, cancelActivity, loading, error };
}

// ============================================
// EVENT HOOKS
// ============================================

export function useUpcomingEvents(groupId?: string) {
  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const data = await eventService.getUpcomingEvents({ groupId });
      setEvents(data);
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return { events, loading, refetch: fetchEvents };
}

export function useUserEvents(userId: string | undefined) {
  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    eventService.getUserEvents(userId)
      .then(setEvents)
      .finally(() => setLoading(false));
  }, [userId]);

  return { events, loading };
}

export function useEvent(eventId: string | undefined) {
  const [event, setEvent] = useState<CommunityEvent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!eventId) return;
    setLoading(true);
    eventService.getEvent(eventId)
      .then(setEvent)
      .finally(() => setLoading(false));
  }, [eventId]);

  return { event, loading };
}

export function useEventActions(userId: string | undefined) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createEvent = useCallback(async (data: CreateEventInput) => {
    if (!userId) throw new Error('Not authenticated');
    setLoading(true);
    setError(null);
    try {
      return await eventService.createEvent(userId, data);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const rsvp = useCallback(async (eventId: string, status: RSVPStatus) => {
    if (!userId) throw new Error('Not authenticated');
    setLoading(true);
    try {
      await eventService.rsvp(userId, eventId, status);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const cancelRsvp = useCallback(async (eventId: string) => {
    if (!userId) throw new Error('Not authenticated');
    setLoading(true);
    try {
      await eventService.cancelRsvp(userId, eventId);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const cancelEvent = useCallback(async (eventId: string) => {
    if (!userId) throw new Error('Not authenticated');
    setLoading(true);
    try {
      await eventService.cancelEvent(userId, eventId);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  return { createEvent, rsvp, cancelRsvp, cancelEvent, loading, error };
}
