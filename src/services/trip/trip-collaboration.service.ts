/**
 * TRIP COLLABORATION SERVICE
 * Invitations, travelers, and permissions
 */

import { supabase } from '@/lib/supabase/client';
import { TripRepository } from './trip-repository';
import {
  Trip,
  TripTraveler,
  TripInvitation,
  TravelerRole,
  InvitationStatus,
} from './trip.types';
import { TripNotFoundError, TripAccessDeniedError, TripInvitationError } from './trip.errors';
import { TripCoreService } from './trip-core.service';
import { generateInviteToken } from './trip.utils';

// ============================================
// INVITATION MANAGEMENT
// ============================================

export interface InvitationInput {
  email?: string;
  phone?: string;
  name?: string;
  role?: TravelerRole;
  relationship?: string;
  message?: string;
}

/**
 * Invite a traveler to a trip
 */
export async function inviteTraveler(
  tripId: string,
  invitedBy: string,
  invitation: InvitationInput
): Promise<TripInvitation> {
  // Check permission
  const access = await TripCoreService.checkAccess(tripId, invitedBy);
  if (!access.canInvite) {
    throw new TripAccessDeniedError(tripId, invitedBy, 'invite');
  }

  // Must have email or phone
  if (!invitation.email && !invitation.phone) {
    throw new TripInvitationError('INVALID_INPUT', 'Email or phone is required');
  }

  // Check if already invited or a traveler
  if (invitation.email) {
    const existingTraveler = await TripRepository.findTravelerByEmail(tripId, invitation.email);
    if (existingTraveler) {
      throw new TripInvitationError('ALREADY_INVITED', 'This person is already on the trip');
    }

    const existingInvitation = await findPendingInvitationByEmail(tripId, invitation.email);
    if (existingInvitation) {
      throw new TripInvitationError('ALREADY_INVITED', 'An invitation is already pending for this email');
    }
  }

  // Generate token
  const token = generateInviteToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  // Create invitation
  const { data, error } = await supabase
    .from('trip_invitations')
    .insert({
      trip_id: tripId,
      invited_email: invitation.email,
      invited_phone: invitation.phone,
      invited_name: invitation.name,
      invited_by: invitedBy,
      role: invitation.role || 'traveler',
      relationship: invitation.relationship,
      token,
      token_expires_at: expiresAt.toISOString(),
      message: invitation.message,
      status: 'pending',
    })
    .select()
    .single();

  if (error) throw error;

  // Send invitation notification
  await sendInvitationNotification(data as TripInvitation, tripId, invitedBy);

  return data as TripInvitation;
}

/**
 * Accept an invitation
 */
export async function acceptInvitation(token: string, userId: string): Promise<TripTraveler> {
  // Find invitation
  const invitation = await findInvitationByToken(token);
  if (!invitation) {
    throw new TripInvitationError('INVALID_TOKEN', 'Invalid or expired invitation');
  }

  if (invitation.status !== 'pending') {
    throw new TripInvitationError('ALREADY_RESPONDED', `Invitation has already been ${invitation.status}`);
  }

  // Check expiration
  if (new Date(invitation.token_expires_at) < new Date()) {
    await updateInvitationStatus(invitation.id, 'expired');
    throw new TripInvitationError('EXPIRED', 'This invitation has expired');
  }

  // Get user details
  const { data: user } = await supabase
    .from('profiles')
    .select('first_name, last_name, email, phone')
    .eq('id', userId)
    .single();

  // Create traveler
  const traveler = await TripRepository.addTraveler({
    trip_id: invitation.trip_id,
    user_id: userId,
    first_name: user?.first_name || invitation.invited_name?.split(' ')[0] || 'Guest',
    last_name: user?.last_name || invitation.invited_name?.split(' ').slice(1).join(' ') || '',
    email: user?.email || invitation.invited_email,
    phone: user?.phone || invitation.invited_phone,
    role: invitation.role as TravelerRole,
    relationship_to_owner: invitation.relationship,
    invitation_status: 'accepted',
    invited_at: invitation.created_at,
    invited_by: invitation.invited_by,
    accepted_at: new Date().toISOString(),
  });

  // Update invitation
  await supabase
    .from('trip_invitations')
    .update({
      status: 'accepted',
      responded_at: new Date().toISOString(),
      created_traveler_id: traveler.id,
    })
    .eq('id', invitation.id);

  // Notify inviter
  await notifyInvitationAccepted(invitation, traveler);

  return traveler;
}

/**
 * Decline an invitation
 */
export async function declineInvitation(token: string, reason?: string): Promise<void> {
  const invitation = await findInvitationByToken(token);
  if (!invitation) {
    throw new TripInvitationError('INVALID_TOKEN', 'Invalid or expired invitation');
  }

  if (invitation.status !== 'pending') {
    throw new TripInvitationError('ALREADY_RESPONDED', `Invitation has already been ${invitation.status}`);
  }

  await supabase
    .from('trip_invitations')
    .update({
      status: 'declined',
      responded_at: new Date().toISOString(),
      decline_reason: reason,
    })
    .eq('id', invitation.id);

  // Notify inviter
  await notifyInvitationDeclined(invitation, reason);
}

/**
 * Revoke an invitation
 */
export async function revokeInvitation(
  tripId: string,
  invitationId: string,
  userId: string
): Promise<void> {
  const access = await TripCoreService.checkAccess(tripId, userId);
  if (!access.canInvite) {
    throw new TripAccessDeniedError(tripId, userId, 'revoke invitation');
  }

  const { data: invitation } = await supabase
    .from('trip_invitations')
    .select('*')
    .eq('id', invitationId)
    .eq('trip_id', tripId)
    .single();

  if (!invitation) {
    throw new TripInvitationError('NOT_FOUND', 'Invitation not found');
  }

  if (invitation.status !== 'pending') {
    throw new TripInvitationError('CANNOT_REVOKE', 'Can only revoke pending invitations');
  }

  await supabase
    .from('trip_invitations')
    .update({ status: 'revoked' })
    .eq('id', invitationId);
}

/**
 * Resend invitation
 */
export async function resendInvitation(
  tripId: string,
  invitationId: string,
  userId: string
): Promise<void> {
  const access = await TripCoreService.checkAccess(tripId, userId);
  if (!access.canInvite) {
    throw new TripAccessDeniedError(tripId, userId, 'resend invitation');
  }

  const { data: invitation } = await supabase
    .from('trip_invitations')
    .select('*')
    .eq('id', invitationId)
    .eq('trip_id', tripId)
    .single();

  if (!invitation || invitation.status !== 'pending') {
    throw new TripInvitationError('CANNOT_RESEND', 'Can only resend pending invitations');
  }

  // Extend expiration
  const newExpiry = new Date();
  newExpiry.setDate(newExpiry.getDate() + 7);

  await supabase
    .from('trip_invitations')
    .update({
      token_expires_at: newExpiry.toISOString(),
      reminder_sent: true,
      reminder_sent_at: new Date().toISOString(),
    })
    .eq('id', invitationId);

  // Resend notification
  await sendInvitationNotification(invitation as TripInvitation, tripId, userId);
}

/**
 * Get pending invitations for a trip
 */
export async function getPendingInvitations(tripId: string): Promise<TripInvitation[]> {
  const { data, error } = await supabase
    .from('trip_invitations')
    .select('*')
    .eq('trip_id', tripId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as TripInvitation[];
}

/**
 * Get user's pending invitations
 */
export async function getUserPendingInvitations(userId: string): Promise<TripInvitation[]> {
  // Get user's email
  const { data: user } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', userId)
    .single();

  if (!user?.email) return [];

  const { data, error } = await supabase
    .from('trip_invitations')
    .select('*, trips(title, start_date, end_date, primary_destination_name)')
    .eq('invited_email', user.email)
    .eq('status', 'pending')
    .gt('token_expires_at', new Date().toISOString())
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as TripInvitation[];
}

// ============================================
// TRAVELER MANAGEMENT
// ============================================

/**
 * Update traveler role
 */
export async function updateTravelerRole(
  tripId: string,
  travelerId: string,
  userId: string,
  newRole: TravelerRole
): Promise<TripTraveler> {
  const access = await TripCoreService.checkAccess(tripId, userId);
  if (!access.canInvite) {
    throw new TripAccessDeniedError(tripId, userId, 'update traveler role');
  }

  // Cannot change owner role
  const traveler = await getTravelerById(travelerId);
  if (traveler?.is_owner) {
    throw new TripInvitationError('CANNOT_CHANGE_OWNER', 'Cannot change owner role');
  }

  return TripRepository.updateTraveler(travelerId, { role: newRole });
}

/**
 * Remove traveler from trip
 */
export async function removeTraveler(
  tripId: string,
  travelerId: string,
  userId: string
): Promise<void> {
  const access = await TripCoreService.checkAccess(tripId, userId);
  
  // Get traveler
  const traveler = await getTravelerById(travelerId);
  if (!traveler) {
    throw new TripInvitationError('NOT_FOUND', 'Traveler not found');
  }

  // Cannot remove owner
  if (traveler.is_owner) {
    throw new TripInvitationError('CANNOT_REMOVE_OWNER', 'Cannot remove trip owner');
  }

  // Must be admin/owner OR removing self
  if (!access.canInvite && traveler.user_id !== userId) {
    throw new TripAccessDeniedError(tripId, userId, 'remove traveler');
  }

  await TripRepository.removeTraveler(travelerId);

  // Notify removed traveler
  if (traveler.user_id && traveler.user_id !== userId) {
    await notifyTravelerRemoved(tripId, traveler);
  }
}

/**
 * Leave trip (self-removal)
 */
export async function leaveTrip(tripId: string, userId: string): Promise<void> {
  const traveler = await TripRepository.findTravelerByUserId(tripId, userId);
  if (!traveler) {
    throw new TripInvitationError('NOT_A_TRAVELER', 'You are not on this trip');
  }

  if (traveler.is_owner) {
    throw new TripInvitationError('OWNER_CANNOT_LEAVE', 'Trip owner cannot leave. Transfer ownership or delete the trip.');
  }

  await TripRepository.removeTraveler(traveler.id);
}

/**
 * Transfer trip ownership
 */
export async function transferOwnership(
  tripId: string,
  currentOwnerId: string,
  newOwnerId: string
): Promise<void> {
  const trip = await TripRepository.findById(tripId);
  if (!trip) {
    throw new TripNotFoundError(tripId);
  }

  if (trip.owner_id !== currentOwnerId && trip.user_id !== currentOwnerId) {
    throw new TripAccessDeniedError(tripId, currentOwnerId, 'transfer ownership');
  }

  // Verify new owner is a traveler
  const newOwnerTraveler = await TripRepository.findTravelerByUserId(tripId, newOwnerId);
  if (!newOwnerTraveler) {
    throw new TripInvitationError('NOT_A_TRAVELER', 'New owner must be a traveler on the trip');
  }

  // Update trip owner
  await TripRepository.update(tripId, {
    owner_id: newOwnerId,
    user_id: newOwnerId,
  } as any);

  // Update traveler roles
  const currentOwnerTraveler = await TripRepository.findTravelerByUserId(tripId, currentOwnerId);
  if (currentOwnerTraveler) {
    await TripRepository.updateTraveler(currentOwnerTraveler.id, {
      role: 'admin',
      is_owner: false,
      relationship_to_owner: undefined,
    });
  }

  await TripRepository.updateTraveler(newOwnerTraveler.id, {
    role: 'owner',
    is_owner: true,
    relationship_to_owner: 'self',
  });

  // Notify both parties
  await notifyOwnershipTransferred(tripId, currentOwnerId, newOwnerId);
}

// ============================================
// HELPER FUNCTIONS
// ============================================

async function findInvitationByToken(token: string): Promise<TripInvitation | null> {
  const { data, error } = await supabase
    .from('trip_invitations')
    .select('*')
    .eq('token', token)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data as TripInvitation;
}

async function findPendingInvitationByEmail(tripId: string, email: string): Promise<TripInvitation | null> {
  const { data, error } = await supabase
    .from('trip_invitations')
    .select('*')
    .eq('trip_id', tripId)
    .eq('invited_email', email)
    .eq('status', 'pending')
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data as TripInvitation;
}

async function getTravelerById(travelerId: string): Promise<TripTraveler | null> {
  const { data, error } = await supabase
    .from('trip_travelers')
    .select('*')
    .eq('id', travelerId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data as TripTraveler;
}

async function updateInvitationStatus(invitationId: string, status: InvitationStatus): Promise<void> {
  await supabase
    .from('trip_invitations')
    .update({ status })
    .eq('id', invitationId);
}

async function sendInvitationNotification(
  invitation: TripInvitation,
  tripId: string,
  invitedBy: string
): Promise<void> {
  try {
    // Get trip and inviter details
    const [tripResult, inviterResult] = await Promise.all([
      supabase.from('trips').select('title, start_date, primary_destination_name').eq('id', tripId).single(),
      supabase.from('profiles').select('first_name, last_name').eq('id', invitedBy).single(),
    ]);

    await supabase.from('scheduled_jobs').insert({
      job_type: 'send_trip_invitation',
      job_data: {
        invitationId: invitation.id,
        tripId,
        tripTitle: tripResult.data?.title,
        destination: tripResult.data?.primary_destination_name,
        startDate: tripResult.data?.start_date,
        inviterName: `${inviterResult.data?.first_name || ''} ${inviterResult.data?.last_name || ''}`.trim(),
        invitedEmail: invitation.invited_email,
        invitedName: invitation.invited_name,
        token: invitation.token,
        message: invitation.message,
      },
      scheduled_for: new Date().toISOString(),
      status: 'pending',
    });

    // Update invitation
    await supabase
      .from('trip_invitations')
      .update({
        notification_sent: true,
        notification_sent_at: new Date().toISOString(),
        notification_method: 'email',
      })
      .eq('id', invitation.id);
  } catch (error) {
    console.error('Failed to send invitation notification:', error);
  }
}

async function notifyInvitationAccepted(invitation: TripInvitation, traveler: TripTraveler): Promise<void> {
  try {
    await supabase.from('scheduled_jobs').insert({
      job_type: 'send_trip_notification',
      job_data: {
        tripId: invitation.trip_id,
        type: 'invitation_accepted',
        userId: invitation.invited_by,
        travelerName: `${traveler.first_name} ${traveler.last_name}`,
      },
      scheduled_for: new Date().toISOString(),
      status: 'pending',
    });
  } catch (error) {
    console.error('Failed to notify invitation accepted:', error);
  }
}

async function notifyInvitationDeclined(invitation: TripInvitation, reason?: string): Promise<void> {
  try {
    await supabase.from('scheduled_jobs').insert({
      job_type: 'send_trip_notification',
      job_data: {
        tripId: invitation.trip_id,
        type: 'invitation_declined',
        userId: invitation.invited_by,
        invitedName: invitation.invited_name || invitation.invited_email,
        reason,
      },
      scheduled_for: new Date().toISOString(),
      status: 'pending',
    });
  } catch (error) {
    console.error('Failed to notify invitation declined:', error);
  }
}

async function notifyTravelerRemoved(tripId: string, traveler: TripTraveler): Promise<void> {
  try {
    await supabase.from('scheduled_jobs').insert({
      job_type: 'send_trip_notification',
      job_data: {
        tripId,
        type: 'removed_from_trip',
        userId: traveler.user_id,
      },
      scheduled_for: new Date().toISOString(),
      status: 'pending',
    });
  } catch (error) {
    console.error('Failed to notify traveler removed:', error);
  }
}

async function notifyOwnershipTransferred(
  tripId: string,
  previousOwnerId: string,
  newOwnerId: string
): Promise<void> {
  try {
    await supabase.from('scheduled_jobs').insert([
      {
        job_type: 'send_trip_notification',
        job_data: {
          tripId,
          type: 'ownership_transferred_from',
          userId: previousOwnerId,
        },
        scheduled_for: new Date().toISOString(),
        status: 'pending',
      },
      {
        job_type: 'send_trip_notification',
        job_data: {
          tripId,
          type: 'ownership_transferred_to',
          userId: newOwnerId,
        },
        scheduled_for: new Date().toISOString(),
        status: 'pending',
      },
    ]);
  } catch (error) {
    console.error('Failed to notify ownership transferred:', error);
  }
}

export const TripCollaborationService = {
  inviteTraveler,
  acceptInvitation,
  declineInvitation,
  revokeInvitation,
  resendInvitation,
  getPendingInvitations,
  getUserPendingInvitations,
  updateTravelerRole,
  removeTraveler,
  leaveTrip,
  transferOwnership,
};
