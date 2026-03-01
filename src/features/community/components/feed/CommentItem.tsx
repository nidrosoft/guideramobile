/**
 * COMMENT ITEM
 * 
 * Single comment with author info, content, like button,
 * reply button, and nested replies (one level deep).
 */

import React, { memo, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
} from 'react-native';
import { Heart, Verify, MessageText } from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/context/ThemeContext';
import { spacing, typography, borderRadius } from '@/styles';
import { FeedComment } from '../../types/feed.types';

interface CommentItemProps {
  comment: FeedComment;
  onLike: (commentId: string) => void;
  onReply: (commentId: string) => void;
  onAuthorPress: (authorId: string) => void;
  isReply?: boolean;
}

function CommentItem({ comment, onLike, onReply, onAuthorPress, isReply = false }: CommentItemProps) {
  const { colors: tc } = useTheme();
  const heartScale = useRef(new Animated.Value(1)).current;

  const handleLike = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.sequence([
      Animated.timing(heartScale, { toValue: 1.4, duration: 100, useNativeDriver: true }),
      Animated.timing(heartScale, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
    onLike(comment.id);
  }, [comment.id, onLike, heartScale]);

  const timeSince = getTimeSince(comment.createdAt);

  return (
    <View style={[styles.container, isReply && styles.replyContainer]}>
      <TouchableOpacity onPress={() => onAuthorPress(comment.author.id)} activeOpacity={0.7}>
        <Image source={{ uri: comment.author.avatar }} style={[styles.avatar, isReply && styles.replyAvatar]} />
      </TouchableOpacity>

      <View style={styles.content}>
        {/* Author + Content bubble */}
        <View style={[styles.bubble, { backgroundColor: tc.bgCard }]}>
          <View style={styles.nameRow}>
            <TouchableOpacity onPress={() => onAuthorPress(comment.author.id)} activeOpacity={0.7}>
              <Text style={[styles.authorName, { color: tc.textPrimary }]}>
                {comment.author.firstName} {comment.author.lastName}
              </Text>
            </TouchableOpacity>
            {comment.author.isVerified && (
              <Verify size={12} color={tc.primary} variant="Bold" />
            )}
            {comment.isAuthorReply && (
              <View style={[styles.opBadge, { backgroundColor: tc.primary + '18' }]}>
                <Text style={[styles.opText, { color: tc.primary }]}>OP</Text>
              </View>
            )}
          </View>
          <Text style={[styles.commentText, { color: tc.textSecondary }]}>
            {comment.content}
          </Text>
        </View>

        {/* Action row */}
        <View style={styles.actionsRow}>
          <Text style={[styles.timeText, { color: tc.textTertiary }]}>{timeSince}</Text>

          <TouchableOpacity onPress={handleLike} style={styles.actionButton}>
            <Animated.View style={{ transform: [{ scale: heartScale }] }}>
              <Heart
                size={13}
                color={comment.isLiked ? '#EF4444' : tc.textTertiary}
                variant={comment.isLiked ? 'Bold' : 'Linear'}
              />
            </Animated.View>
            {comment.likeCount > 0 && (
              <Text style={[styles.actionCount, { color: comment.isLiked ? '#EF4444' : tc.textTertiary }]}>
                {comment.likeCount}
              </Text>
            )}
          </TouchableOpacity>

          {!isReply && (
            <TouchableOpacity onPress={() => onReply(comment.id)} style={styles.actionButton}>
              <MessageText size={13} color={tc.textTertiary} variant="Linear" />
              <Text style={[styles.actionText, { color: tc.textTertiary }]}>Reply</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Nested replies */}
        {!isReply && comment.replies && comment.replies.length > 0 && (
          <View style={styles.repliesContainer}>
            {comment.replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                onLike={onLike}
                onReply={onReply}
                onAuthorPress={onAuthorPress}
                isReply
              />
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

function getTimeSince(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  if (diffMins < 1) return 'now';
  if (diffMins < 60) return `${diffMins}m`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d`;
}

export default memo(CommentItem);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  replyContainer: {
    marginLeft: 0,
    marginBottom: spacing.sm,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    marginTop: 2,
  },
  replyAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
  },
  content: {
    flex: 1,
  },
  bubble: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.xl,
    borderTopLeftRadius: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  authorName: {
    fontSize: 13,
    fontWeight: '600',
  },
  opBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: borderRadius.sm,
    marginLeft: 2,
  },
  opText: {
    fontSize: 9,
    fontWeight: '700',
  },
  commentText: {
    ...typography.bodySm,
    lineHeight: 19,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingLeft: spacing.md,
    marginTop: 4,
  },
  timeText: {
    fontSize: 11,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingVertical: 2,
  },
  actionCount: {
    fontSize: 11,
    fontWeight: '500',
  },
  actionText: {
    fontSize: 11,
    fontWeight: '500',
  },
  repliesContainer: {
    marginTop: spacing.sm,
    marginLeft: spacing.xs,
  },
});
