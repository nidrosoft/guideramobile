/**
 * FLIGHT RESULTS SCREEN
 * 
 * Displays flight search results with:
 * - Horizontal date scroll with prices
 * - Filter options (Sort, Transit, Airline, Time)
 * - Flight cards with recommendations
 * - Change Trip bottom sheet
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ImageBackground,
  Modal,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import {
  ArrowLeft2,
  ArrowDown2,
  Airplane,
  Clock,
  TickCircle,
  Calendar,
  Sort,
  DollarCircle,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { useFlightStore } from '../../../stores/useFlightStore';
import { styles } from './FlightResultsScreen.styles';
import { Flight, FlightSegment } from '../../../types/flight.types';
import ChangeTripSheet from '../sheets/ChangeTripSheet';
import DatePickerSheet from '../sheets/DatePickerSheet';
import { FlightCard, FlightCardData } from '../../../shared/components';
import { useFlightSearchState } from '../../../stores/flightSearchState';

// Helper to format time from Date
const formatTime = (date: Date | undefined): string => {
  if (!date) return '';
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
};

// Helper to get display info from Flight
const getFlightDisplayInfo = (flight: Flight) => {
  const firstSegment = flight.segments[0];
  const lastSegment = flight.segments[flight.segments.length - 1];
  
  return {
    airline: firstSegment?.airline,
    departureTime: formatTime(firstSegment?.departureTime),
    arrivalTime: formatTime(lastSegment?.arrivalTime),
    origin: firstSegment?.origin,
    destination: lastSegment?.destination,
    duration: `${Math.floor(flight.totalDuration / 60)}h ${flight.totalDuration % 60}m`,
    stops: flight.stops,
    price: flight.price,
  };
};

interface FlightResultsScreenProps {
  onSelectFlight: (flight: Flight) => void;
  onBack: () => void;
  onClose: () => void;
}

const generateDateRange = (startDate: Date | string | null, currentPrice?: number) => {
  let baseDate: Date;
  if (!startDate) {
    baseDate = new Date();
  } else if (startDate instanceof Date) {
    baseDate = startDate;
  } else {
    baseDate = new Date(startDate);
    if (isNaN(baseDate.getTime())) baseDate = new Date();
  }
  
  const dates = [];
  for (let i = -2; i < 7; i++) {
    const date = new Date(baseDate);
    date.setDate(date.getDate() + i);
    dates.push({
      date,
      price: i === 0 ? (currentPrice || null) : null,
      isSelected: i === 0,
    });
  }
  return dates;
};

const FILTER_OPTIONS = [
  { id: 'sort', label: 'Sort', icon: 'sort', values: ['Price', 'Duration', 'Departure', 'Arrival'] },
  { id: 'price', label: 'Price', icon: 'price', values: ['Under $200', '$200-$400', '$400-$600', '$600+'] },
  { id: 'transit', label: 'Stops', icon: 'stops', values: ['Direct', '1 Stop', '2+ Stops'] },
  { id: 'time', label: 'Time', icon: 'time', values: ['Morning', 'Afternoon', 'Evening', 'Night'] },
];

interface MockFlight {
  id: string;
  airlineName: string;
  airlineCode: string;
  flightNumber: string;
  originCode: string;
  destCode: string;
  departureTime: Date;
  arrivalTime: Date;
  duration: number;
  stops: number;
  price: number;
  seatsAvailable: number;
  airlineLogo?: string;
}

export default function FlightResultsScreen({
  onSelectFlight,
  onBack,
  onClose,
}: FlightResultsScreenProps) {
  const insets = useSafeAreaInsets();
  const { colors: tc } = useTheme();
  const { searchParams, searchResults } = useFlightStore();
  
  // Use the shared flight search state (populated by FlightSearchLoadingScreen)
  const searchState = useFlightSearchState();
  
  const [showChangeTripSheet, setShowChangeTripSheet] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDateIndex, setSelectedDateIndex] = useState(2); // Center date
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string>>({});
  
  
  const formatRouteHeader = () => {
    const origin = searchParams.origin?.code || 'SAN';
    const destination = searchParams.destination?.code || 'CDG';
    return `${origin} → ${destination}`;
  };
  
  const formatDateHeader = () => {
    if (!searchParams.departureDate) return '';
    // Handle both Date objects and string dates
    const date = searchParams.departureDate instanceof Date 
      ? searchParams.departureDate 
      : new Date(searchParams.departureDate);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };
  
  const handleDateSelect = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedDateIndex(index);
  };
  
  const handleFlightSelect = (flight: Flight) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSelectFlight(flight);
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
    const iconColor = isSelected ? tc.primary : tc.textPrimary;
    switch (iconType) {
      case 'sort':
        return <Sort size={16} color={iconColor} />;
      case 'price':
        return <DollarCircle size={16} color={iconColor} />;
      case 'stops':
        return <Airplane size={16} color={iconColor} />;
      case 'time':
        return <Clock size={16} color={iconColor} />;
      default:
        return null;
    }
  };

  const renderDateItem = ({ item, index }: { item: typeof datePrices[0]; index: number }) => {
    const isSelected = index === selectedDateIndex;
    const dayName = item.date.toLocaleDateString('en-US', { weekday: 'short' });
    const dayNum = item.date.getDate();
    const month = item.date.toLocaleDateString('en-US', { month: 'short' });
    
    return (
      <TouchableOpacity
        style={[styles.dateItem, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle }, isSelected && { backgroundColor: `${tc.primary}10`, borderColor: tc.primary }]}
        onPress={() => handleDateSelect(index)}
        activeOpacity={0.7}
      >
        <Text style={[styles.dateDay, { color: tc.textPrimary }, isSelected && { color: tc.textPrimary }]}>
          {dayName}, {dayNum} {month}
        </Text>
        <Text style={[styles.datePrice, { color: isSelected ? tc.primary : tc.textTertiary }]}>
          {item.price != null ? `$${item.price.toLocaleString('en-US')}` : '–'}
        </Text>
      </TouchableOpacity>
    );
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatFlightTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  // Convert API results to display format
  const flights = useMemo(() => {
    if (searchState.results.length === 0) return [];
    
    return searchState.results.map((result: any) => {
      const outbound = result.outbound || {};
      const firstSegment = outbound.segments?.[0] || {};
      
      return {
        id: result.id,
        airlineName: firstSegment.carrier?.name || 'Unknown Airline',
        airlineCode: firstSegment.carrier?.code || 'XX',
        flightNumber: firstSegment.flightNumber || '',
        originCode: outbound.departure?.airport || searchParams.origin?.code || 'JFK',
        destCode: outbound.arrival?.airport || searchParams.destination?.code || 'LAX',
        departureTime: outbound.departure?.time ? new Date(outbound.departure.time) : new Date(),
        arrivalTime: outbound.arrival?.time ? new Date(outbound.arrival.time) : new Date(),
        duration: result.totalDurationMinutes || outbound.duration || 0,
        stops: result.totalStops || outbound.stops || 0,
        price: result.price?.amount || 0,
        seatsAvailable: 10,
        airlineLogo: result.airlineLogo || firstSegment.carrier?.logo || undefined,
      };
    });
  }, [searchState.results, searchParams.origin?.code, searchParams.destination?.code]);

  const cheapestPrice = useMemo(() => {
    if (flights.length === 0) return null;
    return Math.min(...flights.map(f => f.price));
  }, [flights]);

  const datePrices = useMemo(
    () => generateDateRange(searchParams.departureDate || new Date(), cheapestPrice ?? undefined),
    [searchParams.departureDate, cheapestPrice]
  );

  // Apply filters to flight results
  const filteredFlights = useMemo(() => {
    let result = [...flights];

    const stopsFilter = selectedFilters['transit'];
    if (stopsFilter === 'Direct') {
      result = result.filter(f => f.stops === 0);
    } else if (stopsFilter === '1 Stop') {
      result = result.filter(f => f.stops === 1);
    } else if (stopsFilter === '2+ Stops') {
      result = result.filter(f => f.stops >= 2);
    }

    const priceFilter = selectedFilters['price'];
    if (priceFilter === 'Under $200') {
      result = result.filter(f => f.price < 200);
    } else if (priceFilter === '$200-$400') {
      result = result.filter(f => f.price >= 200 && f.price <= 400);
    } else if (priceFilter === '$400-$600') {
      result = result.filter(f => f.price > 400 && f.price <= 600);
    } else if (priceFilter === '$600+') {
      result = result.filter(f => f.price > 600);
    }

    const timeFilter = selectedFilters['time'];
    if (timeFilter) {
      result = result.filter(f => {
        const hour = f.departureTime instanceof Date ? f.departureTime.getHours() : new Date(f.departureTime).getHours();
        switch (timeFilter) {
          case 'Morning': return hour >= 5 && hour < 12;
          case 'Afternoon': return hour >= 12 && hour < 17;
          case 'Evening': return hour >= 17 && hour < 21;
          case 'Night': return hour >= 21 || hour < 5;
          default: return true;
        }
      });
    }

    const sortOption = selectedFilters['sort'];
    if (sortOption === 'Price') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortOption === 'Duration') {
      result.sort((a, b) => a.duration - b.duration);
    } else if (sortOption === 'Departure') {
      result.sort((a, b) => {
        const aTime = a.departureTime instanceof Date ? a.departureTime.getTime() : new Date(a.departureTime).getTime();
        const bTime = b.departureTime instanceof Date ? b.departureTime.getTime() : new Date(b.departureTime).getTime();
        return aTime - bTime;
      });
    } else if (sortOption === 'Arrival') {
      result.sort((a, b) => {
        const aTime = a.arrivalTime instanceof Date ? a.arrivalTime.getTime() : new Date(a.arrivalTime).getTime();
        const bTime = b.arrivalTime instanceof Date ? b.arrivalTime.getTime() : new Date(b.arrivalTime).getTime();
        return aTime - bTime;
      });
    }

    return result;
  }, [flights, selectedFilters]);

  // Calculate best deal and recommended flights
  const { bestDealId, recommendedId } = useMemo(() => {
    if (filteredFlights.length === 0) return { bestDealId: null, recommendedId: null };
    
    const sortedByPrice = [...filteredFlights].sort((a, b) => a.price - b.price);
    const bestDeal = sortedByPrice[0];
    
    const scored = filteredFlights.map(f => {
      const priceScore = 100 - (f.price / (sortedByPrice[sortedByPrice.length - 1]?.price || 1)) * 100;
      const durationScore = 100 - (f.duration / Math.max(...filteredFlights.map(x => x.duration))) * 100;
      const stopsScore = f.stops === 0 ? 100 : f.stops === 1 ? 60 : 30;
      const depHour = f.departureTime instanceof Date ? f.departureTime.getHours() : new Date(f.departureTime).getHours();
      const timeScore = depHour >= 6 && depHour <= 10 ? 100 : depHour >= 10 && depHour <= 14 ? 80 : 50;
      
      return {
        id: f.id,
        score: priceScore * 0.4 + durationScore * 0.3 + stopsScore * 0.2 + timeScore * 0.1
      };
    });
    const recommended = scored.sort((a, b) => b.score - a.score)[0];
    
    // If best deal and recommended are the same, pick second best for recommended
    if (bestDeal?.id === recommended?.id && scored.length > 1) {
      return { bestDealId: bestDeal?.id, recommendedId: scored[1]?.id };
    }
    
    return { bestDealId: bestDeal?.id, recommendedId: recommended?.id };
  }, [filteredFlights]);

  // Use the shared FlightCard component for consistent premium UI
  const renderFlightCard = ({ item, index }: { item: MockFlight; index: number }) => {
    const flightData: FlightCardData = {
      id: item.id,
      airlineName: item.airlineName,
      airlineCode: item.airlineCode,
      flightNumber: item.flightNumber,
      originCode: item.originCode,
      destCode: item.destCode,
      departureTime: item.departureTime,
      arrivalTime: item.arrivalTime,
      duration: item.duration,
      stops: item.stops,
      price: item.price,
      seatsAvailable: item.seatsAvailable,
      airlineLogo: item.airlineLogo,
    };

    // Convert MockFlight to proper Flight type for FlightDealScreen
    const toFlight = (): Flight => ({
      id: item.id,
      segments: [{
        id: `${item.id}-seg-0`,
        flightNumber: item.flightNumber,
        airline: {
          code: item.airlineCode,
          name: item.airlineName,
          logo: '',
        },
        aircraft: '',
        origin: {
          type: 'airport' as const,
          id: item.originCode,
          name: item.originCode,
          code: item.originCode,
          city: item.originCode,
          timezone: '',
        },
        destination: {
          type: 'airport' as const,
          id: item.destCode,
          name: item.destCode,
          code: item.destCode,
          city: item.destCode,
          timezone: '',
        },
        departureTime: item.departureTime instanceof Date ? item.departureTime : new Date(item.departureTime),
        arrivalTime: item.arrivalTime instanceof Date ? item.arrivalTime : new Date(item.arrivalTime),
        duration: item.duration,
        cabinClass: 'economy' as const,
        status: 'scheduled' as const,
      }],
      layovers: [],
      totalDuration: item.duration,
      stops: item.stops,
      price: {
        amount: item.price,
        currency: 'USD',
        formatted: `$${item.price}`,
      },
      seatsAvailable: item.seatsAvailable,
      refundable: false,
      changeable: false,
      baggageIncluded: {
        cabin: { included: true, quantity: 1, weight: 7 },
        checked: { included: false, quantity: 0, weight: 0 },
      },
      fareClass: 'economy',
    });

    return (
      <FlightCard
        flight={flightData}
        index={index}
        isRecommended={item.id === recommendedId}
        isBestDeal={item.id === bestDealId}
        onPress={() => onSelectFlight(toFlight())}
      />
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: tc.background }]}>
      {/* Header with Background Image */}
      <ImageBackground
        source={require('../../../../../../assets/images/flightbg.jpg')}
        style={[styles.header, { paddingTop: insets.top + spacing.md }]}
        resizeMode="cover"
      >
        <View style={styles.headerOverlay} />
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <ArrowLeft2 size={24} color={colors.white} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.routeInfo}
            onPress={() => setShowChangeTripSheet(true)}
          >
            <Text style={styles.routeText}>{formatRouteHeader()}</Text>
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
      <Animated.View entering={FadeIn.duration(300)}>
        <FlatList
          data={datePrices}
          keyExtractor={(_, index) => index.toString()}
          renderItem={renderDateItem}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dateScroll}
          initialScrollIndex={2}
          getItemLayout={(_, index) => ({
            length: 120,
            offset: 120 * index,
            index,
          })}
        />
      </Animated.View>
      
      {/* Filters - Horizontally Scrollable */}
      <View style={styles.filtersContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersRow}
        >
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
        
        {/* Filter Dropdown */}
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
      
      {/* Flight List */}
      {searchState.isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 }}>
          <ActivityIndicator size="large" color={tc.primary} />
          <Text style={{ marginTop: 16, color: tc.textSecondary }}>
            Searching {searchState.totalCount > 0 ? `${searchState.totalCount} flights...` : 'flights...'}
          </Text>
        </View>
      ) : searchState.error ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60, paddingHorizontal: 20 }}>
          <Text style={{ color: tc.error, textAlign: 'center' }}>{searchState.error}</Text>
        </View>
      ) : filteredFlights.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 }}>
          <Airplane size={48} color={tc.textSecondary} />
          <Text style={{ marginTop: 16, color: tc.textSecondary }}>
            {flights.length > 0 ? 'No flights match your filters' : 'No flights found'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredFlights}
          keyExtractor={(item) => item.id}
          renderItem={renderFlightCard}
          contentContainerStyle={[
            styles.flightList,
            { paddingBottom: insets.bottom + spacing.xl },
          ]}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Text style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, color: tc.textSecondary }}>
              {filteredFlights.length === flights.length
                ? `${flights.length} flights found`
                : `${filteredFlights.length} of ${flights.length} flights`}
            </Text>
          }
        />
      )}
      
      {/* Change Trip Sheet */}
      <ChangeTripSheet
        visible={showChangeTripSheet}
        onClose={() => setShowChangeTripSheet(false)}
        onSave={() => setShowChangeTripSheet(false)}
      />
      
      {/* Date Picker Sheet */}
      <DatePickerSheet
        visible={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        onSelect={(departure) => {
          useFlightStore.getState().setSearchParams({ departureDate: departure });
          setShowDatePicker(false);
        }}
        tripType="one-way"
        departureDate={searchParams.departureDate}
        returnDate={null}
      />
    </View>
  );
}
