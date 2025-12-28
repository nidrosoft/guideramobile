/**
 * FLIGHT RESULTS SCREEN
 * 
 * Displays flight search results with:
 * - Horizontal date scroll with prices
 * - Filter options (Sort, Transit, Airline, Time)
 * - Flight cards with recommendations
 * - Change Trip bottom sheet
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ImageBackground,
  Modal,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import {
  ArrowLeft,
  ArrowDown2,
  Setting4,
  Airplane,
  Clock,
  TickCircle,
  Calendar,
  Sort,
  Filter,
  DollarCircle,
  Star1,
  Briefcase,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing } from '@/styles';
import { useFlightStore } from '../../../stores/useFlightStore';
import { styles } from './FlightResultsScreen.styles';
import { Flight, FlightSegment } from '../../../types/flight.types';
import ChangeTripSheet from '../sheets/ChangeTripSheet';
import DatePickerSheet from '../sheets/DatePickerSheet';
import { FlightCard, FlightCardData } from '../../../shared/components';

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

// Mock date prices for horizontal scroll
const generateDatePrices = (startDate: Date | string | null) => {
  // Ensure we have a valid Date object
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
      price: Math.floor(Math.random() * 200) + 150,
      isSelected: i === 0,
    });
  }
  return dates;
};

// Filter options with values
const FILTER_OPTIONS = [
  { id: 'sort', label: 'Sort', icon: 'sort', values: ['Price', 'Duration', 'Departure', 'Arrival'] },
  { id: 'filters', label: 'Filters', icon: 'filter', values: ['Direct Only', 'Refundable', 'WiFi', 'Meals Included'] },
  { id: 'price', label: 'Price', icon: 'price', values: ['Under $200', '$200-$400', '$400+'] },
  { id: 'transit', label: 'Stops', icon: 'stops', values: ['Direct', '1 Stop', '2+ Stops'] },
  { id: 'time', label: 'Time', icon: 'time', values: ['Morning', 'Afternoon', 'Evening', 'Night'] },
];

// Mock flight type for display
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
}

export default function FlightResultsScreen({
  onSelectFlight,
  onBack,
  onClose,
}: FlightResultsScreenProps) {
  const insets = useSafeAreaInsets();
  const { searchParams, searchResults } = useFlightStore();
  
  const [showChangeTripSheet, setShowChangeTripSheet] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDateIndex, setSelectedDateIndex] = useState(2); // Center date
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string>>({});
  
  const datePrices = generateDatePrices(searchParams.departureDate || new Date());
  
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
    const iconColor = isSelected ? colors.primary : colors.textPrimary;
    switch (iconType) {
      case 'sort':
        return <Sort size={16} color={iconColor} />;
      case 'filter':
        return <Filter size={16} color={iconColor} />;
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

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatFlightTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  // Facility colors
  const facilityColors: Record<string, { bg: string; text: string }> = {
    'WiFi': { bg: '#EEF2FF', text: '#6366F1' },
    'Meals': { bg: '#FEF3C7', text: '#D97706' },
    '23kg': { bg: '#DCFCE7', text: '#16A34A' },
    'Lounge': { bg: '#FCE7F3', text: '#DB2777' },
  };

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
      facilities: ['WiFi', 'Meals', '23kg'],
    };

    return (
      <FlightCard
        flight={flightData}
        index={index}
        isRecommended={index === 0}
        isBestDeal={index === 1}
        onPress={() => onSelectFlight(item as any)}
      />
    );
  };

  // Generate mock flights for display
  const mockFlights = useMemo(() => {
    const originCode = searchParams.origin?.code || 'JFK';
    const destCode = searchParams.destination?.code || 'ATL';
    
    const createMockFlight = (id: string, depHour: number, arrHour: number, price: number, stops: number, airlineName: string) => {
      const depTime = new Date();
      depTime.setHours(depHour, Math.floor(Math.random() * 60), 0);
      const arrTime = new Date();
      arrTime.setHours(arrHour, Math.floor(Math.random() * 60), 0);
      const duration = (arrHour - depHour) * 60 + Math.floor(Math.random() * 30);
      
      return {
        id,
        airlineName,
        airlineCode: airlineName.substring(0, 2).toUpperCase(),
        flightNumber: `${airlineName.substring(0, 2).toUpperCase()}${Math.floor(Math.random() * 900) + 100}`,
        originCode,
        destCode,
        departureTime: depTime,
        arrivalTime: arrTime,
        duration,
        stops,
        price,
        seatsAvailable: Math.floor(Math.random() * 20) + 5,
      };
    };
    
    return [
      createMockFlight('1', 6, 9, 189, 0, 'Delta Airlines'),
      createMockFlight('2', 8, 12, 156, 1, 'American Airlines'),
      createMockFlight('3', 10, 13, 210, 0, 'United Airlines'),
      createMockFlight('4', 12, 16, 145, 1, 'Southwest Airlines'),
      createMockFlight('5', 14, 17, 178, 0, 'JetBlue Airways'),
      createMockFlight('6', 16, 20, 199, 1, 'Spirit Airlines'),
    ];
  }, [searchParams.origin?.code, searchParams.destination?.code]);

  // Use mock data for now
  const flights = mockFlights;

  return (
    <View style={styles.container}>
      {/* Header with Background Image */}
      <ImageBackground
        source={require('../../../../../../assets/images/flightbg.png')}
        style={[styles.header, { paddingTop: insets.top + spacing.md }]}
        resizeMode="cover"
      >
        <View style={styles.headerOverlay} />
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <ArrowLeft size={24} color={colors.white} />
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
                  isActive && styles.filterButtonActive,
                  hasSelection && styles.filterButtonSelected,
                ]}
                onPress={() => handleFilterPress(filter.id)}
              >
                {getFilterIcon(filter.icon, hasSelection)}
                <Text style={[
                  styles.filterText,
                  hasSelection && styles.filterTextSelected,
                ]}>
                  {selectedFilters[filter.id] || filter.label}
                </Text>
                <ArrowDown2 
                  size={14} 
                  color={hasSelection ? colors.primary : colors.textSecondary} 
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
      
      {/* Flight List */}
      <FlatList
        data={flights}
        keyExtractor={(item) => item.id}
        renderItem={renderFlightCard}
        contentContainerStyle={[
          styles.flightList,
          { paddingBottom: insets.bottom + spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      />
      
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
