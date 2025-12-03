/**
 * CHAT TYPES
 * 
 * Type definitions for messaging within communities.
 * Starting with simple text - designed to scale to rich media.
 */

// ============================================
// MESSAGE TYPES
// ============================================

export type MessageType = 'text' | 'image' | 'video' | 'file' | 'location' | 'voice' | 'system';
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
export type ChatType = 'community' | 'direct' | 'event';

export interface MessageSender {
  id: string;
  firstName: string;
  lastName: string;
  avatar: string;
  isPremium: boolean;
}

export interface MediaAttachment {
  type: 'image' | 'video';
  url: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  duration?: number; // for video
}

export interface Message {
  id: string;
  chatId: string;
  chatType: ChatType;
  senderId: string;
  sender: MessageSender;
  type: MessageType;
  content: string;
  status: MessageStatus;
  createdAt: Date;
  editedAt?: Date;
  isDeleted: boolean;
  
  // Media attachments
  media?: MediaAttachment[];
  
  // Location sharing
  location?: { lat: number; lng: number; name: string };
  
  // Future: Reactions
  // reactions?: { emoji: string; userIds: string[] }[];
  
  // Future: Reply threading
  // replyTo?: string;
  // replyPreview?: { content: string; senderName: string };
}

export interface MessagePreview {
  id: string;
  content: string;
  senderName: string;
  createdAt: Date;
  isRead: boolean;
}

// ============================================
// CHAT / CONVERSATION
// ============================================

export interface Chat {
  id: string;
  type: ChatType;
  // For community chats
  communityId?: string;
  communityName?: string;
  communityAvatar?: string;
  // For direct messages
  participants?: MessageSender[];
  // For event chats
  eventId?: string;
  eventName?: string;
  
  lastMessage?: MessagePreview;
  unreadCount: number;
  isMuted: boolean;
  isPinned: boolean;
  updatedAt: Date;
}

export interface ChatListItem {
  id: string;
  type: ChatType;
  name: string;
  avatar: string;
  lastMessage?: string;
  lastMessageTime?: Date;
  unreadCount: number;
  isMuted: boolean;
  isPinned: boolean;
  isOnline?: boolean; // For DMs
}

// ============================================
// CHAT ACTIONS
// ============================================

export interface SendMessageInput {
  chatId: string;
  chatType: ChatType;
  content: string;
  type?: MessageType;
}

export interface ChatSettings {
  isMuted: boolean;
  isPinned: boolean;
  notificationsEnabled: boolean;
}

// ============================================
// TYPING INDICATOR (Future)
// ============================================

export interface TypingUser {
  userId: string;
  firstName: string;
  avatar: string;
  startedAt: Date;
}

// ============================================
// PREMIUM GATE
// ============================================

export interface ChatPermissions {
  canSendMessages: boolean;
  canSendMedia: boolean;
  canReact: boolean;
  canReply: boolean;
  reason?: 'not_member' | 'not_premium' | 'banned' | 'muted';
}

export function getDefaultChatPermissions(isPremium: boolean, isMember: boolean): ChatPermissions {
  if (!isMember) {
    return {
      canSendMessages: false,
      canSendMedia: false,
      canReact: false,
      canReply: false,
      reason: 'not_member',
    };
  }
  
  if (!isPremium) {
    return {
      canSendMessages: false,
      canSendMedia: false,
      canReact: false,
      canReply: false,
      reason: 'not_premium',
    };
  }
  
  return {
    canSendMessages: true,
    canSendMedia: true,
    canReact: true,
    canReply: true,
  };
}
