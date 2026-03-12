/**
 * FLIGHT SELECTION SHEET
 *
 * Full-screen modal for selecting flights in the package flow.
 * Matches FlightResultsScreen styling for visual consistency:
 * - Date chips with primary color selected state
 * - Pill-shaped filter chips with dropdown
 * - Theme-aware colors throughout
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
  Clock,
  DollarCircle,
  ArrowDown2,
  TickCircle,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { spacing, typography, borderRadius as br } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
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

const FILTER_OPTIONS = [
  { id: 'sort', label: 'Sort', icon: 'sort', values: ['Price', 'Duration', 'Departure', 'Arrival'] },
  { id: 'stops', label: 'Stops', icon: 'stops', values: ['Direct', '1 Stop', '2+ Stops'] },
  { id: 'price', label: 'Price', icon: 'price', values: ['Under $200', '$200-$400', '$400-$600', '$600+'] },
  { id: 'time', label: 'Time', icon: 'time', values: ['Morning', 'Afternoon', 'Evening', 'Night'] },
];

const generateDateRange = (startDate: Date | null, cheapestPrice?: number) => {
  const base = startDate || new Date();
  const safe = base instanceof Date && !isNaN(base.getTime()) ? base : new Date();
  const dates = [];
  for (let i = -2; i <= 4; i++) {
    const date = new Date(safe);
    date.setDate(date.getDate() + i);
    dates.push({ date, price: i === 0 ? (cheapestPrice || null) : null });
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
  const { colors: tc } = useTheme();
  const [selectedDateIndex, setSelectedDateIndex] = useState(2);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string>>({});

  const cheapestPrice = useMemo(() => {
    if (flights.length === 0) return null;
    const prices = flights.map(f => f.price).filter(p => p > 0);
    return prices.length > 0 ? Math.min(...prices) : null;
  }, [flights]);

  const datePrices = useMemo(
    () => generateDateRange(tripSetup.departureDate, cheapestPrice ?? undefined),
    [tripSetup.departureDate, cheapestPrice],
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

  const getFilterIcon = (iconType: string, isHighlighted: boolean) => {
    const c = isHighlighted ? tc.primary : tc.textPrimary;
    switch (iconType) {
      case 'sort': return <Sort size={16} color={c} />;
      case 'price': return <DollarCircle size={16} color={c} />;
      case 'stops': return <Airplane size={16} color={c} />;
      case 'time': return <Clock size={16} color={c} />;
      default: return null;
    }
  };

  const formatRoute = () => `${tripSetup.origin?.code || 'DEP'} → ${tripSetup.destination?.code || 'ARR'}`;

  const activeFilterOptions = FILTER_OPTIONS.find(f => f.id === activeFilter);

  const renderDateItem = ({ item, index }: { item: typeof datePrices[0]; index: number }) => {
    const isSelected = index === selectedDateIndex;
    const dayName = item.date.toLocaleDateString('en-US', { weekday: 'short' });
    const dayNum = item.date.getDate();
    const month = item.date.toLocaleDateString('en-US', { month: 'short' });

    return (
      <TouchableOpacity
        style={[
          styles.dateItem,
          { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle },
          isSelected && { backgroundColor: `${tc.primary}10`, borderColor: tc.primary },
        ]}
        onPress={() => handleDateSelect(index)}
        activeOpacity={0.7}
      >
        <Text style={[styles.dateDay, { color: tc.textPrimary }]}>
          {dayName}, {dayNum} {month}
        </Text>
        <Text style={[styles.datePrice, { color: isSelected ? tc.primary : tc.textTertiary }]}>
          {item.price != null ? `$${item.price.toLocaleString('en-US')}` : '–'}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <StatusBar barStyle="dark-content" />
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: tc.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: tc.borderSubtle }]}>
          <TouchableOpacity style={[styles.backButton, { backgroundColor: tc.bgCard }]} onPress={onClose}>
            <ArrowLeft size={24} color={tc.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { color: tc.textPrimary }]}>{title}</Text>
            <Text style={[styles.headerSubtitle, { color: tc.textSecondary }]}>{formatRoute()}</Text>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <CloseCircle size={24} color={tc.textSecondary} variant="Bold" />
          </TouchableOpacity>
        </View>

        {/* Date Scroll */}
        <Animated.View entering={FadeIn.duration(300)}>
          <FlatList
            horizontal
            data={datePrices}
            renderItem={renderDateItem}
            keyExtractor={(_, i) => i.toString()}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dateScroll}
          />
        </Animated.View>

        {/* Filter Bar */}
        <View style={styles.filtersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersRow}>
            {FILTER_OPTIONS.map((filter) => {
              const isActive = activeFilter === filter.id;
              const hasSelection = !!selectedFilters[filter.id];
              return (
                <TouchableOpacity
                  key={filter.id}
                  style={[
                    styles.filterButton,
                    { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle },
                    isActive && { borderColor: tc.primary, backgroundColor: `${tc.primary}08` },
                    hasSelection && { borderColor: tc.primary, backgroundColor: `${tc.primary}10` },
                  ]}
                  onPress={() => handleFilterPress(filter.id)}
                >
                  {getFilterIcon(filter.icon, hasSelection)}
                  <Text style={[
                    styles.filterText,
                    { color: tc.textPrimary },
                    hasSelection && { color: tc.primary },
                  ]}>
                    {selectedFilters[filter.id] || filter.label}
                  </Text>
                  <ArrowDown2
                    size={14}
                    color={hasSelection ? tc.primary : tc.textSecondary}
                    style={{ transform: [{ rotate: isActive ? '180deg' : '0deg' }] }}
                  />
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {activeFilter && activeFilterOptions && (
            <Animated.View
              entering={FadeInDown.duration(200)}
              style={[styles.filterDropdown, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle }]}
            >
              <ScrollView>
                {activeFilterOptions.values.map((value) => {
                  const isSel = selectedFilters[activeFilter] === value;
                  return (
                    <TouchableOpacity
                      key={value}
                      style={[styles.filterOption, { borderBottomColor: tc.borderSubtle }, isSel && { backgroundColor: `${tc.primary}08` }]}
                      onPress={() => handleFilterSelect(activeFilter, value)}
                    >
                      <Text style={[styles.filterOptionText, { color: tc.textPrimary }, isSel && { color: tc.primary }]}>
                        {value}
                      </Text>
                      {isSel && <TickCircle size={16} color={tc.primary} variant="Bold" />}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </Animated.View>
          )}
        </View>

        {/* Results Count */}
        <View style={styles.resultsHeader}>
          <Text style={[styles.resultsCount, { color: tc.textSecondary }]}>{flights.length} flights found</Text>
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
          contentContainerStyle={[styles.flightList, { paddingBottom: insets.bottom + spacing.xl }]}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold },
  headerSubtitle: { fontSize: typography.fontSize.sm, marginTop: 2 },
  closeButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },

  dateScroll: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  dateItem: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginHorizontal: spacing.xs,
    borderRadius: br.lg,
    alignItems: 'center',
    minWidth: 110,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  dateDay: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium, marginBottom: 4 },
  datePrice: { fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.bold },

  filtersContainer: { zIndex: 100 },
  filtersRow: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: br.full,
    borderWidth: 1,
    marginRight: spacing.sm,
    minHeight: 40,
    gap: 6,
  },
  filterText: { fontSize: typography.fontSize.sm, marginRight: spacing.xs },
  filterDropdown: {
    position: 'absolute',
    top: 52,
    left: spacing.md,
    right: spacing.md,
    borderRadius: br.lg,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 1000,
    maxHeight: 250,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  filterOptionText: { fontSize: typography.fontSize.base },

  resultsHeader: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  resultsCount: { fontSize: typography.fontSize.sm },
  flightList: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
});
