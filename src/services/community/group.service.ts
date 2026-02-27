/**
 * Group Service
 * Handles all group-related operations for the Community system
 */

import { supabase } from '@/lib/supabase/client';
import {
  Group,
  GroupMember,
  GroupJoinRequest,
  CreateGroupInput,
  GroupFilters,
  GroupRole,
} from './types/community.types';

class GroupService {
  /**
   * Generate URL-friendly slug from name
   */
  private generateSlug(name: string): string {
    const base = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);
    const suffix = Math.random().toString(36).substring(2, 8);
    return `${base}-${suffix}`;
  }

  /**
   * Create a new group
   */
  async createGroup(userId: string, data: CreateGroupInput): Promise<Group> {
    const slug = this.generateSlug(data.name);

    const { data: group, error } = await supabase
      .from('groups')
      .insert({
        name: data.name,
        slug,
        description: data.description,
        cover_photo_url: data.coverPhotoUrl,
        group_photo_url: data.groupPhotoUrl,
        destination_code: data.destinationCode,
        destination_name: data.destinationName,
        destination_country: data.destinationCountry,
        privacy: data.privacy || 'public',
        join_approval: data.joinApproval || 'automatic',
        member_limit: data.memberLimit,
        category: data.category,
        tags: data.tags || [],
        languages: data.languages || [],
        travel_styles: data.travelStyles || [],
        created_by: userId,
        member_count: 1,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    // Add creator as owner
    await supabase.from('group_members').insert({
      group_id: group.id,
      user_id: userId,
      role: 'owner',
      joined_at: new Date().toISOString(),
    });

    // Create chat room for group
    await supabase.from('chat_rooms').insert({
      type: 'group',
      reference_id: group.id,
      name: data.name,
    });

    return this.mapGroup(group);
  }

  /**
   * Get group by ID
   */
  async getGroup(groupId: string): Promise<Group | null> {
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .eq('id', groupId)
      .single();

    if (error || !data) return null;
    return this.mapGroup(data);
  }

  /**
   * Get group by slug
   */
  async getGroupBySlug(slug: string): Promise<Group | null> {
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error || !data) return null;
    return this.mapGroup(data);
  }

  /**
   * Join a group
   */
  async joinGroup(userId: string, groupId: string, message?: string): Promise<{ status: 'joined' | 'pending' }> {
    const group = await this.getGroup(groupId);
    if (!group) throw new Error('Group not found');

    // Check if already member
    const { data: existing } = await supabase
      .from('group_members')
      .select('id')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .single();

    if (existing) throw new Error('Already a member');

    // Check member limit
    if (group.memberLimit && group.memberCount >= group.memberLimit) {
      throw new Error('Group is full');
    }

    // If approval required, create request
    if (group.joinApproval === 'admin_approval') {
      await supabase.from('group_join_requests').insert({
        group_id: groupId,
        user_id: userId,
        message,
        status: 'pending',
      });
      return { status: 'pending' };
    }

    // Auto-approve
    await this.addMember(groupId, userId, 'member');
    return { status: 'joined' };
  }

  /**
   * Add member to group
   */
  async addMember(groupId: string, userId: string, role: GroupRole = 'member'): Promise<void> {
    await supabase.from('group_members').insert({
      group_id: groupId,
      user_id: userId,
      role,
      joined_at: new Date().toISOString(),
    });

    // Update member count
    await supabase.rpc('increment_group_member_count', { group_id: groupId });
  }

  /**
   * Leave a group
   */
  async leaveGroup(userId: string, groupId: string): Promise<void> {
    const { data: member } = await supabase
      .from('group_members')
      .select('role')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .single();

    if (!member) throw new Error('Not a member');
    if (member.role === 'owner') throw new Error('Owner cannot leave. Transfer ownership first.');

    await supabase
      .from('group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', userId);

    // Decrement member count
    await supabase.rpc('decrement_group_member_count', { group_id: groupId });
  }

  /**
   * Get group members
   */
  async getMembers(groupId: string, limit = 50, offset = 0): Promise<GroupMember[]> {
    const { data, error } = await supabase
      .from('group_members')
      .select(`
        *,
        user:profiles(id, first_name, last_name, avatar_url)
      `)
      .eq('group_id', groupId)
      .order('joined_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) throw new Error(error.message);
    return (data || []).map(this.mapMember);
  }

  /**
   * Get pending join requests (for admins)
   */
  async getJoinRequests(groupId: string): Promise<GroupJoinRequest[]> {
    const { data, error } = await supabase
      .from('group_join_requests')
      .select(`
        *,
        user:profiles(id, first_name, last_name, avatar_url)
      `)
      .eq('group_id', groupId)
      .eq('status', 'pending')
      .order('requested_at', { ascending: true });

    if (error) throw new Error(error.message);
    return (data || []).map(this.mapJoinRequest);
  }

  /**
   * Approve join request
   */
  async approveRequest(adminId: string, requestId: string): Promise<void> {
    const { data: request, error } = await supabase
      .from('group_join_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (error || !request) throw new Error('Request not found');

    // Verify admin
    await this.verifyAdmin(request.group_id, adminId);

    // Update request
    await supabase
      .from('group_join_requests')
      .update({
        status: 'approved',
        responded_by: adminId,
        responded_at: new Date().toISOString(),
      })
      .eq('id', requestId);

    // Add member
    await this.addMember(request.group_id, request.user_id, 'member');
  }

  /**
   * Reject join request
   */
  async rejectRequest(adminId: string, requestId: string, reason?: string): Promise<void> {
    const { data: request, error } = await supabase
      .from('group_join_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (error || !request) throw new Error('Request not found');

    await this.verifyAdmin(request.group_id, adminId);

    await supabase
      .from('group_join_requests')
      .update({
        status: 'rejected',
        responded_by: adminId,
        responded_at: new Date().toISOString(),
        rejection_reason: reason,
      })
      .eq('id', requestId);
  }

  /**
   * Verify user is admin of group
   */
  private async verifyAdmin(groupId: string, userId: string): Promise<void> {
    const { data } = await supabase
      .from('group_members')
      .select('role')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .single();

    if (!data || !['owner', 'admin'].includes(data.role)) {
      throw new Error('Not authorized');
    }
  }

  /**
   * Discover groups
   */
  async discoverGroups(filters: GroupFilters): Promise<Group[]> {
    let query = supabase
      .from('groups')
      .select('*')
      .eq('discoverable', true)
      .eq('status', 'active');

    if (filters.category) {
      query = query.eq('category', filters.category);
    }

    if (filters.destination) {
      query = query.eq('destination_code', filters.destination);
    }

    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    if (filters.tags && filters.tags.length > 0) {
      query = query.overlaps('tags', filters.tags);
    }

    const { data, error } = await query
      .order('member_count', { ascending: false })
      .range(filters.offset || 0, (filters.offset || 0) + (filters.limit || 20) - 1);

    if (error) throw new Error(error.message);
    return (data || []).map(this.mapGroup);
  }

  /**
   * Get user's groups
   */
  async getUserGroups(userId: string): Promise<{ group: Group; role: GroupRole; unreadCount: number }[]> {
    const { data, error } = await supabase
      .from('group_members')
      .select(`
        role,
        group:groups(*)
      `)
      .eq('user_id', userId)
      .eq('status', 'active');

    if (error) throw new Error(error.message);

    return (data || []).map((item: any) => ({
      group: this.mapGroup(item.group),
      role: item.role as GroupRole,
      unreadCount: 0, // TODO: Calculate from message_read_status
    }));
  }

  /**
   * Update member role
   */
  async updateMemberRole(adminId: string, groupId: string, memberId: string, newRole: GroupRole): Promise<void> {
    await this.verifyAdmin(groupId, adminId);

    if (newRole === 'owner') {
      throw new Error('Use transferOwnership to change owner');
    }

    await supabase
      .from('group_members')
      .update({ role: newRole })
      .eq('group_id', groupId)
      .eq('user_id', memberId);
  }

  /**
   * Remove member from group
   */
  async removeMember(adminId: string, groupId: string, memberId: string): Promise<void> {
    await this.verifyAdmin(groupId, adminId);

    const { data: member } = await supabase
      .from('group_members')
      .select('role')
      .eq('group_id', groupId)
      .eq('user_id', memberId)
      .single();

    if (member?.role === 'owner') {
      throw new Error('Cannot remove owner');
    }

    await supabase
      .from('group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', memberId);

    await supabase.rpc('decrement_group_member_count', { group_id: groupId });
  }

  // ============================================
  // MAPPERS
  // ============================================

  private mapGroup(data: any): Group {
    return {
      id: data.id,
      name: data.name,
      slug: data.slug,
      description: data.description,
      coverPhotoUrl: data.cover_photo_url,
      groupPhotoUrl: data.group_photo_url,
      destinationCode: data.destination_code,
      destinationName: data.destination_name,
      destinationCountry: data.destination_country,
      privacy: data.privacy,
      joinApproval: data.join_approval,
      memberLimit: data.member_limit,
      whoCanPost: data.who_can_post,
      mediaAllowed: data.media_allowed,
      linksAllowed: data.links_allowed,
      discoverable: data.discoverable,
      inviteOnly: data.invite_only,
      category: data.category,
      tags: data.tags || [],
      languages: data.languages || [],
      travelStyles: data.travel_styles || [],
      memberCount: data.member_count,
      activeMemberCount: data.active_member_count,
      postCount: data.post_count,
      isVerified: data.is_verified,
      verifiedAt: data.verified_at ? new Date(data.verified_at) : undefined,
      status: data.status,
      createdBy: data.created_by,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  private mapMember(data: any): GroupMember {
    return {
      id: data.id,
      groupId: data.group_id,
      userId: data.user_id,
      role: data.role,
      notificationsEnabled: data.notifications_enabled,
      mutedUntil: data.muted_until ? new Date(data.muted_until) : undefined,
      lastVisitedAt: data.last_visited_at ? new Date(data.last_visited_at) : undefined,
      messageCount: data.message_count,
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

  private mapJoinRequest(data: any): GroupJoinRequest {
    return {
      id: data.id,
      groupId: data.group_id,
      userId: data.user_id,
      message: data.message,
      status: data.status,
      respondedBy: data.responded_by,
      respondedAt: data.responded_at ? new Date(data.responded_at) : undefined,
      rejectionReason: data.rejection_reason,
      requestedAt: new Date(data.requested_at),
      user: data.user ? {
        id: data.user.id,
        firstName: data.user.first_name,
        lastName: data.user.last_name,
        avatarUrl: data.user.avatar_url,
      } : undefined,
    };
  }
}

export const groupService = new GroupService();
export default groupService;
