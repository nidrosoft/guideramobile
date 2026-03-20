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
    action_url: `/community/${groupId}`,
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
    action_url: `/community/${groupId}`,
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
    action_url: `/community/event/${eventId}`,
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
    action_url: `/account/edit-profile`,
    priority: 3,
    channels_requested: ['in_app'],
    status: 'pending',
  });
}

/**
 * Notify user when a travel buddy is nearby
 */
/**
 * Notify user when someone comments on their post
 */
export async function notifyPostComment(
  postAuthorId: string,
  commenterName: string,
  postTitle: string,
  postId: string,
  communityId: string
): Promise<void> {
  await supabase.from('alerts').insert({
    user_id: postAuthorId,
    alert_type_code: 'post_comment',
    category_code: 'social',
    title: `💬 ${commenterName} commented on your post`,
    body: `New comment on "${postTitle.substring(0, 50)}${postTitle.length > 50 ? '...' : ''}"`,
    context: { postId, communityId, commenterName },
    action_url: `/community/post/${postId}`,
    priority: 4,
    channels_requested: ['push', 'in_app'],
    status: 'pending',
  });
}

/**
 * Notify user when someone replies to their comment
 */
export async function notifyCommentReply(
  commentAuthorId: string,
  replierName: string,
  postId: string,
  communityId: string
): Promise<void> {
  await supabase.from('alerts').insert({
    user_id: commentAuthorId,
    alert_type_code: 'comment_reply',
    category_code: 'social',
    title: `↩️ ${replierName} replied to your comment`,
    body: `Tap to see the reply.`,
    context: { postId, communityId, replierName },
    action_url: `/community/post/${postId}`,
    priority: 4,
    channels_requested: ['push', 'in_app'],
    status: 'pending',
  });
}

/**
 * Notify user when someone reacts to their post
 */
export async function notifyPostReaction(
  postAuthorId: string,
  reactorName: string,
  reactionType: string,
  postId: string,
  communityId: string
): Promise<void> {
  // Batch — don't send if already notified about reactions on this post recently
  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  const { data: existing } = await supabase
    .from('alerts')
    .select('id')
    .eq('user_id', postAuthorId)
    .eq('alert_type_code', 'post_reaction')
    .gte('created_at', fiveMinAgo)
    .contains('context', { postId })
    .limit(1);

  if (existing && existing.length > 0) return;

  const emoji = reactionType === 'like' ? '❤️' : reactionType === 'love' ? '😍' : '👍';
  await supabase.from('alerts').insert({
    user_id: postAuthorId,
    alert_type_code: 'post_reaction',
    category_code: 'social',
    title: `${emoji} ${reactorName} reacted to your post`,
    body: `Your post is getting attention!`,
    context: { postId, communityId, reactorName, reactionType },
    action_url: `/community/post/${postId}`,
    priority: 3,
    channels_requested: ['in_app'],
    status: 'pending',
  });
}

/**
 * Notify user when they receive a direct message
 */
export async function notifyDirectMessage(
  userId: string,
  senderName: string,
  senderId: string,
  messagePreview: string,
  conversationId: string
): Promise<void> {
  // Dedup — skip if unread DM notification already exists for this sender
  const { data: existing } = await supabase
    .from('alerts')
    .select('id')
    .eq('user_id', userId)
    .eq('alert_type_code', 'direct_message')
    .is('read_at', null)
    .contains('context', { senderId })
    .limit(1);

  if (existing && existing.length > 0) return;

  await supabase.from('alerts').insert({
    user_id: userId,
    alert_type_code: 'direct_message',
    category_code: 'social',
    title: `✉️ ${senderName} sent you a message`,
    body: messagePreview.substring(0, 100),
    context: { senderId, senderName, conversationId },
    action_url: `/community/chat/${conversationId}`,
    priority: 5,
    channels_requested: ['push', 'in_app'],
    status: 'pending',
  });
}

/**
 * Notify user when their partner verification status changes
 */
export async function notifyVerificationUpdate(
  userId: string,
  status: 'approved' | 'rejected' | 'in_review',
): Promise<void> {
  const titles: Record<string, string> = {
    approved: '✅ You are now a Verified Partner!',
    rejected: '❌ Verification was not approved',
    in_review: '🔍 Your verification is being reviewed',
  };
  const bodies: Record<string, string> = {
    approved: 'Congratulations! Your identity has been verified. You now have the Trusted Traveler badge.',
    rejected: 'Unfortunately your verification was not approved. You can reapply anytime.',
    in_review: 'We received your verification documents and are reviewing them. This usually takes 1-2 business days.',
  };

  await supabase.from('alerts').insert({
    user_id: userId,
    alert_type_code: 'verification_update',
    category_code: 'account',
    title: titles[status],
    body: bodies[status],
    context: { status },
    action_url: '/account/verification',
    priority: status === 'approved' ? 7 : 5,
    channels_requested: ['push', 'in_app'],
    status: 'pending',
  });
}

/**
 * Notify user when their trip expense budget is approaching/exceeded
 */
export async function notifyBudgetWarning(
  userId: string,
  tripId: string,
  tripName: string,
  percentUsed: number,
  budgetAmount: number,
  spentAmount: number,
  currency: string,
): Promise<void> {
  const isOver = percentUsed >= 100;
  await supabase.from('alerts').insert({
    user_id: userId,
    alert_type_code: isOver ? 'budget_exceeded' : 'budget_warning',
    category_code: 'trip',
    title: isOver
      ? `🚨 Budget exceeded for ${tripName}`
      : `⚠️ ${percentUsed}% of budget used — ${tripName}`,
    body: isOver
      ? `You've spent ${currency}${spentAmount.toFixed(0)} of your ${currency}${budgetAmount.toFixed(0)} budget.`
      : `${currency}${(budgetAmount - spentAmount).toFixed(0)} remaining of your ${currency}${budgetAmount.toFixed(0)} budget.`,
    context: { tripId, percentUsed, budgetAmount, spentAmount, currency },
    action_url: `/trip/${tripId}/expenses`,
    priority: isOver ? 6 : 5,
    channels_requested: ['push', 'in_app'],
    status: 'pending',
  });
}

/**
 * Notify user when a saved deal price drops
 */
export async function notifyDealPriceDrop(
  userId: string,
  dealTitle: string,
  oldPrice: number,
  newPrice: number,
  currency: string,
  dealId: string,
): Promise<void> {
  const savings = Math.round(oldPrice - newPrice);
  await supabase.from('alerts').insert({
    user_id: userId,
    alert_type_code: 'price_drop',
    category_code: 'deal',
    title: `💰 Price dropped! Save ${currency}${savings}`,
    body: `${dealTitle} is now ${currency}${newPrice} (was ${currency}${oldPrice})`,
    context: { dealId, oldPrice, newPrice, currency, savings },
    action_url: `/deals/${dealId}`,
    priority: 5,
    channels_requested: ['push', 'in_app'],
    status: 'pending',
  });
}

/**
 * Notify user when Smart Plan generation completes
 */
export async function notifySmartPlanComplete(
  userId: string,
  tripId: string,
  tripName: string,
  modulesGenerated: number,
): Promise<void> {
  await supabase.from('alerts').insert({
    user_id: userId,
    alert_type_code: 'smart_plan_complete',
    category_code: 'trip',
    title: `✨ Smart Plan ready for ${tripName}!`,
    body: `${modulesGenerated} modules generated — itinerary, packing list, safety tips, and more.`,
    context: { tripId, modulesGenerated },
    action_url: `/trip/${tripId}`,
    priority: 5,
    channels_requested: ['push', 'in_app'],
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
    action_url: `/community/buddy/${buddyId}`,
    priority: 5,
    channels_requested: ['push', 'in_app'],
    status: 'pending',
  });
}
