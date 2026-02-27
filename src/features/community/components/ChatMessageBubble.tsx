/**
 * CHAT MESSAGE BUBBLE
 * 
 * Displays a chat message with support for text, images, reactions, and replies.
 */

import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Pressable } from 'react-native';
import { 
  TickCircle,
  Clock,
  CloseCircle,
  Image as ImageIcon,
  Microphone2,
  Location,
} from 'iconsax-react-native';
import { colors, spacing, borderRadius } from '@/styles';

export type MessageType = 'text' | 'image' | 'voice' | 'location' | 'system';
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

export interface MessageReaction {
  emoji: string;
  count: number;
  userReacted: boolean;
}

export interface ReplyContext {
  messageId: string;
  senderName: string;
  preview: string;
}

export interface ChatMessageData {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  type: MessageType;
  content: string;
  media?: {
    url: string;
    thumbnail?: string;
    duration?: number;
  }[];
  replyTo?: ReplyContext;
  reactions?: MessageReaction[];
  status: MessageStatus;
  createdAt: Date;
  isEdited?: boolean;
}

interface ChatMessageBubbleProps {
  message: ChatMessageData;
  isOwn: boolean;
  showAvatar?: boolean;
  showName?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
  onReactionPress?: (emoji: string) => void;
  onReplyPress?: () => void;
  onImagePress?: (url: string) => void;
}

export default function ChatMessageBubble({
  message,
  isOwn,
  showAvatar = true,
  showName = false,
  onPress,
  onLongPress,
  onReactionPress,
  onReplyPress,
  onImagePress,
}: ChatMessageBubbleProps) {
  
  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  };
  
  const renderStatusIcon = () => {
    switch (message.status) {
      case 'sending':
        return <Clock size={12} color={colors.gray400} />;
      case 'sent':
        return <TickCircle size={12} color={colors.gray400} />;
      case 'delivered':
        return <TickCircle size={12} color={colors.gray500} variant="Bold" />;
      case 'read':
        return <TickCircle size={12} color={colors.primary} variant="Bold" />;
      case 'failed':
        return <CloseCircle size={12} color={colors.error} />;
      default:
        return null;
    }
  };
  
  // System message
  if (message.type === 'system') {
    return (
      <View style={styles.systemContainer}>
        <Text style={styles.systemText}>{message.content}</Text>
      </View>
    );
  }
  
  return (
    <View style={[styles.container, isOwn && styles.containerOwn]}>
      {/* Avatar (for others' messages) */}
      {!isOwn && showAvatar && (
        <Image source={{ uri: message.senderAvatar }} style={styles.avatar} />
      )}
      {!isOwn && !showAvatar && <View style={styles.avatarPlaceholder} />}
      
      <View style={[styles.bubbleContainer, isOwn && styles.bubbleContainerOwn]}>
        {/* Sender name (for group chats) */}
        {!isOwn && showName && (
          <Text style={styles.senderName}>{message.senderName}</Text>
        )}
        
        {/* Reply context */}
        {message.replyTo && (
          <TouchableOpacity 
            style={styles.replyContext}
            onPress={onReplyPress}
            activeOpacity={0.7}
          >
            <View style={styles.replyBar} />
            <View style={styles.replyContent}>
              <Text style={styles.replyName}>{message.replyTo.senderName}</Text>
              <Text style={styles.replyPreview} numberOfLines={1}>
                {message.replyTo.preview}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        
        {/* Message bubble */}
        <Pressable
          style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}
          onPress={onPress}
          onLongPress={onLongPress}
        >
          {/* Image content */}
          {message.type === 'image' && message.media && message.media.length > 0 && (
            <View style={styles.imageContainer}>
              {message.media.map((img, index) => (
                <TouchableOpacity 
                  key={index}
                  onPress={() => onImagePress?.(img.url)}
                  activeOpacity={0.9}
                >
                  <Image 
                    source={{ uri: img.thumbnail || img.url }} 
                    style={styles.messageImage}
                  />
                </TouchableOpacity>
              ))}
            </View>
          )}
          
          {/* Voice message */}
          {message.type === 'voice' && (
            <View style={styles.voiceContainer}>
              <View style={[styles.playButton, isOwn && styles.playButtonOwn]}>
                <Microphone2 
                  size={16} 
                  color={isOwn ? colors.white : colors.primary} 
                  variant="Bold" 
                />
              </View>
              <View style={styles.waveform}>
                {[...Array(20)].map((_, i) => (
                  <View 
                    key={i} 
                    style={[
                      styles.waveformBar,
                      { height: Math.random() * 16 + 4 },
                      isOwn && styles.waveformBarOwn,
                    ]} 
                  />
                ))}
              </View>
              {message.media?.[0]?.duration && (
                <Text style={[styles.duration, isOwn && styles.durationOwn]}>
                  {Math.floor(message.media[0].duration / 60)}:{String(message.media[0].duration % 60).padStart(2, '0')}
                </Text>
              )}
            </View>
          )}
          
          {/* Location message */}
          {message.type === 'location' && (
            <View style={styles.locationContainer}>
              <View style={styles.locationIcon}>
                <Location size={24} color={colors.primary} variant="Bold" />
              </View>
              <Text style={[styles.locationText, isOwn && styles.textOwn]}>
                📍 Shared location
              </Text>
            </View>
          )}
          
          {/* Text content */}
          {(message.type === 'text' || message.content) && (
            <Text style={[styles.messageText, isOwn && styles.textOwn]}>
              {message.content}
            </Text>
          )}
          
          {/* Time and status */}
          <View style={styles.metaRow}>
            <Text style={[styles.time, isOwn && styles.timeOwn]}>
              {formatTime(message.createdAt)}
              {message.isEdited && ' • edited'}
            </Text>
            {isOwn && renderStatusIcon()}
          </View>
        </Pressable>
        
        {/* Reactions */}
        {message.reactions && message.reactions.length > 0 && (
          <View style={[styles.reactions, isOwn && styles.reactionsOwn]}>
            {message.reactions.map((reaction, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.reactionBadge,
                  reaction.userReacted && styles.reactionBadgeActive,
                ]}
                onPress={() => onReactionPress?.(reaction.emoji)}
                activeOpacity={0.7}
              >
                <Text style={styles.reactionEmoji}>{reaction.emoji}</Text>
                {reaction.count > 1 && (
                  <Text style={styles.reactionCount}>{reaction.count}</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  containerOwn: {
    flexDirection: 'row-reverse',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: spacing.sm,
  },
  avatarPlaceholder: {
    width: 32,
    marginRight: spacing.sm,
  },
  bubbleContainer: {
    maxWidth: '75%',
  },
  bubbleContainerOwn: {
    alignItems: 'flex-end',
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 2,
    marginLeft: spacing.sm,
  },
  replyContext: {
    flexDirection: 'row',
    backgroundColor: colors.gray100,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: 4,
  },
  replyBar: {
    width: 3,
    backgroundColor: colors.primary,
    borderRadius: 2,
    marginRight: spacing.sm,
  },
  replyContent: {
    flex: 1,
  },
  replyName: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  replyPreview: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  bubble: {
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
    paddingHorizontal: spacing.md,
    minWidth: 60,
  },
  bubbleOwn: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: colors.white,
    borderBottomLeftRadius: 4,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  messageText: {
    fontSize: 15,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  textOwn: {
    color: colors.white,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 4,
  },
  time: {
    fontSize: 11,
    color: colors.gray400,
  },
  timeOwn: {
    color: 'rgba(255,255,255,0.7)',
  },
  imageContainer: {
    marginBottom: spacing.xs,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  messageImage: {
    width: 200,
    height: 150,
    borderRadius: borderRadius.md,
  },
  voiceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minWidth: 150,
  },
  playButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButtonOwn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  waveform: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    height: 24,
  },
  waveformBar: {
    width: 3,
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  waveformBarOwn: {
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  duration: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  durationOwn: {
    color: 'rgba(255,255,255,0.7)',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  locationIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationText: {
    fontSize: 14,
    color: colors.textPrimary,
  },
  reactions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 4,
  },
  reactionsOwn: {
    justifyContent: 'flex-end',
  },
  reactionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.gray200,
    gap: 2,
  },
  reactionBadgeActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  reactionEmoji: {
    fontSize: 14,
  },
  reactionCount: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  systemContainer: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  systemText: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    backgroundColor: colors.gray100,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
});
