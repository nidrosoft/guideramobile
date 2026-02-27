/**
 * POST CARD
 * 
 * Displays a community post with author info, trust badge, content,
 * upvote/downvote buttons, and comment count.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { ArrowUp, ArrowDown, Message, Flag, More } from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '@/styles';
import { CommunityPost, EXPERTISE_OPTIONS } from '../types/guide.types';
import TrustBadge from './TrustBadge';

interface PostCardProps {
  post: CommunityPost;
  onPress?: () => void;
  onAuthorPress?: () => void;
  onComment?: () => void;
  onFlag?: () => void;
}

export default function PostCard({ post, onPress, onAuthorPress, onComment, onFlag }: PostCardProps) {
  const [myVote, setMyVote] = useState<'up' | 'down' | null>(post.myVote || null);
  const [score, setScore] = useState(post.score);

  const handleVote = (type: 'up' | 'down') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (myVote === type) {
      setMyVote(null);
      setScore(post.score);
    } else {
      setMyVote(type);
      const delta = type === 'up' ? 1 : -1;
      const prevDelta = myVote === 'up' ? -1 : myVote === 'down' ? 1 : 0;
      setScore(post.score + delta + prevDelta);
    }
  };

  const expertiseLabel = post.authorExpertise?.[0]
    ? EXPERTISE_OPTIONS.find(o => o.id === post.authorExpertise![0])?.label
    : null;

  const timeSince = getTimeSince(post.createdAt);

  return (
    <View style={styles.container}>
      {/* Pinned indicator */}
      {post.isPinned && (
        <View style={styles.pinnedBanner}>
          <Text style={styles.pinnedText}>📌 Pinned</Text>
        </View>
      )}

      {/* Author Header */}
      <TouchableOpacity style={styles.header} onPress={onAuthorPress} activeOpacity={0.7}>
        <Image source={{ uri: post.authorAvatar }} style={styles.avatar} />
        <View style={styles.headerInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.authorName}>{post.authorName}</Text>
            {post.authorTrustTier && (
              <TrustBadge tier={post.authorTrustTier} size="small" showLabel={false} />
            )}
          </View>
          <View style={styles.metaRow}>
            {post.isGuide && expertiseLabel && (
              <Text style={styles.expertiseTag}>{expertiseLabel}</Text>
            )}
            <Text style={styles.timeText}>{timeSince}</Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Content */}
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        <Text style={styles.content}>{post.content}</Text>

        {/* Photos */}
        {post.photos && post.photos.length > 0 && (
          <View style={styles.photosContainer}>
            {post.photos.map((photo, i) => (
              <Image key={i} source={{ uri: photo }} style={styles.postPhoto} />
            ))}
          </View>
        )}

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <View style={styles.tagsRow}>
            {post.tags.map((tag, i) => (
              <View key={i} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </TouchableOpacity>

      {/* Actions Bar */}
      <View style={styles.actionsBar}>
        {/* Vote Buttons */}
        <View style={styles.voteContainer}>
          <TouchableOpacity
            style={[styles.voteBtn, myVote === 'up' && styles.voteBtnActive]}
            onPress={() => handleVote('up')}
          >
            <ArrowUp size={16} color={myVote === 'up' ? '#22C55E' : colors.textTertiary} variant={myVote === 'up' ? 'Bold' : 'Linear'} />
          </TouchableOpacity>
          <Text style={[styles.scoreText, score > 0 && styles.scorePositive, score < 0 && styles.scoreNegative]}>
            {score}
          </Text>
          <TouchableOpacity
            style={[styles.voteBtn, myVote === 'down' && styles.voteBtnActiveDown]}
            onPress={() => handleVote('down')}
          >
            <ArrowDown size={16} color={myVote === 'down' ? '#EF4444' : colors.textTertiary} variant={myVote === 'down' ? 'Bold' : 'Linear'} />
          </TouchableOpacity>
        </View>

        {/* Comment */}
        <TouchableOpacity style={styles.actionBtn} onPress={onComment}>
          <Message size={16} color={colors.textTertiary} />
          <Text style={styles.actionText}>{post.commentCount}</Text>
        </TouchableOpacity>

        {/* Flag */}
        <TouchableOpacity style={styles.actionBtn} onPress={onFlag}>
          <Flag size={16} color={colors.textTertiary} />
        </TouchableOpacity>
      </View>
    </View>
  );
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

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  pinnedBanner: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  pinnedText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#92400E',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    paddingBottom: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  headerInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 2,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  expertiseTag: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '500',
    backgroundColor: colors.primary + '12',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    overflow: 'hidden',
  },
  timeText: {
    fontSize: 11,
    color: colors.textTertiary,
  },
  content: {
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 21,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  photosContainer: {
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  postPhoto: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: colors.gray100,
    marginBottom: 6,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  tag: {
    backgroundColor: colors.gray100,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  actionsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
    gap: 16,
  },
  voteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray50,
    borderRadius: 10,
    paddingHorizontal: 4,
  },
  voteBtn: {
    padding: 6,
    borderRadius: 8,
  },
  voteBtnActive: {
    backgroundColor: '#22C55E15',
  },
  voteBtnActiveDown: {
    backgroundColor: '#EF444415',
  },
  scoreText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    minWidth: 24,
    textAlign: 'center',
  },
  scorePositive: {
    color: '#22C55E',
  },
  scoreNegative: {
    color: '#EF4444',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 6,
  },
  actionText: {
    fontSize: 13,
    color: colors.textTertiary,
    fontWeight: '500',
  },
});
