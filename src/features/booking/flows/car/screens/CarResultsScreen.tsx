/**
 * CAR RESULTS SCREEN
 *
 * Displays available cars with filtering and sorting.
 * Theme-aware for dark/light mode.
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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  ArrowLeft,
  CloseCircle,
  Setting4,
  ArrowDown2,
  Location,
  Calendar,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { spacing, typography, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { useCarStore } from '../../../stores/useCarStore';
import { Car } from '../../../types/car.types';

import CarDetailSheet from '../sheets/CarDetailSheet';
import { CarCard, CarCardData } from '../../../shared/components';

interface CarResultsScreenProps {
  onSelectCar: (car: Car) => void;
  onBack: () => void;
  onClose: () => void;
}

const SORT_OPTIONS = [
  { id: 'recommended', label: 'Recommended' },
  { id: 'price', label: 'Price: Low to High' },
  { id: 'size', label: 'Vehicle Size' },
];

const FILTER_CHIPS = [
  { id: 'automatic', label: 'Automatic' },
  { id: 'suv', label: 'SUV' },
  { id: 'compact', label: 'Compact' },
  { id: 'economy', label: 'Economy' },
  { id: 'midsize', label: 'Midsize' },
  { id: 'premium', label: 'Premium' },
  { id: 'unlimited', label: 'Unlimited miles' },
  { id: 'ac', label: 'A/C' },
];

export default function CarResultsScreen({
  onSelectCar,
  onBack,
  onClose,
}: CarResultsScreenProps) {
  const insets = useSafeAreaInsets();
  const { colors: tc } = useTheme();
  const { searchParams, getFilteredResults, sortBy, setSortBy, getRentalDays } = useCarStore();

  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [selectedCarForDetail, setSelectedCarForDetail] = useState<Car | null>(null);

  const results = getFilteredResults();
  const rentalDays = getRentalDays();

  const filteredResults = useMemo(() => {
    let filtered = [...results];

    if (activeFilters.includes('automatic')) {
      filtered = filtered.filter(car => car.specs.transmission === 'automatic');
    }
    if (activeFilters.includes('suv')) {
      filtered = filtered.filter(car => car.category.includes('suv'));
    }
    if (activeFilters.includes('compact')) {
      filtered = filtered.filter(car => car.category === 'compact');
    }
    if (activeFilters.includes('economy')) {
      filtered = filtered.filter(car => car.category === 'economy');
    }
    if (activeFilters.includes('midsize')) {
      filtered = filtered.filter(car => car.category.includes('midsize'));
    }
    if (activeFilters.includes('premium')) {
      filtered = filtered.filter(car => car.category.includes('premium') || car.category.includes('luxury'));
    }
    if (activeFilters.includes('unlimited')) {
      filtered = filtered.filter(car => car.specs.mileage === 'unlimited');
    }
    if (activeFilters.includes('ac')) {
      filtered = filtered.filter(car => car.specs.airConditioning);
    }

    return filtered;
  }, [results, activeFilters]);

  const toggleFilter = (filterId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveFilters(prev =>
      prev.includes(filterId)
        ? prev.filter(f => f !== filterId)
        : [...prev, filterId]
    );
  };

  const handleSort = (sortId: 'recommended' | 'price' | 'size') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSortBy(sortId);
    setShowSortMenu(false);
  };

  const handleCarPress = (car: Car) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCarForDetail(car);
  };

  const handleSelectCar = (car: Car) => {
    setSelectedCarForDetail(null);
    onSelectCar(car);
  };

  const formatDate = (date: Date | null): string => {
    if (!date) return '';
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const currentSortLabel = SORT_OPTIONS.find(s => s.id === sortBy)?.label || 'Recommended';

  return (
    <View style={[styles.container, { backgroundColor: tc.background }]}>
      {/* Header with Background Image */}
      <ImageBackground
        source={require('../../../../../../assets/images/carbg.png')}
        style={[styles.header, { paddingTop: insets.top + spacing.md }]}
        resizeMode="cover"
      >
        <View style={styles.headerOverlay} />
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Available Cars</Text>
            <Text style={styles.headerSubtitle}>
              {filteredResults.length} cars found
            </Text>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <CloseCircle size={24} color="#FFFFFF" variant="Bold" />
          </TouchableOpacity>
        </View>

        <View style={styles.summaryBar}>
          <Location size={14} color="#FFFFFF" variant="Bold" />
          <Text style={styles.summaryText}>
            {searchParams.pickupLocation?.code || 'Location'}
          </Text>
          <View style={styles.summaryDivider} />
          <Calendar size={14} color="#FFFFFF" variant="Bold" />
          <Text style={styles.summaryText}>
            {formatDate(searchParams.pickupDate)} - {formatDate(searchParams.returnDate)} ({rentalDays} days)
          </Text>
        </View>
      </ImageBackground>

      {/* Filter Chips */}
      <View style={[styles.filterSection, { backgroundColor: tc.bgElevated, borderBottomColor: tc.borderSubtle }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
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
                onPress={() => handleSort(option.id as 'recommended' | 'price' | 'size')}
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
        renderItem={({ item, index }) => {
          const priceAmt = typeof item.rental.pricePerDay === 'number'
            ? item.rental.pricePerDay
            : item.rental.pricePerDay?.amount || 0;

          const cardData: CarCardData = {
            id: item.id,
            name: item.name,
            make: item.make,
            model: item.model,
            category: item.category.charAt(0).toUpperCase() + item.category.slice(1).replace('_', ' '),
            pricePerDay: priceAmt,
            images: item.images,
            specs: {
              seats: item.specs.seats,
              luggage: item.specs.luggage,
              transmission: item.specs.transmission,
              airConditioning: item.specs.airConditioning,
              mileage: item.specs.mileage === 'unlimited' ? 'unlimited' : 'limited',
            },
            company: {
              name: item.rental.company.name,
              rating: item.rental.company.rating,
              logo: item.rental.company.logo,
            },
            popularChoice: item.popularChoice,
          };

          return (
            <CarCard
              car={cardData}
              onPress={() => handleCarPress(item)}
              index={index}
            />
          );
        }}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + spacing.lg },
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyTitle, { color: tc.textPrimary }]}>No cars found</Text>
            <Text style={[styles.emptySubtitle, { color: tc.textSecondary }]}>
              Try adjusting your filters or search criteria
            </Text>
          </View>
        }
      />

      <CarDetailSheet
        visible={!!selectedCarForDetail}
        onClose={() => setSelectedCarForDetail(null)}
        onSelect={handleSelectCar}
        car={selectedCarForDetail}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { minHeight: 160, justifyContent: 'flex-end' },
  headerOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)' },
  headerContent: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingBottom: spacing.sm,
  },
  backButton: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: '#FFFFFF' },
  headerSubtitle: { fontSize: typography.fontSize.sm, color: 'rgba(255,255,255,0.8)' },
  closeButton: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  summaryBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, paddingBottom: spacing.md, gap: spacing.xs,
  },
  summaryDivider: { width: 1, height: 12, backgroundColor: 'rgba(255,255,255,0.5)', marginHorizontal: spacing.sm },
  summaryText: { fontSize: typography.fontSize.sm, color: 'rgba(255,255,255,0.9)' },
  filterSection: { borderBottomWidth: 1, position: 'relative' },
  filterScroll: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, gap: spacing.sm },
  sortButton: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: borderRadius.full, gap: spacing.xs,
  },
  sortButtonText: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium },
  filterChip: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: borderRadius.full, borderWidth: 1,
  },
  filterChipText: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium },
  sortMenu: {
    position: 'absolute', top: '100%', left: spacing.lg,
    borderRadius: borderRadius.lg, borderWidth: 1,
    shadowColor: '#000000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 12, elevation: 8,
    zIndex: 100, minWidth: 180,
  },
  sortMenuItem: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1 },
  sortMenuItemText: { fontSize: typography.fontSize.sm },
  listContent: { paddingTop: spacing.md, paddingHorizontal: spacing.lg },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xl * 2 },
  emptyTitle: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold },
  emptySubtitle: { fontSize: typography.fontSize.base, marginTop: spacing.xs },
});
