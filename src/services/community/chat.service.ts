/**
 * Chat Service
 * Handles REST operations for direct conversations and group chat rooms.
 * Real-time subscriptions are handled by src/services/realtime/channels/chat.channel.ts
 */

import { supabase } from '@/lib/supabase/client';

const messageSendTimestamps: number[] = [];
const MAX_MESSAGES_PER_MINUTE = 30;

function checkMessageRateLimit(): boolean {
  const now = Date.now();
  const oneMinuteAgo = now - 60000;
  // Remove old timestamps
  while (messageSendTimestamps.length > 0 && messageSendTimestamps[0] < oneMinuteAgo) {
    messageSendTimestamps.shift();
  }
  if (messageSendTimestamps.length >= MAX_MESSAGES_PER_MINUTE) {
    return false; // Rate limited
  }
  messageSendTimestamps.push(now);
  return true;
}

export interface Conversation {
  id: string;
  otherUser: { id: string; fullName: string; avatarUrl?: string };
  lastMessage?: string;
  lastMessageAt?: string;
  messageCount: number;
  unreadCount?: number;
}

export interface GroupChat {
  id: string;
  name: string;
  referenceId: string;
  type: string;
  lastMessage?: string;
  lastMessageAt?: string;
  messageCount: number;
  unreadCount: number;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: string;
  createdAt: string;
}

class ChatService {
  // ============================================
  // DIRECT CONVERSATIONS
  // ============================================

  async getConversations(userId: string): Promise<Conversation[]> {
    const { data, error } = await supabase
      .from('direct_conversations')
      .select(`
        *,
        user1:profiles!direct_conversations_user_id_1_fkey(id, first_name, last_name, avatar_url),
        user2:profiles!direct_conversations_user_id_2_fkey(id, first_name, last_name, avatar_url)
      `)
      .or(`user_id_1.eq.${userId},user_id_2.eq.${userId}`)
      .order('last_message_at', { ascending: false, nullsFirst: false });

    if (error) throw new Error(error.message);

    // H1: Compute unread counts from alerts table
    const convIds = (data || []).map((r: any) => r.id);
    const unreadMap: Record<string, number> = {};
    if (convIds.length > 0) {
      const { data: unreadAlerts } = await supabase
        .from('alerts')
        .select('context')
        .eq('user_id', userId)
        .eq('alert_type_code', 'dm_message')
        .eq('status', 'delivered');
      // Count alerts per sender (each DM alert stores senderId in context)
      for (const alert of unreadAlerts || []) {
        const senderId = (alert.context as any)?.senderId;
        if (senderId) {
          // Find the conversation that has this sender as the other user
          const conv = (data || []).find((r: any) => {
            const otherId = r.user_id_1 === userId ? r.user_id_2 : r.user_id_1;
            return otherId === senderId;
          });
          if (conv) {
            unreadMap[conv.id] = (unreadMap[conv.id] || 0) + 1;
          }
        }
      }
    }

    return (data || []).map((row: any) => {
      const isUser1 = row.user_id_1 === userId;
      const otherProfile = isUser1 ? row.user2 : row.user1;

      return {
        id: row.id,
        otherUser: otherProfile
          ? {
              id: otherProfile.id,
              fullName: [otherProfile.first_name, otherProfile.last_name]
                .filter(Boolean)
                .join(' '),
              avatarUrl: otherProfile.avatar_url,
            }
          : { id: isUser1 ? row.user_id_2 : row.user_id_1, fullName: 'Unknown' },
        lastMessage: row.last_message_preview,
        lastMessageAt: row.last_message_at,
        messageCount: row.message_count || 0,
        unreadCount: unreadMap[row.id] || 0,
      } satisfies Conversation;
    });
  }

  async getOrCreateConversation(
    userId: string,
    otherUserId: string
  ): Promise<Conversation> {
    // Normalize ordering so we can find the conversation regardless of who initiated
    const [uid1, uid2] = [userId, otherUserId].sort();

    const { data: existing } = await supabase
      .from('direct_conversations')
      .select(`
        *,
        user1:profiles!direct_conversations_user_id_1_fkey(id, first_name, last_name, avatar_url),
        user2:profiles!direct_conversations_user_id_2_fkey(id, first_name, last_name, avatar_url)
      `)
      .eq('user_id_1', uid1)
      .eq('user_id_2', uid2)
      .single();

    if (existing) {
      return this.mapConversation(existing, userId);
    }

    const { data: created, error } = await supabase
      .from('direct_conversations')
      .insert({
        user_id_1: uid1,
        user_id_2: uid2,
      })
      .select(`
        *,
        user1:profiles!direct_conversations_user_id_1_fkey(id, first_name, last_name, avatar_url),
        user2:profiles!direct_conversations_user_id_2_fkey(id, first_name, last_name, avatar_url)
      `)
      .single();

    if (error) throw new Error(error.message);
    return this.mapConversation(created, userId);
  }

  /**
   * Get or verify the chat room for an activity.
   */
  async getActivityChatRoom(activityId: string): Promise<GroupChat | null> {
    const { data, error } = await supabase
      .from('chat_rooms')
      .select('*')
      .eq('type', 'activity')
      .eq('reference_id', activityId)
      .maybeSingle();

    if (error || !data) return null;
    return this.mapGroupChat(data);
  }

  /**
   * Get activity chat rooms the user is participating in.
   */
  async getActivityChats(userId: string): Promise<GroupChat[]> {
    // Get activities the user has joined
    const { data: participations } = await supabase
      .from('activity_participants')
      .select('activity_id')
      .eq('user_id', userId);

    const activityIds = (participations || []).map((p: any) => p.activity_id);
    if (activityIds.length === 0) return [];

    const { data, error } = await supabase
      .from('chat_rooms')
      .select('*')
      .eq('type', 'activity')
      .in('reference_id', activityIds)
      .order('last_message_at', { ascending: false, nullsFirst: false });

    if (error) throw new Error(error.message);

    // Fetch unread counts from message_read_status
    const chatIds = (data || []).map((c: any) => c.id);
    const unreadMap: Record<string, number> = {};
    if (chatIds.length > 0) {
      const { data: readStatus } = await supabase
        .from('message_read_status')
        .select('chat_id, unread_count')
        .eq('user_id', userId)
        .eq('chat_type', 'activity')
        .in('chat_id', chatIds);
      for (const row of readStatus || []) {
        unreadMap[row.chat_id] = row.unread_count || 0;
      }
    }

    return (data || []).map((c: any) => this.mapGroupChat(c, unreadMap[c.id] || 0));
  }

  // ============================================
  // GROUP CHATS
  // ============================================

  async getGroupChats(userId: string): Promise<GroupChat[]> {
    // Get groups the user belongs to
    const { data: memberships } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', userId);

    const groupIds = (memberships || []).map((m: any) => m.group_id);
    if (groupIds.length === 0) return [];

    const { data, error } = await supabase
      .from('chat_rooms')
      .select('*')
      .eq('type', 'group')
      .in('reference_id', groupIds)
      .order('last_message_at', { ascending: false, nullsFirst: false });

    if (error) throw new Error(error.message);

    // Fetch unread counts from message_read_status
    const chatIds = (data || []).map((c: any) => c.id);
    const unreadMap: Record<string, number> = {};
    if (chatIds.length > 0) {
      const { data: readStatus } = await supabase
        .from('message_read_status')
        .select('chat_id, unread_count')
        .eq('user_id', userId)
        .eq('chat_type', 'group')
        .in('chat_id', chatIds);
      for (const row of readStatus || []) {
        unreadMap[row.chat_id] = row.unread_count || 0;
      }
    }

    return (data || []).map((c: any) => this.mapGroupChat(c, unreadMap[c.id] || 0));
  }

  // ============================================
  // MESSAGES
  // ============================================

  async getMessages(
    conversationId: string,
    options?: { limit?: number; before?: string }
  ): Promise<Message[]> {
    const limit = options?.limit ?? 50;

    let query = supabase
      .from('chat_messages')
      .select('*')
      .or(
        `group_id.eq.${conversationId},conversation_id.eq.${conversationId}`
      )
      .order('created_at', { ascending: false })
      .limit(limit);

    if (options?.before) {
      query = query.lt('created_at', options.before);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    return (data || []).reverse().map(this.mapMessage.bind(this, conversationId));
  }

  async sendMessage(
    conversationId: string,
    userId: string,
    content: string,
    type: string = 'text'
  ): Promise<Message> {
    if (!checkMessageRateLimit()) {
      throw new Error('Rate limit exceeded. Please wait before sending more messages.');
    }

    // Determine if this is a group chat or direct conversation
    const { data: room } = await supabase
      .from('chat_rooms')
      .select('id')
      .eq('id', conversationId)
      .single();

    const insertPayload: Record<string, unknown> = {
      user_id: userId,
      content,
      message_type: type,
    };

    if (room) {
      insertPayload.group_id = conversationId;
    } else {
      insertPayload.conversation_id = conversationId;
    }

    const { data: message, error } = await supabase
      .from('chat_messages')
      .insert(insertPayload)
      .select('*')
      .single();

    if (error) throw new Error(error.message);

    const lastMsgFields = {
      last_message_at: message.created_at,
      last_message_preview: content.substring(0, 100),
    };

    if (room) {
      // M6: Use atomic counter RPC instead of read-modify-write
      await supabase.rpc('increment_chat_message_count', { p_room_id: conversationId, p_delta: 1 });

      // Update last_message fields
      await supabase
        .from('chat_rooms')
        .update(lastMsgFields)
        .eq('id', conversationId);

      // Get room metadata for notifications
      const { data: roomData } = await supabase
        .from('chat_rooms')
        .select('name, reference_id, type')
        .eq('id', conversationId)
        .single();

      // H2: Only notify for activity chats if no recent activity_comment alert (dedup)
      if (roomData?.type === 'activity' && roomData?.reference_id) {
        this.notifyGroupChatMessage(roomData.reference_id, userId, roomData.name || 'Activity', content, 'activity').catch(() => {});
      }
      // M9: Also notify for regular group chats
      if (roomData?.type === 'group' && roomData?.reference_id) {
        this.notifyGroupChatMessage(roomData.reference_id, userId, roomData.name || 'Group', content, 'group').catch(() => {});
      }
    } else {
      // DM: atomic increment
      await supabase.rpc('increment_conversation_message_count', { p_conv_id: conversationId, p_delta: 1 });

      await supabase
        .from('direct_conversations')
        .update(lastMsgFields)
        .eq('id', conversationId);

      // Get conversation to find recipient
      const { data: convData } = await supabase
        .from('direct_conversations')
        .select('user_id_1, user_id_2')
        .eq('id', conversationId)
        .single();

      // Create alert for the other user so it shows on badges + notifications
      if (convData) {
        const recipientId = convData.user_id_1 === userId ? convData.user_id_2 : convData.user_id_1;
        this.notifyDmMessage(recipientId, userId, content).catch(() => {});
      }
    }

    return this.mapMessage(conversationId, message);
  }

  // ============================================
  // MAPPERS
  // ============================================

  /**
   * Notify recipient of a new DM message via alerts table.
   */
  private async notifyDmMessage(
    recipientId: string,
    senderId: string,
    content: string,
  ): Promise<void> {
    try {
      const { data: senderProfile } = await supabase
        .from('profiles')
        .select('first_name')
        .eq('id', senderId)
        .single();

      const senderName = senderProfile?.first_name || 'Someone';

      await supabase.from('alerts').insert({
        user_id: recipientId,
        category_code: 'social',
        alert_type_code: 'dm_message',
        title: `${senderName} sent you a message`,
        body: content.length > 80 ? content.substring(0, 80) + '...' : content,
        context: { senderId, senderName },
        action_url: `/community/chat/${senderId}`,
        status: 'delivered',
      });
    } catch (err) {
      if (__DEV__) console.warn('notifyDmMessage error:', err);
    }
  }

  /**
   * Notify other participants about a new chat message.
   * Handles both activity group chats and regular group chats (M9).
   * H2: Skips activity chat alerts if a recent activity_comment alert exists (dedup).
   */
  private async notifyGroupChatMessage(
    referenceId: string,
    senderId: string,
    chatName: string,
    content: string,
    chatType: 'activity' | 'group' = 'activity',
  ): Promise<void> {
    try {
      const { data: senderProfile } = await supabase
        .from('profiles')
        .select('first_name')
        .eq('id', senderId)
        .single();

      const senderName = senderProfile?.first_name || 'Someone';

      // Get participants based on chat type
      let participantIds: string[] = [];
      if (chatType === 'activity') {
        const { data: participants } = await supabase
          .from('activity_participants')
          .select('user_id')
          .eq('activity_id', referenceId)
          .neq('user_id', senderId);
        participantIds = (participants || []).map((p: any) => p.user_id);
      } else {
        const { data: members } = await supabase
          .from('group_members')
          .select('user_id')
          .eq('group_id', referenceId)
          .neq('user_id', senderId);
        participantIds = (members || []).map((m: any) => m.user_id);
      }

      if (participantIds.length === 0) return;

      const alertType = chatType === 'activity' ? 'activity_message' : 'group_message';
      const actionUrl = chatType === 'activity'
        ? `/community/activity-chat/${referenceId}`
        : `/community/${referenceId}`;

      const alerts = participantIds.map((uid: string) => ({
        user_id: uid,
        category_code: 'social',
        alert_type_code: alertType,
        title: `${senderName} in "${chatName}"`,
        body: content.length > 80 ? content.substring(0, 80) + '...' : content,
        context: { referenceId, senderId, senderName, chatType },
        action_url: actionUrl,
        status: 'delivered',
      }));

      await supabase.from('alerts').insert(alerts);
    } catch (err) {
      if (__DEV__) console.warn('notifyGroupChatMessage error:', err);
    }
  }

  private mapConversation(data: any, currentUserId: string): Conversation {
    const isUser1 = data.user_id_1 === currentUserId;
    const otherProfile = isUser1 ? data.user2 : data.user1;

    return {
      id: data.id,
      otherUser: otherProfile
        ? {
            id: otherProfile.id,
            fullName: [otherProfile.first_name, otherProfile.last_name]
              .filter(Boolean)
              .join(' '),
            avatarUrl: otherProfile.avatar_url,
          }
        : { id: isUser1 ? data.user_id_2 : data.user_id_1, fullName: 'Unknown' },
      lastMessage: data.last_message_preview,
      lastMessageAt: data.last_message_at,
      messageCount: data.message_count || 0,
    };
  }

  private mapGroupChat = (data: any, unreadCount: number = 0): GroupChat => {
    return {
      id: data.id,
      name: data.name,
      referenceId: data.reference_id,
      type: data.type,
      lastMessage: data.last_message_preview,
      lastMessageAt: data.last_message_at,
      messageCount: data.message_count || 0,
      unreadCount,
    };
  }

  private mapMessage(conversationId: string, data: any): Message {
    return {
      id: data.id,
      conversationId,
      senderId: data.user_id,
      content: data.content,
      type: data.message_type || 'text',
      createdAt: data.created_at,
    };
  }
}

export const chatService = new ChatService();
export default chatService;
