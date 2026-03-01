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
import { useTheme } from '@/context/ThemeContext';
import { spacing, borderRadius } from '@/styles';

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
  const { colors: tc } = useTheme();

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  };
  
  const renderStatusIcon = () => {
    switch (message.status) {
      case 'sending':
        return <Clock size={12} color={tc.textTertiary} />;
      case 'sent':
        return <TickCircle size={12} color={tc.textTertiary} />;
      case 'delivered':
        return <TickCircle size={12} color={tc.textTertiary} variant="Bold" />;
      case 'read':
        return <TickCircle size={12} color={tc.primary} variant="Bold" />;
      case 'failed':
        return <CloseCircle size={12} color={tc.error} />;
      default:
        return null;
    }
  };
  
  // System message
  if (message.type === 'system') {
    return (
      <View style={styles.systemContainer}>
        <Text style={[styles.systemText, { backgroundColor: tc.borderSubtle, color: tc.textSecondary }]}>
          {message.content}
        </Text>
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
          <Text style={[styles.senderName, { color: tc.primary }]}>{message.senderName}</Text>
        )}
        
        {/* Reply context */}
        {message.replyTo && (
          <TouchableOpacity 
            style={[styles.replyContext, { backgroundColor: tc.borderSubtle }]}
            onPress={onReplyPress}
            activeOpacity={0.7}
          >
            <View style={[styles.replyBar, { backgroundColor: tc.primary }]} />
            <View style={styles.replyContent}>
              <Text style={[styles.replyName, { color: tc.primary }]}>{message.replyTo.senderName}</Text>
              <Text style={[styles.replyPreview, { color: tc.textSecondary }]} numberOfLines={1}>
                {message.replyTo.preview}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        
        {/* Message bubble */}
        <Pressable
          style={[
            styles.bubble,
            isOwn
              ? [styles.bubbleOwn, { backgroundColor: tc.primary }]
              : [styles.bubbleOther, { backgroundColor: tc.bgElevated, shadowColor: tc.black }],
          ]}
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
              <View style={[styles.playButton, { backgroundColor: tc.primary + '20' }, isOwn && styles.playButtonOwn]}>
                <Microphone2 
                  size={16} 
                  color={isOwn ? '#FFFFFF' : tc.primary} 
                  variant="Bold" 
                />
              </View>
              <View style={styles.waveform}>
                {[...Array(20)].map((_, i) => (
                  <View 
                    key={i} 
                    style={[
                      styles.waveformBar,
                      { height: Math.random() * 16 + 4, backgroundColor: tc.primary },
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
              <View style={[styles.locationIcon, { backgroundColor: tc.primary + '15' }]}>
                <Location size={24} color={tc.primary} variant="Bold" />
              </View>
              <Text style={[styles.locationText, { color: tc.textPrimary }, isOwn && styles.textOwn]}>
                Shared location
              </Text>
            </View>
          )}
          
          {/* Text content */}
          {(message.type === 'text' || message.content) && (
            <Text style={[styles.messageText, { color: tc.textPrimary }, isOwn && styles.textOwn]}>
              {message.content}
            </Text>
          )}
          
          {/* Time and status */}
          <View style={styles.metaRow}>
            <Text style={[styles.time, { color: tc.textTertiary }, isOwn && styles.timeOwn]}>
              {formatTime(message.createdAt)}
              {message.isEdited && ' . edited'}
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
                  { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle },
                  reaction.userReacted && { borderColor: tc.primary, backgroundColor: tc.primary + '10' },
                ]}
                onPress={() => onReactionPress?.(reaction.emoji)}
                activeOpacity={0.7}
              >
                <Text style={styles.reactionEmoji}>{reaction.emoji}</Text>
                {reaction.count > 1 && (
                  <Text style={[styles.reactionCount, { color: tc.textSecondary }]}>{reaction.count}</Text>
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
    marginBottom: spacing.md,
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
    marginBottom: 2,
    marginLeft: spacing.sm,
  },
  replyContext: {
    flexDirection: 'row',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: 4,
  },
  replyBar: {
    width: 3,
    borderRadius: 2,
    marginRight: spacing.sm,
  },
  replyContent: {
    flex: 1,
  },
  replyName: {
    fontSize: 12,
    fontWeight: '600',
  },
  replyPreview: {
    fontSize: 12,
  },
  bubble: {
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
    paddingHorizontal: spacing.md,
    minWidth: 60,
  },
  bubbleOwn: {
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    borderBottomLeftRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  textOwn: {
    color: '#FFFFFF',
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
    borderRadius: 2,
  },
  waveformBarOwn: {
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  duration: {
    fontSize: 11,
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationText: {
    fontSize: 14,
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
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    gap: 2,
  },
  reactionEmoji: {
    fontSize: 14,
  },
  reactionCount: {
    fontSize: 11,
    fontWeight: '500',
  },
  systemContainer: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  systemText: {
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
});
