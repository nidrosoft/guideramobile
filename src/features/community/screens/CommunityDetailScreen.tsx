/**
 * COMMUNITY DETAIL SCREEN
 * 
 * Redesigned group detail screen with Feed as the default tab.
 * Tabs: Feed | Members | Events | About
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  Edit2,
  People,
  Calendar,
  InfoCircle,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { spacing, typography, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { ReactionType } from '../types/feed.types';
import { MOCK_FEED_POSTS, MOCK_GROUP_DETAIL } from '../data/feedMockData';
import { MOCK_EVENTS } from '../data/mockData';
import { GroupHeader, FeedTab, MembersTab, AboutTab } from '../components/feed';
import EventCard from '../components/EventCard';

type TabType = 'feed' | 'members' | 'events' | 'about';

const TABS: { id: TabType; label: string; icon: any }[] = [
  { id: 'feed', label: 'Feed', icon: Edit2 },
  { id: 'members', label: 'Members', icon: People },
  { id: 'events', label: 'Events', icon: Calendar },
  { id: 'about', label: 'About', icon: InfoCircle },
];

export default function CommunityDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors: tc, isDark } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [activeTab, setActiveTab] = useState<TabType>('feed');
  const [posts, setPosts] = useState(MOCK_FEED_POSTS);

  const group = MOCK_GROUP_DETAIL;
  const userAvatar = 'https://i.pravatar.cc/150?img=12';

  const handleBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  }, [router]);

  const handleJoin = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  const handleShare = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const handleCreatePost = useCallback((type?: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: '/community/create-post' as any, params: { groupId: group.id, postType: type || 'general' } });
  }, [router, group.id]);

  const handlePostPress = useCallback((postId: string) => {
    router.push({ pathname: '/community/post-detail' as any, params: { postId } });
  }, [router]);

  const handleAuthorPress = useCallback((authorId: string) => {
    router.push({ pathname: '/community/traveler-profile' as any, params: { userId: authorId } });
  }, [router]);

  const handleReact = useCallback((postId: string, type: ReactionType) => {
    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p;
      const wasMyReaction = p.myReaction === type;
      const newReactions = { ...p.reactionsCount };
      if (p.myReaction) {
        newReactions[p.myReaction] = Math.max(0, newReactions[p.myReaction] - 1);
      }
      if (!wasMyReaction) {
        newReactions[type] = newReactions[type] + 1;
      }
      return { ...p, myReaction: wasMyReaction ? null : type, reactionsCount: newReactions };
    }));
  }, []);

  const handleComment = useCallback((postId: string) => {
    router.push({ pathname: '/community/post-detail' as any, params: { postId, focusComment: 'true' } });
  }, [router]);

  const handleMemberPress = useCallback((memberId: string) => {
    router.push({ pathname: '/community/traveler-profile' as any, params: { userId: memberId } });
  }, [router]);

  const renderEventsTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {MOCK_EVENTS.length === 0 ? (
        <View style={styles.emptyState}>
          <Calendar size={48} color={tc.textTertiary} variant="Bold" />
          <Text style={[styles.emptyTitle, { color: tc.textPrimary }]}>No upcoming events</Text>
          <Text style={[styles.emptyText, { color: tc.textSecondary }]}>Events will appear here</Text>
        </View>
      ) : (
        MOCK_EVENTS.slice(0, 3).map(event => (
          <EventCard key={event.id} event={event} variant="list" onPress={() => {}} />
        ))
      )}
    </ScrollView>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'feed':
        return (
          <FeedTab
            posts={posts}
            userAvatar={userAvatar}
            onCreatePost={handleCreatePost}
            onPostPress={handlePostPress}
            onAuthorPress={handleAuthorPress}
            onReact={handleReact}
            onComment={handleComment}
            onShare={(id) => {}}
            onMore={(id) => {}}
          />
        );
      case 'members':
        return (
          <MembersTab
            members={[]}
            totalCount={group.memberCount}
            onMemberPress={handleMemberPress}
          />
        );
      case 'events':
        return renderEventsTab();
      case 'about':
        return (
          <AboutTab
            description={group.description}
            guidelines={group.guidelines}
            tags={group.tags}
            privacy={group.privacy}
            createdAt={group.createdAt}
            postingRule={group.postingRule}
          />
        );
      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: tc.background }]}>
      <StatusBar style="light" />

      {/* Banner Header */}
      <GroupHeader
        bannerImage={group.bannerImage}
        avatar={group.avatar}
        name={group.name}
        isVerified={group.isVerified}
        privacy={group.privacy}
        memberCount={group.memberCount}
        activeCount={group.activeCount}
        isMember={group.isMember}
        paddingTop={insets.top}
        onBack={handleBack}
        onMore={() => {}}
        onJoin={handleJoin}
        onShare={handleShare}
      />

      {/* Tab Bar */}
      <View style={[styles.tabBar, { backgroundColor: tc.bgElevated, borderBottomColor: tc.borderSubtle }]}>
        {TABS.map(tab => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, isActive && [styles.tabActive, { borderBottomColor: tc.primary }]]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveTab(tab.id);
              }}
              activeOpacity={0.7}
            >
              <Icon
                size={17}
                color={isActive ? tc.primary : tc.textTertiary}
                variant={isActive ? 'Bold' : 'Linear'}
              />
              <Text
                style={[
                  styles.tabLabel,
                  { color: isActive ? tc.primary : tc.textTertiary },
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Tab Content */}
      <View style={styles.tabContentWrapper}>
        {renderTabContent()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    gap: 5,
  },
  tabActive: {
    borderBottomWidth: 2.5,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  tabContentWrapper: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
    padding: spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['3xl'],
  },
  emptyTitle: {
    ...typography.heading2,
    marginTop: spacing.md,
  },
  emptyText: {
    ...typography.bodySm,
    marginTop: spacing.xs,
  },
});
