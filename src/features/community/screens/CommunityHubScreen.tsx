/**
 * COMMUNITY HUB SCREEN
 * 
 * Main entry point for the Community feature.
 * Shows Your Groups with stats, search, pending requests, and group list.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  SearchNormal1,
  Add,
  People,
  Message,
  Calendar,
  Discover,
  Notification,
  Activity,
  Clock,
  Timer1,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, typography, borderRadius } from '@/styles';
import { MY_COMMUNITIES, DISCOVER_COMMUNITIES, MOCK_EVENTS, MOCK_BUDDY_MATCHES } from '../data/mockData';
import CommunityCard from '../components/CommunityCard';
import SectionHeader from '../components/SectionHeader';
import BuddyMatchCard from '../components/BuddyMatchCard';
import EventCard from '../components/EventCard';

type TabType = 'discover' | 'my' | 'buddies' | 'events';

const TABS: { id: TabType; label: string; icon: any }[] = [
  { id: 'discover', label: 'Discover', icon: Discover },
  { id: 'my', label: 'My Groups', icon: People },
  { id: 'buddies', label: 'Buddies', icon: People },
  { id: 'events', label: 'Events', icon: Calendar },
];

// Mock pending groups waiting for confirmation
const PENDING_GROUPS = [
  {
    id: 'pending-1',
    name: 'UK Travel Community 🇬🇧',
    avatar: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=200',
    memberCount: 67000,
    status: 'waiting' as const,
  },
  {
    id: 'pending-2',
    name: 'Beach & Sea Lover',
    avatar: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=200',
    memberCount: 124600,
    status: 'checked' as const,
  },
  {
    id: 'pending-3',
    name: 'Every Weekend Travel Community',
    avatar: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=200',
    memberCount: 738,
    status: 'waiting' as const,
  },
];

export default function CommunityHubScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabType>('my');
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Mock data - will come from API
  const isPremium = true;
  const notificationCount = 5;
  const activeGroupCount = MY_COMMUNITIES.length;
  const activityCount = 200;
  const waitingCount = PENDING_GROUPS.length;
  
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);
  
  const handleCreateCommunity = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!isPremium) {
      router.push('/premium' as any);
      return;
    }
    router.push('/community/create' as any);
  };
  
  const handleNotifications = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/community/notifications' as any);
  };
  
  const handleCommunityPress = (communityId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/community/${communityId}` as any);
  };
  
  const handleBuddyPress = (buddyId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/community/buddy/${buddyId}` as any);
  };
  
  const handleEventPress = (eventId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/community/event/${eventId}` as any);
  };
  
  const formatMemberCount = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(count >= 10000 ? 0 : 1)}k`;
    return count.toString();
  };
  
  const renderTabContent = () => {
    switch (activeTab) {
      case 'discover':
        return (
          <>
            {/* Trending Communities */}
            <SectionHeader 
              title="Trending Communities" 
              onSeeAll={() => router.push('/community/trending' as any)}
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            >
              {DISCOVER_COMMUNITIES.map(community => (
                <CommunityCard
                  key={community.id}
                  community={community}
                  variant="horizontal"
                  onPress={() => handleCommunityPress(community.id)}
                />
              ))}
            </ScrollView>
            
            {/* All Communities */}
            <SectionHeader title="All Communities" />
            {DISCOVER_COMMUNITIES.map(community => (
              <CommunityCard
                key={community.id}
                community={community}
                variant="list"
                onPress={() => handleCommunityPress(community.id)}
                showJoinButton={true}
              />
            ))}
          </>
        );
        
      case 'my':
        return (
          <>
            {/* Waiting Confirmation Section */}
            {PENDING_GROUPS.length > 0 && (
              <>
                <View style={styles.waitingHeader}>
                  <View style={styles.waitingTitleRow}>
                    <Text style={styles.waitingTitle}>Waiting Confirmation</Text>
                    <View style={styles.waitingDot} />
                  </View>
                  <Text style={styles.waitingSubtitle}>
                    This group are waiting for the admin to confirm it
                  </Text>
                </View>
                
                {PENDING_GROUPS.map(group => (
                  <TouchableOpacity 
                    key={group.id} 
                    style={styles.pendingCard}
                    onPress={() => handleCommunityPress(group.id)}
                  >
                    <Image source={{ uri: group.avatar }} style={styles.pendingAvatar} />
                    <View style={styles.pendingInfo}>
                      <Text style={styles.pendingName} numberOfLines={1}>{group.name}</Text>
                      <Text style={styles.pendingMembers}>
                        {formatMemberCount(group.memberCount)} Members
                      </Text>
                    </View>
                    <View style={[
                      styles.statusBadge,
                      group.status === 'checked' && styles.statusBadgeChecked
                    ]}>
                      <Text style={styles.statusEmoji}>
                        {group.status === 'waiting' ? '✋' : '👀'}
                      </Text>
                      <Text style={[
                        styles.statusText,
                        group.status === 'checked' && styles.statusTextChecked
                      ]}>
                        {group.status === 'waiting' ? 'Waiting' : 'Checked'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </>
            )}
            
            {/* My Active Groups */}
            <SectionHeader 
              title="My Groups" 
              onSeeAll={() => router.push('/community/my-groups' as any)}
            />
            {MY_COMMUNITIES.length === 0 ? (
              <View style={styles.emptyState}>
                <People size={64} color={colors.gray300} variant="Bold" />
                <Text style={styles.emptyTitle}>No groups yet</Text>
                <Text style={styles.emptyText}>
                  Join or create a group to connect with fellow travelers
                </Text>
                <TouchableOpacity 
                  style={styles.emptyButton}
                  onPress={() => setActiveTab('discover')}
                >
                  <Text style={styles.emptyButtonText}>Discover Groups</Text>
                </TouchableOpacity>
              </View>
            ) : (
              MY_COMMUNITIES.map(community => (
                <CommunityCard
                  key={community.id}
                  community={community}
                  variant="list"
                  onPress={() => handleCommunityPress(community.id)}
                />
              ))
            )}
          </>
        );
        
      case 'buddies':
        return (
          <>
            <SectionHeader 
              title="Buddy Matches" 
              subtitle="Travelers with similar plans"
            />
            {MOCK_BUDDY_MATCHES.map(buddy => (
              <BuddyMatchCard
                key={buddy.id}
                buddy={buddy}
                onPress={() => handleBuddyPress(buddy.id)}
                isPremium={isPremium}
              />
            ))}
          </>
        );
        
      case 'events':
        return (
          <>
            <SectionHeader 
              title="Upcoming Events" 
              subtitle="Meetups and virtual gatherings"
            />
            {MOCK_EVENTS.map(event => (
              <EventCard
                key={event.id}
                event={event}
                variant="list"
                onPress={() => handleEventPress(event.id)}
              />
            ))}
          </>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header with page background color */}
      <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Your Group 🍻</Text>
          <View style={styles.headerRight}>
            {/* New Group Button */}
            <TouchableOpacity 
              style={styles.newGroupButton}
              onPress={handleCreateCommunity}
            >
              <Add size={18} color={colors.primary} />
              <Text style={styles.newGroupText}>New Group</Text>
            </TouchableOpacity>
            
            {/* Notification Bell - White background */}
            <TouchableOpacity 
              style={styles.notificationButton}
              onPress={handleNotifications}
            >
              <Notification size={22} color={colors.textPrimary} />
              {notificationCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
      
      {/* Stats Container */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <View style={styles.statIconContainer}>
            <People size={20} color={colors.primary} variant="Bold" />
          </View>
          <View>
            <Text style={styles.statLabel}>Active</Text>
            <Text style={styles.statValue}>{activeGroupCount} Group</Text>
          </View>
        </View>
        
        <View style={styles.statDivider} />
        
        <View style={styles.statItem}>
          <View style={[styles.statIconContainer, { backgroundColor: colors.success + '15' }]}>
            <Activity size={20} color={colors.success} variant="Bold" />
          </View>
          <View>
            <Text style={styles.statLabel}>Activity</Text>
            <Text style={styles.statValue}>{activityCount} Post</Text>
          </View>
        </View>
        
        <View style={styles.statDivider} />
        
        <View style={styles.statItem}>
          <View style={[styles.statIconContainer, { backgroundColor: colors.warning + '15' }]}>
            <Clock size={20} color={colors.warning} variant="Bold" />
          </View>
          <View>
            <Text style={styles.statLabel}>Waiting</Text>
            <Text style={styles.statValue}>{waitingCount} Group</Text>
          </View>
        </View>
      </View>
      
      {/* Search Box */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <SearchNormal1 size={20} color={colors.gray400} />
          <TextInput
            style={styles.searchInput}
            placeholder="Find your groups"
            placeholderTextColor={colors.gray400}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>
      
      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabs}
        >
          {TABS.map(tab => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[styles.tab, isActive && styles.tabActive]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setActiveTab(tab.id);
                }}
              >
                <Icon 
                  size={18} 
                  color={isActive ? colors.white : colors.textSecondary}
                  variant={isActive ? 'Bold' : 'Outline'}
                />
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
      
      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {renderTabContent()}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerContainer: {
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  newGroupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  newGroupText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
  // Stats Container
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  statValue: {
    fontSize: 12,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: colors.gray200,
  },
  // Search
  searchContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.xl,
    gap: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
  // Tabs
  tabsContainer: {
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
    backgroundColor: colors.background,
  },
  tabs: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    flexDirection: 'row',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    backgroundColor: colors.white,
    gap: spacing.xs,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.white,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: spacing.md,
  },
  // Waiting Confirmation
  waitingHeader: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  waitingTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  waitingTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  waitingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF69B4', // Pink dot like screenshot
  },
  waitingSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  // Pending Cards
  pendingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  pendingAvatar: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.md,
  },
  pendingInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  pendingName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  pendingMembers: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning + '20',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  statusBadgeChecked: {
    backgroundColor: colors.warning + '30',
  },
  statusEmoji: {
    fontSize: 14,
  },
  statusText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.warning,
  },
  statusTextChecked: {
    color: colors.warning,
  },
  // Horizontal List
  horizontalList: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.lg,
    paddingTop: spacing.xs,
  },
  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['3xl'],
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  emptyText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  emptyButton: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
  },
  emptyButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
});
