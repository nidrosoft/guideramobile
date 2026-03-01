/**
 * COMMUNITY HUB SCREEN
 *
 * Main entry point for the Community feature.
 * Simplified 4-tab layout: Discover, Guides, Groups, Events.
 * Header: title + search / map / notification icons.
 * No stats container, no hub-level search bar.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  SearchNormal1,
  People,
  Calendar,
  Discover,
  Notification,
  Map1,
  Message,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import {
  useGroups,
  useUpcomingEvents,
  usePendingBuddyRequests,
} from '@/hooks/useCommunity';
import DiscoverFeed from '../components/DiscoverFeed';
import GroupsTabContent from '../components/GroupsTabContent';
import EventsTabContent from '../components/EventsTabContent';
import GuidesTabContent from './GuidesTabContent';
import { styles } from './CommunityHubScreen.styles';

type TabType = 'discover' | 'guides' | 'groups' | 'events';

const TABS: { id: TabType; label: string; icon: any }[] = [
  { id: 'discover', label: 'Discover', icon: Discover },
  { id: 'guides', label: 'Guides', icon: Map1 },
  { id: 'groups', label: 'Groups', icon: People },
  { id: 'events', label: 'Events', icon: Calendar },
];

export default function CommunityHubScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors: tc, isDark } = useTheme();
  const { user } = useAuth();
  const userId = user?.id;

  const [activeTab, setActiveTab] = useState<TabType>('discover');

  // Data hooks
  const { groups: myGroups, loading: loadingMyGroups, refetch: refetchMyGroups } = useGroups(userId);
  const { events, loading: loadingEvents, refetch: refetchEvents } = useUpcomingEvents();
  const { requests: pendingRequests } = usePendingBuddyRequests(userId);

  const isPremium = true;
  const messageCount = 5;
  const notificationCount = 7;

  // Navigation handlers
  const handleSearch = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/community/search' as any);
  };

  const handleLiveMap = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/community/live-map' as any);
  };

  const handleMessages = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/community/messages' as any);
  };

  const handleNotifications = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/community/notifications' as any);
  };

  const handleCommunityPress = (communityId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/community/${communityId}` as any);
  };

  const handleTravelerPress = (userId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/community/buddy/${userId}` as any);
  };

  const handleEventPress = (eventId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/community/event/${eventId}` as any);
  };

  const handleCreateGroup = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/community/create' as any);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'discover':
        return (
          <DiscoverFeed
            onGroupPress={handleCommunityPress}
            onTravelerPress={handleTravelerPress}
            onEventPress={handleEventPress}
            onSeeAllGroups={() => router.push('/community/trending' as any)}
            onSeeAllTravelers={() => router.push('/community/travelers' as any)}
            onSeeAllEvents={() => router.push('/community/all-events' as any)}
            isPremium={isPremium}
          />
        );

      case 'guides':
        return <GuidesTabContent />;

      case 'groups':
        return (
          <GroupsTabContent
            myGroups={myGroups}
            loadingMyGroups={loadingMyGroups}
            onGroupPress={handleCommunityPress}
            onCreateGroup={handleCreateGroup}
            onSeeAllMyGroups={() => router.push('/community/my-groups' as any)}
            onRefresh={refetchMyGroups}
            isVerifiedGuide={false}
          />
        );

      case 'events':
        return (
          <EventsTabContent
            events={events.map(event => ({
              id: event.id,
              communityId: event.groupId || '',
              title: event.title,
              coverImage: event.coverImageUrl,
              type: (event.type === 'other' ? 'meetup' : event.type) as any,
              status: event.status as any,
              location: {
                city: event.locationName || 'Online',
                country: '',
                isVirtual: event.locationType === 'virtual',
              },
              startDate: event.startDate,
              attendeeCount: event.attendeeCount,
              myRSVP: 'none' as const,
            }))}
            loading={loadingEvents}
            onRefresh={refetchEvents}
            onEventPress={handleEventPress}
            onCreateEvent={() => router.push('/community/create-event' as any)}
            currentLocation="Paris"
          />
        );

      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: tc.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Header */}
      <View style={[styles.headerContainer, { paddingTop: insets.top, backgroundColor: tc.background }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: tc.textPrimary }]}>Community</Text>
          <View style={styles.headerRight}>
            {/* Search Icon */}
            <TouchableOpacity
              style={[styles.headerIconButton, { backgroundColor: tc.bgElevated }]}
              onPress={handleSearch}
              activeOpacity={0.7}
            >
              <SearchNormal1 size={20} color={tc.textPrimary} />
            </TouchableOpacity>

            {/* Live Map Icon */}
            <TouchableOpacity
              style={[styles.headerIconButton, { backgroundColor: tc.bgElevated }]}
              onPress={handleLiveMap}
              activeOpacity={0.7}
            >
              <Map1 size={20} color={tc.textPrimary} />
            </TouchableOpacity>

            {/* Messages */}
            <TouchableOpacity
              style={[styles.headerIconButton, { backgroundColor: tc.bgElevated }]}
              onPress={handleMessages}
              activeOpacity={0.7}
            >
              <Message size={20} color={tc.textPrimary} />
              {messageCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>
                    {messageCount > 9 ? '9+' : messageCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Notifications */}
            <TouchableOpacity
              style={[styles.headerIconButton, { backgroundColor: tc.bgElevated }]}
              onPress={handleNotifications}
              activeOpacity={0.7}
            >
              <Notification size={20} color={tc.textPrimary} />
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

      {/* Tab Bar */}
      <View style={[styles.tabsContainer, { backgroundColor: tc.background, borderBottomColor: tc.borderSubtle }]}>
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
                style={[
                  styles.tab,
                  { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle },
                  isActive && styles.tabActive,
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setActiveTab(tab.id);
                }}
                activeOpacity={0.7}
              >
                <Icon
                  size={18}
                  color={isActive ? '#FFFFFF' : tc.textSecondary}
                  variant={isActive ? 'Bold' : 'Outline'}
                />
                <Text style={[styles.tabText, { color: tc.textSecondary }, isActive && styles.tabTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Tab Content */}
      <View style={styles.content}>
        {renderTabContent()}
      </View>
    </View>
  );
}
