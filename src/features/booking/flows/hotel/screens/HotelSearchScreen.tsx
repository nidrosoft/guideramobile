/**
 * HOTEL SEARCH SCREEN
 * 
 * Unified search experience for hotels using the Airbnb-style overlay.
 * Features background image header with accordion-style search sections.
 * Matches the flight search screen pattern for consistency.
 */

import React, { useCallback, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '@/styles';
import { useHotelStore } from '../../../stores/useHotelStore';
import { 
  UnifiedSearchOverlay, 
  type HotelSearchData,
  type SearchData,
  type HotelDestination,
} from '@/components/features/search/unified';
import { Location } from '../../../types/booking.types';

interface HotelSearchScreenProps {
  onSearch: () => void;
  onBack: () => void;
}

// Helper to convert unified HotelDestination to store Location
const toStoreLocation = (destination: HotelDestination): Location => ({
  id: destination.id,
  name: destination.name,
  code: destination.city.substring(0, 3).toUpperCase(),
  country: destination.country,
  countryCode: destination.country.substring(0, 2).toUpperCase(),
  type: destination.type === 'city' ? 'city' : 'hotel',
  coordinates: destination.latitude && destination.longitude 
    ? { lat: destination.latitude, lng: destination.longitude }
    : undefined,
});

// Helper to convert store Location to unified HotelDestination
const toUnifiedDestination = (location: Location | null): HotelDestination | null => {
  if (!location) return null;
  return {
    id: location.id || location.name,
    name: location.name,
    city: location.code || location.name,
    country: location.country || '',
    type: location.type === 'city' ? 'city' : 'hotel',
    latitude: location.coordinates?.lat,
    longitude: location.coordinates?.lng,
  };
};

export default function HotelSearchScreen({
  onSearch,
  onBack,
}: HotelSearchScreenProps) {
  const { 
    searchParams, 
    setDestination, 
    setCheckInDate, 
    setCheckOutDate, 
    setGuests,
  } = useHotelStore();

  const handleSearch = useCallback((data: SearchData) => {
    // Type guard to ensure we have hotel data
    const hotelData = data as HotelSearchData;
    
    // Update store with search data
    if (hotelData.destination) {
      setDestination(toStoreLocation(hotelData.destination));
    }
    if (hotelData.checkInDate) {
      setCheckInDate(hotelData.checkInDate);
    }
    if (hotelData.checkOutDate) {
      setCheckOutDate(hotelData.checkOutDate);
    }
    setGuests({
      rooms: hotelData.guests.rooms,
      adults: hotelData.guests.adults,
      children: hotelData.guests.children,
    });

    onSearch();
  }, [setDestination, setCheckInDate, setCheckOutDate, setGuests, onSearch]);

  // Map current store data to unified format for initial values
  const initialData = useMemo((): Partial<HotelSearchData> => {
    // Handle date conversion from store (could be Date or string)
    const checkIn = searchParams.checkIn;
    const checkOut = searchParams.checkOut;
    
    return {
      destination: toUnifiedDestination(searchParams.destination),
      checkInDate: checkIn instanceof Date 
        ? checkIn 
        : checkIn 
          ? new Date(checkIn) 
          : null,
      checkOutDate: checkOut instanceof Date 
        ? checkOut 
        : checkOut 
          ? new Date(checkOut) 
          : null,
      guests: {
        rooms: searchParams.guests.rooms || 1,
        adults: searchParams.guests.adults || 2,
        children: searchParams.guests.children || 0,
      },
    };
  }, [searchParams]);

  return (
    <View style={styles.container}>
      <UnifiedSearchOverlay
        serviceType="hotel"
        title="Find a Hotel"
        searchButtonLabel="Search"
        backgroundImage={require('../../../../../../assets/images/bookingbg.png')}
        onClose={onBack}
        onSearch={handleSearch}
        initialHotelData={initialData}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
