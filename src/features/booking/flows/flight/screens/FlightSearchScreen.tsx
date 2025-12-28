/**
 * FLIGHT SEARCH SCREEN
 * 
 * Single-page flight search with all fields visible.
 * Tapping fields opens bottom sheet modals for selection.
 * Replaces the old multi-step search flow.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeInDown,
} from 'react-native-reanimated';
import { CloseCircle } from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, typography, borderRadius } from '@/styles';
import { useFlightStore } from '../../../stores/useFlightStore';
import { TripType, Airport, CabinClass } from '../../../types/flight.types';
import { PassengerCount } from '../../../types/booking.types';

// Import components
import TripTypeTabs from '../components/TripTypeTabs';
import LocationField from '../components/LocationField';
import SwapButton from '../components/SwapButton';
import DateField from '../components/DateField';
import TravelerField from '../components/TravelerField';
import ClassField from '../components/ClassField';
import AdditionalOptions from '../components/AdditionalOptions';

// Import bottom sheets
import AirportPickerSheet from '../sheets/AirportPickerSheet';
import DatePickerSheet from '../sheets/DatePickerSheet';
import TravelerSheet from '../sheets/TravelerSheet';
import ClassSheet from '../sheets/ClassSheet';

interface FlightSearchScreenProps {
  onSearch: () => void;
  onBack: () => void;
}

export default function FlightSearchScreen({
  onSearch,
  onBack,
}: FlightSearchScreenProps) {
  const insets = useSafeAreaInsets();
  const { searchParams, setSearchParams, swapLocations } = useFlightStore();
  
  // Bottom sheet visibility states
  const [showOriginSheet, setShowOriginSheet] = useState(false);
  const [showDestinationSheet, setShowDestinationSheet] = useState(false);
  const [showDateSheet, setShowDateSheet] = useState(false);
  const [showTravelerSheet, setShowTravelerSheet] = useState(false);
  const [showClassSheet, setShowClassSheet] = useState(false);
  
  // Additional options state
  const [addHotel, setAddHotel] = useState(false);
  const [addCar, setAddCar] = useState(false);
  
  // Validation
  const canSearch = searchParams.origin && searchParams.destination && searchParams.departureDate;
  
  const handleSearch = useCallback(() => {
    if (!canSearch) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSearch();
  }, [canSearch, onSearch]);
  
  const handleSwap = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    swapLocations();
  }, [swapLocations]);
  
  // Format helpers
  const formatPassengers = (): string => {
    const { adults, children, infants } = searchParams.passengers;
    const total = adults + children + infants;
    return total === 1 ? '1 Traveler' : `${total} Travelers`;
  };
  
  const formatClass = (): string => {
    const classMap: Record<string, string> = {
      economy: 'Economy Class',
      premium_economy: 'Premium Economy',
      business: 'Business Class',
      first: 'First Class',
    };
    return classMap[searchParams.cabinClass] || 'Economy Class';
  };
  
  const formatDate = (date: Date | string | null): string => {
    if (!date) return 'Select date';
    // Handle both Date objects and ISO strings
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return 'Select date';
    return dateObj.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header with Background Image */}
      <ImageBackground
        source={require('../../../../../../assets/images/flightbg.png')}
        style={[styles.header, { paddingTop: insets.top + spacing.md }]}
        resizeMode="cover"
      >
        <View style={styles.headerOverlay} />
        <View style={styles.headerContent}>
          <View style={styles.headerSpacer} />
          
          <Text style={styles.title}>Find a Flight</Text>
          
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={onBack}
            activeOpacity={0.7}
          >
            <CloseCircle size={24} color={colors.white} variant="Bold" />
          </TouchableOpacity>
        </View>
      </ImageBackground>
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Trip Type Tabs - Overlapping Header */}
        <Animated.View entering={FadeInDown.duration(300).delay(100)}>
          <TripTypeTabs
            selected={searchParams.tripType}
            onSelect={(type) => setSearchParams({ tripType: type })}
          />
        </Animated.View>
        
        {/* Location Fields */}
        <Animated.View 
          entering={FadeInDown.duration(300).delay(150)}
          style={styles.locationContainer}
        >
          <LocationField
            label="Flight from"
            value={searchParams.origin?.name}
            placeholder="Select departure"
            type="departure"
            onPress={() => setShowOriginSheet(true)}
          />
          
          <SwapButton onPress={handleSwap} />
          
          <LocationField
            label="Flight to"
            value={searchParams.destination?.name}
            placeholder="Select destination"
            type="arrival"
            onPress={() => setShowDestinationSheet(true)}
          />
        </Animated.View>
        
        {/* Date Field */}
        <Animated.View entering={FadeInDown.duration(300).delay(200)}>
          <DateField
            label={searchParams.tripType === 'round-trip' ? 'Departure - Return' : 'Select date'}
            departureDate={formatDate(searchParams.departureDate)}
            returnDate={searchParams.tripType === 'round-trip' ? formatDate(searchParams.returnDate) : undefined}
            onPress={() => setShowDateSheet(true)}
          />
        </Animated.View>
        
        {/* Traveler Field */}
        <Animated.View entering={FadeInDown.duration(300).delay(250)}>
          <TravelerField
            value={formatPassengers()}
            onPress={() => setShowTravelerSheet(true)}
          />
        </Animated.View>
        
        {/* Class Field */}
        <Animated.View entering={FadeInDown.duration(300).delay(300)}>
          <ClassField
            value={formatClass()}
            onPress={() => setShowClassSheet(true)}
          />
        </Animated.View>
        
        {/* Additional Options */}
        <Animated.View entering={FadeInDown.duration(300).delay(350)}>
          <AdditionalOptions
            addHotel={addHotel}
            addCar={addCar}
            onToggleHotel={() => setAddHotel(!addHotel)}
            onToggleCar={() => setAddCar(!addCar)}
          />
        </Animated.View>
      </ScrollView>
      
      {/* Search Button - Fixed at bottom with high zIndex */}
      <View style={[styles.bottomContainer, { paddingBottom: insets.bottom + spacing.md }]}>
        <TouchableOpacity
          style={[styles.searchButton, !canSearch && styles.searchButtonDisabled]}
          onPress={handleSearch}
          activeOpacity={0.8}
          disabled={!canSearch}
        >
          <Text style={styles.searchButtonText}>Search Flights</Text>
        </TouchableOpacity>
      </View>
      
      {/* Bottom Sheets */}
      <AirportPickerSheet
        visible={showOriginSheet}
        onClose={() => setShowOriginSheet(false)}
        onSelect={(airport) => {
          setSearchParams({ origin: airport });
          setShowOriginSheet(false);
        }}
        title="Flight from"
        selectedAirport={searchParams.origin}
      />
      
      <AirportPickerSheet
        visible={showDestinationSheet}
        onClose={() => setShowDestinationSheet(false)}
        onSelect={(airport) => {
          setSearchParams({ destination: airport });
          setShowDestinationSheet(false);
        }}
        title="Flight to"
        selectedAirport={searchParams.destination}
      />
      
      <DatePickerSheet
        visible={showDateSheet}
        onClose={() => setShowDateSheet(false)}
        onSelect={(departure: Date, returnDate?: Date) => {
          setSearchParams({ 
            departureDate: departure,
            returnDate: returnDate || null,
          });
          setShowDateSheet(false);
        }}
        tripType={searchParams.tripType}
        departureDate={searchParams.departureDate}
        returnDate={searchParams.returnDate}
      />
      
      <TravelerSheet
        visible={showTravelerSheet}
        onClose={() => setShowTravelerSheet(false)}
        passengers={searchParams.passengers}
        onSave={(passengers: PassengerCount) => {
          setSearchParams({ passengers });
          setShowTravelerSheet(false);
        }}
      />
      
      <ClassSheet
        visible={showClassSheet}
        onClose={() => setShowClassSheet(false)}
        selected={searchParams.cabinClass}
        onSelect={(cabinClass: CabinClass) => {
          setSearchParams({ cabinClass });
          setShowClassSheet(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    minHeight: 160,
    justifyContent: 'flex-end',
    zIndex: 10,
  },
  headerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl + spacing.lg,
    zIndex: 2,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
    marginTop: -40,
    zIndex: 20,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.lg,
  },
  locationContainer: {
    position: 'relative',
    gap: spacing.md,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.background,
    zIndex: 100,
    elevation: 10,
    // Add shadow for visual separation
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  searchButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.md,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchButtonDisabled: {
    backgroundColor: colors.gray300,
  },
  searchButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
});
