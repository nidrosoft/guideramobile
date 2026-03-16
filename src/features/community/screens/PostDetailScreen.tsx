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
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Send2 } from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { spacing, typography, borderRadius } from '@/styles';
import { ReactionType, FeedComment, FeedPost } from '../types/feed.types';
import { postService } from '@/services/community/post.service';
import { FeedPostCard } from '../components/feed';
import CommentItem from '../components/feed/CommentItem';

function mapServicePostToFeedPost(p: any): FeedPost {
  return {
    id: p.id,
    groupId: p.communityId || '',
    author: {
      id: p.author?.id || p.authorId,
      firstName: p.author?.fullName?.split(' ')[0] || 'User',
      lastName: p.author?.fullName?.split(' ').slice(1).join(' ') || '',
      avatar: p.author?.avatarUrl || 'https://i.pravatar.cc/150?img=1',
      isVerified: false,
    },
    postType: (p.postType || 'general') as any,
    content: p.content,
    photos: p.photos || [],
    tags: p.tags || [],
    location: p.locationName ? { name: p.locationName, verified: false } : undefined,
    status: 'published',
    isPinned: p.isPinned || false,
    isAnswered: false,
    reactionsCount: {
      love: p.reactionsCount?.love || 0,
      been_there: p.reactionsCount?.been_there || 0,
      helpful: p.reactionsCount?.helpful || 0,
      want_to_go: p.reactionsCount?.want_to_go || 0,
      fire: p.reactionsCount?.fire || 0,
    },
    commentCount: p.commentCount || 0,
    myReaction: null,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt || p.createdAt,
  };
}

function mapServiceCommentToFeedComment(c: any): FeedComment {
  return {
    id: c.id,
    postId: c.postId,
    author: {
      id: c.author?.id || c.authorId,
      firstName: c.author?.fullName?.split(' ')[0] || 'User',
      lastName: c.author?.fullName?.split(' ').slice(1).join(' ') || '',
      avatar: c.author?.avatarUrl || 'https://i.pravatar.cc/150?img=1',
      isVerified: false,
    },
    content: c.content,
    likeCount: c.likeCount || 0,
    isLiked: false,
    isAuthorReply: false,
    parentCommentId: c.parentCommentId || null,
    createdAt: c.createdAt,
  };
}

function nestComments(flat: FeedComment[]): FeedComment[] {
  const topLevel: FeedComment[] = [];
  const byParent: Record<string, FeedComment[]> = {};

  for (const c of flat) {
    if (c.parentCommentId) {
      if (!byParent[c.parentCommentId]) byParent[c.parentCommentId] = [];
      byParent[c.parentCommentId].push(c);
    } else {
      topLevel.push(c);
    }
  }

  return topLevel.map(c => ({
    ...c,
    replies: byParent[c.id] || undefined,
  }));
}

export default function PostDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors: tc, isDark } = useTheme();
  const { profile } = useAuth();
  const { postId, focusComment } = useLocalSearchParams<{ postId: string; focusComment?: string }>();

  const [post, setPost] = useState<FeedPost | null>(null);
  const [comments, setComments] = useState<FeedComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [rawPost, rawComments] = await Promise.all([
          postService.getPost(postId),
          postService.getComments(postId),
        ]);
        if (cancelled) return;
        if (rawPost) setPost(mapServicePostToFeedPost(rawPost));
        const mapped = rawComments.map(mapServiceCommentToFeedComment);
        setComments(nestComments(mapped));
      } catch (err) {
        if (__DEV__) console.warn('PostDetailScreen load error:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [postId]);

  useEffect(() => {
    if (!loading && post) {
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
      if (focusComment === 'true') {
        setTimeout(() => inputRef.current?.focus(), 400);
      }
    }
  }, [loading, post]);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleReact = useCallback((pid: string, type: ReactionType) => {
    setPost(prev => {
      if (!prev) return prev;
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
    if (profile?.id) {
      postService.toggleReaction(pid, profile.id, type).catch(console.warn);
    }
  }, [profile?.id]);

  const handleLikeComment = useCallback((commentId: string) => {
    setComments(prev => prev.map(c => {
      if (c.id === commentId) {
        return {
          ...c,
          isLiked: !c.isLiked,
          likeCount: c.isLiked ? c.likeCount - 1 : c.likeCount + 1,
        };
      }
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
    if (profile?.id) {
      postService.toggleCommentLike(commentId, profile.id).catch(console.warn);
    }
  }, [profile?.id]);

  const handleReply = useCallback((commentId: string) => {
    setReplyingTo(commentId);
    inputRef.current?.focus();
  }, []);

  const handleSendComment = useCallback(async () => {
    const text = commentText.trim();
    if (!text || !post || !profile?.id) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const optimistic: FeedComment = {
      id: `cmt-temp-${Date.now()}`,
      postId: post.id,
      author: {
        id: profile.id,
        firstName: profile.first_name || 'You',
        lastName: profile.last_name || '',
        avatar: profile.avatar_url || 'https://i.pravatar.cc/150?img=12',
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
          return { ...c, replies: [...(c.replies || []), optimistic] };
        }
        return c;
      }));
    } else {
      setComments(prev => [...prev, optimistic]);
    }

    setCommentText('');
    setReplyingTo(null);

    try {
      const saved = await postService.addComment(post.id, profile.id, {
        content: text,
        parentCommentId: replyingTo || undefined,
      });
      const mapped = mapServiceCommentToFeedComment(saved);
      setComments(prev => {
        const replaceOptimistic = (list: FeedComment[]): FeedComment[] =>
          list.map(c => {
            if (c.id === optimistic.id) return mapped;
            if (c.replies) return { ...c, replies: replaceOptimistic(c.replies) };
            return c;
          });
        return replaceOptimistic(prev);
      });
    } catch (err) {
      if (__DEV__) console.warn('Failed to save comment:', err);
    }
  }, [commentText, replyingTo, post?.id, profile]);

  const handleAuthorPress = useCallback((authorId: string) => {
    router.push({ pathname: '/community/traveler-profile' as any, params: { userId: authorId } });
  }, [router]);

  const replyingComment = replyingTo ? comments.find(c => c.id === replyingTo) : null;

  const renderHeader = useCallback(() => {
    if (!post) return null;
    return (
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
    );
  }, [post, comments.length, tc, handleAuthorPress, handleReact]);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: tc.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={tc.primary} />
      </View>
    );
  }

  if (!post) {
    return (
      <View style={[styles.container, { backgroundColor: tc.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: tc.textSecondary }}>Post not found</Text>
      </View>
    );
  }

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
