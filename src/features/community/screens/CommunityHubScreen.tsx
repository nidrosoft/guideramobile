/**
 * COMMUNITY HUB SCREEN
 * 
 * Main entry point for the Community feature.
 * Shows Your Groups with stats, search, pending requests, and group list.
 * Refactored to use modular services and hooks.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Image,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  SearchNormal1,
  Add,
  People,
  Calendar,
  Discover,
  Notification,
  Activity,
  Clock,
  Map1,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import {
  useGroups,
  useDiscoverGroups,
  useBuddySuggestions,
  useUpcomingEvents,
  usePendingBuddyRequests,
} from '@/hooks/useCommunity';
import CommunityCard from '../components/CommunityCard';
import SectionHeader from '../components/SectionHeader';
import BuddyMatchCard from '../components/BuddyMatchCard';
import EventCard from '../components/EventCard';
import DiscoverTabContent from '../components/DiscoverTabContent';
import EventsTabContent from '../components/EventsTabContent';
import GuidesTabContent from './GuidesTabContent';
import { styles } from './CommunityHubScreen.styles';

type TabType = 'discover' | 'my' | 'buddies' | 'events' | 'guides' | 'map';

const TABS: { id: TabType; label: string; icon: any }[] = [
  { id: 'discover', label: 'Discover', icon: Discover },
  { id: 'guides', label: 'Guides', icon: Map1 },
  { id: 'my', label: 'My Groups', icon: People },
  { id: 'buddies', label: 'Buddies', icon: People },
  { id: 'events', label: 'Events', icon: Calendar },
  { id: 'map', label: 'Live Map', icon: Map1 },
];

export default function CommunityHubScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors: themeColors } = useTheme();
  const { user } = useAuth();
  const userId = user?.id;

  const [activeTab, setActiveTab] = useState<TabType>('my');
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Hooks for data fetching
  const { groups: myGroups, loading: loadingMyGroups, refetch: refetchMyGroups } = useGroups(userId);
  const { groups: discoverGroups, loading: loadingDiscover } = useDiscoverGroups({ search: searchQuery, limit: 20 });
  const { suggestions: buddySuggestions, loading: loadingBuddies, refetch: refetchBuddies } = useBuddySuggestions(userId);
  const { events, loading: loadingEvents, refetch: refetchEvents } = useUpcomingEvents();
  const { requests: pendingRequests } = usePendingBuddyRequests(userId);

  const isPremium = true;
  const notificationCount = pendingRequests.length;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchMyGroups(), refetchBuddies(), refetchEvents()]);
    setRefreshing(false);
  }, [refetchMyGroups, refetchBuddies, refetchEvents]);

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

  const handleLiveMapPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/community/live-map' as any);
  };

  const formatMemberCount = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(count >= 10000 ? 0 : 1)}k`;
    return count.toString();
  };

  const renderLoading = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'discover':
        return (
          <DiscoverTabContent
            onSearch={() => router.push('/community/search' as any)}
            onGroupPress={handleCommunityPress}
            onTravelerPress={handleBuddyPress}
            onEventPress={handleEventPress}
            onSeeAllGroups={() => router.push('/community/trending' as any)}
            onSeeAllTravelers={() => router.push('/community/travelers' as any)}
            onSeeAllEvents={() => router.push('/community/all-events' as any)}
            isPremium={isPremium}
          />
        );

      case 'my':
        if (loadingMyGroups) return renderLoading();
        return (
          <>
            <SectionHeader 
              title="My Groups" 
              onSeeAll={() => router.push('/community/my-groups' as any)}
            />
            {myGroups.length === 0 ? (
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
              myGroups.map(({ group, role }) => (
                <CommunityCard
                  key={group.id}
                  community={{
                    id: group.id,
                    name: group.name,
                    avatar: group.groupPhotoUrl || '',
                    coverImage: group.coverPhotoUrl || '',
                    memberCount: group.memberCount,
                    isVerified: group.isVerified,
                    type: (group.category as any) || 'interest',
                    privacy: group.privacy,
                    tags: group.tags,
                    isMember: true,
                  }}
                  variant="list"
                  onPress={() => handleCommunityPress(group.id)}
                />
              ))
            )}
          </>
        );

      case 'buddies':
        if (loadingBuddies) return renderLoading();
        return (
          <>
            <SectionHeader 
              title="Buddy Matches" 
              subtitle="Travelers with similar plans"
            />
            {buddySuggestions.length === 0 ? (
              <View style={styles.emptyState}>
                <People size={64} color={colors.gray300} variant="Bold" />
                <Text style={styles.emptyTitle}>No matches yet</Text>
                <Text style={styles.emptyText}>
                  Complete your profile and add trips to find buddy matches
                </Text>
              </View>
            ) : (
              buddySuggestions.map(suggestion => (
                <BuddyMatchCard
                  key={suggestion.user.id}
                  buddy={{
                    id: suggestion.user.id,
                    userId: suggestion.user.id,
                    firstName: suggestion.user.firstName,
                    lastName: suggestion.user.lastName,
                    avatar: suggestion.user.avatarUrl || '',
                    bio: suggestion.user.bio || '',
                    matchScore: suggestion.matchScore,
                    matchReasons: suggestion.matchReasons.map(r => r.label),
                    travelStyles: (suggestion.user.travelStyles as any) || [],
                    languages: suggestion.user.languages || [],
                    verificationLevel: 'email' as const,
                    countriesVisited: suggestion.user.countryCount || 0,
                    rating: suggestion.user.averageRating || 0,
                    connectionStatus: 'none' as const,
                    sharedTrip: suggestion.tripOverlap ? {
                      destination: suggestion.tripOverlap.destination,
                      dates: `${suggestion.tripOverlap.yourDates.start.toLocaleDateString()} - ${suggestion.tripOverlap.yourDates.end.toLocaleDateString()}`,
                    } : undefined,
                  }}
                  onPress={() => handleBuddyPress(suggestion.user.id)}
                  isPremium={isPremium}
                />
              ))
            )}
          </>
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

      case 'guides':
        return <GuidesTabContent />;

      case 'map':
        return (
          <View style={styles.emptyState}>
            <Map1 size={64} color={colors.primary} variant="Bold" />
            <Text style={styles.emptyTitle}>Live Map</Text>
            <Text style={styles.emptyText}>
              See nearby travelers and activities in real-time
            </Text>
            <TouchableOpacity 
              style={styles.emptyButton}
              onPress={handleLiveMapPress}
            >
              <Text style={styles.emptyButtonText}>Open Live Map</Text>
            </TouchableOpacity>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Community 🍻</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity 
              style={styles.newGroupButton}
              onPress={handleCreateCommunity}
            >
              <Add size={18} color={colors.primary} />
              <Text style={styles.newGroupText}>New Group</Text>
            </TouchableOpacity>
            
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
            <Text style={styles.statValue}>{myGroups.length} Groups</Text>
          </View>
        </View>
        
        <View style={styles.statDivider} />
        
        <View style={styles.statItem}>
          <View style={[styles.statIconContainer, { backgroundColor: colors.success + '15' }]}>
            <Activity size={20} color={colors.success} variant="Bold" />
          </View>
          <View>
            <Text style={styles.statLabel}>Buddies</Text>
            <Text style={styles.statValue}>{buddySuggestions.length} Matches</Text>
          </View>
        </View>
        
        <View style={styles.statDivider} />
        
        <View style={styles.statItem}>
          <View style={[styles.statIconContainer, { backgroundColor: colors.warning + '15' }]}>
            <Clock size={20} color={colors.warning} variant="Bold" />
          </View>
          <View>
            <Text style={styles.statLabel}>Events</Text>
            <Text style={styles.statValue}>{events.length} Upcoming</Text>
          </View>
        </View>
      </View>
      
      {/* Search Box */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <SearchNormal1 size={20} color={colors.gray400} />
          <TextInput
            style={styles.searchInput}
            placeholder="Find groups, buddies, events..."
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
