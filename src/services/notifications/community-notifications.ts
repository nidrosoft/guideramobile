/**
 * COMMUNITY NOTIFICATION TRIGGERS
 *
 * Functions to create alerts when community actions happen.
 * These insert directly into the alerts table — the cron job
 * picks them up and dispatches as push notifications.
 */

import { supabase } from '@/lib/supabase/client';

/**
 * Notify group admin when someone requests to join their group
 */
export async function notifyJoinRequest(
  adminUserId: string,
  requesterName: string,
  groupName: string,
  groupId: string
): Promise<void> {
  await supabase.from('alerts').insert({
    user_id: adminUserId,
    alert_type_code: 'join_request',
    category_code: 'social',
    title: `📩 Join Request: ${groupName}`,
    body: `${requesterName} wants to join your group ${groupName}.`,
    context: { groupId, groupName, requesterName },
    action_url: `/community/groups/${groupId}`,
    priority: 5,
    channels_requested: ['push', 'in_app'],
    status: 'pending',
  });
}

/**
 * Notify user when their join request is approved
 */
export async function notifyJoinApproved(
  userId: string,
  groupName: string,
  groupId: string
): Promise<void> {
  await supabase.from('alerts').insert({
    user_id: userId,
    alert_type_code: 'join_approved',
    category_code: 'social',
    title: `✅ Welcome to ${groupName}!`,
    body: `Your request to join ${groupName} has been approved. Start connecting with the group!`,
    context: { groupId, groupName },
    action_url: `/community/groups/${groupId}`,
    priority: 5,
    channels_requested: ['push', 'in_app'],
    status: 'pending',
  });
}

/**
 * Notify user when their join request is denied
 */
export async function notifyJoinDenied(
  userId: string,
  groupName: string,
  groupId: string
): Promise<void> {
  await supabase.from('alerts').insert({
    user_id: userId,
    alert_type_code: 'join_denied',
    category_code: 'social',
    title: `Group Request Update`,
    body: `Your request to join ${groupName} was not approved at this time.`,
    context: { groupId, groupName },
    action_url: `/community`,
    priority: 4,
    channels_requested: ['in_app'],
    status: 'pending',
  });
}

/**
 * Notify group members when a new event is created
 */
export async function notifyEventCreated(
  memberUserIds: string[],
  eventName: string,
  groupName: string,
  groupId: string,
  eventId: string
): Promise<void> {
  const rows = memberUserIds.map(uid => ({
    user_id: uid,
    alert_type_code: 'event_created',
    category_code: 'social',
    title: `📅 New Event: ${eventName}`,
    body: `A new event was created in ${groupName}: ${eventName}`,
    context: { groupId, groupName, eventId, eventName },
    action_url: `/community/events/${eventId}`,
    priority: 4,
    channels_requested: ['push', 'in_app'],
    status: 'pending',
  }));

  if (rows.length > 0) {
    await supabase.from('alerts').insert(rows);
  }
}

/**
 * Notify user when they receive a new message in a group chat
 * (batched — only send if no recent notification for same group)
 */
export async function notifyNewMessage(
  userId: string,
  senderName: string,
  groupName: string,
  groupId: string,
  messagePreview: string
): Promise<void> {
  // Check if there's already a recent unread message notification for this group
  const { data: existing } = await supabase
    .from('alerts')
    .select('id')
    .eq('user_id', userId)
    .eq('alert_type_code', 'new_message')
    .eq('category_code', 'social')
    .is('read_at', null)
    .contains('context', { groupId })
    .limit(1);

  // If there's already an unread message notification for this group, skip
  if (existing && existing.length > 0) return;

  await supabase.from('alerts').insert({
    user_id: userId,
    alert_type_code: 'new_message',
    category_code: 'social',
    title: `💬 New message in ${groupName}`,
    body: `${senderName}: ${messagePreview.substring(0, 100)}`,
    context: { groupId, groupName, senderName },
    action_url: `/community/chat/${groupId}`,
    priority: 4,
    channels_requested: ['push', 'in_app'],
    status: 'pending',
  });
}

/**
 * Notify user when someone follows them or sends a connection request
 */
export async function notifyNewFollower(
  userId: string,
  followerName: string,
  followerAvatar?: string
): Promise<void> {
  await supabase.from('alerts').insert({
    user_id: userId,
    alert_type_code: 'new_follower',
    category_code: 'social',
    title: `👋 ${followerName} started following you`,
    body: `${followerName} is now following your travel updates.`,
    context: { followerName, followerAvatar },
    action_url: `/community/profile`,
    priority: 3,
    channels_requested: ['in_app'],
    status: 'pending',
  });
}

/**
 * Notify user when a travel buddy is nearby
 */
export async function notifyBuddyNearby(
  userId: string,
  buddyName: string,
  buddyId: string,
  distance: string,
  location: string
): Promise<void> {
  // Don't spam — check if already notified about this buddy recently
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { data: existing } = await supabase
    .from('alerts')
    .select('id')
    .eq('user_id', userId)
    .eq('alert_type_code', 'buddy_nearby')
    .gte('created_at', oneHourAgo)
    .contains('context', { buddyId })
    .limit(1);

  if (existing && existing.length > 0) return;

  await supabase.from('alerts').insert({
    user_id: userId,
    alert_type_code: 'buddy_nearby',
    category_code: 'social',
    title: `🎉 ${buddyName} is nearby!`,
    body: `Your travel buddy is ${distance} away in ${location}.`,
    context: { buddyId, buddyName, distance, location },
    action_url: `/community/buddies/${buddyId}`,
    priority: 5,
    channels_requested: ['push', 'in_app'],
    status: 'pending',
  });
}
