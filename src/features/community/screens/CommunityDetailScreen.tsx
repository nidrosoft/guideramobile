/**
 * COMMUNITY DETAIL SCREEN
 * 
 * Redesigned group detail screen with Feed as the default tab.
 * Tabs: Feed | Members | Events | About
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
  Share,
  Alert,
  ActionSheetIOS,
  Platform,
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
import { useAuth } from '@/context/AuthContext';
import { ReactionType, FeedPost } from '../types/feed.types';
import { groupService, eventService } from '@/services/community';
import { postService } from '@/services/community/post.service';
import { GroupHeader, FeedTab, MembersTab, AboutTab } from '../components/feed';
import EventCard from '../components/EventCard';

type TabType = 'feed' | 'members' | 'events' | 'about';

const TABS: { id: TabType; label: string; icon: any }[] = [
  { id: 'feed', label: 'Feed', icon: Edit2 },
  { id: 'members', label: 'Members', icon: People },
  { id: 'events', label: 'Events', icon: Calendar },
  { id: 'about', label: 'About', icon: InfoCircle },
];

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

export default function CommunityDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors: tc, isDark } = useTheme();
  const { profile } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [activeTab, setActiveTab] = useState<TabType>('feed');
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [group, setGroup] = useState({
    id: id || '',
    name: '',
    description: '',
    coverImage: '',
    avatar: '',
    bannerImage: '',
    privacy: 'public' as const,
    isVerified: false,
    memberCount: 0,
    activeCount: 0,
    isMember: false,
    myRole: 'member' as const,
    postingRule: 'anyone' as const,
    tags: [] as string[],
    guidelines: [] as string[],
    createdAt: '',
  });

  const userAvatar = profile?.avatar_url || 'https://i.pravatar.cc/150?img=12';

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!id) return;
      try {
        const [groupData, postsData, eventsData, membersData] = await Promise.all([
          groupService.getGroup(id),
          postService.getPosts({ communityId: id }),
          eventService.getUpcomingEvents({ groupId: id, limit: 3 }),
          groupService.getMembers(id),
        ]);
        if (cancelled) return;

        if (groupData) {
          setGroup({
            id: groupData.id,
            name: groupData.name,
            description: groupData.description || '',
            coverImage: groupData.coverPhotoUrl || '',
            avatar: groupData.groupPhotoUrl || '',
            bannerImage: groupData.coverPhotoUrl || '',
            privacy: groupData.privacy,
            isVerified: groupData.isVerified,
            memberCount: groupData.memberCount,
            activeCount: groupData.activeMemberCount,
            isMember: true,
            myRole: 'member',
            postingRule: groupData.whoCanPost === 'anyone' ? 'anyone' : 'admins_only' as any,
            tags: groupData.tags || [],
            guidelines: [],
            createdAt: groupData.createdAt?.toString() || '',
          });
        }

        let feedPosts = postsData.map(mapServicePostToFeedPost);

        // Enrich posts with user's reactions and saved state
        if (profile?.id && feedPosts.length > 0) {
          try {
            const postIds = feedPosts.map(p => p.id);
            const [reactionsMap, savedIds] = await Promise.all([
              postService.getUserReactions(profile.id, postIds),
              postService.getUserSavedPostIds(profile.id, postIds),
            ]);
            feedPosts = feedPosts.map(p => ({
              ...p,
              myReaction: (reactionsMap[p.id] as any) || null,
              isSaved: savedIds.has(p.id),
            }));
          } catch { /* non-critical — posts still show without user state */ }
        }

        setPosts(feedPosts);
        setEvents(eventsData.map((e: any) => ({
          id: e.id,
          communityId: e.groupId || '',
          title: e.title,
          coverImage: e.coverImageUrl,
          type: 'meetup',
          status: e.status || 'upcoming',
          location: { city: e.locationName || 'Online', country: '', isVirtual: e.locationType === 'virtual' },
          startDate: e.startDate,
          attendeeCount: e.attendeeCount || 0,
          myRSVP: 'none',
        })));
        setMembers(membersData);
      } catch (err) {
        console.warn('CommunityDetailScreen load error:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [id]);

  const handleBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  }, [router]);

  const handleJoin = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!profile?.id || !id) return;
    try {
      if (group.isMember) {
        await groupService.leaveGroup(profile.id, id);
        setGroup(prev => ({ ...prev, isMember: false, memberCount: Math.max(0, prev.memberCount - 1) }));
      } else {
        const result = await groupService.joinGroup(profile.id, id);
        if (result.status === 'joined') {
          setGroup(prev => ({ ...prev, isMember: true, memberCount: prev.memberCount + 1 }));
        }
      }
    } catch (err) {
      console.warn('Join/leave error:', err);
    }
  }, [profile?.id, id, group.isMember]);

  const handleShare = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Share.share({
      message: `Check out ${group.name} on Guidera!`,
      url: `https://guidera.app/community/${group.id}`,
    }).catch(() => {});
  }, [group.name, group.id]);

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
    if (profile?.id) {
      postService.toggleReaction(postId, profile.id, type).catch(console.warn);
    }
  }, [profile?.id]);

  const handleComment = useCallback((postId: string) => {
    router.push({ pathname: '/community/post-detail' as any, params: { postId, focusComment: 'true' } });
  }, [router]);

  const handleSharePost = useCallback((postId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Share.share({
      message: `Check out this post on Guidera!`,
      url: `https://guidera.app/community/post/${postId}`,
    }).catch(() => {});
    // post_shares tracking is handled by DB triggers on saved_posts
    // No explicit sharePost method needed — the Share sheet handles it
  }, [profile?.id]);

  const handleSavePost = useCallback((postId: string) => {
    if (!profile?.id) return;
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    // Optimistic toggle
    setPosts(prev => prev.map(p =>
      p.id === postId ? { ...p, isSaved: !(p as any).isSaved } : p
    ));
    const wasSaved = (post as any).isSaved;
    if (wasSaved) {
      postService.unsavePost(postId, profile.id).catch(console.warn);
    } else {
      postService.savePost(postId, profile.id).catch(console.warn);
    }
  }, [profile?.id, posts]);

  const handleMorePost = useCallback((postId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const post = posts.find(p => p.id === postId);
    const isAuthor = post?.author.id === profile?.id;

    const options = isAuthor
      ? ['Delete Post', 'Cancel']
      : ['Report Post', 'Cancel'];
    const destructiveIndex = 0;
    const cancelIndex = options.length - 1;

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options, destructiveButtonIndex: destructiveIndex, cancelButtonIndex: cancelIndex },
        (index) => {
          if (index === 0 && isAuthor) {
            Alert.alert('Delete Post', 'Are you sure?', [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Delete', style: 'destructive',
                onPress: () => {
                  postService.deletePost(postId).then(() => {
                    setPosts(prev => prev.filter(p => p.id !== postId));
                  }).catch(console.warn);
                },
              },
            ]);
          } else if (index === 0 && !isAuthor) {
            router.push(`/community/report?type=post&id=${postId}` as any);
          }
        }
      );
    } else {
      Alert.alert('Post Options', undefined, [
        isAuthor
          ? {
              text: 'Delete Post', style: 'destructive',
              onPress: () => {
                postService.deletePost(postId).then(() => {
                  setPosts(prev => prev.filter(p => p.id !== postId));
                }).catch(console.warn);
              },
            }
          : { text: 'Report Post', onPress: () => router.push(`/community/report?type=post&id=${postId}` as any) },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  }, [posts, profile?.id, router]);

  const handleEventPress = useCallback((eventId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/community/event/${eventId}` as any);
  }, [router]);

  const handleMemberPress = useCallback((memberId: string) => {
    router.push({ pathname: '/community/traveler-profile' as any, params: { userId: memberId } });
  }, [router]);

  const renderEventsTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {events.length === 0 ? (
        <View style={styles.emptyState}>
          <Calendar size={48} color={tc.textTertiary} variant="Bold" />
          <Text style={[styles.emptyTitle, { color: tc.textPrimary }]}>No upcoming events</Text>
          <Text style={[styles.emptyText, { color: tc.textSecondary }]}>Events will appear here</Text>
        </View>
      ) : (
        events.map(event => (
          <EventCard key={event.id} event={event} variant="list" onPress={() => handleEventPress(event.id)} />
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
            onShare={handleSharePost}
            onMore={handleMorePost}
            onSave={handleSavePost}
          />
        );
      case 'members':
        return (
          <MembersTab
            members={members}
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

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: tc.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={tc.primary} />
      </View>
    );
  }

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
