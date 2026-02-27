/**
 * FILTER BOTTOM SHEET
 * 
 * Reusable filter component for search results.
 * Allows filtering by category, price, rating, and sorting.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
  CloseCircle,
  Location,
  Building,
  Airplane,
  Map1,
  TicketDiscount,
  Star1,
  ArrowDown,
  ArrowUp,
  TickCircle,
} from 'iconsax-react-native';
import { colors, spacing, typography, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { SearchFilters, DEFAULT_FILTERS } from '@/services/search.service';

interface FilterBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  filters: SearchFilters;
  onApplyFilters: (filters: SearchFilters) => void;
}

const CATEGORIES = [
  { id: 'all', label: 'All', icon: Star1 },
  { id: 'destinations', label: 'Destinations', icon: Location },
  { id: 'hotels', label: 'Hotels', icon: Building },
  { id: 'flights', label: 'Flights', icon: Airplane },
  { id: 'experiences', label: 'Experiences', icon: Map1 },
  { id: 'deals', label: 'Deals', icon: TicketDiscount },
];

const PRICE_RANGES = [
  { id: 'all', label: 'Any Price' },
  { id: 'budget', label: 'Budget', subtitle: 'Under $100' },
  { id: 'mid', label: 'Mid-range', subtitle: '$100 - $300' },
  { id: 'luxury', label: 'Luxury', subtitle: '$300+' },
];

const RATINGS = [
  { id: null, label: 'Any Rating' },
  { id: 3, label: '3+ Stars' },
  { id: 4, label: '4+ Stars' },
  { id: 4.5, label: '4.5+ Stars' },
];

const SORT_OPTIONS = [
  { id: 'relevance', label: 'Most Relevant', icon: Star1 },
  { id: 'price_low', label: 'Price: Low to High', icon: ArrowUp },
  { id: 'price_high', label: 'Price: High to Low', icon: ArrowDown },
  { id: 'rating', label: 'Highest Rated', icon: Star1 },
  { id: 'popularity', label: 'Most Popular', icon: TickCircle },
];

export default function FilterBottomSheet({
  visible,
  onClose,
  filters,
  onApplyFilters,
}: FilterBottomSheetProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [localFilters, setLocalFilters] = useState<SearchFilters>(filters);

  const dynamicStyles = useMemo(() => ({
    sheet: { backgroundColor: colors.white },
    handle: { backgroundColor: colors.gray200 },
    title: { color: colors.textPrimary },
    resetText: { color: colors.primary },
    sectionTitle: { color: colors.textPrimary },
    categoryChip: { backgroundColor: colors.gray100 },
    categoryChipSelected: { backgroundColor: colors.primary },
    categoryChipText: { color: colors.gray600 },
    categoryChipTextSelected: { color: colors.white },
    optionRow: { backgroundColor: colors.gray50 },
    optionRowSelected: { backgroundColor: colors.primary + '10', borderColor: colors.primary + '30' },
    optionText: { color: colors.textPrimary },
    optionTextSelected: { color: colors.primary },
    optionSubtext: { color: colors.textSecondary },
    ratingChip: { backgroundColor: colors.gray100 },
    ratingChipSelected: { backgroundColor: colors.primary },
    ratingChipText: { color: colors.gray600 },
    ratingChipTextSelected: { color: colors.white },
    footer: { borderTopColor: colors.gray100 },
    applyButton: { backgroundColor: colors.primary },
    applyButtonText: { color: colors.white },
  }), [colors]);

  useEffect(() => {
    if (visible) {
      setLocalFilters(filters);
    }
  }, [visible, filters]);

  const handleApply = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onApplyFilters(localFilters);
    onClose();
  };

  const handleReset = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLocalFilters(DEFAULT_FILTERS);
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  const updateFilter = <K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLocalFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <Pressable style={styles.overlay} onPress={handleClose}>
        <Pressable style={[styles.sheet, dynamicStyles.sheet, { paddingBottom: insets.bottom + spacing.md }]}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleReset} activeOpacity={0.7}>
              <Text style={[styles.resetText, dynamicStyles.resetText]}>Reset</Text>
            </TouchableOpacity>
            <Text style={[styles.title, dynamicStyles.title]}>Filters</Text>
            <TouchableOpacity onPress={handleClose} activeOpacity={0.7}>
              <CloseCircle size={24} color={colors.gray400} variant="Bold" />
            </TouchableOpacity>
          </View>

          {/* Handle */}
          <View style={styles.handleContainer}>
            <View style={[styles.handle, dynamicStyles.handle]} />
          </View>

          <ScrollView 
            style={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* Category Filter */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Category</Text>
              <View style={styles.categoryGrid}>
                {CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const isSelected = localFilters.category === cat.id;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        styles.categoryChip,
                        isSelected ? dynamicStyles.categoryChipSelected : dynamicStyles.categoryChip,
                      ]}
                      onPress={() => updateFilter('category', cat.id as SearchFilters['category'])}
                      activeOpacity={0.7}
                    >
                      <Icon 
                        size={18} 
                        color={isSelected ? colors.white : colors.gray600} 
                        variant="Bold" 
                      />
                      <Text style={[
                        styles.categoryChipText,
                        isSelected ? dynamicStyles.categoryChipTextSelected : dynamicStyles.categoryChipText,
                      ]}>
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Price Range Filter */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Price Range</Text>
              <View style={styles.optionsList}>
                {PRICE_RANGES.map((price) => {
                  const isSelected = localFilters.priceRange === price.id;
                  return (
                    <TouchableOpacity
                      key={price.id}
                      style={[
                        styles.optionRow,
                        isSelected ? dynamicStyles.optionRowSelected : dynamicStyles.optionRow,
                      ]}
                      onPress={() => updateFilter('priceRange', price.id as SearchFilters['priceRange'])}
                      activeOpacity={0.7}
                    >
                      <View>
                        <Text style={[
                          styles.optionText,
                          isSelected ? dynamicStyles.optionTextSelected : dynamicStyles.optionText,
                        ]}>
                          {price.label}
                        </Text>
                        {price.subtitle && (
                          <Text style={[styles.optionSubtext, dynamicStyles.optionSubtext]}>{price.subtitle}</Text>
                        )}
                      </View>
                      {isSelected && (
                        <TickCircle size={20} color={colors.primary} variant="Bold" />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Rating Filter */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Minimum Rating</Text>
              <View style={styles.ratingRow}>
                {RATINGS.map((rating) => {
                  const isSelected = localFilters.rating === rating.id;
                  return (
                    <TouchableOpacity
                      key={rating.id ?? 'any'}
                      style={[
                        styles.ratingChip,
                        isSelected ? dynamicStyles.ratingChipSelected : dynamicStyles.ratingChip,
                      ]}
                      onPress={() => updateFilter('rating', rating.id)}
                      activeOpacity={0.7}
                    >
                      {rating.id && (
                        <Star1 
                          size={14} 
                          color={isSelected ? colors.white : colors.warning} 
                          variant="Bold" 
                        />
                      )}
                      <Text style={[
                        styles.ratingChipText,
                        isSelected ? dynamicStyles.ratingChipTextSelected : dynamicStyles.ratingChipText,
                      ]}>
                        {rating.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Sort By */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Sort By</Text>
              <View style={styles.optionsList}>
                {SORT_OPTIONS.map((sort) => {
                  const Icon = sort.icon;
                  const isSelected = localFilters.sortBy === sort.id;
                  return (
                    <TouchableOpacity
                      key={sort.id}
                      style={[
                        styles.optionRow,
                        isSelected ? dynamicStyles.optionRowSelected : dynamicStyles.optionRow,
                      ]}
                      onPress={() => updateFilter('sortBy', sort.id as SearchFilters['sortBy'])}
                      activeOpacity={0.7}
                    >
                      <View style={styles.sortOption}>
                        <Icon 
                          size={18} 
                          color={isSelected ? colors.primary : colors.gray500} 
                          variant={isSelected ? 'Bold' : 'Outline'}
                        />
                        <Text style={[
                          styles.optionText,
                          isSelected ? dynamicStyles.optionTextSelected : dynamicStyles.optionText,
                        ]}>
                          {sort.label}
                        </Text>
                      </View>
                      {isSelected && (
                        <TickCircle size={20} color={colors.primary} variant="Bold" />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </ScrollView>

          {/* Apply Button */}
          <View style={[styles.footer, dynamicStyles.footer]}>
            <TouchableOpacity
              style={[styles.applyButton, dynamicStyles.applyButton]}
              onPress={handleApply}
              activeOpacity={0.8}
            >
              <Text style={[styles.applyButtonText, dynamicStyles.applyButtonText]}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '85%',
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.gray200,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  resetText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: typography.fontWeight.medium,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.gray100,
    gap: spacing.xs,
  },
  categoryChipSelected: {
    backgroundColor: colors.primary,
  },
  categoryChipText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray600,
    fontWeight: typography.fontWeight.medium,
  },
  categoryChipTextSelected: {
    color: colors.white,
  },
  optionsList: {
    gap: spacing.xs,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.gray50,
  },
  optionRowSelected: {
    backgroundColor: colors.primary + '10',
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  optionText: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.medium,
  },
  optionTextSelected: {
    color: colors.primary,
  },
  optionSubtext: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  ratingRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  ratingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.gray100,
    gap: spacing.xs,
  },
  ratingChipSelected: {
    backgroundColor: colors.primary,
  },
  ratingChipText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray600,
    fontWeight: typography.fontWeight.medium,
  },
  ratingChipTextSelected: {
    color: colors.white,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
  },
  applyButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
});
