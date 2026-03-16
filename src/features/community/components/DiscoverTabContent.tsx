/**
 * DISCOVER TAB CONTENT
 * 
 * Enhanced discover view with sub-tabs for Groups, Travelers, Events, Destinations.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
  ActivityIndicator,
} from 'react-native';
import { 
  SearchNormal1, 
  TrendUp, 
  Location, 
  People, 
  Calendar,
  Map1,
  ArrowRight2,
  Verify,
} from 'iconsax-react-native';
import { colors, spacing, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { supabase } from '@/lib/supabase/client';
import { styles } from './DiscoverTabContent.styles';
import CommunityCard from './CommunityCard';
import BuddyMatchCard from './BuddyMatchCard';
import EventCard from './EventCard';
import SectionHeader from './SectionHeader';
import { CommunityPreview } from '../types/community.types';
import { BuddyMatch } from '../types/buddy.types';
import { EventPreview } from '../types/event.types';

type DiscoverSubTab = 'all' | 'groups' | 'travelers' | 'events' | 'destinations';

interface DiscoverTabContentProps {
  onSearch?: () => void;
  onGroupPress: (groupId: string) => void;
  onTravelerPress: (userId: string) => void;
  onEventPress: (eventId: string) => void;
  onDestinationPress?: (destinationId: string) => void;
  onSeeAllGroups?: () => void;
  onSeeAllTravelers?: () => void;
  onSeeAllEvents?: () => void;
  isPremium?: boolean;
}

// Data is fetched from Supabase — no more inline mock arrays

const SUB_TABS: { id: DiscoverSubTab; label: string; icon: any }[] = [
  { id: 'all', label: 'All', icon: SearchNormal1 },
  { id: 'groups', label: 'Groups', icon: People },
  { id: 'travelers', label: 'Travelers', icon: People },
  { id: 'events', label: 'Events', icon: Calendar },
  { id: 'destinations', label: 'Destinations', icon: Map1 },
];

export default function DiscoverTabContent({
  onSearch,
  onGroupPress,
  onTravelerPress,
  onEventPress,
  onDestinationPress,
  onSeeAllGroups,
  onSeeAllTravelers,
  onSeeAllEvents,
  isPremium = false,
}: DiscoverTabContentProps) {
  const { colors: tc } = useTheme();
  const [activeSubTab, setActiveSubTab] = useState<DiscoverSubTab>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<CommunityPreview[]>([]);
  const [events, setEvents] = useState<EventPreview[]>([]);

  const fetchDiscoverData = async () => {
    try {
      // Fetch real groups from Supabase
      const { data: groupData } = await supabase
        .from('groups')
        .select('*')
        .eq('status', 'active')
        .order('member_count', { ascending: false })
        .limit(10);

      if (groupData) {
        setGroups(groupData.map((g: any) => ({
          id: g.id,
          name: g.name,
          avatar: g.avatar_url || '',
          coverImage: g.cover_image_url || '',
          memberCount: g.member_count || 0,
          isVerified: g.is_verified || false,
          type: g.type || 'interest',
          privacy: g.privacy || 'public',
          tags: g.tags || [],
          isMember: false,
        })));
      }

      // Fetch real events
      const { data: eventData } = await supabase
        .from('community_events')
        .select('*')
        .eq('status', 'upcoming')
        .gte('start_date', new Date().toISOString())
        .order('start_date', { ascending: true })
        .limit(5);

      if (eventData) {
        setEvents(eventData.map((e: any) => ({
          id: e.id,
          communityId: e.community_id,
          title: e.title,
          coverImage: e.cover_image_url || '',
          type: e.event_type || 'meetup',
          status: 'upcoming',
          location: { city: e.city || '', country: e.country || '', isVirtual: e.is_virtual || false },
          startDate: new Date(e.start_date),
          attendeeCount: e.attendee_count || 0,
          myRSVP: 'none' as const,
        })));
      }
    } catch (err) {
      if (__DEV__) console.warn('DiscoverTab fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscoverData();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDiscoverData();
    setRefreshing(false);
  };

  // Split groups into trending (most members) and trip-related
  const trendingGroups = groups.slice(0, 3);
  const tripGroups = groups.slice(3, 5);
  
  const renderAllContent = () => (
    <>
      {/* Trending Groups */}
      <View style={styles.section}>
        <SectionHeader
          title="🔥 Trending Groups"
          onSeeAll={onSeeAllGroups}
        />
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalScroll}
        >
          {trendingGroups.map((group) => (
            <View key={group.id} style={styles.horizontalCard}>
              <CommunityCard
                community={group}
                variant="horizontal"
                onPress={() => onGroupPress(group.id)}
                showJoinButton
              />
            </View>
          ))}
        </ScrollView>
      </View>
      
      {/* Groups for Your Trip */}
      <View style={styles.section}>
        <SectionHeader
          title="📍 Groups for Your Next Trip"
          subtitle="Tokyo"
        />
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalScroll}
        >
          {tripGroups.map((group) => (
            <View key={group.id} style={styles.horizontalCard}>
              <CommunityCard
                community={group}
                variant="horizontal"
                onPress={() => onGroupPress(group.id)}
                showJoinButton
              />
            </View>
          ))}
        </ScrollView>
      </View>
      
      {/* Travelers You Might Like */}
      <View style={styles.section}>
        <SectionHeader
          title="👥 Travelers You Might Like"
          onSeeAll={onSeeAllTravelers}
        />
        <Text style={[styles.emptyHint, { color: tc.textTertiary }]}>Connect with travelers on your trips</Text>
      </View>
      
      {/* Upcoming Events */}
      <View style={styles.section}>
        <SectionHeader
          title="🎉 Upcoming Events Near You"
          onSeeAll={onSeeAllEvents}
        />
        {events.length > 0 ? events.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            variant="list"
            onPress={() => onEventPress(event.id)}
          />
        )) : (
          <Text style={[styles.emptyHint, { color: tc.textTertiary }]}>No upcoming events yet</Text>
        )}
      </View>
      
      {/* Popular Destinations */}
      <View style={styles.section}>
        <SectionHeader title="🌍 Popular Destinations" />
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalScroll}
        >
          <Text style={[styles.emptyHint, { color: tc.textTertiary, paddingHorizontal: spacing.md }]}>Popular destinations coming soon</Text>
        </ScrollView>
      </View>
    </>
  );
  
  const renderGroupsContent = () => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>All Groups</Text>
      {groups.map((group) => (
        <CommunityCard
          key={group.id}
          community={group}
          variant="list"
          onPress={() => onGroupPress(group.id)}
          showJoinButton
        />
      ))}
    </View>
  );
  
  const renderTravelersContent = () => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>Recommended Travelers</Text>
      {MOCK_TRAVELERS.map((traveler) => (
        <BuddyMatchCard
          key={traveler.id}
          buddy={traveler}
          onPress={() => onTravelerPress(traveler.id)}
          isPremium={isPremium}
        />
      ))}
    </View>
  );
  
  const renderEventsContent = () => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>Upcoming Events</Text>
      {MOCK_EVENTS.map((event) => (
        <EventCard
          key={event.id}
          event={event}
          variant="list"
          onPress={() => onEventPress(event.id)}
        />
      ))}
    </View>
  );
  
  const renderDestinationsContent = () => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>Popular Destinations</Text>
      <View style={styles.destinationsGrid}>
        {MOCK_DESTINATIONS.map((dest) => (
          <TouchableOpacity
            key={dest.id}
            style={styles.destinationGridCard}
            onPress={() => onDestinationPress?.(dest.id)}
            activeOpacity={0.8}
          >
            <Image source={{ uri: dest.image }} style={styles.destinationGridImage} />
            <View style={styles.destinationOverlay}>
              <Text style={styles.destinationName}>{dest.name}</Text>
              <Text style={styles.destinationCountry}>{dest.country}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
  
  return (
    <View style={[styles.container, { backgroundColor: tc.background }]}>
      {/* Search Bar */}
      <TouchableOpacity 
        style={[styles.searchBar, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle }]}
        onPress={onSearch}
        activeOpacity={0.7}
      >
        <SearchNormal1 size={20} color={tc.textSecondary} />
        <Text style={[styles.searchPlaceholder, { color: tc.textSecondary }]}>Search groups, travelers, events...</Text>
      </TouchableOpacity>
      
      {/* Sub Tabs */}
      <View style={styles.subTabsContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.subTabsScroll}
        >
          {SUB_TABS.map((tab) => {
            const IconComponent = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[styles.subTab, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle }, isActive && styles.subTabActive]}
                onPress={() => setActiveSubTab(tab.id)}
                activeOpacity={0.7}
              >
                <IconComponent 
                  size={16} 
                  color={isActive ? '#FFFFFF' : tc.textSecondary} 
                />
                <Text style={[styles.subTabText, { color: tc.textSecondary }, isActive && styles.subTabTextActive]}>
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
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {activeSubTab === 'all' && renderAllContent()}
        {activeSubTab === 'groups' && renderGroupsContent()}
        {activeSubTab === 'travelers' && renderTravelersContent()}
        {activeSubTab === 'events' && renderEventsContent()}
        {activeSubTab === 'destinations' && renderDestinationsContent()}
        
        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

