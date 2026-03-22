/**
 * CONNECT HUB SCREEN (formerly Community Hub)
 *
 * NOTE: This feature was renamed from "Community" to "Connect" in the UI.
 * The folder structure, routes, and code identifiers still use "community"
 * for backward compatibility. All user-visible text says "Connect".
 *
 * Main entry point for the Connect feature.
 * 4-tab layout: Discover, Guides, Groups, Events.
 * Header: title + search / Pulse map / notification icons.
 */

import React, { useState, useEffect, useCallback } from 'react';
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
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import {
  useGroups,
  useUpcomingEvents,
  usePendingBuddyRequests,
  useNearbyActivities,
} from '@/hooks/useCommunity';
import { useNotifications } from '@/hooks/useNotifications';
import { chatService } from '@/services/community/chat.service';
import { supabase } from '@/lib/supabase/client';
import DiscoverFeed from '../components/DiscoverFeed';
import GroupsTabContent from '../components/GroupsTabContent';
import EventsTabContent from '../components/EventsTabContent';
import GuidesTabContent from './GuidesTabContent';
import GroupExplainerSheet from '../components/GroupExplainerSheet';
import EventExplainerSheet from '../components/EventExplainerSheet';
import { styles } from './CommunityHubScreen.styles';

type TabType = 'discover' | 'guides' | 'groups' | 'events';

const TAB_KEYS: { id: TabType; labelKey: string; icon: any }[] = [
  { id: 'discover', labelKey: 'connect.tabs.discover', icon: Discover },
  { id: 'guides', labelKey: 'connect.tabs.guides', icon: Map1 },
  { id: 'groups', labelKey: 'connect.tabs.groups', icon: People },
  { id: 'events', labelKey: 'connect.tabs.events', icon: Calendar },
];

export default function CommunityHubScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors: tc, isDark } = useTheme();
  const { t } = useTranslation();
  const { profile } = useAuth();
  const userId = profile?.id;

  const [activeTab, setActiveTab] = useState<TabType>('discover');

  // Data hooks
  const { groups: myGroups, loading: loadingMyGroups, refetch: refetchMyGroups } = useGroups(userId);
  const { events, loading: loadingEvents, refetch: refetchEvents } = useUpcomingEvents();
  const { requests: pendingRequests } = usePendingBuddyRequests(userId);
  const { activities: pulseActivities } = useNearbyActivities(userId, null);

  const { unreadCount: notificationCount } = useNotifications({ category: 'social', autoRefresh: true });
  const pulseCount = pulseActivities.length;

  const [messageCount, setMessageCount] = useState(0);
  const [showGroupSheet, setShowGroupSheet] = useState(false);
  const [showEventSheet, setShowEventSheet] = useState(false);
  const [isVerifiedGuide, setIsVerifiedGuide] = useState(false);
  const [userCity, setUserCity] = useState<string | undefined>();
  const isPremium = false; // TODO: [PREMIUM] Wire to actual subscription/membership status from Supabase

  // Check partner/guide verification status + user city
  useEffect(() => {
    if (!userId) return;
    const checkStatus = async () => {
      try {
        const { data } = await supabase
          .from('partner_applications')
          .select('status, didit_verification_status')
          .eq('user_id', userId)
          .in('status', ['approved'])
          .limit(1)
          .maybeSingle();
        if (data?.status === 'approved' || data?.didit_verification_status === 'approved') {
          setIsVerifiedGuide(true);
        }
      } catch { /* ignore */ }
      try {
        const { data: prof } = await supabase
          .from('profiles')
          .select('city')
          .eq('id', userId)
          .single();
        if (prof?.city) setUserCity(prof.city);
      } catch { /* ignore */ }
    };
    checkStatus();
  }, [userId]);

  // Fetch unread message count
  const fetchMessageCount = useCallback(async () => {
    if (!userId) return;
    try {
      const convs = await chatService.getConversations(userId);
      const total = convs.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
      setMessageCount(total);
    } catch { /* ignore */ }
  }, [userId]);

  useEffect(() => { fetchMessageCount(); }, [fetchMessageCount]);

  // Realtime: update message badge when new DMs arrive
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel('connect-dm-badge')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `conversation_id=neq.`,
      }, (payload) => {
        const msg = payload.new as any;
        // Only count messages from others in conversations the user participates in
        if (msg.user_id !== userId && msg.conversation_id) {
          setMessageCount(prev => prev + 1);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  // Navigation handlers
  const handleSearch = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/community/search');
  };

  const handleLiveMap = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/community/live-map');
  };

  const handleMessages = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/community/messages');
  };

  const handleNotifications = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/community/notifications');
  };

  const handleCommunityPress = (communityId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/community/${communityId}`);
  };

  const handleTravelerPress = (userId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/community/buddy/${userId}`);
  };

  const handleEventPress = (eventId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/community/event/${eventId}`);
  };

  const handleCreateGroup = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowGroupSheet(true);
  };

  const handleCreateEvent = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowEventSheet(true);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'discover':
        return (
          <DiscoverFeed
            onGroupPress={handleCommunityPress}
            onTravelerPress={handleTravelerPress}
            onEventPress={handleEventPress}
            onSeeAllGroups={() => router.push('/community/trending')}
            onSeeAllTravelers={() => router.push('/community/travelers')}
            onSeeAllEvents={() => router.push('/community/all-events')}
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
            onSeeAllMyGroups={() => router.push('/community/my-groups')}
            onRefresh={refetchMyGroups}
            isVerifiedGuide={isVerifiedGuide}
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
            onCreateEvent={handleCreateEvent}
            currentLocation={userCity || 'Nearby'}
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
          <Text style={[styles.title, { color: tc.textPrimary }]}>{t('connect.title')}</Text>
          <View style={styles.headerRight}>
            {/* Search Icon */}
            <TouchableOpacity
              style={[styles.headerIconButton, { backgroundColor: tc.bgElevated }]}
              onPress={handleSearch}
              activeOpacity={0.7}
              accessibilityRole="search"
              accessibilityLabel="Search community"
            >
              <SearchNormal1 size={20} color={tc.textPrimary} />
            </TouchableOpacity>

            {/* Live Map / Pulse Icon */}
            <TouchableOpacity
              style={[styles.headerIconButton, { backgroundColor: tc.bgElevated }]}
              onPress={handleLiveMap}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Live map"
              accessibilityHint="View nearby travelers on a map"
            >
              <Map1 size={20} color={tc.textPrimary} />
              {pulseCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>
                    {pulseCount > 9 ? '9+' : pulseCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Messages */}
            <TouchableOpacity
              style={[styles.headerIconButton, { backgroundColor: tc.bgElevated }]}
              onPress={handleMessages}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={messageCount > 0 ? `Messages, ${messageCount} unread` : 'Messages'}
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
              accessibilityRole="button"
              accessibilityLabel={notificationCount > 0 ? `Notifications, ${notificationCount} unread` : 'Notifications'}
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
          {TAB_KEYS.map(tab => {
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
                accessibilityRole="tab"
                accessibilityLabel={t(tab.labelKey)}
                accessibilityState={{ selected: isActive }}
              >
                <Icon
                  size={18}
                  color={isActive ? '#FFFFFF' : tc.textSecondary}
                  variant={isActive ? 'Bold' : 'Outline'}
                />
                <Text style={[styles.tabText, { color: tc.textSecondary }, isActive && styles.tabTextActive]}>
                  {t(tab.labelKey)}
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

      {/* Explainer Bottom Sheets */}
      <GroupExplainerSheet
        visible={showGroupSheet}
        onClose={() => setShowGroupSheet(false)}
        onCreate={() => {
          setShowGroupSheet(false);
          router.push('/community/create');
        }}
      />
      <EventExplainerSheet
        visible={showEventSheet}
        onClose={() => setShowEventSheet(false)}
        onCreate={() => {
          setShowEventSheet(false);
          router.push('/community/create-event');
        }}
      />
    </View>
  );
}
