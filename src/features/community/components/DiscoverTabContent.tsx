/**
 * DISCOVER TAB CONTENT
 * 
 * Enhanced discover view with sub-tabs for Groups, Travelers, Events, Destinations.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
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

// Mock data
const MOCK_TRENDING_GROUPS: CommunityPreview[] = [
  {
    id: 'grp-1',
    name: 'Japan 2025 Travelers',
    avatar: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=200',
    coverImage: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400',
    memberCount: 12400,
    isVerified: true,
    type: 'destination',
    privacy: 'public',
    tags: ['Japan', '2025', 'Travel'],
    isMember: false,
  },
  {
    id: 'grp-2',
    name: 'Solo Female Travelers',
    avatar: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=200',
    coverImage: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400',
    memberCount: 45600,
    isVerified: true,
    type: 'interest',
    privacy: 'public',
    tags: ['Solo', 'Women', 'Safety'],
    isMember: true,
  },
  {
    id: 'grp-3',
    name: 'Digital Nomads Worldwide',
    avatar: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=200',
    coverImage: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400',
    memberCount: 28900,
    isVerified: true,
    type: 'interest',
    privacy: 'public',
    tags: ['Remote Work', 'Nomad', 'Coworking'],
    isMember: false,
  },
];

const MOCK_TRIP_GROUPS: CommunityPreview[] = [
  {
    id: 'grp-4',
    name: 'Tokyo Foodies',
    avatar: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=200',
    coverImage: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400',
    memberCount: 2800,
    isVerified: false,
    type: 'destination',
    privacy: 'public',
    tags: ['Tokyo', 'Food', 'Ramen'],
    isMember: false,
    destination: { city: 'Tokyo', country: 'Japan' },
  },
  {
    id: 'grp-5',
    name: 'Tokyo Nightlife',
    avatar: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=200',
    coverImage: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=400',
    memberCount: 1560,
    isVerified: false,
    type: 'destination',
    privacy: 'public',
    tags: ['Tokyo', 'Nightlife', 'Bars'],
    isMember: false,
    destination: { city: 'Tokyo', country: 'Japan' },
  },
];

const MOCK_TRAVELERS: BuddyMatch[] = [
  {
    id: 'user-1',
    userId: 'user-1',
    firstName: 'Priya',
    lastName: 'Sharma',
    avatar: 'https://i.pravatar.cc/150?img=25',
    bio: 'Adventure seeker & photography enthusiast',
    matchScore: 87,
    matchReasons: ['Same destination', 'Similar interests'],
    travelStyles: ['adventure', 'photography'],
    languages: ['English', 'Hindi'],
    verificationLevel: 'id',
    countriesVisited: 12,
    rating: 4.8,
    connectionStatus: 'none',
    sharedTrip: { destination: 'Tokyo', dates: 'Mar 20 - Apr 5' },
  },
  {
    id: 'user-2',
    userId: 'user-2',
    firstName: 'Marcus',
    lastName: 'Chen',
    avatar: 'https://i.pravatar.cc/150?img=33',
    bio: 'Foodie exploring the world one dish at a time',
    matchScore: 82,
    matchReasons: ['Food lover', 'Overlapping dates'],
    travelStyles: ['foodie', 'cultural'],
    languages: ['English', 'Mandarin'],
    verificationLevel: 'email',
    countriesVisited: 8,
    rating: 4.6,
    connectionStatus: 'none',
    sharedTrip: { destination: 'Tokyo', dates: 'Mar 22 - Apr 2' },
  },
  {
    id: 'user-3',
    userId: 'user-3',
    firstName: 'Emma',
    lastName: 'Wilson',
    avatar: 'https://i.pravatar.cc/150?img=9',
    bio: 'Solo traveler, yoga instructor, sunset chaser',
    matchScore: 75,
    matchReasons: ['Solo traveler', 'Similar age'],
    travelStyles: ['solo', 'wellness'],
    languages: ['English', 'Spanish'],
    verificationLevel: 'id',
    countriesVisited: 15,
    rating: 4.9,
    connectionStatus: 'none',
  },
];

const MOCK_EVENTS: EventPreview[] = [
  {
    id: 'evt-1',
    communityId: 'grp-4',
    title: 'Tokyo Street Food Tour',
    coverImage: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400',
    type: 'food_drink',
    status: 'upcoming',
    location: { city: 'Tokyo', country: 'Japan', isVirtual: false },
    startDate: new Date(Date.now() + 1000 * 60 * 60 * 24),
    attendeeCount: 12,
    myRSVP: 'none',
  },
  {
    id: 'evt-2',
    communityId: 'grp-1',
    title: 'Cherry Blossom Photography Walk',
    coverImage: 'https://images.unsplash.com/photo-1522383225653-ed111181a951?w=400',
    type: 'outdoor',
    status: 'upcoming',
    location: { city: 'Tokyo', country: 'Japan', isVirtual: false },
    startDate: new Date(Date.now() + 1000 * 60 * 60 * 72),
    attendeeCount: 24,
    myRSVP: 'none',
  },
];

const MOCK_DESTINATIONS = [
  { id: 'dest-1', name: 'Tokyo', country: 'Japan', image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400', travelerCount: 234 },
  { id: 'dest-2', name: 'Bali', country: 'Indonesia', image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400', travelerCount: 189 },
  { id: 'dest-3', name: 'Paris', country: 'France', image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400', travelerCount: 156 },
  { id: 'dest-4', name: 'Barcelona', country: 'Spain', image: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=400', travelerCount: 142 },
];

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
  
  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };
  
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
          {MOCK_TRENDING_GROUPS.map((group) => (
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
          {MOCK_TRIP_GROUPS.map((group) => (
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
        {MOCK_TRAVELERS.slice(0, 3).map((traveler) => (
          <BuddyMatchCard
            key={traveler.id}
            buddy={traveler}
            onPress={() => onTravelerPress(traveler.id)}
            isPremium={isPremium}
          />
        ))}
      </View>
      
      {/* Upcoming Events */}
      <View style={styles.section}>
        <SectionHeader
          title="🎉 Upcoming Events Near You"
          onSeeAll={onSeeAllEvents}
        />
        {MOCK_EVENTS.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            variant="list"
            onPress={() => onEventPress(event.id)}
          />
        ))}
      </View>
      
      {/* Popular Destinations */}
      <View style={styles.section}>
        <SectionHeader title="🌍 Popular Destinations" />
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalScroll}
        >
          {MOCK_DESTINATIONS.map((dest) => (
            <TouchableOpacity
              key={dest.id}
              style={styles.destinationCard}
              onPress={() => onDestinationPress?.(dest.id)}
              activeOpacity={0.8}
            >
              <Image source={{ uri: dest.image }} style={styles.destinationImage} />
              <View style={styles.destinationOverlay}>
                <Text style={styles.destinationName}>{dest.name}</Text>
                <Text style={styles.destinationCountry}>{dest.country}</Text>
                <View style={styles.travelerBadge}>
                  <People size={12} color={colors.white} />
                  <Text style={styles.travelerCount}>{dest.travelerCount} travelers</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </>
  );
  
  const renderGroupsContent = () => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>All Groups</Text>
      {[...MOCK_TRENDING_GROUPS, ...MOCK_TRIP_GROUPS].map((group) => (
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

