/**
 * WHERE SECTION
 * 
 * Destination search with Google Places Autocomplete.
 * Shows popular destinations when empty, real-time API suggestions when typing.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SearchNormal1, Location, CloseCircle } from 'iconsax-react-native';
import { spacing, typography, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';

interface Destination {
  id: string;
  name: string;
  subtitle: string;
  icon: string;
}

// Popular destinations shown when input is empty
const POPULAR_DESTINATIONS: Destination[] = [
  { id: 'nearby', name: 'Nearby', subtitle: "Find what's around you", icon: '📍' },
  { id: 'paris', name: 'Paris, France', subtitle: 'City of lights and romance', icon: '🗼' },
  { id: 'tokyo', name: 'Tokyo, Japan', subtitle: 'Modern meets traditional', icon: '🏯' },
  { id: 'new-york', name: 'New York, USA', subtitle: 'The city that never sleeps', icon: '🗽' },
  { id: 'dubai', name: 'Dubai, UAE', subtitle: 'Luxury and adventure', icon: '🏙️' },
  { id: 'bali', name: 'Bali, Indonesia', subtitle: 'Tropical paradise', icon: '🏝️' },
  { id: 'london', name: 'London, UK', subtitle: 'Historic and vibrant', icon: '🎡' },
  { id: 'singapore', name: 'Singapore', subtitle: 'Garden city of Asia', icon: '🌳' },
];

const GOOGLE_PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';

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
  const [results, setResults] = useState<Destination[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch autocomplete suggestions from Google Places API
  const fetchSuggestions = useCallback(async (input: string) => {
    if (!input.trim() || input.trim().length < 2 || !GOOGLE_PLACES_API_KEY) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&types=(cities)&key=${GOOGLE_PLACES_API_KEY}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' && data.predictions) {
        const suggestions: Destination[] = data.predictions.map((p: any) => {
          // Extract city and country from structured_formatting
          const mainText = p.structured_formatting?.main_text || p.description.split(',')[0];
          const secondaryText = p.structured_formatting?.secondary_text || 
            p.description.split(',').slice(1).join(',').trim();
          
          return {
            id: p.place_id,
            name: mainText,
            subtitle: secondaryText,
            icon: '📍',
          };
        });
        setResults(suggestions);
      } else {
        setResults([]);
      }
    } catch (err) {
      if (__DEV__) console.warn('[WhereSection] Autocomplete error:', err);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounced search — triggers 300ms after user stops typing
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query.trim() || query.trim().length < 2) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    debounceRef.current = setTimeout(() => {
      fetchSuggestions(query);
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, fetchSuggestions]);

  const handleSelect = (destination: Destination) => {
    const fullName = destination.subtitle 
      ? `${destination.name}, ${destination.subtitle}` 
      : destination.name;
    setQuery(destination.name);
    onSelect(fullName);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
  };

  // Show API results when typing, popular destinations when empty
  const showingResults = query.trim().length >= 2;
  const displayList = showingResults ? results : POPULAR_DESTINATIONS;
  const sectionLabel = showingResults ? 'SEARCH RESULTS' : 'SUGGESTED DESTINATIONS';

  return (
    <View style={styles.container}>
      {/* Search Input */}
      <View style={[styles.searchInput, { 
        backgroundColor: themeColors.bgCard,
        borderColor: themeColors.borderSubtle,
      }]}>
        <SearchNormal1 size={20} color={themeColors.textSecondary} />
        <TextInput
          style={[styles.input, { color: themeColors.textPrimary }]}
          placeholder="Search any city or country..."
          placeholderTextColor={themeColors.textSecondary}
          value={query}
          onChangeText={setQuery}
          autoFocus={autoFocus}
          autoCorrect={false}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={handleClear} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <CloseCircle size={18} color={themeColors.textTertiary} variant="Bold" />
          </TouchableOpacity>
        )}
      </View>

      {/* Section Label */}
      <Text style={[styles.sectionLabel, { color: themeColors.textSecondary }]}>
        {sectionLabel}
      </Text>

      {/* Loading Indicator */}
      {isSearching && (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={themeColors.primary} />
          <Text style={[styles.loadingText, { color: themeColors.textTertiary }]}>Searching...</Text>
        </View>
      )}

      {/* Results List */}
      <ScrollView 
        style={styles.destinationsList}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
        keyboardShouldPersistTaps="handled"
      >
        {!isSearching && showingResults && displayList.length === 0 && (
          <Text style={[styles.emptyText, { color: themeColors.textTertiary }]}>
            No destinations found for "{query}"
          </Text>
        )}

        {displayList.map((destination) => (
          <TouchableOpacity
            key={destination.id}
            style={styles.destinationRow}
            onPress={() => handleSelect(destination)}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, { backgroundColor: themeColors.bgCard }]}>
              {showingResults ? (
                <Location size={20} color={themeColors.primary} variant="Bold" />
              ) : (
                <Text style={styles.emoji}>{destination.icon}</Text>
              )}
            </View>
            <View style={styles.destinationInfo}>
              <Text style={[styles.destinationName, { color: themeColors.textPrimary }]}>
                {destination.name}
              </Text>
              <Text style={[styles.destinationSubtitle, { color: themeColors.textSecondary }]} numberOfLines={1}>
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
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    marginBottom: spacing.xs,
  },
  loadingText: {
    fontSize: typography.fontSize.sm,
  },
  emptyText: {
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
});
