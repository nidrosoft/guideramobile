/**
 * SEARCH RESULTS SCREEN
 * 
 * Displays search results categorized by type.
 * Supports filtering and sorting.
 * Refactored to use reusable components.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/context/ThemeContext';
import { spacing } from '@/styles';
import { 
  searchService, 
  SearchResult, 
  SearchFilters, 
  DEFAULT_FILTERS 
} from '@/services/search.service';
import {
  FilterBottomSheet,
  SearchResultCard,
  CategoryTabs,
  SearchHeader,
  EmptyState,
} from '@/components/features/search';
import { styles } from '@/components/features/search/styles/SearchResults.styles';

type CategoryTab = 'all' | 'destinations' | 'hotels' | 'experiences' | 'places';

const CATEGORY_TABS = [
  { id: 'all', label: 'All' },
  { id: 'destinations', label: 'Destinations' },
  { id: 'hotels', label: 'Hotels' },
  { id: 'experiences', label: 'Experiences' },
  { id: 'places', label: 'Places' },
];

export default function SearchResultsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { q } = useLocalSearchParams<{ q: string }>();
  const { colors, isDark } = useTheme();
  
  const [searchQuery, setSearchQuery] = useState(q || '');
  const [activeTab, setActiveTab] = useState<CategoryTab>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS);
  
  
  const dynamicStyles = useMemo(() => ({
    container: { backgroundColor: colors.background },
    resultsCount: { color: colors.textSecondary },
    loadingText: { color: colors.textSecondary },
  }), [colors]);
  
  const [results, setResults] = useState<{
    destinations: SearchResult[];
    hotels: SearchResult[];
    experiences: SearchResult[];
    places: SearchResult[];
    totalCount: number;
  }>({
    destinations: [],
    hotels: [],
    experiences: [],
    places: [],
    totalCount: 0,
  });

  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults({ destinations: [], hotels: [], experiences: [], places: [], totalCount: 0 });
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const searchResults = await searchService.search(query, filters);
      setResults(searchResults);
      
      // Save to recent searches
      await searchService.addRecentSearch(query);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    if (q) {
      performSearch(q);
    }
  }, [q, performSearch]);

  const handleBack = () => router.back();

  const handleSearch = () => {
    if (searchQuery.trim()) {
      performSearch(searchQuery);
    }
  };

  const handleTabPress = (tabId: string) => {
    setActiveTab(tabId as CategoryTab);
  };

  const handleFilterPress = () => setShowFilters(true);

  const handleApplyFilters = (newFilters: SearchFilters) => {
    setFilters(newFilters);
    performSearch(searchQuery);
  };

  const handleResultPress = (result: SearchResult) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const routes: Record<string, string> = {
      destination: `/destination/${result.id}`,
      hotel: `/hotel/${result.id}`,
      experience: `/experience/${result.id}`,
      place: `/place/${result.id}`,
    };
    const route = routes[result.type];
    if (route) router.push(route as any);
  };

  const filteredResults = useMemo((): SearchResult[] => {
    const resultMap: Record<CategoryTab, SearchResult[]> = {
      all: [...results.destinations, ...results.hotels, ...results.experiences, ...results.places],
      destinations: results.destinations,
      hotels: results.hotels,
      experiences: results.experiences,
      places: results.places,
    };
    return resultMap[activeTab] || [];
  }, [activeTab, results]);

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      {/* Header */}
      <SearchHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchSubmit={handleSearch}
        onBackPress={handleBack}
        onFilterPress={handleFilterPress}
        autoFocus={!q}
        paddingTop={insets.top}
      />

      {/* Category Tabs */}
      <CategoryTabs
        tabs={CATEGORY_TABS}
        activeTab={activeTab}
        onTabPress={handleTabPress}
      />

      {/* Results Count */}
      <View style={styles.resultsHeader}>
        <Text style={[styles.resultsCount, dynamicStyles.resultsCount]}>
          {isLoading ? 'Searching...' : `${filteredResults.length} results found`}
        </Text>
      </View>

      {/* Results */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, dynamicStyles.loadingText]}>Searching...</Text>
        </View>
      ) : filteredResults.length === 0 ? (
        <EmptyState />
      ) : (
        <ScrollView
          style={styles.resultsScroll}
          contentContainerStyle={[
            styles.resultsContent,
            { paddingBottom: insets.bottom + spacing.xl },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {filteredResults.map((result) => (
            <SearchResultCard
              key={result.id}
              result={result}
              onPress={() => handleResultPress(result)}
              onFavoritePress={() => {}}
            />
          ))}
        </ScrollView>
      )}

      {/* Filter Bottom Sheet */}
      <FilterBottomSheet
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        onApplyFilters={handleApplyFilters}
      />

      </View>
  );
}
