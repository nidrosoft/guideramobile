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
import CarWhereSection from './CarWhereSection';
import CarWhenSection from './CarWhenSection';
import CarWhoSection from './CarWhoSection';
import PackageWhereSection from './PackageWhereSection';
import ExperienceWhereSection from './ExperienceWhereSection';
import { FlightLeg } from './FlightLegCard';
import { SearchSectionCard, WhenSection, WhoSection } from '../overlay';
import { Location as LocationType } from '@/features/booking/types/booking.types';
import { PackageTemplate } from '@/features/booking/types/package.types';
import { ExperienceCategory } from '@/features/booking/types/experience.types';

type ServiceType = 'flight' | 'hotel' | 'car' | 'experience' | 'package';
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

// Car-specific search data
export interface CarSearchData {
  pickupLocation: LocationType | null;
  returnLocation: LocationType | null;
  sameReturnLocation: boolean;
  pickupDate: Date | null;
  pickupTime: string;
  returnDate: Date | null;
  returnTime: string;
  driverAge: number;
}

// Package-specific search data
export interface PackageSearchData {
  packageType: PackageTemplate;
  origin: LocationType | null;
  destination: LocationType | null;
  departureDate: Date | null;
  returnDate: Date | null;
  travelers: GuestCounts;
}

// Experience-specific search data
export interface ExperienceSearchData {
  destination: LocationType | null;
  date: Date | null;
  participants: GuestCounts;
  category: ExperienceCategory | undefined;
}

// Union type for all search data
export type SearchData = FlightSearchData | HotelSearchData | CarSearchData | PackageSearchData | ExperienceSearchData;

interface UnifiedSearchOverlayProps {
  serviceType: ServiceType;
  title: string;
  searchButtonLabel: string;
  backgroundImage: ImageSourcePropType;
  onClose: () => void;
  onSearch: (data: SearchData) => void;
  initialFlightData?: Partial<FlightSearchData>;
  initialHotelData?: Partial<HotelSearchData>;
  initialCarData?: Partial<CarSearchData>;
  initialPackageData?: Partial<PackageSearchData>;
  initialExperienceData?: Partial<ExperienceSearchData>;
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
  initialCarData,
  initialPackageData,
  initialExperienceData,
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

  // ============================================
  // CAR-SPECIFIC STATE
  // ============================================
  const [carPickupLocation, setCarPickupLocation] = useState<LocationType | null>(
    initialCarData?.pickupLocation || null
  );
  const [carReturnLocation, setCarReturnLocation] = useState<LocationType | null>(
    initialCarData?.returnLocation || null
  );
  const [carSameReturn, setCarSameReturn] = useState(initialCarData?.sameReturnLocation ?? true);
  const [carPickupDate, setCarPickupDate] = useState<Date | null>(initialCarData?.pickupDate || null);
  const [carPickupTime, setCarPickupTime] = useState(initialCarData?.pickupTime || '10:00');
  const [carReturnDate, setCarReturnDate] = useState<Date | null>(initialCarData?.returnDate || null);
  const [carReturnTime, setCarReturnTime] = useState(initialCarData?.returnTime || '10:00');
  const [driverAge, setDriverAge] = useState(initialCarData?.driverAge || 30);

  // ============================================
  // PACKAGE-SPECIFIC STATE
  // ============================================
  const [pkgType, setPkgType] = useState<PackageTemplate>(
    initialPackageData?.packageType || 'flight_hotel'
  );
  const [pkgOrigin, setPkgOrigin] = useState<LocationType | null>(initialPackageData?.origin || null);
  const [pkgDestination, setPkgDestination] = useState<LocationType | null>(initialPackageData?.destination || null);
  const [pkgDepartureDate, setPkgDepartureDate] = useState<Date | null>(initialPackageData?.departureDate || null);
  const [pkgReturnDate, setPkgReturnDate] = useState<Date | null>(initialPackageData?.returnDate || null);
  const [pkgTravelers, setPkgTravelers] = useState<GuestCounts>(
    initialPackageData?.travelers || { adults: 1, children: 0, infants: 0, pets: 0 }
  );

  // ============================================
  // EXPERIENCE-SPECIFIC STATE
  // ============================================
  const [expDestination, setExpDestination] = useState<LocationType | null>(
    initialExperienceData?.destination || null
  );
  const [expDate, setExpDate] = useState<Date | null>(initialExperienceData?.date || null);
  const [expParticipants, setExpParticipants] = useState<GuestCounts>(
    initialExperienceData?.participants || { adults: 2, children: 0, infants: 0, pets: 0 }
  );
  const [expCategory, setExpCategory] = useState<ExperienceCategory | undefined>(
    initialExperienceData?.category
  );

  // Check if multi-city mode (flight only)
  const isMultiCity = serviceType === 'flight' && tripType === 'multi-city';

  // Computed display values
  const dateDisplayText = useMemo(() => {
    const fmt = (d: Date | null) => d?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) || '';
    if (serviceType === 'hotel') {
      if (checkInDate && checkOutDate) return `${fmt(checkInDate)} - ${fmt(checkOutDate)}`;
      return 'Add dates';
    }
    if (serviceType === 'car') {
      if (carPickupDate && carReturnDate) return `${fmt(carPickupDate)} - ${fmt(carReturnDate)}`;
      if (carPickupDate) return fmt(carPickupDate);
      return 'Add dates & times';
    }
    if (serviceType === 'package') {
      if (pkgDepartureDate && pkgReturnDate) return `${fmt(pkgDepartureDate)} - ${fmt(pkgReturnDate)}`;
      if (pkgDepartureDate) return fmt(pkgDepartureDate);
      return 'Add dates';
    }
    if (serviceType === 'experience') {
      if (expDate) return fmt(expDate);
      return 'Select date';
    }
    // Flight dates
    if (departureDate && returnDate && tripType === 'round-trip') {
      return `${fmt(departureDate)} - ${fmt(returnDate)}`;
    }
    if (departureDate) return fmt(departureDate);
    return 'Add dates';
  }, [serviceType, departureDate, returnDate, tripType, checkInDate, checkOutDate, carPickupDate, carReturnDate, pkgDepartureDate, pkgReturnDate, expDate]);

  const guestDisplayText = useMemo(() => {
    if (serviceType === 'hotel') {
      const { rooms, adults, children } = hotelGuests;
      let text = `${rooms} room${rooms > 1 ? 's' : ''}, ${adults} adult${adults > 1 ? 's' : ''}`;
      if (children > 0) text += `, ${children} child${children > 1 ? 'ren' : ''}`;
      return text;
    }
    if (serviceType === 'car') {
      return `Driver age: ${driverAge}`;
    }
    if (serviceType === 'package') {
      const total = pkgTravelers.adults + pkgTravelers.children;
      if (total === 0) return 'Add travelers';
      let text = `${total} traveler${total > 1 ? 's' : ''}`;
      if (pkgTravelers.infants > 0) text += `, ${pkgTravelers.infants} infant${pkgTravelers.infants > 1 ? 's' : ''}`;
      return text;
    }
    if (serviceType === 'experience') {
      const total = expParticipants.adults + expParticipants.children;
      if (total === 0) return 'Add guests';
      let text = `${total} guest${total > 1 ? 's' : ''}`;
      if (expParticipants.infants > 0) text += `, ${expParticipants.infants} infant${expParticipants.infants > 1 ? 's' : ''}`;
      return text;
    }
    // Flight passengers
    const total = passengers.adults + passengers.children;
    if (total === 0) return 'Add travelers';
    let text = `${total} traveler${total > 1 ? 's' : ''}`;
    if (passengers.infants > 0) text += `, ${passengers.infants} infant${passengers.infants > 1 ? 's' : ''}`;
    return text;
  }, [serviceType, passengers, hotelGuests, driverAge, pkgTravelers, expParticipants]);

  const whereDisplayText = useMemo(() => {
    if (serviceType === 'hotel') {
      return hotelDestination?.name || 'Select destination';
    }
    if (serviceType === 'car') {
      if (carPickupLocation) return carPickupLocation.name;
      return 'Select pickup location';
    }
    if (serviceType === 'package') {
      if (pkgOrigin && pkgDestination) return `${pkgOrigin.code} → ${pkgDestination.code}`;
      if (pkgOrigin) return `From ${pkgOrigin.name}`;
      if (pkgDestination) return `To ${pkgDestination.name}`;
      return 'Select cities';
    }
    if (serviceType === 'experience') {
      return expDestination?.name || 'Select destination';
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
  }, [serviceType, origin, flightDestination, isMultiCity, multiCityLegs, hotelDestination, carPickupLocation, pkgOrigin, pkgDestination, expDestination]);

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
    if (serviceType === 'car') {
      return !!(carPickupLocation && carPickupDate && carReturnDate);
    }
    if (serviceType === 'package') {
      return !!(pkgOrigin && pkgDestination && pkgDepartureDate && pkgReturnDate && pkgTravelers.adults > 0);
    }
    if (serviceType === 'experience') {
      return !!(expDestination && expDate && expParticipants.adults > 0);
    }
    return true;
  }, [serviceType, origin, flightDestination, departureDate, passengers, isMultiCity, multiCityLegs, hotelDestination, checkInDate, checkOutDate, hotelGuests, carPickupLocation, carPickupDate, carReturnDate, pkgOrigin, pkgDestination, pkgDepartureDate, pkgReturnDate, pkgTravelers, expDestination, expDate, expParticipants]);

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
    } else if (serviceType === 'package') {
      setPkgDepartureDate(start);
      setPkgReturnDate(end);
    } else if (serviceType === 'experience') {
      setExpDate(start);
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
    } else if (serviceType === 'car') {
      setCarPickupLocation(null);
      setCarReturnLocation(null);
      setCarSameReturn(true);
      setCarPickupDate(null);
      setCarPickupTime('10:00');
      setCarReturnDate(null);
      setCarReturnTime('10:00');
      setDriverAge(30);
    } else if (serviceType === 'package') {
      setPkgType('flight_hotel');
      setPkgOrigin(null);
      setPkgDestination(null);
      setPkgDepartureDate(null);
      setPkgReturnDate(null);
      setPkgTravelers({ adults: 1, children: 0, infants: 0, pets: 0 });
    } else if (serviceType === 'experience') {
      setExpDestination(null);
      setExpDate(null);
      setExpParticipants({ adults: 2, children: 0, infants: 0, pets: 0 });
      setExpCategory(undefined);
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
    } else if (serviceType === 'car') {
      onSearch({
        pickupLocation: carPickupLocation,
        returnLocation: carSameReturn ? carPickupLocation : carReturnLocation,
        sameReturnLocation: carSameReturn,
        pickupDate: carPickupDate,
        pickupTime: carPickupTime,
        returnDate: carReturnDate,
        returnTime: carReturnTime,
        driverAge,
      } as CarSearchData);
    } else if (serviceType === 'package') {
      onSearch({
        packageType: pkgType,
        origin: pkgOrigin,
        destination: pkgDestination,
        departureDate: pkgDepartureDate,
        returnDate: pkgReturnDate,
        travelers: pkgTravelers,
      } as PackageSearchData);
    } else if (serviceType === 'experience') {
      onSearch({
        destination: expDestination,
        date: expDate,
        participants: expParticipants,
        category: expCategory,
      } as ExperienceSearchData);
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
  }, [canSearch, serviceType, tripType, origin, flightDestination, departureDate, returnDate, passengers, onSearch, isMultiCity, multiCityLegs, hotelDestination, checkInDate, checkOutDate, hotelGuests, carPickupLocation, carReturnLocation, carSameReturn, carPickupDate, carPickupTime, carReturnDate, carReturnTime, driverAge, pkgType, pkgOrigin, pkgDestination, pkgDepartureDate, pkgReturnDate, pkgTravelers, expDestination, expDate, expParticipants, expCategory]);

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
            {serviceType === 'car' && (
              <CarWhereSection
                pickupLocation={carPickupLocation}
                returnLocation={carReturnLocation}
                sameReturnLocation={carSameReturn}
                onPickupSelect={setCarPickupLocation}
                onReturnSelect={setCarReturnLocation}
                onSameReturnToggle={setCarSameReturn}
              />
            )}
            {serviceType === 'package' && (
              <PackageWhereSection
                packageType={pkgType}
                origin={pkgOrigin}
                destination={pkgDestination}
                onPackageTypeChange={setPkgType}
                onOriginSelect={setPkgOrigin}
                onDestinationSelect={setPkgDestination}
              />
            )}
            {serviceType === 'experience' && (
              <ExperienceWhereSection
                destination={expDestination}
                category={expCategory}
                onDestinationSelect={setExpDestination}
                onCategoryChange={setExpCategory}
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
              {serviceType === 'car' ? (
                <CarWhenSection
                  pickupDate={carPickupDate}
                  pickupTime={carPickupTime}
                  returnDate={carReturnDate}
                  returnTime={carReturnTime}
                  onPickupDateTimeSelect={(date, time) => {
                    setCarPickupDate(date);
                    setCarPickupTime(time);
                  }}
                  onReturnDateTimeSelect={(date, time) => {
                    setCarReturnDate(date);
                    setCarReturnTime(time);
                  }}
                />
              ) : (
                <WhenSection
                  startDate={serviceType === 'hotel' ? checkInDate : (serviceType === 'package' ? pkgDepartureDate : (serviceType === 'experience' ? expDate : departureDate))}
                  endDate={serviceType === 'hotel' ? checkOutDate : (serviceType === 'package' ? pkgReturnDate : (serviceType === 'experience' ? null : (tripType === 'round-trip' ? returnDate : null)))}
                  onSelectDates={handleDatesSelect}
                  singleDateOnly={serviceType === 'experience' || (serviceType === 'flight' && tripType === 'one-way')}
                />
              )}
            </SearchSectionCard>
          )}

          {/* WHO Section */}
          <SearchSectionCard
            title={serviceType === 'hotel' ? 'Guests' : (serviceType === 'car' ? 'Driver' : (serviceType === 'experience' ? 'Guests' : 'Who'))}
            collapsedValue={guestDisplayText}
            isExpanded={activeSection === 'who'}
            onPress={() => handleSectionPress('who')}
          >
            {serviceType === 'hotel' ? (
              <HotelGuestSection
                guests={hotelGuests}
                onGuestsChange={handleHotelGuestsUpdate}
              />
            ) : serviceType === 'car' ? (
              <CarWhoSection
                driverAge={driverAge}
                onAgeChange={setDriverAge}
              />
            ) : (
              <WhoSection
                guests={serviceType === 'package' ? pkgTravelers : (serviceType === 'experience' ? expParticipants : passengers)}
                onUpdateGuests={serviceType === 'package' ? setPkgTravelers : (serviceType === 'experience' ? setExpParticipants : handlePassengersUpdate)}
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
