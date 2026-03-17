/**
 * EXPERIENCE RESULTS SCREEN
 *
 * Browse and filter available experiences with working filter chips & sort dropdown.
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  ImageBackground,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  CloseCircle,
  Setting4,
  ArrowDown2,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, typography, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { useExperienceStore } from '../../../stores/useExperienceStore';
import { Experience } from '../../../types/experience.types';

// Import sheets
import ExperienceDetailSheet from '../sheets/ExperienceDetailSheet';

// Import shared
import { ExperienceCard, ExperienceCardData } from '../../../shared/components';

interface ExperienceResultsScreenProps {
  onSelectExperience: (experience: Experience) => void;
  onBack: () => void;
  onClose: () => void;
}

const SORT_OPTIONS = [
  { id: 'recommended', label: 'Recommended' },
  { id: 'price_low', label: 'Price: Low to High' },
  { id: 'price_high', label: 'Price: High to Low' },
  { id: 'rating', label: 'Highest Rated' },
  { id: 'reviews', label: 'Most Reviewed' },
];

const FILTER_CHIPS = [
  { id: 'tours', label: 'Tours' },
  { id: 'attractions', label: 'Attractions' },
  { id: 'food_drink', label: 'Food & Drink' },
  { id: 'adventure', label: 'Adventure' },
  { id: 'culture_history', label: 'Culture' },
  { id: 'free_cancel', label: 'Free Cancellation' },
  { id: 'instant', label: 'Instant Confirm' },
  { id: 'best_seller', label: 'Best Seller' },
];

// Safe helpers for data that may be numbers or objects
function safeRating(exp: any): number {
  if (typeof exp.rating === 'number') return exp.rating;
  if (exp.rating?.score) return exp.rating.score;
  return 0;
}
function safeReviewCount(exp: any): number {
  if (typeof exp.reviewCount === 'number') return exp.reviewCount;
  if (exp.rating?.reviewCount) return exp.rating.reviewCount;
  return 0;
}
function safePrice(exp: any): number {
  if (typeof exp.price === 'number') return exp.price;
  if (exp.price?.amount) return exp.price.amount;
  return 0;
}
function safeDuration(exp: any): number {
  if (typeof exp.duration === 'number') return exp.duration;
  if (exp.duration?.value) {
    return exp.duration.unit === 'hours' ? exp.duration.value * 60 : exp.duration.value;
  }
  return 0;
}
function safeCancellation(exp: any): string {
  return exp.cancellationPolicy || 'non_refundable';
}

export default function ExperienceResultsScreen({
  onSelectExperience,
  onBack,
  onClose,
}: ExperienceResultsScreenProps) {
  const insets = useSafeAreaInsets();
  const { colors: tc } = useTheme();
  const { searchParams, results } = useExperienceStore();
  const [selectedExperience, setSelectedExperience] = useState<Experience | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>('recommended');
  const [showSortMenu, setShowSortMenu] = useState(false);

  // ─── Filter + Sort logic ───
  const filteredResults = useMemo(() => {
    let filtered = [...results] as any[];

    // Category filters
    const categoryFilters = activeFilters.filter(f =>
      ['tours', 'attractions', 'food_drink', 'adventure', 'culture_history'].includes(f)
    );
    if (categoryFilters.length > 0) {
      filtered = filtered.filter(exp => categoryFilters.includes(exp.category));
    }

    // Feature filters
    if (activeFilters.includes('free_cancel')) {
      filtered = filtered.filter(exp => {
        const policy = safeCancellation(exp);
        return policy === 'free_24h' || policy === 'free_48h' || policy === 'free_7d';
      });
    }
    if (activeFilters.includes('instant')) {
      filtered = filtered.filter(exp => exp.instantConfirmation);
    }
    if (activeFilters.includes('best_seller')) {
      filtered = filtered.filter(exp => exp.bestSeller);
    }

    // Sort
    switch (sortBy) {
      case 'price_low':
        filtered.sort((a, b) => safePrice(a) - safePrice(b));
        break;
      case 'price_high':
        filtered.sort((a, b) => safePrice(b) - safePrice(a));
        break;
      case 'rating':
        filtered.sort((a, b) => safeRating(b) - safeRating(a));
        break;
      case 'reviews':
        filtered.sort((a, b) => safeReviewCount(b) - safeReviewCount(a));
        break;
      default: // recommended — best sellers first, then by rating
        filtered.sort((a, b) => {
          if (a.bestSeller && !b.bestSeller) return -1;
          if (!a.bestSeller && b.bestSeller) return 1;
          return safeRating(b) - safeRating(a);
        });
    }

    return filtered;
  }, [results, activeFilters, sortBy]);

  const toggleFilter = (filterId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveFilters(prev =>
      prev.includes(filterId)
        ? prev.filter(f => f !== filterId)
        : [...prev, filterId]
    );
  };

  const handleSort = (sortId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSortBy(sortId);
    setShowSortMenu(false);
  };

  const toggleFavorite = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(id)) {
        newFavorites.delete(id);
      } else {
        newFavorites.add(id);
      }
      return newFavorites;
    });
  };

  const handleExperienceSelect = (experience: Experience) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedExperience(experience);
  };

  const handleCheckAvailability = (experience: Experience) => {
    setSelectedExperience(null);
    onSelectExperience(experience);
  };

  const currentSortLabel = SORT_OPTIONS.find(s => s.id === sortBy)?.label || 'Recommended';

  // Use the shared ExperienceCard component
  const renderExperienceCard = ({ item, index }: { item: any; index: number }) => {
    const cardData: ExperienceCardData = {
      id: item.id,
      title: item.title,
      shortDescription: item.shortDescription || item.description || '',
      images: Array.isArray(item.images) ? item.images : [],
      category: typeof item.category === 'string'
        ? item.category.charAt(0).toUpperCase() + item.category.slice(1).replace(/_/g, ' ')
        : 'Experience',
      duration: safeDuration(item),
      price: safePrice(item),
      rating: safeRating(item),
      reviewCount: safeReviewCount(item),
      bestSeller: item.bestSeller || false,
      featured: item.featured || false,
      instantConfirmation: item.instantConfirmation || false,
    };

    return (
      <ExperienceCard
        experience={cardData}
        index={index}
        isFavorite={favorites.has(item.id)}
        onPress={() => handleExperienceSelect(item)}
        onFavorite={() => toggleFavorite(item.id)}
      />
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: tc.background }]}>
      <StatusBar barStyle="light-content" />

      {/* Header with Background Image */}
      <ImageBackground
        source={require('../../../../../../assets/images/experiencebg.jpg')}
        style={[styles.header, { paddingTop: insets.top + spacing.sm }]}
        resizeMode="cover"
      >
        <View style={styles.headerOverlay} />
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>{searchParams.destination?.name || 'Experiences'}</Text>
            <Text style={styles.headerSubtitle}>{filteredResults.length} experiences found</Text>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <CloseCircle size={24} color="#FFFFFF" variant="Bold" />
          </TouchableOpacity>
        </View>
      </ImageBackground>

      {/* Filter Chips — horizontal scroll */}
      <View style={[styles.filterSection, { backgroundColor: tc.bgElevated, borderBottomColor: tc.borderSubtle }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {/* Sort button */}
          <TouchableOpacity
            style={[styles.sortButton, { backgroundColor: `${tc.primary}10` }]}
            onPress={() => setShowSortMenu(!showSortMenu)}
          >
            <Setting4 size={16} color={tc.primary} />
            <Text style={[styles.sortButtonText, { color: tc.primary }]}>{currentSortLabel}</Text>
            <ArrowDown2 size={14} color={tc.primary} />
          </TouchableOpacity>

          {FILTER_CHIPS.map((filter) => {
            const isActive = activeFilters.includes(filter.id);
            return (
              <TouchableOpacity
                key={filter.id}
                style={[
                  styles.filterChip,
                  { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle },
                  isActive && { backgroundColor: tc.primary, borderColor: tc.primary },
                ]}
                onPress={() => toggleFilter(filter.id)}
              >
                <Text style={[
                  styles.filterChipText,
                  { color: tc.textSecondary },
                  isActive && { color: '#FFFFFF' },
                ]}>
                  {filter.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Sort dropdown */}
        {showSortMenu && (
          <View style={[styles.sortMenu, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle }]}>
            {SORT_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.sortMenuItem,
                  { borderBottomColor: tc.borderSubtle },
                  sortBy === option.id && { backgroundColor: `${tc.primary}10` },
                ]}
                onPress={() => handleSort(option.id)}
              >
                <Text style={[
                  styles.sortMenuItemText,
                  { color: tc.textPrimary },
                  sortBy === option.id && { color: tc.primary, fontWeight: typography.fontWeight.semibold },
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Results List */}
      <FlatList
        data={filteredResults}
        keyExtractor={(item) => item.id}
        renderItem={renderExperienceCard}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + spacing.lg }]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyTitle, { color: tc.textPrimary }]}>No experiences match</Text>
            <Text style={[styles.emptySubtitle, { color: tc.textSecondary }]}>
              Try adjusting your filters to see more results.
            </Text>
            <TouchableOpacity
              style={[styles.clearButton, { backgroundColor: `${tc.primary}10` }]}
              onPress={() => { setActiveFilters([]); setSortBy('recommended'); }}
            >
              <Text style={[styles.clearButtonText, { color: tc.primary }]}>Clear All Filters</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Experience Detail Sheet */}
      <ExperienceDetailSheet
        visible={!!selectedExperience}
        onClose={() => setSelectedExperience(null)}
        onSelect={handleCheckAvailability}
        experience={selectedExperience}
      />

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingBottom: spacing.md,
  },
  headerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Filter section
  filterSection: {
    borderBottomWidth: 1,
    position: 'relative',
  },
  filterScroll: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    gap: 6,
  },
  sortButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  sortMenu: {
    position: 'absolute',
    top: '100%',
    left: spacing.lg,
    right: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    zIndex: 100,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  sortMenuItem: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  sortMenuItemText: {
    fontSize: typography.fontSize.sm,
  },

  // List
  listContent: {
    padding: spacing.lg,
    gap: spacing.md,
  },

  // Empty state
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  clearButton: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
  },
  clearButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
});
