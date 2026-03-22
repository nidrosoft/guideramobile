/**
 * SECTION VIEW ALL
 * 
 * Universal "View All" screen used by all homepage sections.
 * Accepts a section slug to fetch the right data, and optional filter config.
 * Theme-aware — works in both light and dark mode.
 */

import { View, Text, StyleSheet, ScrollView, FlatList, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { ArrowLeft2 } from 'iconsax-react-native';
import { typography, spacing, fontFamily } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { useSectionDestinations } from '@/hooks/useSectionDestinations';
import DestinationListCard from '@/components/common/DestinationListCard';
import { SkeletonDestinationListCard } from '@/components/common/SkeletonLoader';
import type { CuratedDestination } from '@/hooks/useSectionDestinations';

interface SectionViewAllProps {
  /** Section slug used to determine which data to fetch (e.g. 'destinations', 'budget-friendly') */
  sectionSlug: string;
  /** Screen header title */
  headerTitle: string;
  /** Optional subtitle shown below header */
  subtitle?: string;
  /** Whether to show continent filter tabs (default: true) */
  showFilters?: boolean;
}

export default function SectionViewAll({
  sectionSlug,
  headerTitle,
  subtitle,
  showFilters = true,
}: SectionViewAllProps) {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const PAGE_SIZE = 15;
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loadingMore, setLoadingMore] = useState(false);

  const { destinations, isLoading, error, filters } = useSectionDestinations(sectionSlug);

  const filteredDestinations = useMemo(() => {
    if (selectedFilter === 'all') return destinations;
    return destinations.filter(d => d.continent === selectedFilter);
  }, [destinations, selectedFilter]);

  const paginatedDestinations = useMemo(() => {
    return filteredDestinations.slice(0, visibleCount);
  }, [filteredDestinations, visibleCount]);

  const handleLoadMore = useCallback(() => {
    if (loadingMore || visibleCount >= filteredDestinations.length) return;
    setLoadingMore(true);
    setTimeout(() => {
      setVisibleCount(prev => Math.min(prev + PAGE_SIZE, filteredDestinations.length));
      setLoadingMore(false);
    }, 300);
  }, [loadingMore, visibleCount, filteredDestinations.length]);

  const handleBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  }, [router]);

  const handleFilterPress = useCallback((filterId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedFilter(filterId);
    setVisibleCount(PAGE_SIZE);
  }, []);

  const handleDestinationPress = useCallback((destination: CuratedDestination) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: '/destinations/[id]' as any,
      params: { id: destination.id },
    });
  }, [router]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleBack}
          style={[styles.backBtn, { backgroundColor: colors.bgCard }]}
          activeOpacity={0.7}
        >
          <ArrowLeft2 size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{headerTitle}</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Subtitle */}
      {subtitle ? (
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
      ) : null}

      {/* Filter Tabs */}
      {showFilters && filters.length > 2 ? (
        <View style={styles.tabsWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsContainer}
          >
            {filters.map(filter => {
              const isActive = selectedFilter === filter.id;
              return (
                <TouchableOpacity
                  key={filter.id}
                  style={[
                    styles.tab,
                    {
                      backgroundColor: isActive ? colors.primary : (isDark ? colors.bgCard : '#F1F5F9'),
                      borderColor: isActive ? colors.primary : colors.borderSubtle,
                    },
                  ]}
                  onPress={() => handleFilterPress(filter.id)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.tabText,
                      { color: isActive ? '#FFFFFF' : colors.textPrimary },
                    ]}
                  >
                    {filter.label}
                  </Text>
                  {filter.count != null && filter.count > 0 ? (
                    <View
                      style={[
                        styles.countBadge,
                        { backgroundColor: isActive ? 'rgba(255,255,255,0.3)' : colors.borderSubtle },
                      ]}
                    >
                      <Text style={[styles.countText, { color: isActive ? '#FFFFFF' : colors.textSecondary }]}>
                        {filter.count}
                      </Text>
                    </View>
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      ) : null}

      {/* Content */}
      {isLoading ? (
        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {[1, 2, 3, 4, 5, 6].map(i => (
            <SkeletonDestinationListCard key={i} />
          ))}
        </ScrollView>
      ) : error ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Something went wrong</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={paginatedDestinations}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <DestinationListCard
              destination={item}
              onPress={() => handleDestinationPress(item)}
            />
          )}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No destinations found</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                {selectedFilter === 'all' ? 'Check back soon for new content' : 'Try a different filter'}
              </Text>
            </View>
          }
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.loadingFooter}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: fontFamily.bold,
    fontSize: typography.fontSize.kpiValue,
  },
  subtitle: {
    fontFamily: fontFamily.regular,
    fontSize: typography.fontSize.bodyLg,
    paddingHorizontal: spacing.lg,
    marginBottom: 4,
  },

  // Tabs
  tabsWrapper: { height: 52, marginBottom: 4 },
  tabsContainer: {
    paddingHorizontal: spacing.lg,
    gap: 8,
    alignItems: 'center',
    height: 52,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 38,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
  },
  tabText: { fontFamily: fontFamily.semibold, fontSize: typography.fontSize.body },
  countBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
    minWidth: 22,
    alignItems: 'center',
  },
  countText: { fontFamily: fontFamily.medium, fontSize: typography.fontSize.caption },

  // Loading / Empty
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontFamily: fontFamily.regular, fontSize: typography.fontSize.bodyLg },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8, paddingBottom: 60 },
  emptyTitle: { fontFamily: fontFamily.semibold, fontSize: typography.fontSize.heading2 },
  emptySubtitle: { fontFamily: fontFamily.regular, fontSize: typography.fontSize.bodyLg },

  // List
  list: { flex: 1 },
  listContent: { paddingHorizontal: spacing.lg, paddingBottom: 40 },
  headerRight: { width: 40 },
  loadingFooter: { paddingVertical: 20, alignItems: 'center' as const },
});
