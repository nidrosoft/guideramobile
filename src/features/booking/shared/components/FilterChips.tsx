/**
 * SHARED FILTER CHIPS COMPONENT
 * 
 * Reusable filter chips with icons and vertical dropdown functionality.
 * Matches the behavior of standalone booking flows.
 * 
 * Used in:
 * - PackageBuildScreen (all categories)
 * - Can be used in standalone flows for consistency
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import {
  Sort,
  Filter,
  DollarCircle,
  Airplane,
  Clock,
  Star1,
  Building,
  Car,
  Category,
  Timer1,
  ArrowDown2,
  TickCircle,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, typography, borderRadius } from '@/styles';

// Filter option type
export interface FilterOption {
  id: string;
  label: string;
  icon: 'sort' | 'filter' | 'price' | 'stops' | 'time' | 'stars' | 'amenities' | 'category' | 'duration' | 'automatic' | 'suv' | 'compact' | 'unlimited';
  values?: string[];
}

// Preset filter configurations for each category
export const FLIGHT_FILTERS: FilterOption[] = [
  { id: 'sort', label: 'Sort', icon: 'sort', values: ['Price', 'Duration', 'Departure', 'Arrival'] },
  { id: 'stops', label: 'Stops', icon: 'stops', values: ['Direct', '1 Stop', '2+ Stops'] },
  { id: 'price', label: 'Price', icon: 'price', values: ['Under $200', '$200-$400', '$400+'] },
  { id: 'time', label: 'Time', icon: 'time', values: ['Morning', 'Afternoon', 'Evening', 'Night'] },
];

export const HOTEL_FILTERS: FilterOption[] = [
  { id: 'sort', label: 'Sort', icon: 'sort', values: ['Recommended', 'Price: Low', 'Price: High', 'Rating'] },
  { id: 'price', label: 'Price', icon: 'price', values: ['Under $100', '$100-$200', '$200-$300', '$300+'] },
  { id: 'stars', label: 'Stars', icon: 'stars', values: ['5 Stars', '4+ Stars', '3+ Stars', 'Any'] },
  { id: 'amenities', label: 'Amenities', icon: 'amenities', values: ['Free WiFi', 'Pool', 'Spa', 'Breakfast'] },
];

export const CAR_FILTERS: FilterOption[] = [
  { id: 'sort', label: 'Sort', icon: 'sort', values: ['Recommended', 'Price: Low', 'Price: High'] },
  { id: 'automatic', label: 'Automatic', icon: 'automatic' },
  { id: 'suv', label: 'SUV', icon: 'suv' },
  { id: 'compact', label: 'Compact', icon: 'compact' },
  { id: 'unlimited', label: 'Unlimited km', icon: 'unlimited' },
];

export const EXPERIENCE_FILTERS: FilterOption[] = [
  { id: 'sort', label: 'Sort', icon: 'sort', values: ['Recommended', 'Price: Low', 'Price: High', 'Rating'] },
  { id: 'category', label: 'Category', icon: 'category', values: ['Tours', 'Food & Drink', 'Adventure', 'Culture'] },
  { id: 'duration', label: 'Duration', icon: 'duration', values: ['Under 2h', '2-4h', '4-8h', 'Full Day'] },
  { id: 'price', label: 'Price', icon: 'price', values: ['Under $50', '$50-$100', '$100-$200', '$200+'] },
];

interface FilterChipsProps {
  filters: FilterOption[];
  activeFilter: string | null;
  selectedFilters: Record<string, string>;
  toggleFilters?: string[]; // For toggle-style filters (no dropdown)
  onFilterPress: (filterId: string) => void;
  onFilterSelect?: (filterId: string, value: string) => void;
  onToggleFilter?: (filterId: string) => void;
}

// Get icon for filter type
const getFilterIcon = (iconType: string, isActive: boolean) => {
  const iconColor = isActive ? colors.primary : colors.textPrimary;
  const size = 16;
  
  switch (iconType) {
    case 'sort':
      return <Sort size={size} color={iconColor} />;
    case 'filter':
      return <Filter size={size} color={iconColor} />;
    case 'price':
      return <DollarCircle size={size} color={iconColor} />;
    case 'stops':
      return <Airplane size={size} color={iconColor} />;
    case 'time':
      return <Clock size={size} color={iconColor} />;
    case 'stars':
      return <Star1 size={size} color={iconColor} variant={isActive ? 'Bold' : 'Linear'} />;
    case 'amenities':
      return <Building size={size} color={iconColor} />;
    case 'category':
      return <Category size={size} color={iconColor} />;
    case 'duration':
      return <Timer1 size={size} color={iconColor} />;
    case 'automatic':
    case 'suv':
    case 'compact':
      return <Car size={size} color={iconColor} />;
    case 'unlimited':
      return <TickCircle size={size} color={iconColor} variant={isActive ? 'Bold' : 'Linear'} />;
    default:
      return <Filter size={size} color={iconColor} />;
  }
};

export default function FilterChips({
  filters,
  activeFilter,
  selectedFilters,
  toggleFilters = [],
  onFilterPress,
  onFilterSelect,
  onToggleFilter,
}: FilterChipsProps) {
  const handleChipPress = (filter: FilterOption) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // If it's a toggle filter (no values), toggle it
    if (!filter.values || filter.values.length === 0) {
      onToggleFilter?.(filter.id);
    } else {
      onFilterPress(filter.id);
    }
  };

  const handleOptionSelect = (filterId: string, value: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onFilterSelect?.(filterId, value);
  };

  const activeFilterOptions = filters.find(f => f.id === activeFilter);

  return (
    <View style={styles.container}>
      {/* Filter Chips Row */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {filters.map((filter) => {
          const isToggle = !filter.values || filter.values.length === 0;
          const isToggleActive = toggleFilters.includes(filter.id);
          const hasSelectedValue = !!selectedFilters[filter.id];
          const isDropdownOpen = activeFilter === filter.id;
          const isActive = isToggleActive || hasSelectedValue || isDropdownOpen;

          return (
            <TouchableOpacity
              key={filter.id}
              style={[
                styles.chip,
                isActive && styles.chipActive,
              ]}
              onPress={() => handleChipPress(filter)}
              activeOpacity={0.7}
            >
              {getFilterIcon(filter.icon, isActive)}
              <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                {selectedFilters[filter.id] || filter.label}
              </Text>
              {!isToggle && (
                <ArrowDown2 
                  size={14} 
                  color={isActive ? colors.primary : colors.textSecondary}
                  style={isDropdownOpen ? styles.arrowUp : undefined}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Vertical Dropdown Menu - matches standalone flow behavior */}
      {activeFilter && activeFilterOptions?.values && (
        <Animated.View 
          entering={FadeIn.duration(150)}
          exiting={FadeOut.duration(100)}
          style={styles.dropdown}
        >
          {activeFilterOptions.values.map((value, index) => {
            const isSelected = selectedFilters[activeFilter] === value;
            const isLast = index === activeFilterOptions.values!.length - 1;
            return (
              <TouchableOpacity
                key={value}
                style={[
                  styles.dropdownOption, 
                  isSelected && styles.dropdownOptionSelected,
                  isLast && styles.dropdownOptionLast,
                ]}
                onPress={() => handleOptionSelect(activeFilter, value)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.dropdownOptionText, 
                  isSelected && styles.dropdownOptionTextSelected
                ]}>
                  {value}
                </Text>
                {isSelected && (
                  <TickCircle size={16} color={colors.primary} variant="Bold" />
                )}
              </TouchableOpacity>
            );
          })}
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
    zIndex: 100, // Ensure dropdown appears above other content
  },
  scrollView: {
    marginHorizontal: -spacing.lg,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray200,
    gap: 6,
  },
  chipActive: {
    backgroundColor: colors.primary + '10',
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
  },
  chipTextActive: {
    color: colors.primary,
    fontWeight: typography.fontWeight.medium,
  },
  arrowUp: {
    transform: [{ rotate: '180deg' }],
  },
  // Vertical dropdown menu - matches standalone flow behavior
  dropdown: {
    position: 'absolute',
    top: 48, // Below the filter chips row
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: '#E6E9EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 1000,
    maxHeight: 250,
    overflow: 'hidden',
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  dropdownOptionSelected: {
    backgroundColor: colors.primary + '08',
  },
  dropdownOptionLast: {
    borderBottomWidth: 0,
  },
  dropdownOptionText: {
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
  dropdownOptionTextSelected: {
    color: colors.primary,
    fontWeight: typography.fontWeight.medium,
  },
});
