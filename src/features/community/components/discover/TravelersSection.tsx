/**
 * TRAVELERS SECTION
 *
 * Shows recommended traveler matches inside DiscoverFeed.
 * Replaces the old dedicated Buddies tab.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { spacing } from '@/styles';
import BuddyMatchCard from '../BuddyMatchCard';
import SectionHeader from '../SectionHeader';
import { BuddyMatch } from '../../types/buddy.types';

interface TravelersSectionProps {
  onTravelerPress: (userId: string) => void;
  onSeeAll?: () => void;
  isPremium?: boolean;
}

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

export default function TravelersSection({
  onTravelerPress,
  onSeeAll,
  isPremium = false,
}: TravelersSectionProps) {
  return (
    <View style={styles.section}>
      <SectionHeader
        title="Travelers You Might Like"
        onSeeAll={onSeeAll}
      />
      <View style={styles.listContainer}>
        {MOCK_TRAVELERS.slice(0, 3).map((traveler) => (
          <BuddyMatchCard
            key={traveler.id}
            buddy={traveler}
            onPress={() => onTravelerPress(traveler.id)}
            isPremium={isPremium}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: spacing.lg,
  },
  listContainer: {
    // No extra horizontal padding — BuddyMatchCard handles its own margins
  },
});
