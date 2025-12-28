/**
 * FLIGHT SELECTION SHEET
 * 
 * Full-screen sheet for selecting flights in package flow.
 * Mirrors the FlightResultsScreen experience with:
 * - Date scroll with prices
 * - Filter options
 * - Full flight cards
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  ScrollView,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import {
  ArrowLeft,
  CloseCircle,
  Airplane,
  Sort,
  Filter,
  Clock,
  DollarCircle,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, typography, borderRadius } from '@/styles';
import { FlightCard, FlightCardData } from '../../../shared/components';
import { TripSetup } from '../../../stores/usePackageStore';

interface FlightSelectionSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (flight: FlightCardData) => void;
  tripSetup: TripSetup;
  flights: FlightCardData[];
  selectedId?: string;
  title?: string;
}

// Filter options
const FILTER_OPTIONS = [
  { id: 'sort', label: 'Sort', icon: 'sort', values: ['Price', 'Duration', 'Departure'] },
  { id: 'stops', label: 'Stops', icon: 'stops', values: ['Direct', '1 Stop', '2+ Stops'] },
  { id: 'price', label: 'Price', icon: 'price', values: ['Under $200', '$200-$400', '$400+'] },
  { id: 'time', label: 'Time', icon: 'time', values: ['Morning', 'Afternoon', 'Evening'] },
];

// Generate date prices for horizontal scroll
const generateDatePrices = (startDate: Date | null) => {
  const baseDate = startDate || new Date();
  const dates = [];
  for (let i = -2; i < 7; i++) {
    const date = new Date(baseDate);
    date.setDate(date.getDate() + i);
    dates.push({
      date,
      price: Math.floor(Math.random() * 200) + 150,
      isSelected: i === 0,
    });
  }
  return dates;
};

export default function FlightSelectionSheet({
  visible,
  onClose,
  onSelect,
  tripSetup,
  flights,
  selectedId,
  title = 'Select Flight',
}: FlightSelectionSheetProps) {
  const insets = useSafeAreaInsets();
  const [selectedDateIndex, setSelectedDateIndex] = useState(2);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string>>({});

  const datePrices = useMemo(() => 
    generateDatePrices(tripSetup.departureDate), 
    [tripSetup.departureDate]
  );

  const handleDateSelect = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedDateIndex(index);
  };

  const handleFilterPress = (filterId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveFilter(activeFilter === filterId ? null : filterId);
  };

  const handleFilterSelect = (filterId: string, value: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedFilters(prev => ({ ...prev, [filterId]: value }));
    setActiveFilter(null);
  };

  const handleFlightSelect = useCallback((flight: FlightCardData) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSelect(flight);
    onClose();
  }, [onSelect, onClose]);

  const getFilterIcon = (iconType: string, isSelected: boolean) => {
    const iconColor = isSelected ? colors.primary : colors.textPrimary;
    switch (iconType) {
      case 'sort': return <Sort size={16} color={iconColor} />;
      case 'price': return <DollarCircle size={16} color={iconColor} />;
      case 'stops': return <Airplane size={16} color={iconColor} />;
      case 'time': return <Clock size={16} color={iconColor} />;
      default: return <Filter size={16} color={iconColor} />;
    }
  };

  const formatRoute = () => {
    const origin = tripSetup.origin?.code || 'DEP';
    const dest = tripSetup.destination?.code || 'ARR';
    return `${origin} → ${dest}`;
  };

  const renderDateItem = ({ item, index }: { item: typeof datePrices[0]; index: number }) => {
    const isSelected = index === selectedDateIndex;
    const dayName = item.date.toLocaleDateString('en-US', { weekday: 'short' });
    const dayNum = item.date.getDate();
    const month = item.date.toLocaleDateString('en-US', { month: 'short' });

    return (
      <TouchableOpacity
        style={[styles.dateItem, isSelected && styles.dateItemSelected]}
        onPress={() => handleDateSelect(index)}
        activeOpacity={0.7}
      >
        <Text style={[styles.dateDay, isSelected && styles.dateDaySelected]}>
          {dayName}, {dayNum} {month}
        </Text>
        <Text style={[styles.datePrice, isSelected && styles.datePriceSelected]}>
          ${item.price}
        </Text>
      </TouchableOpacity>
    );
  };

  const activeFilterOptions = FILTER_OPTIONS.find(f => f.id === activeFilter);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <StatusBar barStyle="dark-content" />
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onClose}>
            <ArrowLeft size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>{title}</Text>
            <Text style={styles.headerSubtitle}>{formatRoute()}</Text>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <CloseCircle size={24} color={colors.gray400} variant="Bold" />
          </TouchableOpacity>
        </View>

        {/* Date Scroll */}
        <Animated.View entering={FadeIn.duration(300)}>
          <FlatList
            horizontal
            data={datePrices}
            renderItem={renderDateItem}
            keyExtractor={(_, index) => index.toString()}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dateScroll}
          />
        </Animated.View>

        {/* Filters */}
        <View style={styles.filtersContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersRow}
          >
            {FILTER_OPTIONS.map((filter) => {
              const isActive = activeFilter === filter.id;
              const isSelected = !!selectedFilters[filter.id];
              return (
                <TouchableOpacity
                  key={filter.id}
                  style={[
                    styles.filterButton,
                    isActive && styles.filterButtonActive,
                    isSelected && styles.filterButtonSelected,
                  ]}
                  onPress={() => handleFilterPress(filter.id)}
                >
                  {getFilterIcon(filter.icon, isActive || isSelected)}
                  <Text style={[
                    styles.filterText,
                    (isActive || isSelected) && styles.filterTextSelected,
                  ]}>
                    {selectedFilters[filter.id] || filter.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Filter Dropdown */}
          {activeFilter && activeFilterOptions && (
            <Animated.View entering={FadeInDown.duration(200)} style={styles.filterDropdown}>
              <ScrollView>
                {activeFilterOptions.values.map((value) => {
                  const isSelected = selectedFilters[activeFilter] === value;
                  return (
                    <TouchableOpacity
                      key={value}
                      style={[styles.filterOption, isSelected && styles.filterOptionSelected]}
                      onPress={() => handleFilterSelect(activeFilter, value)}
                    >
                      <Text style={[
                        styles.filterOptionText,
                        isSelected && styles.filterOptionTextSelected,
                      ]}>
                        {value}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </Animated.View>
          )}
        </View>

        {/* Results Count */}
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsCount}>{flights.length} flights found</Text>
        </View>

        {/* Flight List */}
        <FlatList
          data={flights}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <FlightCard
              flight={item}
              index={index}
              isSelected={item.id === selectedId}
              isRecommended={index === 0}
              isBestDeal={index === 1}
              onPress={() => handleFlightSelect(item)}
            />
          )}
          contentContainerStyle={[
            styles.flightList,
            { paddingBottom: insets.bottom + spacing.xl },
          ]}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray50,
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
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Date Scroll
  dateScroll: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  dateItem: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginHorizontal: spacing.xs,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.white,
    alignItems: 'center',
    minWidth: 110,
    borderWidth: 1,
    borderColor: colors.gray200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  dateItemSelected: {
    backgroundColor: `${colors.primary}10`,
    borderColor: colors.primary,
    borderWidth: 2,
  },
  dateDay: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  dateDaySelected: {
    color: colors.textPrimary,
  },
  datePrice: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: `${colors.primary}60`,
  },
  datePriceSelected: {
    color: colors.textPrimary,
  },
  // Filters
  filtersContainer: {
    zIndex: 100,
  },
  filtersRow: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray200,
    marginRight: spacing.sm,
    minHeight: 40,
    gap: 6,
  },
  filterButtonActive: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}08`,
  },
  filterButtonSelected: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}10`,
  },
  filterText: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
  },
  filterTextSelected: {
    color: colors.primary,
    fontWeight: typography.fontWeight.medium,
  },
  filterDropdown: {
    position: 'absolute',
    top: 52,
    left: spacing.md,
    right: spacing.md,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.gray200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 1000,
    maxHeight: 200,
  },
  filterOption: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  filterOptionSelected: {
    backgroundColor: `${colors.primary}08`,
  },
  filterOptionText: {
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
  filterOptionTextSelected: {
    color: colors.primary,
    fontWeight: typography.fontWeight.medium,
  },
  // Results
  resultsHeader: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  resultsCount: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  flightList: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
});
