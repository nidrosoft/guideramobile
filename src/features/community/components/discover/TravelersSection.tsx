/**
 * TRAVELERS SECTION
 *
 * Shows recommended traveler matches inside DiscoverFeed.
 * Replaces the old dedicated Buddies tab. Data provided via props.
 */

import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { spacing } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import BuddyMatchCard from '../BuddyMatchCard';
import SectionHeader from '../SectionHeader';
import { BuddyMatch } from '../../types/buddy.types';

interface TravelersSectionProps {
  travelers: BuddyMatch[];
  loading?: boolean;
  onTravelerPress: (userId: string) => void;
  onConnect?: (userId: string) => void;
  onSeeAll?: () => void;
  isPremium?: boolean;
}

export default function TravelersSection({
  travelers,
  loading = false,
  onTravelerPress,
  onConnect,
  onSeeAll,
  isPremium = false,
}: TravelersSectionProps) {
  const { colors: tc } = useTheme();

  if (!loading && travelers.length === 0) return null;

  return (
    <View style={styles.section}>
      <SectionHeader
        title="Connect with Other Travelers"
        onSeeAll={onSeeAll}
      />
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={tc.primary} />
        </View>
      ) : (
        <View style={styles.listContainer}>
          {travelers.slice(0, 3).map((traveler) => (
            <BuddyMatchCard
              key={traveler.id}
              buddy={traveler}
              onPress={() => onTravelerPress(traveler.userId)}
              onConnect={onConnect}
              isPremium={isPremium}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: spacing.lg,
  },
  loadingContainer: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  listContainer: {
    // No extra horizontal padding — BuddyMatchCard handles its own margins
  },
});
