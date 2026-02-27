/**
 * WHERE SECTION
 * 
 * Destination search with suggested destinations list.
 * Shows search input and filterable destination suggestions.
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { SearchNormal1 } from 'iconsax-react-native';
import { spacing, typography, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';

interface Destination {
  id: string;
  name: string;
  subtitle: string;
  icon: string;
}

const SUGGESTED_DESTINATIONS: Destination[] = [
  { id: '1', name: 'Nearby', subtitle: "Find what's around you", icon: '📍' },
  { id: '2', name: 'Paris, France', subtitle: 'City of lights and romance', icon: '🗼' },
  { id: '3', name: 'Tokyo, Japan', subtitle: 'Modern meets traditional', icon: '🏯' },
  { id: '4', name: 'New York, USA', subtitle: 'The city that never sleeps', icon: '🗽' },
  { id: '5', name: 'Dubai, UAE', subtitle: 'Luxury and adventure', icon: '🏙️' },
  { id: '6', name: 'Bali, Indonesia', subtitle: 'Tropical paradise', icon: '🏝️' },
  { id: '7', name: 'London, UK', subtitle: 'Historic and vibrant', icon: '🎡' },
  { id: '8', name: 'Singapore', subtitle: 'Garden city of Asia', icon: '🌳' },
];

interface WhereSectionProps {
  value: string;
  onSelect: (destination: string) => void;
  autoFocus?: boolean;
}

export default function WhereSection({
  value,
  onSelect,
  autoFocus = true,
}: WhereSectionProps) {
  const { colors: themeColors } = useTheme();
  const [query, setQuery] = useState(value);

  const filteredDestinations = useMemo(() => {
    if (!query.trim()) return SUGGESTED_DESTINATIONS;
    const lowerQuery = query.toLowerCase();
    return SUGGESTED_DESTINATIONS.filter(
      (dest) =>
        dest.name.toLowerCase().includes(lowerQuery) ||
        dest.subtitle.toLowerCase().includes(lowerQuery)
    );
  }, [query]);

  const handleSelect = (destination: Destination) => {
    setQuery(destination.name);
    onSelect(destination.name);
  };

  return (
    <View style={styles.container}>
      {/* Search Input */}
      <View style={[styles.searchInput, { 
        backgroundColor: themeColors.gray100,
        borderColor: themeColors.gray200,
      }]}>
        <SearchNormal1 size={20} color={themeColors.textSecondary} />
        <TextInput
          style={[styles.input, { color: themeColors.textPrimary }]}
          placeholder="Search destinations"
          placeholderTextColor={themeColors.textSecondary}
          value={query}
          onChangeText={setQuery}
          autoFocus={autoFocus}
        />
      </View>

      {/* Suggested Destinations */}
      <Text style={[styles.sectionLabel, { color: themeColors.textSecondary }]}>
        SUGGESTED DESTINATIONS
      </Text>

      <ScrollView 
        style={styles.destinationsList}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
      >
        {filteredDestinations.map((destination) => (
          <TouchableOpacity
            key={destination.id}
            style={styles.destinationRow}
            onPress={() => handleSelect(destination)}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, { backgroundColor: themeColors.gray100 }]}>
              <Text style={styles.emoji}>{destination.icon}</Text>
            </View>
            <View style={styles.destinationInfo}>
              <Text style={[styles.destinationName, { color: themeColors.textPrimary }]}>
                {destination.name}
              </Text>
              <Text style={[styles.destinationSubtitle, { color: themeColors.textSecondary }]}>
                {destination.subtitle}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: spacing.md,
    height: 48,
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  input: {
    flex: 1,
    fontSize: typography.fontSize.base,
  },
  sectionLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },
  destinationsList: {
    maxHeight: 300,
  },
  destinationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  emoji: {
    fontSize: 24,
  },
  destinationInfo: {
    flex: 1,
  },
  destinationName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
  destinationSubtitle: {
    fontSize: typography.fontSize.sm,
    marginTop: 2,
  },
});
