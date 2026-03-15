/**
 * INVITATION SERVICE
 * 
 * Handles trip invitations: sending, accepting, declining, and checking pending invites.
 * Uses the send-trip-invite edge function for email delivery via Resend.
 */

import { supabase } from '@/lib/supabase/client';

export interface TripInvitation {
  id: string;
  tripId: string;
  invitedBy: string;
  invitedEmail: string;
  invitedName: string | null;
  token: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  role: string;
  createdAt: string;
  respondedAt: string | null;
  // Joined fields
  tripTitle?: string;
  tripDestination?: any;
  inviterName?: string;
}

export interface SendInviteResult {
  success: boolean;
  sent: number;
  total: number;
  results: { email: string; status: string; inviteCode?: string }[];
  error?: string;
}

function mapInvitation(row: any): TripInvitation {
  return {
    id: row.id,
    tripId: row.trip_id,
    invitedBy: row.invited_by,
    invitedEmail: row.invited_email,
    invitedName: row.invited_name ?? null,
    token: row.token,
    status: row.status,
    role: row.role,
    createdAt: row.created_at,
    respondedAt: row.responded_at ?? null,
    tripTitle: row.trips?.title,
    tripDestination: row.trips?.destination,
    inviterName: row.inviter?.first_name
      ? [row.inviter.first_name, row.inviter.last_name].filter(Boolean).join(' ')
      : undefined,
  };
}

class InvitationService {
  /**
   * Send trip invitations via the edge function (uses Resend for email).
   */
  async sendInvites(
    tripId: string,
    invitees: { name?: string; email: string }[],
  ): Promise<SendInviteResult> {
    const { data, error } = await supabase.functions.invoke('send-trip-invite', {
      body: { tripId, invitees },
    });

    if (error) throw new Error(`Failed to send invitations: ${error.message}`);
    if (data?.error) throw new Error(data.error);
    return data;
  }

  /**
   * Get all invitations for a specific trip (sent by the owner).
   */
  async getTripInvitations(tripId: string): Promise<TripInvitation[]> {
    const { data, error } = await supabase
      .from('trip_invitations')
      .select('*')
      .eq('trip_id', tripId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return (data ?? []).map(mapInvitation);
  }

  /**
   * Get pending invitations for the current user's email.
   */
  async getPendingInvitations(userEmail: string): Promise<TripInvitation[]> {
    const { data, error } = await supabase
      .from('trip_invitations')
      .select('*, trips(title, destination), inviter:profiles!invited_by(first_name, last_name)')
      .eq('invited_email', userEmail.toLowerCase())
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      // Fallback without joins
      const { data: fallback, error: fbErr } = await supabase
        .from('trip_invitations')
        .select('*')
        .eq('invited_email', userEmail.toLowerCase())
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (fbErr) throw new Error(fbErr.message);
      return (fallback ?? []).map(mapInvitation);
    }

    return (data ?? []).map(mapInvitation);
  }

  /**
   * Accept a trip invitation. Creates a trip_members row and updates invitation status.
   */
  async acceptInvitation(invitationId: string, userId: string): Promise<void> {
    // Get the invitation
    const { data: invite, error: fetchErr } = await supabase
      .from('trip_invitations')
      .select('*')
      .eq('id', invitationId)
      .single();

    if (fetchErr || !invite) throw new Error('Invitation not found');
    if (invite.status !== 'pending') throw new Error('Invitation is no longer pending');

    // Update invitation status
    const { error: updateErr } = await supabase
      .from('trip_invitations')
      .update({
        status: 'accepted',
        responded_at: new Date().toISOString(),
        invited_user_id: userId,
      })
      .eq('id', invitationId);

    if (updateErr) throw new Error(updateErr.message);

    // Create trip member
    const { error: memberErr } = await supabase
      .from('trip_members')
      .insert({
        trip_id: invite.trip_id,
        user_id: userId,
        role: invite.role === 'traveler' ? 'collaborator' : invite.role,
        joined_via: 'invite',
        invitation_id: invitationId,
      });

    // Ignore unique constraint errors (already a member)
    if (memberErr && !memberErr.message.includes('unique')) {
      throw new Error(memberErr.message);
    }
  }

  /**
   * Decline a trip invitation.
   */
  async declineInvitation(invitationId: string, reason?: string): Promise<void> {
    const { error } = await supabase
      .from('trip_invitations')
      .update({
        status: 'declined',
        responded_at: new Date().toISOString(),
        decline_reason: reason ?? null,
      })
      .eq('id', invitationId);

    if (error) throw new Error(error.message);
  }

  /**
   * Look up an invitation by invite code (token).
   */
  async getInvitationByCode(code: string): Promise<TripInvitation | null> {
    const { data, error } = await supabase
      .from('trip_invitations')
      .select('*, trips(title, destination)')
      .eq('token', code)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data ? mapInvitation(data) : null;
  }

  /**
   * Get trip members for a specific trip.
   */
  async getTripMembers(tripId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('trip_members')
      .select('*, profiles:user_id(id, first_name, last_name, email, avatar_url)')
      .eq('trip_id', tripId)
      .order('joined_at', { ascending: true });

    if (error) throw new Error(error.message);
    return data ?? [];
  }

  /**
   * Remove a member from a trip (owner only).
   */
  async removeMember(tripId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('trip_members')
      .delete()
      .eq('trip_id', tripId)
      .eq('user_id', userId);

    if (error) throw new Error(error.message);
  }
}

export const invitationService = new InvitationService();
export default invitationService;
