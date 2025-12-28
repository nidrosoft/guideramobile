/**
 * HOTEL RESULTS SCREEN
 * 
 * Display hotel search results with filtering and sorting.
 * Follows the same pattern as FlightResultsScreen.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ImageBackground,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  FadeInDown,
} from 'react-native-reanimated';
import {
  ArrowLeft,
  Sort,
  Filter,
  Calendar,
  ArrowDown2,
  DollarCircle,
  Star1,
  TickCircle,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing } from '@/styles';
import { useHotelStore } from '../../../stores/useHotelStore';
import { Hotel } from '../../../types/hotel.types';
import { generateMockHotels } from '../../../data/mockHotels';
import { styles } from './HotelResultsScreen.styles';

// Import components
import DatePickerSheet from '../../flight/sheets/DatePickerSheet';

// Import shared premium card
import { HotelCard, HotelCardData } from '../../../shared/components';

interface HotelResultsScreenProps {
  onSelectHotel: (hotel: Hotel) => void;
  onBack: () => void;
  onClose: () => void;
}

// Filter options with values
const FILTER_OPTIONS = [
  { id: 'sort', label: 'Sort', icon: 'sort', values: ['Recommended', 'Price: Low to High', 'Price: High to Low', 'Rating: Highest'] },
  { id: 'filters', label: 'Filters', icon: 'filter', values: ['Free Cancellation', 'Breakfast Included', 'Free WiFi', 'Pool', 'Spa'] },
  { id: 'price', label: 'Price', icon: 'price', values: ['Under $100', '$100-$200', '$200-$300', '$300+'] },
  { id: 'stars', label: 'Stars', icon: 'star', values: ['5 Stars', '4+ Stars', '3+ Stars', 'Any'] },
];

// Generate date prices for horizontal scroll
const generateDatePrices = (baseDate: Date | string | null) => {
  // Handle both Date objects and string dates (from persistence)
  const base = baseDate 
    ? (baseDate instanceof Date ? baseDate : new Date(baseDate))
    : new Date();
  if (isNaN(base.getTime())) {
    // Fallback to today if invalid date
    const today = new Date();
    const dates = [];
    for (let i = -2; i <= 4; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      dates.push({
        date,
        price: Math.floor(Math.random() * 100) + 100,
      });
    }
    return dates;
  }
  const dates = [];
  for (let i = -2; i <= 4; i++) {
    const date = new Date(base);
    date.setDate(date.getDate() + i);
    dates.push({
      date,
      price: Math.floor(Math.random() * 100) + 100,
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
  const {
    searchParams,
    searchResults,
    filteredResults,
    isSearching,
    setSearchResults,
    setSearching,
    selectHotel,
    getNights,
    setCheckInDate,
    setCheckOutDate,
  } = useHotelStore();
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDateIndex, setSelectedDateIndex] = useState(2);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string>>({});
  
  const nights = getNights();
  const datePrices = useMemo(() => 
    generateDatePrices(searchParams.checkIn || new Date()), 
    [searchParams.checkIn]
  );

  // Load mock hotels on mount
  useEffect(() => {
    if (searchParams.destination && searchParams.checkIn && searchParams.checkOut) {
      setSearching(true);
      
      // Handle both Date objects and string dates (from persistence)
      const checkInDate = searchParams.checkIn instanceof Date 
        ? searchParams.checkIn 
        : new Date(searchParams.checkIn);
      const checkOutDate = searchParams.checkOut instanceof Date 
        ? searchParams.checkOut 
        : new Date(searchParams.checkOut);
      
      // Simulate API call
      setTimeout(() => {
        const hotels = generateMockHotels(
          searchParams.destination!,
          checkInDate,
          checkOutDate,
          15
        );
        setSearchResults(hotels);
        setSearching(false);
      }, 500);
    }
  }, [searchParams.destination, searchParams.checkIn, searchParams.checkOut]);

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
  };

  const getActiveFilterOptions = () => {
    return FILTER_OPTIONS.find(f => f.id === activeFilter);
  };

  const getFilterIcon = (iconType: string, isSelected: boolean) => {
    const iconColor = isSelected ? colors.primary : colors.textPrimary;
    switch (iconType) {
      case 'sort':
        return <Sort size={16} color={iconColor} />;
      case 'filter':
        return <Filter size={16} color={iconColor} />;
      case 'price':
        return <DollarCircle size={16} color={iconColor} />;
      case 'star':
        return <Star1 size={16} color={iconColor} />;
      default:
        return null;
    }
  };

  const formatDateHeader = () => {
    if (!searchParams.checkIn || !searchParams.checkOut) return '';
    // Handle both Date objects and string dates (from persistence)
    const checkInDate = searchParams.checkIn instanceof Date 
      ? searchParams.checkIn 
      : new Date(searchParams.checkIn);
    const checkOutDate = searchParams.checkOut instanceof Date 
      ? searchParams.checkOut 
      : new Date(searchParams.checkOut);
    if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) return '';
    const checkIn = checkInDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
    const checkOut = checkOutDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
    return `${checkIn} - ${checkOut} · ${nights} night${nights > 1 ? 's' : ''}`;
  };

  const renderHotelCard = useCallback(({ item, index }: { item: Hotel; index: number }) => {
    // Convert Hotel to HotelCardData format for the premium shared card
    const cardData: HotelCardData = {
      id: item.id,
      name: item.name,
      images: item.images.map(img => img.url), // Extract URLs from HotelImage[]
      starRating: item.starRating,
      userRating: item.userRating, // 0-10 scale
      reviewCount: item.reviewCount,
      location: {
        city: item.location.city,
        neighborhood: item.location.neighborhood,
        address: item.location.address,
      },
      amenities: item.amenities.slice(0, 4).map(a => a.name), // Extract amenity names
      pricePerNight: item.pricePerNight.amount,
      totalPrice: item.pricePerNight.amount * nights,
      isPopular: index === 0,
      isBestValue: index === 1,
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
    
    return (
      <TouchableOpacity
        style={[styles.dateItem, isSelected && styles.dateItemSelected]}
        onPress={() => handleDateSelect(index)}
      >
        <Text style={[styles.dateDay, isSelected && styles.dateDaySelected]}>{dayName}</Text>
        <Text style={[styles.dateNum, isSelected && styles.dateNumSelected]}>{dayNum}</Text>
        <Text style={[styles.datePrice, isSelected && styles.datePriceSelected]}>
          ${item.price}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
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
              setShowDatePicker(true);
            }}
          >
            <Calendar size={24} color={colors.white} />
          </TouchableOpacity>
        </View>
      </ImageBackground>

      {/* Date Scroll */}
      <View style={styles.dateScrollContainer}>
        <FlatList
          data={datePrices}
          renderItem={renderDateItem}
          keyExtractor={(item) => item.date.toISOString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dateScrollContent}
        />
      </View>

      {/* Filter Bar */}
      <View style={styles.filtersContainer}>
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
                  isActive && styles.filterChipActive,
                  hasSelection && styles.filterChipSelected,
                ]}
                onPress={() => handleFilterPress(filter.id)}
              >
                {getFilterIcon(filter.icon, hasSelection)}
                <Text style={[
                  styles.filterChipText,
                  hasSelection && styles.filterChipTextSelected,
                ]}>
                  {selectedFilters[filter.id] || filter.label}
                </Text>
                <ArrowDown2
                  size={14}
                  color={hasSelection ? colors.primary : colors.gray400}
                  style={{ transform: [{ rotate: isActive ? '180deg' : '0deg' }] }}
                />
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Filter Dropdown */}
        {activeFilter && (
          <View style={styles.filterDropdown}>
            {getActiveFilterOptions()?.values.map((value) => (
              <TouchableOpacity
                key={value}
                style={[
                  styles.filterOption,
                  selectedFilters[activeFilter] === value && styles.filterOptionSelected,
                ]}
                onPress={() => handleFilterSelect(activeFilter, value)}
              >
                <Text style={[
                  styles.filterOptionText,
                  selectedFilters[activeFilter] === value && styles.filterOptionTextSelected,
                ]}>
                  {value}
                </Text>
                {selectedFilters[activeFilter] === value && (
                  <TickCircle size={16} color={colors.primary} variant="Bold" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Results Count */}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsCount}>
          {filteredResults.length || searchResults.length} hotels found
        </Text>
      </View>

      {/* Hotel List */}
      <FlatList
        data={filteredResults.length > 0 ? filteredResults : searchResults}
        renderItem={renderHotelCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + spacing.lg },
        ]}
        showsVerticalScrollIndicator={false}
      />

      {/* Date Picker Sheet */}
      <DatePickerSheet
        visible={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        onSelect={(checkIn: Date, checkOut?: Date) => {
          if (checkIn && checkOut) {
            setCheckInDate(checkIn);
            setCheckOutDate(checkOut);
          }
          setShowDatePicker(false);
        }}
        tripType="round-trip"
        departureDate={searchParams.checkIn}
        returnDate={searchParams.checkOut}
      />
    </View>
  );
}
