/**
 * CHAT REALTIME CHANNEL
 *
 * Subscribes to Supabase Realtime for group chat messages.
 * Handles new messages, message updates, and typing indicators.
 */

import { supabase } from '@/lib/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

const activeChannels = new Map<string, RealtimeChannel>();

export interface ChatMessage {
  id: string;
  groupId: string;
  userId: string;
  content: string;
  messageType: 'text' | 'image' | 'location' | 'system';
  replyToId?: string;
  createdAt: string;
  updatedAt?: string;
}

export type ChatMessageCallback = (message: ChatMessage) => void;
export type TypingCallback = (data: { userId: string; isTyping: boolean }) => void;

/**
 * Subscribe to real-time chat messages for a group
 */
export function subscribeToChatMessages(
  groupId: string,
  onMessage: ChatMessageCallback,
  onTyping?: TypingCallback
): RealtimeChannel {
  // Cleanup existing channel for this group
  const existing = activeChannels.get(groupId);
  if (existing) {
    supabase.removeChannel(existing);
  }

  const channel = supabase
    .channel(`chat:${groupId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `group_id=eq.${groupId}`,
      },
      (payload) => {
        const msg = payload.new as Record<string, unknown>;
        onMessage({
          id: msg.id as string,
          groupId: msg.group_id as string,
          userId: msg.user_id as string,
          content: msg.content as string,
          messageType: (msg.message_type as string || 'text') as ChatMessage['messageType'],
          replyToId: msg.reply_to_id as string | undefined,
          createdAt: msg.created_at as string,
          updatedAt: msg.updated_at as string | undefined,
        });
      }
    )
    .on(
      'broadcast',
      { event: 'typing' },
      (payload) => {
        if (onTyping && payload.payload) {
          onTyping({
            userId: payload.payload.userId as string,
            isTyping: payload.payload.isTyping as boolean,
          });
        }
      }
    )
    .subscribe();

  activeChannels.set(groupId, channel);
  return channel;
}

/**
 * Send typing indicator for a group chat
 */
export function sendTypingIndicator(
  groupId: string,
  userId: string,
  isTyping: boolean
): void {
  const channel = activeChannels.get(groupId);
  if (channel) {
    channel.send({
      type: 'broadcast',
      event: 'typing',
      payload: { userId, isTyping },
    });
  }
}

/**
 * Unsubscribe from a group's chat channel
 */
export function unsubscribeFromChat(groupId: string): void {
  const channel = activeChannels.get(groupId);
  if (channel) {
    supabase.removeChannel(channel);
    activeChannels.delete(groupId);
  }
}

/**
 * Unsubscribe from all chat channels
 */
export function unsubscribeFromAllChats(): void {
  for (const [groupId, channel] of activeChannels) {
    supabase.removeChannel(channel);
  }
  activeChannels.clear();
}
