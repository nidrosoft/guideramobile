/**
 * DESTINATIONS SECTION
 *
 * Popular travel destinations with traveler counts.
 * Horizontal scroll inside DiscoverFeed. Data provided via props.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { People } from 'iconsax-react-native';
import { spacing, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import SectionHeader from '../SectionHeader';

export interface DestinationItem {
  id: string;
  name: string;
  country: string;
  image: string;
  travelerCount: number;
}

interface DestinationsSectionProps {
  destinations: DestinationItem[];
  loading?: boolean;
  onDestinationPress?: (destinationId: string) => void;
}

export default function DestinationsSection({
  destinations,
  loading = false,
  onDestinationPress,
}: DestinationsSectionProps) {
  const { colors: tc } = useTheme();

  if (!loading && destinations.length === 0) return null;

  return (
    <View style={styles.section}>
      <SectionHeader title="Popular Destinations" />
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={tc.primary} />
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalScroll}
        >
          {destinations.map((dest) => (
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
