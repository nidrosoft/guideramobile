/**
 * HOTEL RESULTS STEP
 * 
 * Display hotel search results with filtering and sorting.
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
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  Layout,
} from 'react-native-reanimated';
import {
  Star1,
  Location,
  Filter,
  Sort,
  Heart,
  TickCircle,
  Building,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, typography, shadows, borderRadius } from '@/styles';
import { useHotelStore } from '../../../stores/useHotelStore';
import { Hotel } from '../../../types/hotel.types';
import { generateMockHotels } from '../../../data/mockHotels';
import { SortOption } from '../../../types/booking.types';

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
  { value: 'rating_high', label: 'Rating: Highest' },
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
    selectHotel,
    setSortBy,
    getNights,
  } = useHotelStore();
  
  const [showSortModal, setShowSortModal] = useState(false);
  const nights = getNights();
  
  // Load mock hotels on mount
  useEffect(() => {
    if (searchParams.destination && searchParams.checkIn && searchParams.checkOut) {
      setSearching(true);
      
      // Simulate API call
      setTimeout(() => {
        const hotels = generateMockHotels(
          searchParams.destination!,
          searchParams.checkIn!,
          searchParams.checkOut!,
          15
        );
        setSearchResults(hotels);
        setSearching(false);
      }, 1500);
    }
  }, []);
  
  const handleSelectHotel = useCallback((hotel: Hotel) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    selectHotel(hotel);
    onNext();
  }, [selectHotel, onNext]);
  
  const renderHotelCard = useCallback(({ item, index }: { item: Hotel; index: number }) => (
    <Animated.View
      entering={FadeInDown.duration(400).delay(index * 80)}
      layout={Layout.springify()}
    >
      <HotelCard
        hotel={item}
        nights={nights}
        onSelect={() => handleSelectHotel(item)}
      />
    </Animated.View>
  ), [handleSelectHotel, nights]);
  
  const ListHeader = useMemo(() => (
    <Animated.View entering={FadeIn.duration(400)}>
      {/* Search Summary */}
      <View style={styles.searchSummary}>
        <View style={styles.summaryInfo}>
          <Text style={styles.summaryDestination}>
            {searchParams.destination?.name}
          </Text>
          <Text style={styles.summaryDates}>
            {searchParams.checkIn?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {' '}
            {searchParams.checkOut?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            {' · '}{nights} night{nights > 1 ? 's' : ''}
          </Text>
        </View>
        <Text style={styles.resultsCount}>
          {filteredResults.length} hotels found
        </Text>
      </View>
      
      {/* Sort Bar */}
      <View style={styles.sortBar}>
        <TouchableOpacity
          style={styles.sortButton}
          onPress={() => setShowSortModal(true)}
        >
          <Sort size={18} color={colors.textPrimary} />
          <Text style={styles.sortButtonText}>
            {SORT_OPTIONS.find(o => o.value === sortBy)?.label || 'Sort'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.filterButton}>
          <Filter size={18} color={colors.textPrimary} />
          <Text style={styles.filterButtonText}>Filter</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  ), [searchParams, filteredResults.length, sortBy, nights]);
  
  return (
    <View style={styles.container}>
      {isSearching ? (
        <View style={styles.loadingContainer}>
          <Animated.View 
            entering={FadeIn.duration(400)}
            style={styles.loadingContent}
          >
            <View style={styles.loadingAnimation}>
              <Building size={48} color={colors.primary} variant="Bold" />
            </View>
            <Text style={styles.loadingTitle}>Searching hotels...</Text>
            <Text style={styles.loadingSubtitle}>
              Finding the best stays for you
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
          renderItem={renderHotelCard}
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
// HOTEL CARD
// ============================================

interface HotelCardProps {
  hotel: Hotel;
  nights: number;
  onSelect: () => void;
}

function HotelCard({ hotel, nights, onSelect }: HotelCardProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const totalPrice = hotel.lowestPrice.amount * nights;
  
  return (
    <Pressable
      style={({ pressed }) => [
        styles.hotelCard,
        pressed && styles.hotelCardPressed,
      ]}
      onPress={onSelect}
    >
      {/* Image */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: hotel.images[0]?.url }}
          style={styles.hotelImage}
          resizeMode="cover"
        />
        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setIsFavorite(!isFavorite);
          }}
        >
          <Heart
            size={20}
            color={isFavorite ? colors.error : colors.white}
            variant={isFavorite ? 'Bold' : 'Linear'}
          />
        </TouchableOpacity>
        {hotel.featured && (
          <View style={styles.featuredBadge}>
            <Text style={styles.featuredText}>Featured</Text>
          </View>
        )}
      </View>
      
      {/* Content */}
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <View style={styles.ratingContainer}>
            {Array.from({ length: hotel.starRating }).map((_, i) => (
              <Star1 key={i} size={12} color={colors.warning} variant="Bold" />
            ))}
          </View>
          <View style={styles.userRating}>
            <Text style={styles.userRatingText}>{hotel.userRating.toFixed(1)}</Text>
            <Text style={styles.reviewCount}>({hotel.reviewCount})</Text>
          </View>
        </View>
        
        <Text style={styles.hotelName} numberOfLines={1}>{hotel.name}</Text>
        
        <View style={styles.locationRow}>
          <Location size={14} color={colors.textSecondary} />
          <Text style={styles.locationText} numberOfLines={1}>
            {hotel.location.neighborhood || hotel.location.city}
            {hotel.location.distanceFromCenter && ` · ${hotel.location.distanceFromCenter}km from center`}
          </Text>
        </View>
        
        {/* Amenities Preview */}
        <View style={styles.amenitiesRow}>
          {hotel.amenities.slice(0, 3).map((amenity) => (
            <View key={amenity.id} style={styles.amenityBadge}>
              <Text style={styles.amenityText}>{amenity.name}</Text>
            </View>
          ))}
        </View>
        
        {/* Price */}
        <View style={styles.priceRow}>
          <View>
            <Text style={styles.priceLabel}>From</Text>
            <View style={styles.priceContainer}>
              <Text style={styles.price}>${hotel.lowestPrice.amount}</Text>
              <Text style={styles.priceNight}>/night</Text>
            </View>
          </View>
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>{nights} night{nights > 1 ? 's' : ''}</Text>
            <Text style={styles.totalPrice}>${totalPrice}</Text>
          </View>
        </View>
      </View>
    </Pressable>
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
  
  // Search Summary
  searchSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  summaryInfo: {
    flex: 1,
  },
  summaryDestination: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  summaryDates: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 4,
  },
  resultsCount: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: typography.fontWeight.medium,
  },
  
  // Sort Bar
  sortBar: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  sortButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.white,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  sortButtonText: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.medium,
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.white,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  filterButtonText: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.medium,
  },
  
  // Hotel Card
  hotelCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.md,
  },
  hotelCardPressed: {
    opacity: 0.95,
    transform: [{ scale: 0.98 }],
  },
  imageContainer: {
    height: 180,
    position: 'relative',
  },
  hotelImage: {
    width: '100%',
    height: '100%',
  },
  favoriteButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featuredBadge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  featuredText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
  cardContent: {
    padding: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  ratingContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  userRating: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '15',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  userRatingText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  reviewCount: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  hotelName: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  locationText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  amenitiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  amenityBadge: {
    backgroundColor: colors.gray100,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  amenityText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
    paddingTop: spacing.md,
  },
  priceLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  price: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  priceNight: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginLeft: 2,
  },
  totalContainer: {
    alignItems: 'flex-end',
  },
  totalLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  totalPrice: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
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
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.gray300,
    borderRadius: 2,
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
    backgroundColor: colors.primary + '10',
    marginHorizontal: -spacing.lg,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  sortOptionText: {
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
  sortOptionTextSelected: {
    color: colors.primary,
    fontWeight: typography.fontWeight.semibold,
  },
});
