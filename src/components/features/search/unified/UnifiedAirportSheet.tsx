/**
 * UNIFIED AIRPORT SHEET
 * 
 * Bottom sheet for airport/city search.
 * Uses Google Places API for airport autocomplete suggestions.
 */

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { 
  FadeIn, 
  FadeOut,
  SlideInDown,
  SlideOutDown,
} from 'react-native-reanimated';
import { SearchNormal1, Airplane, CloseCircle, Location } from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { spacing, typography } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { supabase } from '@/lib/supabase/client';

export interface Airport {
  code: string;
  name: string;
  city: string;
  country: string;
}

interface UnifiedAirportSheetProps {
  visible: boolean;
  title: string;
  onClose: () => void;
  onSelect: (airport: Airport) => void;
  selectedAirport?: Airport | null;
}

// Popular airports for suggestions
const POPULAR_AIRPORTS: Airport[] = [
  { code: 'JFK', name: 'John F. Kennedy International', city: 'New York', country: 'USA' },
  { code: 'LAX', name: 'Los Angeles International', city: 'Los Angeles', country: 'USA' },
  { code: 'LHR', name: 'Heathrow Airport', city: 'London', country: 'UK' },
  { code: 'CDG', name: 'Charles de Gaulle', city: 'Paris', country: 'France' },
  { code: 'DXB', name: 'Dubai International', city: 'Dubai', country: 'UAE' },
  { code: 'NRT', name: 'Narita International', city: 'Tokyo', country: 'Japan' },
  { code: 'SIN', name: 'Changi Airport', city: 'Singapore', country: 'Singapore' },
  { code: 'SFO', name: 'San Francisco International', city: 'San Francisco', country: 'USA' },
  { code: 'ORD', name: "O'Hare International", city: 'Chicago', country: 'USA' },
  { code: 'FRA', name: 'Frankfurt Airport', city: 'Frankfurt', country: 'Germany' },
  { code: 'AMS', name: 'Schiphol Airport', city: 'Amsterdam', country: 'Netherlands' },
  { code: 'HKG', name: 'Hong Kong International', city: 'Hong Kong', country: 'China' },
];

export default function UnifiedAirportSheet({
  visible,
  title,
  onClose,
  onSelect,
  selectedAirport,
}: UnifiedAirportSheetProps) {
  const insets = useSafeAreaInsets();
  const { colors: themeColors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Airport[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Search airports using Google Places API
  const searchAirports = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke('places', {
        body: {
          action: 'autocomplete',
          query: `${query} airport`,
          type: 'airport',
        },
      });

      if (error) throw error;

      if (data?.success && data?.data?.predictions) {
        // Map predictions to Airport format
        const airports: Airport[] = data.data.predictions
          .filter((p: { types: string[] }) => 
            p.types?.includes('airport') || 
            p.types?.includes('establishment')
          )
          .slice(0, 10)
          .map((p: { mainText: string; secondaryText: string; description: string }) => {
            // Extract airport code from description if available (e.g., "JFK" from "John F. Kennedy International Airport (JFK)")
            const codeMatch = p.description.match(/\(([A-Z]{3})\)/);
            const code = codeMatch ? codeMatch[1] : p.mainText.substring(0, 3).toUpperCase();
            
            // Parse city and country from secondary text
            const parts = p.secondaryText?.split(',') || [];
            const city = parts[0]?.trim() || '';
            const country = parts[parts.length - 1]?.trim() || '';

            return {
              code,
              name: p.mainText,
              city,
              country,
            };
          });

        setSearchResults(airports);
      }
    } catch (error) {
      console.error('Airport search error:', error);
      // Fall back to local search on error
      const query_lower = query.toLowerCase();
      const localResults = POPULAR_AIRPORTS.filter(
        (airport) =>
          airport.code.toLowerCase().includes(query_lower) ||
          airport.name.toLowerCase().includes(query_lower) ||
          airport.city.toLowerCase().includes(query_lower)
      );
      setSearchResults(localResults);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.trim().length >= 2) {
      setIsSearching(true);
      searchTimeoutRef.current = setTimeout(() => {
        searchAirports(searchQuery);
      }, 300);
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, searchAirports]);

  // Display airports: search results or popular airports
  const displayAirports = useMemo(() => {
    if (searchQuery.trim().length >= 2) {
      return searchResults;
    }
    return POPULAR_AIRPORTS;
  }, [searchQuery, searchResults]);

  const handleSelect = useCallback((airport: Airport) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelect(airport);
    setSearchQuery('');
  }, [onSelect]);

  const handleClose = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSearchQuery('');
    onClose();
  }, [onClose]);

  const renderAirportItem = useCallback(({ item }: { item: Airport }) => {
    const isSelected = selectedAirport?.code === item.code;
    return (
      <TouchableOpacity
        style={[
          styles.airportRow,
          isSelected && { backgroundColor: `${themeColors.primary}10` },
        ]}
        onPress={() => handleSelect(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.airportIcon, { backgroundColor: themeColors.gray100 }]}>
          <Airplane size={18} color={themeColors.primary} />
        </View>
        <View style={styles.airportInfo}>
          <Text style={[styles.airportCity, { color: themeColors.textPrimary }]}>
            {item.city}, {item.country}
          </Text>
          <Text style={[styles.airportName, { color: themeColors.textSecondary }]}>
            {item.name} ({item.code})
          </Text>
        </View>
        {isSelected && (
          <View style={[styles.selectedBadge, { backgroundColor: themeColors.primary }]}>
            <Text style={styles.selectedText}>✓</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }, [themeColors, selectedAirport, handleSelect]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <Animated.View 
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(150)}
        style={styles.overlay}
      >
        <TouchableOpacity 
          style={styles.backdrop} 
          activeOpacity={1} 
          onPress={handleClose}
        />
        
        <Animated.View
          entering={SlideInDown.duration(250)}
          exiting={SlideOutDown.duration(200)}
          style={[
            styles.sheet,
            { 
              backgroundColor: themeColors.white,
              paddingBottom: insets.bottom + spacing.md,
            },
          ]}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.keyboardView}
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={[styles.title, { color: themeColors.textPrimary }]}>
                {title}
              </Text>
              <TouchableOpacity onPress={handleClose} activeOpacity={0.7}>
                <CloseCircle size={24} color={themeColors.textSecondary} variant="Bold" />
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View style={[styles.searchContainer, { 
              backgroundColor: themeColors.gray100,
              borderColor: themeColors.gray200,
            }]}>
              <SearchNormal1 size={20} color={themeColors.textSecondary} />
              <TextInput
                style={[styles.searchInput, { color: themeColors.textPrimary }]}
                placeholder="Search city or airport"
                placeholderTextColor={themeColors.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
                autoCapitalize="none"
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <CloseCircle size={18} color={themeColors.gray400} />
                </TouchableOpacity>
              )}
            </View>

            {/* Section Label */}
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionLabel, { color: themeColors.textSecondary }]}>
                {searchQuery.length >= 2 ? 'SEARCH RESULTS' : 'POPULAR AIRPORTS'}
              </Text>
              {isSearching && (
                <ActivityIndicator size="small" color={themeColors.primary} />
              )}
            </View>

            {/* Airport List */}
            <FlatList
              data={displayAirports}
              keyExtractor={(item, index) => `${item.code}-${index}`}
              renderItem={renderAirportItem}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Location size={48} color={themeColors.gray300} />
                  <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>
                    {isSearching ? 'Searching...' : 'No airports found'}
                  </Text>
                </View>
              }
            />
          </KeyboardAvoidingView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '90%',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    paddingHorizontal: spacing.md,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.fontSize.base,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  sectionLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    letterSpacing: 0.5,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
  },
  airportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: 12,
    paddingHorizontal: spacing.sm,
    marginVertical: 2,
  },
  airportIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  airportInfo: {
    flex: 1,
  },
  airportCity: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
  airportName: {
    fontSize: typography.fontSize.sm,
    marginTop: 2,
  },
  selectedBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyText: {
    fontSize: typography.fontSize.base,
    marginTop: spacing.md,
  },
});
