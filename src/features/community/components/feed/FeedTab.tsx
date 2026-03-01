/**
 * FEED TAB
 * 
 * Main feed tab content with composer, filter chips,
 * and scrollable post feed with pull-to-refresh.
 */

import React, { memo, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Animated,
} from 'react-native';
import {
  Sort,
  Filter,
  Category,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/context/ThemeContext';
import { spacing, typography, borderRadius } from '@/styles';
import { FeedPost, ReactionType, PostType } from '../../types/feed.types';
import FeedPostCard from './FeedPostCard';
import FeedComposer from './FeedComposer';

const FILTER_CHIPS: { id: string; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'tip', label: 'Tips' },
  { id: 'question', label: 'Questions' },
  { id: 'checkin', label: 'Check-ins' },
  { id: 'buddy_request', label: 'Buddies' },
  { id: 'hidden_gem', label: 'Gems' },
  { id: 'cost_report', label: 'Costs' },
];

interface FeedTabProps {
  posts: FeedPost[];
  userAvatar: string;
  onCreatePost: (type?: string) => void;
  onPostPress: (postId: string) => void;
  onAuthorPress: (authorId: string) => void;
  onReact: (postId: string, type: ReactionType) => void;
  onComment: (postId: string) => void;
  onShare: (postId: string) => void;
  onMore: (postId: string) => void;
}

function FeedTab({
  posts,
  userAvatar,
  onCreatePost,
  onPostPress,
  onAuthorPress,
  onReact,
  onComment,
  onShare,
  onMore,
}: FeedTabProps) {
  const { colors: tc } = useTheme();
  const [activeFilter, setActiveFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  const filteredPosts = activeFilter === 'all'
    ? posts
    : posts.filter(p => p.postType === activeFilter);

  const pinnedPosts = filteredPosts.filter(p => p.isPinned);
  const regularPosts = filteredPosts.filter(p => !p.isPinned);
  const sortedPosts = [...pinnedPosts, ...regularPosts];

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Simulate fetch
    await new Promise(r => setTimeout(r, 1200));
    setRefreshing(false);
  }, []);

  const handleFilterPress = useCallback((id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveFilter(id);
  }, []);

  const renderHeader = useCallback(() => (
    <View>
      <FeedComposer
        userAvatar={userAvatar}
        onPress={() => onCreatePost()}
        onQuickType={(type) => onCreatePost(type)}
      />

      {/* Filter chips */}
      <View style={styles.filterRow}>
        {FILTER_CHIPS.map((chip) => {
          const isActive = activeFilter === chip.id;
          return (
            <TouchableOpacity
              key={chip.id}
              style={[
                styles.filterChip,
                {
                  backgroundColor: isActive ? tc.primary : tc.bgElevated,
                  borderColor: isActive ? tc.primary : tc.borderSubtle,
                },
              ]}
              onPress={() => handleFilterPress(chip.id)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.filterText,
                  { color: isActive ? '#121212' : tc.textSecondary },
                ]}
              >
                {chip.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  ), [activeFilter, userAvatar, tc, onCreatePost, handleFilterPress]);

  const renderPost = useCallback(({ item, index }: { item: FeedPost; index: number }) => (
    <FeedPostCard
      post={item}
      onPress={() => onPostPress(item.id)}
      onAuthorPress={onAuthorPress}
      onReact={onReact}
      onComment={onComment}
      onShare={onShare}
      onMore={onMore}
    />
  ), [onPostPress, onAuthorPress, onReact, onComment, onShare, onMore]);

  const renderEmpty = useCallback(() => (
    <View style={styles.emptyState}>
      <Category size={48} color={tc.textTertiary} variant="Bold" />
      <Text style={[styles.emptyTitle, { color: tc.textPrimary }]}>
        No posts yet
      </Text>
      <Text style={[styles.emptyText, { color: tc.textSecondary }]}>
        Be the first to share something with the group!
      </Text>
      <TouchableOpacity
        style={[styles.emptyButton, { backgroundColor: tc.primary }]}
        onPress={() => onCreatePost()}
      >
        <Text style={[styles.emptyButtonText, { color: '#121212' }]}>
          Create a Post
        </Text>
      </TouchableOpacity>
    </View>
  ), [tc, onCreatePost]);

  return (
    <FlatList
      data={sortedPosts}
      renderItem={renderPost}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={renderHeader}
      ListEmptyComponent={renderEmpty}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={tc.primary}
          colors={[tc.primary]}
        />
      }
    />
  );
}

export default memo(FeedTab);

const styles = StyleSheet.create({
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing['3xl'],
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing['4xl'],
    gap: spacing.sm,
  },
  emptyTitle: {
    ...typography.heading2,
    marginTop: spacing.md,
  },
  emptyText: {
    ...typography.bodySm,
    textAlign: 'center',
    maxWidth: 250,
  },
  emptyButton: {
    paddingHorizontal: spacing.xl,
    paddingVertical: 10,
    borderRadius: borderRadius.full,
    marginTop: spacing.md,
  },
  emptyButtonText: {
    ...typography.heading3,
  },
});
