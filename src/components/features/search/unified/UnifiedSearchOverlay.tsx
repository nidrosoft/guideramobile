/**
 * UNIFIED SEARCH OVERLAY
 * 
 * Full-screen search overlay with background image header.
 * Supports different service types (flight, hotel, car, experience).
 * Uses Airbnb-style accordion sections.
 * 
 * Service Type Behavior:
 * - Flight: Where (From/To) + When (departure + return) + Who (travelers)
 * - Hotel: Where (destination) + When (check-in/out) + Who (rooms/guests)
 * - Car: Where (pickup/dropoff) + When (dates) + Who (driver age)
 * - Experience: Where (destination) + When (date) + Who (participants)
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ImageSourcePropType,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { spacing } from '@/styles';
import { useTheme } from '@/context/ThemeContext';

import UnifiedSearchHeader from './UnifiedSearchHeader';
import UnifiedSearchFooter from './UnifiedSearchFooter';
import FlightWhereSection, { TripType, Airport } from './FlightWhereSection';
import MultiCitySection from './MultiCitySection';
import HotelWhereSection, { HotelDestination } from './HotelWhereSection';
import HotelGuestSection, { HotelGuestCount } from './HotelGuestSection';
import { FlightLeg } from './FlightLegCard';
import { SearchSectionCard, WhenSection, WhoSection } from '../overlay';

type ServiceType = 'flight' | 'hotel' | 'car' | 'experience';
type ActiveSection = 'where' | 'when' | 'who' | null;

interface GuestCounts {
  adults: number;
  children: number;
  infants: number;
  pets: number;
}

// Flight-specific search data
export interface FlightSearchData {
  tripType: TripType;
  origin: Airport | null;
  destination: Airport | null;
  departureDate: Date | null;
  returnDate: Date | null;
  passengers: GuestCounts;
  legs?: FlightLeg[]; // For multi-city
}

// Hotel-specific search data
export interface HotelSearchData {
  destination: HotelDestination | null;
  checkInDate: Date | null;
  checkOutDate: Date | null;
  guests: HotelGuestCount;
}

// Union type for all search data
export type SearchData = FlightSearchData | HotelSearchData;

interface UnifiedSearchOverlayProps {
  serviceType: ServiceType;
  title: string;
  searchButtonLabel: string;
  backgroundImage: ImageSourcePropType;
  onClose: () => void;
  onSearch: (data: SearchData) => void;
  initialFlightData?: Partial<FlightSearchData>;
  initialHotelData?: Partial<HotelSearchData>;
}

export default function UnifiedSearchOverlay({
  serviceType,
  title,
  searchButtonLabel,
  backgroundImage,
  onClose,
  onSearch,
  initialFlightData,
  initialHotelData,
}: UnifiedSearchOverlayProps) {
  const { colors: themeColors } = useTheme();
  
  // Active section state
  const [activeSection, setActiveSection] = useState<ActiveSection>('where');
  
  // ============================================
  // FLIGHT-SPECIFIC STATE
  // ============================================
  const [tripType, setTripType] = useState<TripType>(initialFlightData?.tripType || 'round-trip');
  const [origin, setOrigin] = useState<Airport | null>(initialFlightData?.origin || null);
  const [flightDestination, setFlightDestination] = useState<Airport | null>(initialFlightData?.destination || null);
  const [departureDate, setDepartureDate] = useState<Date | null>(initialFlightData?.departureDate || null);
  const [returnDate, setReturnDate] = useState<Date | null>(initialFlightData?.returnDate || null);
  const [passengers, setPassengers] = useState<GuestCounts>(
    initialFlightData?.passengers || { adults: 1, children: 0, infants: 0, pets: 0 }
  );
  const [multiCityLegs, setMultiCityLegs] = useState<FlightLeg[]>(
    initialFlightData?.legs || [
      { id: 'leg-1', origin: null, destination: null, date: null },
      { id: 'leg-2', origin: null, destination: null, date: null },
    ]
  );

  // ============================================
  // HOTEL-SPECIFIC STATE
  // ============================================
  const [hotelDestination, setHotelDestination] = useState<HotelDestination | null>(
    initialHotelData?.destination || null
  );
  const [checkInDate, setCheckInDate] = useState<Date | null>(initialHotelData?.checkInDate || null);
  const [checkOutDate, setCheckOutDate] = useState<Date | null>(initialHotelData?.checkOutDate || null);
  const [hotelGuests, setHotelGuests] = useState<HotelGuestCount>(
    initialHotelData?.guests || { rooms: 1, adults: 2, children: 0 }
  );

  // Check if multi-city mode (flight only)
  const isMultiCity = serviceType === 'flight' && tripType === 'multi-city';

  // Computed display values
  const dateDisplayText = useMemo(() => {
    if (serviceType === 'hotel') {
      if (checkInDate && checkOutDate) {
        const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
        return `${checkInDate.toLocaleDateString('en-US', options)} - ${checkOutDate.toLocaleDateString('en-US', options)}`;
      }
      return 'Add dates';
    }
    // Flight dates
    if (departureDate && returnDate && tripType === 'round-trip') {
      const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
      return `${departureDate.toLocaleDateString('en-US', options)} - ${returnDate.toLocaleDateString('en-US', options)}`;
    }
    if (departureDate) {
      return departureDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    return 'Add dates';
  }, [serviceType, departureDate, returnDate, tripType, checkInDate, checkOutDate]);

  const guestDisplayText = useMemo(() => {
    if (serviceType === 'hotel') {
      const { rooms, adults, children } = hotelGuests;
      let text = `${rooms} room${rooms > 1 ? 's' : ''}, ${adults} adult${adults > 1 ? 's' : ''}`;
      if (children > 0) text += `, ${children} child${children > 1 ? 'ren' : ''}`;
      return text;
    }
    // Flight passengers
    const total = passengers.adults + passengers.children;
    if (total === 0) return 'Add travelers';
    let text = `${total} traveler${total > 1 ? 's' : ''}`;
    if (passengers.infants > 0) text += `, ${passengers.infants} infant${passengers.infants > 1 ? 's' : ''}`;
    return text;
  }, [serviceType, passengers, hotelGuests]);

  const whereDisplayText = useMemo(() => {
    if (serviceType === 'hotel') {
      return hotelDestination?.name || 'Select destination';
    }
    // Flight where
    if (isMultiCity) {
      const completedLegs = multiCityLegs.filter(l => l.origin && l.destination).length;
      if (completedLegs === 0) return 'Add flights';
      return `${completedLegs} flight${completedLegs > 1 ? 's' : ''} added`;
    }
    if (origin && flightDestination) {
      return `${origin.code} → ${flightDestination.code}`;
    }
    if (origin) return `From ${origin.code}`;
    if (flightDestination) return `To ${flightDestination.code}`;
    return 'Select cities';
  }, [serviceType, origin, flightDestination, isMultiCity, multiCityLegs, hotelDestination]);

  // Validation
  const canSearch = useMemo((): boolean => {
    if (serviceType === 'flight') {
      if (isMultiCity) {
        const allLegsComplete = multiCityLegs.every(l => l.origin && l.destination && l.date);
        return allLegsComplete && passengers.adults > 0;
      }
      return !!(origin && flightDestination && departureDate && passengers.adults > 0);
    }
    if (serviceType === 'hotel') {
      return !!(hotelDestination && checkInDate && checkOutDate && hotelGuests.adults > 0);
    }
    return true;
  }, [serviceType, origin, flightDestination, departureDate, passengers, isMultiCity, multiCityLegs, hotelDestination, checkInDate, checkOutDate, hotelGuests]);

  // Handlers
  const handleSectionPress = useCallback((section: ActiveSection) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveSection(section);
  }, []);

  const handleSwapLocations = useCallback(() => {
    const temp = origin;
    setOrigin(flightDestination);
    setFlightDestination(temp);
  }, [origin, flightDestination]);

  const handleDatesSelect = useCallback((start: Date | null, end: Date | null) => {
    if (serviceType === 'hotel') {
      setCheckInDate(start);
      setCheckOutDate(end);
    } else {
      setDepartureDate(start);
      setReturnDate(end);
    }
  }, [serviceType]);

  const handlePassengersUpdate = useCallback((newPassengers: GuestCounts) => {
    setPassengers(newPassengers);
  }, []);

  const handleHotelGuestsUpdate = useCallback((newGuests: HotelGuestCount) => {
    setHotelGuests(newGuests);
  }, []);

  const handleClearAll = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (serviceType === 'hotel') {
      setHotelDestination(null);
      setCheckInDate(null);
      setCheckOutDate(null);
      setHotelGuests({ rooms: 1, adults: 2, children: 0 });
    } else {
      setTripType('round-trip');
      setOrigin(null);
      setFlightDestination(null);
      setDepartureDate(null);
      setReturnDate(null);
      setPassengers({ adults: 1, children: 0, infants: 0, pets: 0 });
      setMultiCityLegs([
        { id: 'leg-1', origin: null, destination: null, date: null },
        { id: 'leg-2', origin: null, destination: null, date: null },
      ]);
    }
    setActiveSection('where');
  }, [serviceType]);

  const handleSearch = useCallback(() => {
    if (!canSearch) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    if (serviceType === 'hotel') {
      onSearch({
        destination: hotelDestination,
        checkInDate,
        checkOutDate,
        guests: hotelGuests,
      } as HotelSearchData);
    } else {
      onSearch({
        tripType,
        origin: isMultiCity ? null : origin,
        destination: isMultiCity ? null : flightDestination,
        departureDate: isMultiCity ? null : departureDate,
        returnDate: tripType === 'round-trip' ? returnDate : null,
        passengers,
        legs: isMultiCity ? multiCityLegs : undefined,
      } as FlightSearchData);
    }
  }, [canSearch, serviceType, tripType, origin, flightDestination, departureDate, returnDate, passengers, onSearch, isMultiCity, multiCityLegs, hotelDestination, checkInDate, checkOutDate, hotelGuests]);

  const handleClose = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  }, [onClose]);

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      {/* Header with Background Image */}
      <UnifiedSearchHeader
        title={title}
        backgroundImage={backgroundImage}
        onClose={handleClose}
      />

      {/* Scrollable Content */}
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* WHERE Section */}
          <SearchSectionCard
            title="Where"
            collapsedValue={whereDisplayText}
            isExpanded={activeSection === 'where'}
            onPress={() => handleSectionPress('where')}
          >
            {serviceType === 'flight' && !isMultiCity && (
              <FlightWhereSection
                tripType={tripType}
                origin={origin}
                destination={flightDestination}
                onTripTypeChange={setTripType}
                onOriginSelect={setOrigin}
                onDestinationSelect={setFlightDestination}
                onSwap={handleSwapLocations}
              />
            )}
            {serviceType === 'flight' && isMultiCity && (
              <MultiCitySection
                legs={multiCityLegs}
                onLegsChange={setMultiCityLegs}
                tripType={tripType}
                onTripTypeChange={setTripType}
              />
            )}
            {serviceType === 'hotel' && (
              <HotelWhereSection
                destination={hotelDestination}
                onDestinationSelect={setHotelDestination}
              />
            )}
          </SearchSectionCard>

          {/* WHEN Section - Hidden for multi-city (dates are per leg) */}
          {!isMultiCity && (
            <SearchSectionCard
              title="When"
              collapsedValue={dateDisplayText}
              isExpanded={activeSection === 'when'}
              onPress={() => handleSectionPress('when')}
            >
              <WhenSection
                startDate={serviceType === 'hotel' ? checkInDate : departureDate}
                endDate={serviceType === 'hotel' ? checkOutDate : (tripType === 'round-trip' ? returnDate : null)}
                onSelectDates={handleDatesSelect}
                singleDateOnly={serviceType === 'flight' && tripType === 'one-way'}
              />
            </SearchSectionCard>
          )}

          {/* WHO Section */}
          <SearchSectionCard
            title={serviceType === 'hotel' ? 'Guests' : 'Who'}
            collapsedValue={guestDisplayText}
            isExpanded={activeSection === 'who'}
            onPress={() => handleSectionPress('who')}
          >
            {serviceType === 'hotel' ? (
              <HotelGuestSection
                guests={hotelGuests}
                onGuestsChange={handleHotelGuestsUpdate}
              />
            ) : (
              <WhoSection
                guests={passengers}
                onUpdateGuests={handlePassengersUpdate}
              />
            )}
          </SearchSectionCard>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Footer */}
      <UnifiedSearchFooter
        searchLabel={searchButtonLabel}
        onClear={handleClearAll}
        onSearch={handleSearch}
        canSearch={canSearch}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    marginTop: -30,
    zIndex: 20,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl * 2,
    gap: spacing.sm,
  },
});
