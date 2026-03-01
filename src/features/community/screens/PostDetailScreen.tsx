/**
 * POST DETAIL SCREEN
 * 
 * Full post view with threaded comments and comment input.
 * Supports one-level-deep threaded replies.
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Send2 } from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/context/ThemeContext';
import { spacing, typography, borderRadius } from '@/styles';
import { ReactionType, FeedComment } from '../types/feed.types';
import { MOCK_FEED_POSTS, MOCK_COMMENTS } from '../data/feedMockData';
import { FeedPostCard } from '../components/feed';
import CommentItem from '../components/feed/CommentItem';

export default function PostDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors: tc, isDark } = useTheme();
  const { postId, focusComment } = useLocalSearchParams<{ postId: string; focusComment?: string }>();

  const [post, setPost] = useState(() => MOCK_FEED_POSTS.find(p => p.id === postId) || MOCK_FEED_POSTS[0]);
  const [comments, setComments] = useState<FeedComment[]>(MOCK_COMMENTS);
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    if (focusComment === 'true') {
      setTimeout(() => inputRef.current?.focus(), 400);
    }
  }, []);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleReact = useCallback((pid: string, type: ReactionType) => {
    setPost(prev => {
      const wasMyReaction = prev.myReaction === type;
      const newReactions = { ...prev.reactionsCount };
      if (prev.myReaction) {
        newReactions[prev.myReaction] = Math.max(0, newReactions[prev.myReaction] - 1);
      }
      if (!wasMyReaction) {
        newReactions[type] = newReactions[type] + 1;
      }
      return { ...prev, myReaction: wasMyReaction ? null : type, reactionsCount: newReactions };
    });
  }, []);

  const handleLikeComment = useCallback((commentId: string) => {
    setComments(prev => prev.map(c => {
      if (c.id === commentId) {
        return {
          ...c,
          isLiked: !c.isLiked,
          likeCount: c.isLiked ? c.likeCount - 1 : c.likeCount + 1,
        };
      }
      // Check replies
      if (c.replies) {
        return {
          ...c,
          replies: c.replies.map(r =>
            r.id === commentId
              ? { ...r, isLiked: !r.isLiked, likeCount: r.isLiked ? r.likeCount - 1 : r.likeCount + 1 }
              : r
          ),
        };
      }
      return c;
    }));
  }, []);

  const handleReply = useCallback((commentId: string) => {
    setReplyingTo(commentId);
    inputRef.current?.focus();
  }, []);

  const handleSendComment = useCallback(() => {
    const text = commentText.trim();
    if (!text) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const newComment: FeedComment = {
      id: `cmt-new-${Date.now()}`,
      postId: post.id,
      author: {
        id: 'current-user',
        firstName: 'You',
        lastName: '',
        avatar: 'https://i.pravatar.cc/150?img=12',
        isVerified: false,
      },
      content: text,
      likeCount: 0,
      isLiked: false,
      isAuthorReply: false,
      parentCommentId: replyingTo,
      createdAt: new Date().toISOString(),
    };

    if (replyingTo) {
      setComments(prev => prev.map(c => {
        if (c.id === replyingTo) {
          return { ...c, replies: [...(c.replies || []), newComment] };
        }
        return c;
      }));
    } else {
      setComments(prev => [...prev, newComment]);
    }

    setCommentText('');
    setReplyingTo(null);
  }, [commentText, replyingTo, post.id]);

  const handleAuthorPress = useCallback((authorId: string) => {
    router.push({ pathname: '/community/traveler-profile' as any, params: { userId: authorId } });
  }, [router]);

  const replyingComment = replyingTo ? comments.find(c => c.id === replyingTo) : null;

  const renderHeader = useCallback(() => (
    <View>
      <FeedPostCard
        post={post}
        onAuthorPress={handleAuthorPress}
        onReact={handleReact}
        onComment={() => inputRef.current?.focus()}
      />
      <View style={styles.commentsHeader}>
        <Text style={[styles.commentsTitle, { color: tc.textPrimary }]}>
          Comments ({comments.length})
        </Text>
      </View>
    </View>
  ), [post, comments.length, tc, handleAuthorPress, handleReact]);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: tc.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Header bar */}
      <View style={[styles.header, { paddingTop: insets.top + 4, borderBottomColor: tc.borderSubtle }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ArrowLeft size={22} color={tc.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: tc.textPrimary }]}>Post</Text>
        <View style={styles.backButton} />
      </View>

      <Animated.View style={[styles.contentWrapper, { opacity: fadeAnim }]}>
        <FlatList
          data={comments}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={renderHeader}
          renderItem={({ item }) => (
            <View style={styles.commentWrapper}>
              <CommentItem
                comment={item}
                onLike={handleLikeComment}
                onReply={handleReply}
                onAuthorPress={handleAuthorPress}
              />
            </View>
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />

        {/* Comment input */}
        <View style={[styles.inputBar, { backgroundColor: tc.bgElevated, borderTopColor: tc.borderSubtle, paddingBottom: insets.bottom || spacing.md }]}>
          {replyingTo && replyingComment && (
            <View style={[styles.replyBanner, { backgroundColor: tc.primarySubtle }]}>
              <Text style={[styles.replyBannerText, { color: tc.primary }]}>
                Replying to {replyingComment.author.firstName}
              </Text>
              <TouchableOpacity onPress={() => setReplyingTo(null)}>
                <Text style={[styles.cancelReply, { color: tc.textTertiary }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}
          <View style={styles.inputRow}>
            <TextInput
              ref={inputRef}
              style={[styles.commentInput, { color: tc.textPrimary, backgroundColor: tc.bgInput, borderColor: tc.borderSubtle }]}
              placeholder={replyingTo ? 'Write a reply...' : 'Write a comment...'}
              placeholderTextColor={tc.textTertiary}
              value={commentText}
              onChangeText={setCommentText}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[styles.sendButton, { backgroundColor: commentText.trim() ? tc.primary : tc.borderMedium }]}
              onPress={handleSendComment}
              disabled={!commentText.trim()}
            >
              <Send2 size={18} color={commentText.trim() ? '#121212' : tc.textTertiary} variant="Bold" />
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...typography.heading2,
  },
  contentWrapper: {
    flex: 1,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.lg,
  },
  commentsHeader: {
    paddingVertical: spacing.md,
  },
  commentsTitle: {
    ...typography.heading3,
  },
  commentWrapper: {
    marginBottom: 0,
  },
  inputBar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  replyBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.xs,
  },
  replyBannerText: {
    fontSize: 12,
    fontWeight: '500',
  },
  cancelReply: {
    fontSize: 12,
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  commentInput: {
    flex: 1,
    ...typography.bodySm,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
