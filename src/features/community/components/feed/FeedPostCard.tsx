/**
 * FEED POST CARD
 * 
 * Main post card for the group feed. Displays author info,
 * post content, media, location, type badge, and reactions.
 */

import React, { memo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Image,
} from 'react-native';
import {
  Location,
  Verify,
  More,
  LampCharge,
  MessageQuestion,
  People,
  ShieldTick,
  Discover,
  Wallet2,
  Camera,
  TickCircle,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/context/ThemeContext';
import { spacing, typography, borderRadius, shadows } from '@/styles';
import {
  FeedPost,
  ReactionType,
  POST_TYPE_CONFIGS,
} from '../../types/feed.types';
import PostMediaGrid from './PostMediaGrid';
import PostReactions from './PostReactions';
import CostReportCard from './CostReportCard';
import BuddyRequestCard from './BuddyRequestCard';

interface FeedPostCardProps {
  post: FeedPost;
  onPress?: () => void;
  onAuthorPress?: (authorId: string) => void;
  onReact?: (postId: string, type: ReactionType) => void;
  onComment?: (postId: string) => void;
  onShare?: (postId: string) => void;
  onMore?: (postId: string) => void;
}

function FeedPostCard({
  post,
  onPress,
  onAuthorPress,
  onReact,
  onComment,
  onShare,
  onMore,
}: FeedPostCardProps) {
  const { colors: tc } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const typeConfig = POST_TYPE_CONFIGS[post.postType];

  const handlePressIn = useCallback(() => {
    Animated.timing(scaleAnim, {
      toValue: 0.985,
      duration: 100,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  const timeSince = getTimeSince(post.createdAt);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: tc.bgElevated,
          borderColor: tc.borderSubtle,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      {/* Pinned indicator */}
      {post.isPinned && (
        <View style={[styles.pinnedBar, { backgroundColor: tc.primarySubtle }]}>
          <ShieldTick size={13} color={tc.primary} variant="Bold" />
          <Text style={[styles.pinnedText, { color: tc.primary }]}>Pinned</Text>
        </View>
      )}

      {/* Author Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.authorRow}
          onPress={() => onAuthorPress?.(post.author.id)}
          activeOpacity={0.7}
        >
          <Image source={{ uri: post.author.avatar }} style={styles.avatar} />
          <View style={styles.authorInfo}>
            <View style={styles.nameRow}>
              <Text style={[styles.authorName, { color: tc.textPrimary }]}>
                {post.author.firstName} {post.author.lastName}
              </Text>
              {post.author.isVerified && (
                <Verify size={14} color={tc.primary} variant="Bold" />
              )}
            </View>
            <View style={styles.metaRow}>
              <Text style={[styles.timeText, { color: tc.textTertiary }]}>
                {timeSince}
              </Text>
              {post.location && (
                <>
                  <View style={[styles.metaDot, { backgroundColor: tc.textTertiary }]} />
                  <Location size={12} color={tc.textTertiary} variant="Bold" />
                  <Text
                    style={[styles.locationText, { color: tc.textTertiary }]}
                    numberOfLines={1}
                  >
                    {post.location.name}
                  </Text>
                  {post.location.verified && (
                    <TickCircle size={11} color={tc.primary} variant="Bold" />
                  )}
                </>
              )}
            </View>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.moreButton}
          onPress={() => onMore?.(post.id)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <More size={18} color={tc.textTertiary} variant="Linear" />
        </TouchableOpacity>
      </View>

      {/* Post Type Badge */}
      {post.postType !== 'general' && (
        <View style={styles.typeBadgeRow}>
          <View style={[styles.typeBadge, { backgroundColor: typeConfig.color + '15' }]}>
            <PostTypeIcon type={post.postType} size={13} color={typeConfig.color} />
            <Text style={[styles.typeBadgeText, { color: typeConfig.color }]}>
              {typeConfig.label}
            </Text>
            {post.postType === 'question' && post.isAnswered && (
              <View style={[styles.answeredBadge, { backgroundColor: tc.success + '20' }]}>
                <TickCircle size={10} color={tc.success} variant="Bold" />
                <Text style={[styles.answeredText, { color: tc.success }]}>Answered</Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Content */}
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        <Text style={[styles.content, { color: tc.textPrimary }]}>
          {post.content}
        </Text>

        {/* Buddy Request Details */}
        {post.postType === 'buddy_request' && post.buddyDetails && (
          <BuddyRequestCard details={post.buddyDetails} />
        )}

        {/* Cost Report */}
        {post.postType === 'cost_report' && post.costItems && (
          <CostReportCard items={post.costItems} />
        )}

        {/* Media Grid */}
        {post.photos.length > 0 && (
          <View style={styles.mediaWrapper}>
            <PostMediaGrid photos={post.photos} />
          </View>
        )}

        {/* Tags */}
        {post.tags.length > 0 && (
          <View style={styles.tagsRow}>
            {post.tags.map((tag) => (
              <View key={tag} style={[styles.tag, { backgroundColor: tc.primarySubtle }]}>
                <Text style={[styles.tagText, { color: tc.primary }]}>{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </TouchableOpacity>

      {/* Reactions & Actions */}
      <PostReactions
        reactionsCount={post.reactionsCount}
        commentCount={post.commentCount}
        myReaction={post.myReaction ?? null}
        onReact={(type) => onReact?.(post.id, type)}
        onComment={() => onComment?.(post.id)}
        onShare={() => onShare?.(post.id)}
      />
    </Animated.View>
  );
}

function PostTypeIcon({ type, size, color }: { type: string; size: number; color: string }) {
  switch (type) {
    case 'checkin': return <Location size={size} color={color} variant="Bold" />;
    case 'question': return <MessageQuestion size={size} color={color} variant="Bold" />;
    case 'tip': return <LampCharge size={size} color={color} variant="Bold" />;
    case 'buddy_request': return <People size={size} color={color} variant="Bold" />;
    case 'safety_alert': return <ShieldTick size={size} color={color} variant="Bold" />;
    case 'hidden_gem': return <Discover size={size} color={color} variant="Bold" />;
    case 'cost_report': return <Wallet2 size={size} color={color} variant="Bold" />;
    case 'photo_journal': return <Camera size={size} color={color} variant="Bold" />;
    default: return null;
  }
}

function getTimeSince(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return `${Math.floor(diffDays / 7)}w ago`;
}

export default memo(FeedPostCard);

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius['2xl'],
    marginBottom: spacing.md,
    overflow: 'hidden',
    borderWidth: 1,
    ...shadows.cardLight,
  },
  pinnedBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: 5,
  },
  pinnedText: {
    ...typography.captionSm,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  authorRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: spacing.sm,
  },
  authorInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  authorName: {
    ...typography.heading3,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
  },
  timeText: {
    ...typography.captionSm,
  },
  locationText: {
    ...typography.captionSm,
    maxWidth: 140,
  },
  moreButton: {
    padding: spacing.xs,
  },
  typeBadgeRow: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  answeredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginLeft: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  answeredText: {
    fontSize: 10,
    fontWeight: '600',
  },
  content: {
    ...typography.bodyLg,
    lineHeight: 21,
    paddingHorizontal: spacing.lg,
  },
  mediaWrapper: {
    paddingHorizontal: spacing.lg,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  tag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '500',
  },
});
