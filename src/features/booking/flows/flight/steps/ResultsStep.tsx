/**
 * RESULTS STEP
 * 
 * Flight search results with beautiful cards, filters, and sorting.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeOut,
  Layout,
  SlideInRight,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import {
  Airplane,
  Clock,
  Filter,
  Sort,
  ArrowRight2,
  TickCircle,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, shadows, borderRadius } from '@/styles';
import { useFlightStore } from '../../../stores/useFlightStore';
import { Flight } from '../../../types/flight.types';
import { SortOption } from '../../../types/booking.types';
import { generateMockFlights } from '../../../data/mockFlights';

interface ResultsStepProps {
  onNext: () => void;
  onBack: () => void;
  onClose: () => void;
  stepIndex: number;
  totalSteps: number;
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'price_low', label: 'Price: Low to High' },
  { value: 'price_high', label: 'Price: High to Low' },
  { value: 'duration_short', label: 'Duration: Shortest' },
  { value: 'departure_early', label: 'Departure: Earliest' },
];

export default function ResultsStep({
  onNext,
  onBack,
  onClose,
  stepIndex,
  totalSteps,
}: ResultsStepProps) {
  const insets = useSafeAreaInsets();
  const {
    searchParams,
    searchResults,
    filteredResults,
    isSearching,
    sortBy,
    setSearchResults,
    setSearching,
    selectOutboundFlight,
    setSortBy,
  } = useFlightStore();
  
  const [showSortModal, setShowSortModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  
  // Load mock flights on mount
  useEffect(() => {
    if (searchParams.origin && searchParams.destination && searchParams.departureDate) {
      setSearching(true);
      
      // Simulate API call
      setTimeout(() => {
        const flights = generateMockFlights(
          searchParams.origin!,
          searchParams.destination!,
          searchParams.departureDate!
        );
        setSearchResults(flights);
        setSearching(false);
      }, 1500);
    }
  }, []);
  
  const handleSelectFlight = useCallback((flight: Flight) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    selectOutboundFlight(flight);
    onNext();
  }, [selectOutboundFlight, onNext]);
  
  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };
  
  const formatTime = (date: Date): string => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };
  
  const renderFlightCard = useCallback(({ item, index }: { item: Flight; index: number }) => (
    <Animated.View
      entering={FadeInDown.duration(400).delay(index * 80)}
      layout={Layout.springify()}
    >
      <FlightCard
        flight={item}
        onSelect={() => handleSelectFlight(item)}
        formatDuration={formatDuration}
        formatTime={formatTime}
      />
    </Animated.View>
  ), [handleSelectFlight]);
  
  const ListHeader = useMemo(() => (
    <Animated.View entering={FadeIn.duration(400)}>
      {/* Route Summary */}
      <View style={styles.routeSummary}>
        <View style={styles.routeInfo}>
          <Text style={styles.routeText}>
            {searchParams.origin?.code} → {searchParams.destination?.code}
          </Text>
          <Text style={styles.routeDate}>
            {searchParams.departureDate?.toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            })}
          </Text>
        </View>
        <Text style={styles.resultsCount}>
          {filteredResults.length} flights found
        </Text>
      </View>
      
      {/* Filter & Sort Bar */}
      <View style={styles.filterBar}>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilterModal(true)}
        >
          <Filter size={18} color={colors.textPrimary} />
          <Text style={styles.filterButtonText}>Filter</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowSortModal(true)}
        >
          <Sort size={18} color={colors.textPrimary} />
          <Text style={styles.filterButtonText}>
            {SORT_OPTIONS.find(o => o.value === sortBy)?.label || 'Sort'}
          </Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  ), [searchParams, filteredResults.length, sortBy]);
  
  return (
    <View style={styles.container}>
      {/* Content */}
      {isSearching ? (
        <View style={styles.loadingContainer}>
          <Animated.View 
            entering={FadeIn.duration(400)}
            style={styles.loadingContent}
          >
            <View style={styles.loadingAnimation}>
              <Airplane size={48} color={colors.primary} variant="Bold" />
            </View>
            <Text style={styles.loadingTitle}>Searching flights...</Text>
            <Text style={styles.loadingSubtitle}>
              Finding the best deals for you
            </Text>
            <ActivityIndicator 
              size="large" 
              color={colors.primary} 
              style={styles.loadingSpinner}
            />
          </Animated.View>
        </View>
      ) : (
        <FlatList
          data={filteredResults}
          renderItem={renderFlightCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + spacing.lg },
          ]}
          ListHeaderComponent={ListHeader}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
      
      {/* Sort Modal */}
      <SortModal
        visible={showSortModal}
        onClose={() => setShowSortModal(false)}
        selected={sortBy}
        onSelect={(value) => {
          setSortBy(value);
          setShowSortModal(false);
        }}
      />
    </View>
  );
}

// ============================================
// FLIGHT CARD COMPONENT
// ============================================

interface FlightCardProps {
  flight: Flight;
  onSelect: () => void;
  formatDuration: (minutes: number) => string;
  formatTime: (date: Date) => string;
}

function FlightCard({ flight, onSelect, formatDuration, formatTime }: FlightCardProps) {
  const firstSegment = flight.segments[0];
  const lastSegment = flight.segments[flight.segments.length - 1];
  const scale = useSharedValue(1);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  
  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15 });
  };
  
  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15 });
  };
  
  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        style={styles.flightCard}
        onPress={onSelect}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        {/* Airline Info */}
        <View style={styles.airlineRow}>
          <View style={styles.airlineLogo}>
            <Text style={styles.airlineCode}>{firstSegment.airline.code}</Text>
          </View>
          <View style={styles.airlineInfo}>
            <Text style={styles.airlineName}>{firstSegment.airline.name}</Text>
            <Text style={styles.flightNumber}>{firstSegment.flightNumber}</Text>
          </View>
          {flight.refundable && (
            <View style={styles.refundableBadge}>
              <Text style={styles.refundableText}>Refundable</Text>
            </View>
          )}
        </View>
        
        {/* Flight Timeline */}
        <View style={styles.timelineRow}>
          {/* Departure */}
          <View style={styles.timeBlock}>
            <Text style={styles.timeText}>
              {formatTime(firstSegment.departureTime)}
            </Text>
            <Text style={styles.airportCode}>{firstSegment.origin.code}</Text>
          </View>
          
          {/* Duration & Stops */}
          <View style={styles.durationBlock}>
            <Text style={styles.durationText}>
              {formatDuration(flight.totalDuration)}
            </Text>
            <View style={styles.flightLine}>
              <View style={styles.lineDot} />
              <View style={styles.lineBar} />
              {flight.stops > 0 && (
                <View style={styles.stopIndicator}>
                  <View style={styles.stopDot} />
                </View>
              )}
              <View style={styles.lineBar} />
              <Airplane 
                size={16} 
                color={colors.primary} 
                style={styles.planeIcon}
              />
            </View>
            <Text style={[
              styles.stopsText,
              flight.stops === 0 && styles.directText,
            ]}>
              {flight.stops === 0 ? 'Direct' : `${flight.stops} stop`}
            </Text>
          </View>
          
          {/* Arrival */}
          <View style={[styles.timeBlock, styles.timeBlockRight]}>
            <Text style={styles.timeText}>
              {formatTime(lastSegment.arrivalTime)}
            </Text>
            <Text style={styles.airportCode}>{lastSegment.destination.code}</Text>
          </View>
        </View>
        
        {/* Price & Select */}
        <View style={styles.priceRow}>
          <View style={styles.priceInfo}>
            <Text style={styles.priceLabel}>from</Text>
            <Text style={styles.priceAmount}>${flight.price.amount}</Text>
            <Text style={styles.pricePerPerson}>/person</Text>
          </View>
          
          <View style={styles.selectButton}>
            <Text style={styles.selectButtonText}>Select</Text>
            <ArrowRight2 size={16} color={colors.primary} />
          </View>
        </View>
        
        {/* Baggage Info */}
        <View style={styles.baggageRow}>
          <View style={styles.baggageItem}>
            <TickCircle 
              size={14} 
              color={colors.success} 
              variant="Bold"
            />
            <Text style={styles.baggageText}>Carry-on included</Text>
          </View>
          {flight.baggageIncluded.checked.included && (
            <View style={styles.baggageItem}>
              <TickCircle 
                size={14} 
                color={colors.success} 
                variant="Bold"
              />
              <Text style={styles.baggageText}>Checked bag included</Text>
            </View>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ============================================
// SORT MODAL
// ============================================

interface SortModalProps {
  visible: boolean;
  onClose: () => void;
  selected: SortOption;
  onSelect: (value: SortOption) => void;
}

function SortModal({ visible, onClose, selected, onSelect }: SortModalProps) {
  const insets = useSafeAreaInsets();
  
  if (!visible) return null;
  
  return (
    <View style={StyleSheet.absoluteFill}>
      <Pressable style={styles.modalOverlay} onPress={onClose} />
      <Animated.View 
        entering={FadeInUp.duration(300)}
        style={[styles.sortModal, { paddingBottom: insets.bottom + spacing.lg }]}
      >
        <View style={styles.modalHandle} />
        <Text style={styles.modalTitle}>Sort By</Text>
        
        {SORT_OPTIONS.map((option, index) => (
          <Animated.View
            key={option.value}
            entering={FadeInDown.duration(300).delay(index * 50)}
          >
            <TouchableOpacity
              style={[
                styles.sortOption,
                selected === option.value && styles.sortOptionSelected,
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onSelect(option.value);
              }}
            >
              <Text style={[
                styles.sortOptionText,
                selected === option.value && styles.sortOptionTextSelected,
              ]}>
                {option.label}
              </Text>
              {selected === option.value && (
                <TickCircle size={22} color={colors.primary} variant="Bold" />
              )}
            </TouchableOpacity>
          </Animated.View>
        ))}
      </Animated.View>
    </View>
  );
}

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  
  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
  },
  loadingAnimation: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  loadingTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  loadingSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  loadingSpinner: {
    marginTop: spacing.xl,
  },
  
  // List
  listContent: {
    padding: spacing.lg,
  },
  separator: {
    height: spacing.md,
  },
  
  // Route Summary
  routeSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  routeInfo: {},
  routeText: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  routeDate: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  resultsCount: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  
  // Filter Bar
  filterBar: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    gap: spacing.xs,
    ...shadows.sm,
  },
  filterButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  
  // Flight Card
  flightCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    ...shadows.card,
  },
  airlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  airlineLogo: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  airlineCode: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  airlineInfo: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  airlineName: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  flightNumber: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  refundableBadge: {
    backgroundColor: colors.success + '15',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  refundableText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.success,
  },
  
  // Timeline
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingVertical: spacing.sm,
  },
  timeBlock: {
    alignItems: 'flex-start',
  },
  timeBlockRight: {
    alignItems: 'flex-end',
  },
  timeText: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  airportCode: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  durationBlock: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  durationText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  flightLine: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  lineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.gray400,
  },
  lineBar: {
    flex: 1,
    height: 2,
    backgroundColor: colors.gray200,
  },
  stopIndicator: {
    paddingHorizontal: spacing.xs,
  },
  stopDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.warning,
  },
  planeIcon: {
    transform: [{ rotate: '45deg' }],
  },
  stopsText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  directText: {
    color: colors.success,
    fontWeight: typography.fontWeight.medium,
  },
  
  // Price Row
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
  },
  priceInfo: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginRight: spacing.xs,
  },
  priceAmount: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  pricePerPerson: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginLeft: 2,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '15',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    gap: spacing.xs,
  },
  selectButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
  },
  
  // Baggage Row
  baggageRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
    paddingTop: spacing.sm,
  },
  baggageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  baggageText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  
  // Modal
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sortModal: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius['2xl'],
    borderTopRightRadius: borderRadius['2xl'],
    padding: spacing.lg,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.gray300,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  sortOptionSelected: {
    backgroundColor: colors.primary + '08',
    marginHorizontal: -spacing.lg,
    paddingHorizontal: spacing.lg,
    borderBottomColor: 'transparent',
  },
  sortOptionText: {
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
  sortOptionTextSelected: {
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
  },
});
