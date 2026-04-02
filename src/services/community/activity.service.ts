/**
 * Activity Service
 * Handles meetup activities for the Pulse (Connect) system.
 * City-based activity discovery with real-time updates.
 */

import { supabase } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';
import {
  Activity,
  ActivityParticipant,
  CreateActivityInput,
  UserProfile,
} from './types/community.types';

export interface ActivityComment {
  id: string;
  activityId: string;
  authorId: string;
  content: string;
  parentCommentId?: string;
  likeCount: number;
  createdAt: Date;
  updatedAt: Date;
  author?: UserProfile;
  isLiked?: boolean;
}

export interface UpdateActivityInput {
  title?: string;
  description?: string;
  coverImageUrl?: string;
  locationName?: string;
  locationAddress?: string;
  city?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  timing?: 'now' | 'today' | 'tomorrow' | 'specific';
  scheduledFor?: Date;
  maxParticipants?: number;
  visibility?: 'everyone' | 'buddies_only' | 'selected';
}

class ActivityService {
  /**
   * Create a new activity (meetup proposal)
   */
  async createActivity(userId: string, data: CreateActivityInput): Promise<Activity> {
    // C3: Creation cooldown — max 3 activities per hour per user
    const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
    const { count: recentCount } = await supabase
      .from('community_activities')
      .select('id', { count: 'exact', head: true })
      .eq('created_by', userId)
      .gte('created_at', oneHourAgo);
    if ((recentCount || 0) >= 3) {
      throw new Error('You can create up to 3 activities per hour. Please wait.');
    }

    // Calculate expiry
    const now = new Date();
    let expiresAt: Date;

    switch (data.timing) {
      case 'now':
        expiresAt = new Date(now.getTime() + (data.expiresIn || 4) * 60 * 60 * 1000);
        break;
      case 'today':
        expiresAt = new Date(now);
        expiresAt.setHours(23, 59, 59, 999);
        break;
      case 'tomorrow':
        expiresAt = new Date(now);
        expiresAt.setDate(expiresAt.getDate() + 1);
        expiresAt.setHours(23, 59, 59, 999);
        break;
      case 'specific':
        expiresAt = new Date(data.scheduledFor!);
        expiresAt.setHours(expiresAt.getHours() + 2);
        break;
      default:
        expiresAt = new Date(now.getTime() + 6 * 60 * 60 * 1000);
    }

    const { data: activity, error } = await supabase
      .from('community_activities')
      .insert({
        created_by: userId,
        type: data.type,
        title: data.title,
        description: data.description,
        cover_image_url: data.coverImageUrl,
        location_name: data.location.name,
        location_address: data.location.address,
        city: data.city,
        country: data.country,
        latitude: data.location.latitude,
        longitude: data.location.longitude,
        place_id: data.location.placeId,
        timing: data.timing,
        scheduled_for: data.scheduledFor?.toISOString(),
        duration_minutes: data.duration,
        max_participants: data.maxParticipants,
        visibility: data.visibility || 'everyone',
        status: 'open',
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    // Add creator as participant
    await supabase.from('activity_participants').insert({
      activity_id: activity.id,
      user_id: userId,
      status: 'going',
    });

    // Create chat room for activity
    await supabase.from('chat_rooms').insert({
      type: 'activity',
      reference_id: activity.id,
      name: data.title,
    });

    // Send invites if specified
    if (data.visibility === 'selected' && data.invitedUsers) {
      for (const invitedUserId of data.invitedUsers) {
        await this.inviteToActivity(activity.id, userId, invitedUserId);
      }
    }

    return this.mapActivity(activity);
  }

  /**
   * Get activity by ID
   */
  async getActivity(activityId: string): Promise<Activity | null> {
    const { data, error } = await supabase
      .from('community_activities')
      .select(`
        *,
        creator:profiles!created_by(id, first_name, last_name, avatar_url),
        participants:activity_participants(
          *,
          user:profiles(id, first_name, last_name, avatar_url)
        )
      `)
      .eq('id', activityId)
      .single();

    if (error || !data) return null;
    return this.mapActivity(data);
  }

  /**
   * Update an activity (creator only)
   */
  async updateActivity(userId: string, activityId: string, updates: UpdateActivityInput): Promise<Activity> {
    const activity = await this.getActivity(activityId);
    if (!activity) throw new Error('Activity not found');
    if (activity.createdBy !== userId) throw new Error('Only creator can edit');

    const dbUpdates: Record<string, any> = {};
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.coverImageUrl !== undefined) dbUpdates.cover_image_url = updates.coverImageUrl;
    if (updates.locationName !== undefined) dbUpdates.location_name = updates.locationName;
    if (updates.locationAddress !== undefined) dbUpdates.location_address = updates.locationAddress;
    if (updates.city !== undefined) dbUpdates.city = updates.city;
    if (updates.country !== undefined) dbUpdates.country = updates.country;
    if (updates.latitude !== undefined) dbUpdates.latitude = updates.latitude;
    if (updates.longitude !== undefined) dbUpdates.longitude = updates.longitude;
    if (updates.timing !== undefined) dbUpdates.timing = updates.timing;
    if (updates.scheduledFor !== undefined) dbUpdates.scheduled_for = updates.scheduledFor.toISOString();
    if (updates.maxParticipants !== undefined) dbUpdates.max_participants = updates.maxParticipants;
    if (updates.visibility !== undefined) dbUpdates.visibility = updates.visibility;

    const { data, error } = await supabase
      .from('community_activities')
      .update(dbUpdates)
      .eq('id', activityId)
      .select()
      .single();

    if (error) throw new Error(error.message);

    // Notify all participants that activity details changed
    this.notifyActivityEvent(activityId, userId, 'update').catch(() => {});

    return this.mapActivity(data);
  }

  /**
   * Join an activity
   * participant_count is auto-updated by DB trigger
   */
  async joinActivity(userId: string, activityId: string): Promise<void> {
    const activity = await this.getActivity(activityId);
    if (!activity) throw new Error('Activity not found');

    if (activity.status !== 'open') {
      throw new Error('Activity is no longer open');
    }

    if (activity.maxParticipants && activity.participantCount >= activity.maxParticipants) {
      throw new Error('Activity is full');
    }

    // Check not already joined
    const { data: existing } = await supabase
      .from('activity_participants')
      .select('id')
      .eq('activity_id', activityId)
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) throw new Error('Already joined');

    // Join — DB trigger handles participant_count + full status
    const { error } = await supabase.from('activity_participants').insert({
      activity_id: activityId,
      user_id: userId,
      status: 'going',
    });

    if (error) throw new Error(error.message);

    // Notify all participants that someone joined + check milestones
    this.notifyActivityEvent(activityId, userId, 'join').catch(() => {});

    // Check milestone thresholds (newCount = current + 1 since DB trigger hasn't fired yet)
    const newCount = (activity.participantCount || 0) + 1;
    this.checkMilestone(activityId, activity.createdBy, activity.title, newCount, activity.maxParticipants).catch(() => {});
  }

  /**
   * Leave an activity
   * participant_count is auto-updated by DB trigger
   */
  async leaveActivity(userId: string, activityId: string): Promise<void> {
    const activity = await this.getActivity(activityId);
    if (!activity) throw new Error('Activity not found');

    if (activity.createdBy === userId) {
      throw new Error('Creator cannot leave. Cancel the activity instead.');
    }

    const { error } = await supabase
      .from('activity_participants')
      .delete()
      .eq('activity_id', activityId)
      .eq('user_id', userId);

    if (error) throw new Error(error.message);

    // Notify activity creator that someone left
    this.notifyActivityEvent(activityId, userId, 'leave').catch(() => {});
  }

  /**
   * Cancel an activity (creator only)
   */
  async cancelActivity(userId: string, activityId: string): Promise<void> {
    const activity = await this.getActivity(activityId);
    if (!activity) throw new Error('Activity not found');

    if (activity.createdBy !== userId) {
      throw new Error('Only creator can cancel');
    }

    // Notify all participants BEFORE cleanup (so we can still read participants)
    await this.notifyActivityEvent(activityId, userId, 'cancel').catch(() => {});

    // Mark activity as cancelled
    await supabase
      .from('community_activities')
      .update({ status: 'cancelled' })
      .eq('id', activityId);

    // Remove all participants
    await supabase
      .from('activity_participants')
      .delete()
      .eq('activity_id', activityId);

    // Remove associated chat room
    await supabase
      .from('chat_rooms')
      .delete()
      .eq('reference_id', activityId)
      .eq('type', 'activity');

    // Remove any pending invites
    await supabase
      .from('activity_invites')
      .delete()
      .eq('activity_id', activityId);
  }

  /**
   * Invite user to activity
   */
  async inviteToActivity(activityId: string, inviterId: string, invitedUserId: string): Promise<void> {
    await supabase.from('activity_invites').insert({
      activity_id: activityId,
      invited_by: inviterId,
      invited_user_id: invitedUserId,
      status: 'pending',
    });
  }

  /**
   * Get activities by city (primary filter) with optional distance refinement.
   * City-based: shows all activities in the user's city.
   * If no city match, falls back to bounding-box distance filter.
   */
  async getNearbyActivities(
    userId: string,
    latitude: number,
    longitude: number,
    options?: { city?: string; radiusKm?: number }
  ): Promise<Activity[]> {
    const radiusKm = options?.radiusKm || 30;
    const city = options?.city;

    let query = supabase
      .from('community_activities')
      .select(`
        *,
        creator:profiles!created_by(id, first_name, last_name, avatar_url),
        participants:activity_participants(
          *,
          user:profiles(id, first_name, last_name, avatar_url)
        )
      `)
      .in('status', ['open', 'full'])
      .gt('expires_at', new Date().toISOString())
      .eq('visibility', 'everyone')
      .order('created_at', { ascending: false })
      .limit(100);

    // City-based filter (primary)
    if (city) {
      query = query.ilike('city', `%${city}%`);
    } else {
      // Bounding box fallback (~30km)
      const latDelta = radiusKm / 111;
      const lngDelta = radiusKm / (111 * Math.cos(latitude * Math.PI / 180));
      query = query
        .gte('latitude', latitude - latDelta)
        .lte('latitude', latitude + latDelta)
        .gte('longitude', longitude - lngDelta)
        .lte('longitude', longitude + lngDelta);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    // Filter out activities from blocked users
    const blockedIds = await this.getBlockedUserIds(userId);

    // Add distance and sort by nearest
    const activities = (data || [])
      .filter(a => !blockedIds.has(a.created_by))
      .map((a) => ({
        ...this.mapActivity(a),
        distance: this.calculateDistance(latitude, longitude, a.latitude, a.longitude),
      }))
      .sort((a, b) => a.distance - b.distance);

    return activities;
  }

  /**
   * Get user's activities
   */
  async getUserActivities(userId: string): Promise<Activity[]> {
    const { data, error } = await supabase
      .from('activity_participants')
      .select(`
        activity:community_activities(
          *,
          creator:profiles!created_by(id, first_name, last_name, avatar_url)
        )
      `)
      .eq('user_id', userId)
      .order('joined_at', { ascending: false });

    if (error) throw new Error(error.message);

    return (data || [])
      .filter((d) => d.activity && (d.activity as any).status !== 'cancelled')
      .map((d) => this.mapActivity(d.activity));
  }

  /**
   * Get activity participants
   */
  async getParticipants(activityId: string): Promise<ActivityParticipant[]> {
    const { data, error } = await supabase
      .from('activity_participants')
      .select(`
        *,
        user:profiles(id, first_name, last_name, avatar_url)
      `)
      .eq('activity_id', activityId)
      .order('joined_at', { ascending: true });

    if (error) throw new Error(error.message);
    return (data || []).map(this.mapParticipant);
  }

  // ============================================
  // COMMENTS
  // ============================================

  async getComments(activityId: string, userId?: string): Promise<ActivityComment[]> {
    const { data, error } = await supabase
      .from('activity_comments')
      .select(`
        *,
        author:profiles!author_id(id, first_name, last_name, avatar_url)
      `)
      .eq('activity_id', activityId)
      .order('created_at', { ascending: true });

    if (error) throw new Error(error.message);

    let likedIds = new Set<string>();
    if (userId && data?.length) {
      const { data: likes } = await supabase
        .from('activity_comment_likes')
        .select('comment_id')
        .eq('user_id', userId)
        .in('comment_id', data.map(c => c.id));
      likedIds = new Set((likes || []).map(l => l.comment_id));
    }

    return (data || []).map(c => this.mapComment(c, likedIds.has(c.id)));
  }

  async addComment(activityId: string, userId: string, content: string, parentCommentId?: string): Promise<ActivityComment> {
    // C1: Rate limit — max 5 comments per minute per user
    const oneMinAgo = new Date(Date.now() - 60000).toISOString();
    const { count } = await supabase
      .from('activity_comments')
      .select('id', { count: 'exact', head: true })
      .eq('author_id', userId)
      .gte('created_at', oneMinAgo);
    if ((count || 0) >= 5) throw new Error('Too many comments. Please wait a moment.');

    const { data, error } = await supabase
      .from('activity_comments')
      .insert({
        activity_id: activityId,
        author_id: userId,
        content,
        parent_comment_id: parentCommentId || null,
      })
      .select(`*, author:profiles!author_id(id, first_name, last_name, avatar_url)`)
      .single();

    if (error) throw new Error(error.message);

    // Notify all participants about new comment (with content preview)
    this.notifyActivityEvent(activityId, userId, 'comment', content).catch(() => {});

    return this.mapComment(data, false);
  }

  async deleteComment(commentId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('activity_comments')
      .delete()
      .eq('id', commentId)
      .eq('author_id', userId);
    if (error) throw new Error(error.message);
  }

  async toggleCommentLike(commentId: string, userId: string): Promise<boolean> {
    const { data: existing } = await supabase
      .from('activity_comment_likes')
      .select('id')
      .eq('comment_id', commentId)
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) {
      await supabase.from('activity_comment_likes').delete().eq('id', existing.id);
      return false;
    } else {
      await supabase.from('activity_comment_likes').insert({ comment_id: commentId, user_id: userId });
      return true;
    }
  }

  // ============================================
  // REALTIME
  // ============================================

  /**
   * Subscribe to live activity changes for a city/area.
   * Returns the channel so the caller can unsubscribe.
   */
  subscribeToActivities(
    city: string | null,
    onInsert: (activity: any) => void,
    onUpdate: (activity: any) => void,
    onDelete: (old: any) => void,
  ): RealtimeChannel {
    let channel = supabase.channel('pulse-activities');

    channel = channel
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'community_activities',
      }, (payload) => onInsert(payload.new))
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'community_activities',
      }, (payload) => onUpdate(payload.new))
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'community_activities',
      }, (payload) => onDelete(payload.old));

    channel.subscribe();
    return channel;
  }

  /**
   * Subscribe to participant changes for a specific activity.
   */
  subscribeToParticipants(
    activityId: string,
    onChange: () => void,
  ): RealtimeChannel {
    const channel = supabase
      .channel(`pulse-participants-${activityId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'activity_participants',
        filter: `activity_id=eq.${activityId}`,
      }, () => onChange())
      .subscribe();

    return channel;
  }

  /**
   * Subscribe to comments for a specific activity.
   */
  subscribeToComments(
    activityId: string,
    onNew: (comment: any) => void,
    onDelete: (old: any) => void,
  ): RealtimeChannel {
    const channel = supabase
      .channel(`pulse-comments-${activityId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'activity_comments',
        filter: `activity_id=eq.${activityId}`,
      }, (payload) => onNew(payload.new))
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'activity_comments',
        filter: `activity_id=eq.${activityId}`,
      }, (payload) => onDelete(payload.old))
      .subscribe();

    return channel;
  }

  unsubscribe(channel: RealtimeChannel): void {
    supabase.removeChannel(channel);
  }

  // ============================================
  // NOTIFICATIONS
  // ============================================

  /**
   * Comment notification cooldown cache.
   * Key: `${recipientId}_${activityId}`, Value: last notification timestamp.
   * Prevents a user from receiving more than 1 comment notification per activity per minute.
   */
  private commentCooldowns = new Map<string, number>();

  /**
   * Send in-app + push notifications for activity events.
   * Notifies ALL relevant participants (not just the creator).
   *
   * Events: join, leave, cancel, comment, update
   */
  private async notifyActivityEvent(
    activityId: string,
    triggerUserId: string,
    event: 'join' | 'leave' | 'cancel' | 'comment' | 'update',
    commentContent?: string
  ): Promise<void> {
    try {
      const activity = await this.getActivity(activityId);
      if (!activity) return;

      // Get trigger user's name
      const { data: triggerProfile } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', triggerUserId)
        .single();

      const triggerName = triggerProfile
        ? `${triggerProfile.first_name} ${triggerProfile.last_name}`.trim()
        : 'Someone';

      // Collect all participant user IDs (excluding the trigger user)
      const allParticipantIds = (activity.participants || [])
        .map(p => p.userId)
        .filter(uid => uid !== triggerUserId);

      // Determine recipients, title, and body based on event type
      let recipientIds: string[] = [];
      let title = '';
      let body = '';

      switch (event) {
        case 'join': {
          // Notify ALL existing participants (the joiner just inserted, so
          // they may or may not be in the participant list yet)
          recipientIds = allParticipantIds;
          // Make sure creator is included even if not in participants list
          if (activity.createdBy !== triggerUserId && !recipientIds.includes(activity.createdBy)) {
            recipientIds.push(activity.createdBy);
          }
          title = `${triggerName} joined your activity`;
          body = `${triggerName} is going to "${activity.title}"`;
          break;
        }

        case 'leave': {
          // Notify remaining participants (only if 3+ people were in the activity,
          // to avoid noise for small groups)
          const totalBefore = (activity.participantCount || 0);
          if (totalBefore >= 3) {
            recipientIds = allParticipantIds;
          } else {
            // Small group — only notify creator
            if (activity.createdBy !== triggerUserId) {
              recipientIds = [activity.createdBy];
            }
          }
          title = `${triggerName} left your activity`;
          body = `${triggerName} is no longer going to "${activity.title}"`;
          break;
        }

        case 'cancel': {
          // Notify ALL participants except the creator (who triggered the cancel)
          recipientIds = allParticipantIds;
          title = 'Activity cancelled';
          body = `"${activity.title}" has been cancelled by the host`;
          break;
        }

        case 'comment': {
          // Notify ALL participants except the commenter
          recipientIds = allParticipantIds;
          // Apply 1-minute cooldown per recipient per activity to prevent spam
          const now = Date.now();
          recipientIds = recipientIds.filter(uid => {
            const key = `${uid}_${activityId}`;
            const lastNotif = this.commentCooldowns.get(key);
            if (lastNotif && now - lastNotif < 60_000) return false;
            this.commentCooldowns.set(key, now);
            return true;
          });
          // Clean up old cooldown entries (older than 5 minutes)
          for (const [key, ts] of this.commentCooldowns) {
            if (now - ts > 300_000) this.commentCooldowns.delete(key);
          }
          title = `New comment on "${activity.title}"`;
          const preview = commentContent
            ? commentContent.length > 50 ? commentContent.substring(0, 47) + '...' : commentContent
            : '';
          body = preview ? `${triggerName}: ${preview}` : `${triggerName} commented`;
          break;
        }

        case 'update': {
          // Notify ALL participants except the creator (who made the update)
          recipientIds = allParticipantIds;
          title = `"${activity.title}" updated`;
          body = 'The host updated the activity details';
          break;
        }
      }

      if (recipientIds.length === 0) return;

      // De-duplicate recipient IDs
      recipientIds = [...new Set(recipientIds)];

      // Insert alerts for each recipient
      const actionUrl = `/community/activity/${activityId}`;
      const alerts = recipientIds.map(uid => ({
        user_id: uid,
        category_code: 'social',
        alert_type_code: `activity_${event}`,
        title,
        body,
        context: {
          activityId,
          activityTitle: activity.title,
          triggerUserId,
          triggerName,
          event,
        },
        action_url: actionUrl,
        status: 'delivered',
        channels_requested: ['push', 'in_app'],
      }));

      const { data: insertedAlerts } = await supabase.from('alerts').insert(alerts).select('id, user_id');

      // Fire-and-forget: trigger push delivery for each recipient
      if (insertedAlerts && insertedAlerts.length > 0) {
        this.dispatchPushNotifications(insertedAlerts, title, body, actionUrl, {
          activityId,
          event,
        }).catch(() => {});
      }
    } catch (err) {
      if (__DEV__) console.warn('notifyActivityEvent error:', err);
    }
  }

  /**
   * Check milestone thresholds and notify the activity creator.
   * Milestones: 5, 10, 20, and full capacity.
   */
  private async checkMilestone(
    activityId: string,
    creatorId: string,
    activityTitle: string,
    newCount: number,
    maxParticipants?: number | null
  ): Promise<void> {
    try {
      const milestones: { threshold: number; emoji: string; label: string }[] = [
        { threshold: 5, emoji: '🎉', label: 'Growing fast!' },
        { threshold: 10, emoji: '🔥', label: '10 going!' },
        { threshold: 20, emoji: '🚀', label: '20 and counting!' },
        { threshold: 50, emoji: '⭐', label: '50 people!' },
      ];

      let title = '';
      let body = '';

      // Check if we just crossed a milestone threshold
      for (const m of milestones) {
        if (newCount === m.threshold) {
          title = `${m.emoji} ${m.label}`;
          body = `${newCount} people are going to "${activityTitle}"!`;
          break;
        }
      }

      // Check if activity just became full
      if (!title && maxParticipants && newCount >= maxParticipants) {
        title = '🎊 Activity is full!';
        body = `"${activityTitle}" has reached capacity (${maxParticipants})`;
      }

      if (!title) return;

      const actionUrl = `/community/activity/${activityId}`;
      const { data: inserted } = await supabase.from('alerts').insert({
        user_id: creatorId,
        category_code: 'social',
        alert_type_code: 'activity_milestone',
        title,
        body,
        context: { activityId, activityTitle, participantCount: newCount },
        action_url: actionUrl,
        status: 'delivered',
        channels_requested: ['push', 'in_app'],
      }).select('id, user_id');

      if (inserted && inserted.length > 0) {
        this.dispatchPushNotifications(inserted, title, body, actionUrl, {
          activityId,
          event: 'milestone',
        }).catch(() => {});
      }
    } catch (err) {
      if (__DEV__) console.warn('checkMilestone error:', err);
    }
  }

  /**
   * Dispatch push notifications via SECURITY DEFINER RPC.
   * The RPC reads device tokens server-side (bypasses client RLS restrictions).
   */
  private async dispatchPushNotifications(
    alerts: { id: string; user_id: string }[],
    title: string,
    body: string,
    actionUrl: string,
    data: Record<string, unknown>
  ): Promise<void> {
    try {
      const userIds = [...new Set(alerts.map(a => a.user_id))];
      if (userIds.length === 0) return;

      await supabase.rpc('send_push_to_users', {
        user_ids: userIds,
        push_title: title,
        push_body: body,
        push_data: { actionUrl, ...data },
      });
    } catch (err) {
      if (__DEV__) console.warn('dispatchPushNotifications error:', err);
    }
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  /**
   * Get IDs of users blocked by/blocking this user.
   */
  private async getBlockedUserIds(userId: string): Promise<Set<string>> {
    const { data } = await supabase
      .from('user_blocks')
      .select('blocker_id, blocked_id')
      .or(`blocker_id.eq.${userId},blocked_id.eq.${userId}`);

    const ids = new Set<string>();
    for (const row of data || []) {
      if (row.blocker_id === userId) ids.add(row.blocked_id);
      else ids.add(row.blocker_id);
    }
    return ids;
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    if (!lat2 || !lon2) return Infinity;
    const R = 6371;
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  private mapActivity(data: any): Activity {
    return {
      id: data.id,
      createdBy: data.created_by,
      type: data.type,
      title: data.title,
      description: data.description,
      coverImageUrl: data.cover_image_url,
      locationName: data.location_name,
      locationAddress: data.location_address,
      city: data.city,
      country: data.country,
      latitude: data.latitude ? parseFloat(data.latitude) : undefined,
      longitude: data.longitude ? parseFloat(data.longitude) : undefined,
      placeId: data.place_id,
      timing: data.timing,
      scheduledFor: data.scheduled_for ? new Date(data.scheduled_for) : undefined,
      durationMinutes: data.duration_minutes,
      maxParticipants: data.max_participants,
      participantCount: data.participant_count || 0,
      visibility: data.visibility,
      status: data.status,
      createdAt: new Date(data.created_at),
      updatedAt: data.updated_at ? new Date(data.updated_at) : undefined,
      expiresAt: new Date(data.expires_at),
      creator: data.creator ? {
        id: data.creator.id,
        firstName: data.creator.first_name,
        lastName: data.creator.last_name,
        avatarUrl: data.creator.avatar_url,
      } : undefined,
      participants: data.participants?.map(this.mapParticipant),
    };
  }

  private mapParticipant(data: any): ActivityParticipant {
    return {
      id: data.id,
      activityId: data.activity_id,
      userId: data.user_id,
      status: data.status,
      joinedAt: new Date(data.joined_at),
      user: data.user ? {
        id: data.user.id,
        firstName: data.user.first_name,
        lastName: data.user.last_name,
        avatarUrl: data.user.avatar_url,
      } : undefined,
    };
  }

  private mapComment(data: any, isLiked: boolean): ActivityComment {
    return {
      id: data.id,
      activityId: data.activity_id,
      authorId: data.author_id,
      content: data.content,
      parentCommentId: data.parent_comment_id,
      likeCount: data.like_count || 0,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      isLiked,
      author: data.author ? {
        id: data.author.id,
        firstName: data.author.first_name,
        lastName: data.author.last_name,
        avatarUrl: data.author.avatar_url,
      } : undefined,
    };
  }
}

export const activityService = new ActivityService();
export default activityService;
