/**
 * Activity Service
 * Handles meetup activities for the Community system
 */

import { supabase } from '@/lib/supabase/client';
import {
  Activity,
  ActivityParticipant,
  CreateActivityInput,
  UserProfile,
} from './types/community.types';

class ActivityService {
  /**
   * Create a new activity (meetup proposal)
   */
  async createActivity(userId: string, data: CreateActivityInput): Promise<Activity> {
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
        location_name: data.location.name,
        location_address: data.location.address,
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
   * Join an activity
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
      .single();

    if (existing) throw new Error('Already joined');

    // Join
    await supabase.from('activity_participants').insert({
      activity_id: activityId,
      user_id: userId,
      status: 'going',
    });

    // Update count
    const newCount = activity.participantCount + 1;
    const updates: any = { participant_count: newCount };

    // Check if now full
    if (activity.maxParticipants && newCount >= activity.maxParticipants) {
      updates.status = 'full';
    }

    await supabase
      .from('community_activities')
      .update(updates)
      .eq('id', activityId);
  }

  /**
   * Leave an activity
   */
  async leaveActivity(userId: string, activityId: string): Promise<void> {
    const activity = await this.getActivity(activityId);
    if (!activity) throw new Error('Activity not found');

    if (activity.createdBy === userId) {
      throw new Error('Creator cannot leave. Cancel the activity instead.');
    }

    await supabase
      .from('activity_participants')
      .delete()
      .eq('activity_id', activityId)
      .eq('user_id', userId);

    // Update count and status
    const newCount = Math.max(0, activity.participantCount - 1);
    await supabase
      .from('community_activities')
      .update({
        participant_count: newCount,
        status: activity.status === 'full' ? 'open' : activity.status,
      })
      .eq('id', activityId);
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

    await supabase
      .from('community_activities')
      .update({ status: 'cancelled' })
      .eq('id', activityId);
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
   * Get nearby activities
   */
  async getNearbyActivities(
    userId: string,
    latitude: number,
    longitude: number,
    radiusKm: number = 10
  ): Promise<Activity[]> {
    // Get activities within radius that are open
    const { data, error } = await supabase
      .from('community_activities')
      .select(`
        *,
        creator:profiles!created_by(id, first_name, last_name, avatar_url),
        participants:activity_participants(
          user:profiles(id, first_name, last_name, avatar_url)
        )
      `)
      .eq('status', 'open')
      .gt('expires_at', new Date().toISOString())
      .eq('visibility', 'everyone')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw new Error(error.message);

    // Filter by distance (client-side for now, can use PostGIS later)
    const activities = (data || [])
      .map((a) => ({
        ...this.mapActivity(a),
        distance: this.calculateDistance(latitude, longitude, a.latitude, a.longitude),
      }))
      .filter((a) => a.distance <= radiusKm)
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
      .filter((d) => d.activity)
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
  // HELPER METHODS
  // ============================================

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    if (!lat2 || !lon2) return Infinity;
    const R = 6371; // Earth's radius in km
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
      locationName: data.location_name,
      locationAddress: data.location_address,
      latitude: data.latitude ? parseFloat(data.latitude) : undefined,
      longitude: data.longitude ? parseFloat(data.longitude) : undefined,
      placeId: data.place_id,
      timing: data.timing,
      scheduledFor: data.scheduled_for ? new Date(data.scheduled_for) : undefined,
      durationMinutes: data.duration_minutes,
      maxParticipants: data.max_participants,
      participantCount: data.participant_count,
      visibility: data.visibility,
      status: data.status,
      createdAt: new Date(data.created_at),
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
}

export const activityService = new ActivityService();
export default activityService;
