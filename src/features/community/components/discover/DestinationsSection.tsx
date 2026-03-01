/**
 * DESTINATIONS SECTION
 *
 * Popular travel destinations with traveler counts.
 * Horizontal scroll inside DiscoverFeed.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { People } from 'iconsax-react-native';
import { spacing, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import SectionHeader from '../SectionHeader';

interface DestinationsSectionProps {
  onDestinationPress?: (destinationId: string) => void;
}

const MOCK_DESTINATIONS = [
  { id: 'dest-1', name: 'Tokyo', country: 'Japan', image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400', travelerCount: 234 },
  { id: 'dest-2', name: 'Bali', country: 'Indonesia', image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400', travelerCount: 189 },
  { id: 'dest-3', name: 'Paris', country: 'France', image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400', travelerCount: 156 },
  { id: 'dest-4', name: 'Barcelona', country: 'Spain', image: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=400', travelerCount: 142 },
];

export default function DestinationsSection({
  onDestinationPress,
}: DestinationsSectionProps) {
  const { colors: tc } = useTheme();

  return (
    <View style={styles.section}>
      <SectionHeader title="Popular Destinations" />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalScroll}
      >
        {MOCK_DESTINATIONS.map((dest) => (
          <TouchableOpacity
            key={dest.id}
            style={styles.card}
            onPress={() => onDestinationPress?.(dest.id)}
            activeOpacity={0.8}
          >
            <Image source={{ uri: dest.image }} style={styles.image} />
            <View style={styles.overlay}>
              <Text style={styles.name}>{dest.name}</Text>
              <Text style={styles.country}>{dest.country}</Text>
              <View style={styles.badge}>
                <People size={12} color="#FFFFFF" />
                <Text style={styles.badgeText}>
                  {dest.travelerCount} travelers
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: spacing.lg,
  },
  horizontalScroll: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  card: {
    width: 160,
    height: 200,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    padding: spacing.md,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  country: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.xs,
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '500',
  },
});
