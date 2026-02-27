/**
 * HOTEL WHERE SECTION
 * 
 * Hotel-specific search section for the unified search overlay.
 * Handles destination selection with Google Places autocomplete.
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Location, SearchNormal1, CloseCircle } from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, typography, borderRadius } from '@/styles';
import { supabase } from '@/lib/supabase/client';

// Types
export interface HotelDestination {
  id: string;
  name: string;
  city: string;
  country: string;
  type: 'city' | 'hotel' | 'region';
  latitude?: number;
  longitude?: number;
}

interface PlacesAutocompleteResult {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
  types: string[];
}

interface HotelWhereSectionProps {
  destination: HotelDestination | null;
  onDestinationSelect: (destination: HotelDestination) => void;
}

// Popular destinations for quick selection
const POPULAR_DESTINATIONS: HotelDestination[] = [
  { id: 'nyc', name: 'New York City', city: 'New York', country: 'United States', type: 'city' },
  { id: 'par', name: 'Paris', city: 'Paris', country: 'France', type: 'city' },
  { id: 'lon', name: 'London', city: 'London', country: 'United Kingdom', type: 'city' },
  { id: 'tok', name: 'Tokyo', city: 'Tokyo', country: 'Japan', type: 'city' },
  { id: 'dub', name: 'Dubai', city: 'Dubai', country: 'UAE', type: 'city' },
  { id: 'rom', name: 'Rome', city: 'Rome', country: 'Italy', type: 'city' },
];

export default function HotelWhereSection({
  destination,
  onDestinationSelect,
}: HotelWhereSectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [autocompleteResults, setAutocompleteResults] = useState<PlacesAutocompleteResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch autocomplete results from Google Places
  const fetchAutocomplete = useCallback(async (query: string) => {
    if (query.trim().length < 2) {
      setAutocompleteResults([]);
      setShowAutocomplete(false);
      return;
    }

    setIsSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke('places', {
        body: {
          action: 'autocomplete',
          query: query,
          type: '(cities)', // Focus on cities for hotel search
        },
      });

      console.log('Places API response:', { data, error });

      if (error) throw error;

      if (data?.success && data?.data?.predictions && data.data.predictions.length > 0) {
        setAutocompleteResults(data.data.predictions);
        setShowAutocomplete(true);
      } else {
        // No results from API, show a manual result for the query
        setAutocompleteResults([{
          placeId: `manual-${query}`,
          description: query,
          mainText: query,
          secondaryText: 'Search location',
          types: ['locality'],
        }]);
        setShowAutocomplete(true);
      }
    } catch (error) {
      console.error('Autocomplete error:', error);
      // Fall back - create a manual entry for the search query
      setAutocompleteResults([{
        placeId: `manual-${query}`,
        description: query,
        mainText: query,
        secondaryText: 'Search location',
        types: ['locality'],
      }]);
      setShowAutocomplete(true);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    
    // Clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (query.trim() === '') {
      setAutocompleteResults([]);
      setShowAutocomplete(false);
      return;
    }

    // Debounce API calls
    debounceRef.current = setTimeout(() => {
      fetchAutocomplete(query);
    }, 300);
  }, [fetchAutocomplete]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const handleSelectAutocomplete = useCallback(async (result: PlacesAutocompleteResult) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Create destination from autocomplete result
    const dest: HotelDestination = {
      id: result.placeId,
      name: result.mainText,
      city: result.mainText,
      country: result.secondaryText,
      type: 'city',
    };

    // Try to get place details for coordinates
    try {
      const { data, error } = await supabase.functions.invoke('places', {
        body: {
          action: 'details',
          placeId: result.placeId,
        },
      });

      if (!error && data?.success && data?.data?.place) {
        const place = data.data.place;
        dest.latitude = place.location?.latitude;
        dest.longitude = place.location?.longitude;
      }
    } catch (error) {
      console.error('Place details error:', error);
    }

    onDestinationSelect(dest);
    setSearchQuery(result.mainText);
    setShowAutocomplete(false);
    setAutocompleteResults([]);
  }, [onDestinationSelect]);

  const handleSelectDestination = useCallback((dest: HotelDestination) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onDestinationSelect(dest);
    setSearchQuery(dest.name);
    setShowAutocomplete(false);
  }, [onDestinationSelect]);

  const handleClearSelection = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSearchQuery('');
    setAutocompleteResults([]);
    setShowAutocomplete(false);
  }, []);

  return (
    <View style={styles.container}>
      {/* Search Input */}
      <View style={styles.searchInputContainer}>
        <SearchNormal1 size={20} color={colors.gray400} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search destinations"
          placeholderTextColor={colors.gray400}
          value={searchQuery}
          onChangeText={handleSearch}
          autoCapitalize="words"
        />
        {isSearching && (
          <ActivityIndicator size="small" color={colors.primary} />
        )}
      </View>

      {/* Selected Destination Badge - Black background with white text */}
      {destination && (
        <View style={styles.selectedContainer}>
          <TouchableOpacity 
            style={styles.selectedBadge}
            onPress={handleClearSelection}
            activeOpacity={0.8}
          >
            <Location size={16} color={colors.white} variant="Bold" />
            <Text style={styles.selectedText}>{destination.name}</Text>
            <CloseCircle size={14} color={colors.white} variant="Bold" />
          </TouchableOpacity>
        </View>
      )}

      {/* Autocomplete Results */}
      {showAutocomplete && autocompleteResults.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Search Results</Text>
          <View style={styles.autocompleteList}>
            {autocompleteResults.map((result) => (
              <TouchableOpacity
                key={result.placeId}
                style={[
                  styles.autocompleteItem,
                  destination?.id === result.placeId && styles.autocompleteItemSelected,
                ]}
                onPress={() => handleSelectAutocomplete(result)}
                activeOpacity={0.7}
              >
                <Location 
                  size={18} 
                  color={destination?.id === result.placeId ? colors.white : colors.primary} 
                  variant="Bold"
                />
                <View style={styles.autocompleteTextContainer}>
                  <Text 
                    style={[
                      styles.autocompleteMainText,
                      destination?.id === result.placeId && styles.autocompleteTextSelected,
                    ]}
                    numberOfLines={1}
                  >
                    {result.mainText}
                  </Text>
                  <Text 
                    style={[
                      styles.autocompleteSecondaryText,
                      destination?.id === result.placeId && styles.autocompleteSecondaryTextSelected,
                    ]}
                    numberOfLines={1}
                  >
                    {result.secondaryText}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      {/* Popular Destinations - Show when not searching */}
      {!showAutocomplete && (
        <>
          <Text style={styles.sectionTitle}>Popular Destinations</Text>
          <View style={styles.destinationsGrid}>
            {POPULAR_DESTINATIONS.map((dest: HotelDestination) => (
              <TouchableOpacity
                key={dest.id}
                style={[
                  styles.destinationChip,
                  destination?.id === dest.id && styles.destinationChipSelected,
                ]}
                onPress={() => handleSelectDestination(dest)}
                activeOpacity={0.7}
              >
                <Location 
                  size={16} 
                  color={destination?.id === dest.id ? colors.white : colors.primary} 
                  variant="Bold"
                />
                <Text 
                  style={[
                    styles.destinationChipText,
                    destination?.id === dest.id && styles.destinationChipTextSelected,
                  ]}
                  numberOfLines={1}
                >
                  {dest.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      {/* Empty State */}
      {showAutocomplete && autocompleteResults.length === 0 && !isSearching && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No destinations found</Text>
          <Text style={styles.emptyStateSubtext}>Try a different search term</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.sm,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray100,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    paddingVertical: spacing.xs,
  },
  selectedContainer: {
    marginBottom: spacing.md,
  },
  selectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray900,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
    gap: spacing.xs,
  },
  selectedText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium as any,
    color: colors.white,
  },
  sectionTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  destinationsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  destinationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  destinationChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  destinationChipText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  destinationChipTextSelected: {
    color: colors.white,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyStateText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
  },
  emptyStateSubtext: {
    fontSize: typography.fontSize.sm,
    color: colors.gray400,
    marginTop: spacing.xs,
  },
  autocompleteList: {
    gap: spacing.xs,
  },
  autocompleteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  autocompleteItemSelected: {
    backgroundColor: colors.gray900,
    borderColor: colors.gray900,
  },
  autocompleteTextContainer: {
    flex: 1,
  },
  autocompleteMainText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium as any,
    color: colors.textPrimary,
  },
  autocompleteTextSelected: {
    color: colors.white,
  },
  autocompleteSecondaryText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  autocompleteSecondaryTextSelected: {
    color: 'rgba(255,255,255,0.7)',
  },
});
