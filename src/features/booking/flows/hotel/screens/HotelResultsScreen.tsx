/**
 * HOTEL RESULTS SCREEN
 *
 * Display hotel search results with filtering and sorting.
 * Matches FlightResultsScreen styling for visual consistency.
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ImageBackground,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';
import {
  ArrowLeft,
  Sort,
  CloseCircle,
  ArrowDown2,
  DollarCircle,
  Star1,
  TickCircle,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { useHotelStore } from '../../../stores/useHotelStore';
import { Hotel } from '../../../types/hotel.types';
import { styles } from './HotelResultsScreen.styles';
import { HotelCard, HotelCardData } from '../../../shared/components';

interface HotelResultsScreenProps {
  onSelectHotel: (hotel: Hotel) => void;
  onBack: () => void;
  onClose: () => void;
}

const FILTER_OPTIONS = [
  { id: 'sort', label: 'Sort', icon: 'sort', values: ['Recommended', 'Price: Low to High', 'Price: High to Low', 'Rating: Highest'] },
  { id: 'price', label: 'Price', icon: 'price', values: ['Under $100', '$100-$200', '$200-$300', '$300+'] },
  { id: 'stars', label: 'Stars', icon: 'star', values: ['5 Stars', '4+ Stars', '3+ Stars', 'Any'] },
];

const generateDateRange = (baseDate: Date | string | null, cheapestPrice?: number) => {
  const base = baseDate
    ? baseDate instanceof Date ? baseDate : new Date(baseDate)
    : new Date();
  const safe = isNaN(base.getTime()) ? new Date() : base;

  const dates = [];
  for (let i = -2; i <= 4; i++) {
    const date = new Date(safe);
    date.setDate(date.getDate() + i);
    dates.push({
      date,
      price: i === 0 ? (cheapestPrice || null) : null,
    });
  }
  return dates;
};

export default function HotelResultsScreen({
  onSelectHotel,
  onBack,
  onClose,
}: HotelResultsScreenProps) {
  const insets = useSafeAreaInsets();
  const { colors: tc } = useTheme();
  const {
    searchParams,
    searchResults,
    filteredResults,
    selectHotel,
    getNights,
    setCheckInDate,
    setCheckOutDate,
    setFilters,
    setSortBy,
  } = useHotelStore();

  const [selectedDateIndex, setSelectedDateIndex] = useState(2);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string>>({});

  const nights = getNights();
  const hotelList = filteredResults.length > 0 ? filteredResults : searchResults;

  const cheapestPrice = useMemo(() => {
    if (hotelList.length === 0) return null;
    const prices = hotelList.map(h => h.pricePerNight?.amount || 0).filter(p => p > 0);
    return prices.length > 0 ? Math.min(...prices) : null;
  }, [hotelList]);

  const datePrices = useMemo(
    () => generateDateRange(searchParams.checkIn || new Date(), cheapestPrice ?? undefined),
    [searchParams.checkIn, cheapestPrice],
  );

  const handleSelectHotel = useCallback((hotel: Hotel) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    selectHotel(hotel);
    onSelectHotel(hotel);
  }, [selectHotel, onSelectHotel]);

  const handleDateSelect = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedDateIndex(index);
    const newCheckIn = datePrices[index].date;
    const newCheckOut = new Date(newCheckIn);
    newCheckOut.setDate(newCheckOut.getDate() + nights);
    setCheckInDate(newCheckIn);
    setCheckOutDate(newCheckOut);
  };

  const handleFilterPress = (filterId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveFilter(activeFilter === filterId ? null : filterId);
  };

  const handleFilterSelect = (filterId: string, value: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedFilters(prev => ({ ...prev, [filterId]: value }));
    setActiveFilter(null);

    if (filterId === 'sort') {
      const sortMap: Record<string, string> = {
        'Recommended': 'recommended',
        'Price: Low to High': 'price_low',
        'Price: High to Low': 'price_high',
        'Rating: Highest': 'recommended',
      };
      setSortBy((sortMap[value] || 'recommended') as any);
    } else if (filterId === 'price') {
      const priceMap: Record<string, { min: number; max: number } | null> = {
        'Under $100': { min: 0, max: 100 },
        '$100-$200': { min: 100, max: 200 },
        '$200-$300': { min: 200, max: 300 },
        '$300+': { min: 300, max: 10000 },
      };
      setFilters({ priceRange: priceMap[value] || null });
    } else if (filterId === 'stars') {
      const starsMap: Record<string, number[]> = {
        '5 Stars': [5],
        '4+ Stars': [4, 5],
        '3+ Stars': [3, 4, 5],
        'Any': [],
      };
      setFilters({ starRating: starsMap[value] || [] });
    }
  };

  const getActiveFilterOptions = () => FILTER_OPTIONS.find(f => f.id === activeFilter);

  const getFilterIcon = (iconType: string, isSelected: boolean) => {
    const iconColor = isSelected ? tc.primary : tc.textPrimary;
    switch (iconType) {
      case 'sort': return <Sort size={16} color={iconColor} />;
      case 'price': return <DollarCircle size={16} color={iconColor} />;
      case 'star': return <Star1 size={16} color={iconColor} />;
      default: return null;
    }
  };

  const formatDateHeader = () => {
    if (!searchParams.checkIn || !searchParams.checkOut) return '';
    const checkInDate = searchParams.checkIn instanceof Date ? searchParams.checkIn : new Date(searchParams.checkIn);
    const checkOutDate = searchParams.checkOut instanceof Date ? searchParams.checkOut : new Date(searchParams.checkOut);
    if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) return '';
    const ci = checkInDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const co = checkOutDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${ci} - ${co} · ${nights} night${nights > 1 ? 's' : ''}`;
  };

  const renderHotelCard = useCallback(({ item, index }: { item: Hotel; index: number }) => {
    const firstRoom = item.rooms?.[0];
    const cancellationPolicy = firstRoom?.cancellationPolicy;

    const cardData: HotelCardData = {
      id: item.id,
      name: item.name,
      images: item.images?.map(img => img.url) || [],
      starRating: item.starRating,
      userRating: item.userRating,
      reviewCount: item.reviewCount,
      location: {
        city: typeof item.location?.city === 'string' ? item.location.city : (item.location?.city as any)?.formatted || '',
        neighborhood: typeof item.location?.neighborhood === 'string' ? item.location.neighborhood : '',
        address: typeof item.location?.address === 'string' ? item.location.address : (item.location?.address as any)?.formatted || '',
        coordinates: item.location?.coordinates,
      },
      amenities: (item.amenities || []).slice(0, 4).map(a => typeof a === 'string' ? a : a.name),
      pricePerNight: item.pricePerNight?.amount || 0,
      totalPrice: (item.pricePerNight?.amount || 0) * nights,
      currency: item.pricePerNight?.currency || 'USD',
      isPopular: index === 0,
      isBestValue: index === 1,
      isFreeCancellable: typeof cancellationPolicy === 'object'
        ? (cancellationPolicy as any)?.freeCancellation
        : firstRoom?.refundable || false,
      freeCancellationDeadline: typeof cancellationPolicy === 'object'
        ? (cancellationPolicy as any)?.freeCancellationDeadline
        : undefined,
      hasBreakfast: (firstRoom as any)?.boardType === 'breakfast_included' || firstRoom?.breakfast === 'included',
      roomsRemaining: (firstRoom as any)?.roomsRemaining,
      checkInTime: (item.policies?.checkIn as any)?.time || item.policies?.checkIn?.from,
      checkOutTime: (item.policies?.checkOut as any)?.time || item.policies?.checkOut?.until,
    };

    return (
      <HotelCard
        hotel={cardData}
        nights={nights}
        index={index}
        onPress={() => handleSelectHotel(item)}
      />
    );
  }, [handleSelectHotel, nights]);

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
    <View style={[styles.container, { backgroundColor: tc.background }]}>
      {/* Header */}
      <ImageBackground
        source={require('../../../../../../assets/images/bookingbg.png')}
        style={[styles.header, { paddingTop: insets.top + spacing.sm }]}
        resizeMode="cover"
      >
        <View style={styles.headerOverlay} />
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <ArrowLeft size={24} color={colors.white} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.routeInfo}>
            <Text style={styles.routeText}>{searchParams.destination?.name}</Text>
            <Text style={styles.dateText}>{formatDateHeader()}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.calendarButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onClose();
            }}
          >
            <CloseCircle size={24} color={colors.white} variant="Bold" />
          </TouchableOpacity>
        </View>
      </ImageBackground>

      {/* Date Scroll */}
      <Animated.View entering={FadeIn.duration(300)}>
        <View style={[styles.dateScrollContainer, { backgroundColor: tc.bgElevated, borderBottomColor: tc.borderSubtle }]}>
          <FlatList
            data={datePrices}
            renderItem={renderDateItem}
            keyExtractor={(item) => item.date.toISOString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dateScrollContent}
          />
        </View>
      </Animated.View>

      {/* Filter Bar */}
      <View style={[styles.filtersContainer, { backgroundColor: tc.bgElevated, borderBottomColor: tc.borderSubtle }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterBar}
        >
          {FILTER_OPTIONS.map((filter) => {
            const isActive = activeFilter === filter.id;
            const hasSelection = !!selectedFilters[filter.id];
            return (
              <TouchableOpacity
                key={filter.id}
                style={[
                  styles.filterChip,
                  { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle },
                  isActive && { borderColor: tc.primary, backgroundColor: `${tc.primary}08` },
                  hasSelection && { borderColor: tc.primary, backgroundColor: `${tc.primary}10` },
                ]}
                onPress={() => handleFilterPress(filter.id)}
              >
                {getFilterIcon(filter.icon, hasSelection)}
                <Text style={[
                  styles.filterChipText,
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

        {activeFilter && (
          <View style={[styles.filterDropdown, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle }]}>
            {getActiveFilterOptions()?.values.map((value) => (
              <TouchableOpacity
                key={value}
                style={[
                  styles.filterOption,
                  { borderBottomColor: tc.borderSubtle },
                  selectedFilters[activeFilter] === value && { backgroundColor: `${tc.primary}08` },
                ]}
                onPress={() => handleFilterSelect(activeFilter, value)}
              >
                <Text style={[
                  styles.filterOptionText,
                  { color: tc.textPrimary },
                  selectedFilters[activeFilter] === value && { color: tc.primary },
                ]}>
                  {value}
                </Text>
                {selectedFilters[activeFilter] === value && (
                  <TickCircle size={16} color={tc.primary} variant="Bold" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Results Count */}
      <View style={styles.resultsHeader}>
        <Text style={[styles.resultsCount, { color: tc.textSecondary }]}>
          {hotelList.length} hotels found
        </Text>
      </View>

      {/* Hotel List */}
      <FlatList
        data={hotelList}
        renderItem={renderHotelCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + spacing.lg },
        ]}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}
