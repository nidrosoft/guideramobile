/**
 * Buddy Service
 * Handles buddy connections and matching for the Community system
 */

import { supabase } from '@/lib/supabase/client';
import {
  BuddyConnection,
  BuddySuggestion,
  MatchReason,
  MatchCalculation,
  UserProfile,
} from './types/community.types';

class BuddyService {
  /**
   * Send buddy request
   */
  async sendRequest(requesterId: string, targetId: string): Promise<BuddyConnection> {
    if (requesterId === targetId) {
      throw new Error('Cannot buddy yourself');
    }

    // Check not blocked
    const blocked = await this.isBlocked(requesterId, targetId);
    if (blocked) throw new Error('Cannot connect with this user');

    // Order IDs for consistency
    const [userId1, userId2] = [requesterId, targetId].sort();

    // Check existing
    const { data: existing } = await supabase
      .from('buddy_connections')
      .select('*')
      .eq('user_id_1', userId1)
      .eq('user_id_2', userId2)
      .single();

    if (existing) {
      if (existing.status === 'connected') {
        throw new Error('Already buddies');
      }
      if (existing.status === 'pending') {
        throw new Error('Request already pending');
      }
    }

    // Create request
    const { data: connection, error } = await supabase
      .from('buddy_connections')
      .insert({
        user_id_1: userId1,
        user_id_2: userId2,
        requested_by: requesterId,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return this.mapConnection(connection);
  }

  /**
   * Accept buddy request
   */
  async acceptRequest(userId: string, connectionId: string): Promise<void> {
    const { data: connection, error } = await supabase
      .from('buddy_connections')
      .select('*')
      .eq('id', connectionId)
      .single();

    if (error || !connection) throw new Error('Connection not found');

    // Verify user is the recipient
    const isRecipient =
      (connection.user_id_1 === userId || connection.user_id_2 === userId) &&
      connection.requested_by !== userId;

    if (!isRecipient) {
      throw new Error('Cannot accept this request');
    }

    // Update connection
    await supabase
      .from('buddy_connections')
      .update({
        status: 'connected',
        connected_at: new Date().toISOString(),
      })
      .eq('id', connectionId);

    // Update buddy counts
    await this.updateBuddyCount(connection.user_id_1);
    await this.updateBuddyCount(connection.user_id_2);

    // Create DM conversation
    await supabase.from('direct_conversations').insert({
      user_id_1: connection.user_id_1,
      user_id_2: connection.user_id_2,
    });
  }

  /**
   * Reject buddy request
   */
  async rejectRequest(userId: string, connectionId: string): Promise<void> {
    const { data: connection } = await supabase
      .from('buddy_connections')
      .select('*')
      .eq('id', connectionId)
      .single();

    if (!connection) throw new Error('Connection not found');

    const isRecipient =
      (connection.user_id_1 === userId || connection.user_id_2 === userId) &&
      connection.requested_by !== userId;

    if (!isRecipient) {
      throw new Error('Cannot reject this request');
    }

    await supabase.from('buddy_connections').delete().eq('id', connectionId);
  }

  /**
   * Remove buddy connection
   */
  async removeBuddy(userId: string, buddyId: string): Promise<void> {
    const [userId1, userId2] = [userId, buddyId].sort();

    await supabase
      .from('buddy_connections')
      .delete()
      .eq('user_id_1', userId1)
      .eq('user_id_2', userId2);

    await this.updateBuddyCount(userId);
    await this.updateBuddyCount(buddyId);
  }

  /**
   * Get user's buddies
   */
  async getBuddies(userId: string): Promise<UserProfile[]> {
    const { data: connections } = await supabase
      .from('buddy_connections')
      .select('user_id_1, user_id_2')
      .or(`user_id_1.eq.${userId},user_id_2.eq.${userId}`)
      .eq('status', 'connected');

    if (!connections || connections.length === 0) return [];

    const buddyIds = connections.map((c) =>
      c.user_id_1 === userId ? c.user_id_2 : c.user_id_1
    );

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, avatar_url, nationality')
      .in('id', buddyIds);

    return (profiles || []).map(this.mapUserProfile);
  }

  /**
   * Get pending requests received
   */
  async getPendingRequests(userId: string): Promise<{ connection: BuddyConnection; user: UserProfile }[]> {
    const { data: connections } = await supabase
      .from('buddy_connections')
      .select('*')
      .or(`user_id_1.eq.${userId},user_id_2.eq.${userId}`)
      .eq('status', 'pending')
      .neq('requested_by', userId);

    if (!connections || connections.length === 0) return [];

    const requesterIds = connections.map((c) => c.requested_by);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, avatar_url, nationality')
      .in('id', requesterIds);

    const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

    return connections.map((c) => ({
      connection: this.mapConnection(c),
      user: this.mapUserProfile(profileMap.get(c.requested_by)),
    }));
  }

  /**
   * Get buddy suggestions based on matching algorithm
   */
  async getSuggestions(userId: string, limit = 20): Promise<BuddySuggestion[]> {
    const user = await this.getUserWithProfile(userId);
    if (!user) return [];

    // Get user's upcoming trips
    const { data: userTrips } = await supabase
      .from('trips')
      .select('id, primary_destination_code, primary_destination_name, start_date, end_date')
      .eq('user_id', userId)
      .gt('start_date', new Date().toISOString())
      .in('status', ['confirmed', 'planning']);

    const suggestions: BuddySuggestion[] = [];
    const existingBuddyIds = await this.getBuddyIds(userId);
    const blockedIds = await this.getBlockedIds(userId);
    const excludeIds = [...existingBuddyIds, ...blockedIds, userId];

    // Find users with similar destinations
    if (userTrips && userTrips.length > 0) {
      for (const trip of userTrips) {
        const { data: matchingTrips } = await supabase
          .from('trips')
          .select('user_id, primary_destination_name, start_date, end_date')
          .eq('primary_destination_code', trip.primary_destination_code)
          .not('user_id', 'in', `(${excludeIds.join(',')})`)
          .gte('end_date', trip.start_date)
          .lte('start_date', trip.end_date)
          .limit(10);

        if (matchingTrips) {
          for (const match of matchingTrips) {
            const matchUser = await this.getUserWithProfile(match.user_id);
            if (!matchUser) continue;

            const score = this.calculateMatchScore(user, matchUser);
            const overlapDays = this.calculateOverlapDays(
              new Date(trip.start_date),
              new Date(trip.end_date),
              new Date(match.start_date),
              new Date(match.end_date)
            );

            suggestions.push({
              user: matchUser,
              matchScore: score.finalScore,
              matchReasons: score.reasons,
              tripOverlap: {
                destination: trip.primary_destination_name,
                yourDates: { start: new Date(trip.start_date), end: new Date(trip.end_date) },
                theirDates: { start: new Date(match.start_date), end: new Date(match.end_date) },
                overlapDays,
              },
            });
          }
        }
      }
    }

    // Find users with similar interests
    const { data: similarUsers } = await supabase
      .from('user_social_profiles')
      .select('user_id, interests, travel_styles, languages')
      .not('user_id', 'in', `(${excludeIds.join(',')})`)
      .limit(30);

    if (similarUsers) {
      for (const profile of similarUsers) {
        if (suggestions.find((s) => s.user.id === profile.user_id)) continue;

        const matchUser = await this.getUserWithProfile(profile.user_id);
        if (!matchUser) continue;

        const score = this.calculateMatchScore(user, matchUser);
        if (score.finalScore >= 30) {
          suggestions.push({
            user: matchUser,
            matchScore: score.finalScore,
            matchReasons: score.reasons,
          });
        }
      }
    }

    // Sort by score and limit
    return suggestions
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit);
  }

  /**
   * Calculate match score between two users
   */
  calculateMatchScore(user1: UserProfile, user2: UserProfile): MatchCalculation {
    const factors: Record<string, number> = {};
    const reasons: MatchReason[] = [];

    // Interest overlap (25%)
    const interestScore = this.calculateInterestOverlap(
      user1.interests || [],
      user2.interests || []
    );
    factors.interests = interestScore;
    if (interestScore > 0.3) {
      reasons.push({ type: 'similar_interests', label: 'Similar interests', weight: interestScore });
    }

    // Travel style overlap (20%)
    const styleScore = this.calculateArrayOverlap(
      user1.travelStyles || [],
      user2.travelStyles || []
    );
    factors.travelStyle = styleScore;
    if (styleScore > 0.3) {
      reasons.push({ type: 'same_travel_style', label: 'Same travel style', weight: styleScore });
    }

    // Language overlap (15%)
    const langScore = this.calculateArrayOverlap(
      user1.languages || [],
      user2.languages || []
    );
    factors.language = langScore;
    if (langScore > 0.5) {
      reasons.push({ type: 'speaks_same_language', label: 'Speaks your language', weight: langScore });
    }

    // Nationality (10%)
    factors.nationality = user1.nationality === user2.nationality ? 1 : 0;
    if (factors.nationality === 1) {
      reasons.push({ type: 'same_nationality', label: 'Same nationality', weight: 1 });
    }

    // Calculate weighted score
    const weights = {
      interests: 0.25,
      travelStyle: 0.20,
      language: 0.15,
      nationality: 0.10,
    };

    let rawScore = 0;
    for (const [factor, weight] of Object.entries(weights)) {
      rawScore += (factors[factor] || 0) * weight;
    }

    // Normalize to 0-100
    const finalScore = Math.min(100, Math.round(rawScore * 100 / 0.7));

    return { factors, rawScore, finalScore, reasons };
  }

  /**
   * Check if users are blocked
   */
  async isBlocked(userId1: string, userId2: string): Promise<boolean> {
    const { data } = await supabase
      .from('user_blocks')
      .select('id')
      .or(`and(blocker_id.eq.${userId1},blocked_id.eq.${userId2}),and(blocker_id.eq.${userId2},blocked_id.eq.${userId1})`)
      .limit(1);

    return (data?.length || 0) > 0;
  }

  /**
   * Block a user
   */
  async blockUser(blockerId: string, blockedId: string, reason?: string): Promise<void> {
    await supabase.from('user_blocks').insert({
      blocker_id: blockerId,
      blocked_id: blockedId,
      reason,
    });

    // Remove any existing buddy connection
    await this.removeBuddy(blockerId, blockedId);
  }

  /**
   * Unblock a user
   */
  async unblockUser(blockerId: string, blockedId: string): Promise<void> {
    await supabase
      .from('user_blocks')
      .delete()
      .eq('blocker_id', blockerId)
      .eq('blocked_id', blockedId);
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  private async getUserWithProfile(userId: string): Promise<UserProfile | null> {
    const { data } = await supabase
      .from('profiles')
      .select(`
        id, first_name, last_name, avatar_url, nationality,
        social:user_social_profiles(interests, travel_styles, languages)
      `)
      .eq('id', userId)
      .single();

    if (!data) return null;

    return {
      id: data.id,
      firstName: data.first_name,
      lastName: data.last_name,
      avatarUrl: data.avatar_url,
      nationality: data.nationality,
      interests: data.social?.[0]?.interests || [],
      travelStyles: data.social?.[0]?.travel_styles || [],
      languages: data.social?.[0]?.languages || [],
    };
  }

  private async getBuddyIds(userId: string): Promise<string[]> {
    const { data } = await supabase
      .from('buddy_connections')
      .select('user_id_1, user_id_2')
      .or(`user_id_1.eq.${userId},user_id_2.eq.${userId}`)
      .eq('status', 'connected');

    if (!data) return [];
    return data.map((c) => (c.user_id_1 === userId ? c.user_id_2 : c.user_id_1));
  }

  private async getBlockedIds(userId: string): Promise<string[]> {
    const { data } = await supabase
      .from('user_blocks')
      .select('blocked_id')
      .eq('blocker_id', userId);

    return (data || []).map((b) => b.blocked_id);
  }

  private async updateBuddyCount(userId: string): Promise<void> {
    const buddyIds = await this.getBuddyIds(userId);
    await supabase
      .from('user_social_profiles')
      .update({ buddy_count: buddyIds.length })
      .eq('user_id', userId);
  }

  private calculateInterestOverlap(interests1: any[], interests2: any[]): number {
    if (interests1.length === 0 || interests2.length === 0) return 0;
    const ids1 = new Set(interests1.map((i) => (typeof i === 'string' ? i : i.id)));
    const ids2 = new Set(interests2.map((i) => (typeof i === 'string' ? i : i.id)));
    const intersection = [...ids1].filter((id) => ids2.has(id));
    return intersection.length / Math.max(ids1.size, ids2.size);
  }

  private calculateArrayOverlap(arr1: string[], arr2: string[]): number {
    if (arr1.length === 0 || arr2.length === 0) return 0;
    const set1 = new Set(arr1);
    const set2 = new Set(arr2);
    const intersection = [...set1].filter((x) => set2.has(x));
    return intersection.length / Math.max(set1.size, set2.size);
  }

  private calculateOverlapDays(start1: Date, end1: Date, start2: Date, end2: Date): number {
    const overlapStart = new Date(Math.max(start1.getTime(), start2.getTime()));
    const overlapEnd = new Date(Math.min(end1.getTime(), end2.getTime()));
    const diffTime = overlapEnd.getTime() - overlapStart.getTime();
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  }

  private mapConnection(data: any): BuddyConnection {
    return {
      id: data.id,
      userId1: data.user_id_1,
      userId2: data.user_id_2,
      requestedBy: data.requested_by,
      requestedAt: new Date(data.requested_at),
      status: data.status,
      connectedAt: data.connected_at ? new Date(data.connected_at) : undefined,
      blockedBy: data.blocked_by,
      blockedAt: data.blocked_at ? new Date(data.blocked_at) : undefined,
    };
  }

  private mapUserProfile(data: any): UserProfile {
    return {
      id: data?.id || '',
      firstName: data?.first_name || '',
      lastName: data?.last_name || '',
      avatarUrl: data?.avatar_url,
      nationality: data?.nationality,
    };
  }
}

export const buddyService = new BuddyService();
export default buddyService;
