/**
 * FLIGHT SEARCH SCREEN
 * 
 * Unified search experience for flights using the Airbnb-style overlay.
 * Features background image header with accordion-style search sections.
 */

import React, { useCallback, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '@/styles';
import { useFlightStore } from '../../../stores/useFlightStore';
import { 
  UnifiedSearchOverlay, 
  type FlightSearchData,
  type SearchData,
  type Airport as UnifiedAirport,
} from '@/components/features/search/unified';
import { Airport as FlightAirport } from '../../../types/flight.types';

interface FlightSearchScreenProps {
  onSearch: () => void;
  onBack: () => void;
}

// Helper to convert unified Airport to flight store Airport
const toFlightAirport = (airport: UnifiedAirport): FlightAirport => ({
  id: airport.code,
  code: airport.code,
  name: airport.name,
  city: airport.city,
  country: airport.country,
  countryCode: airport.country.substring(0, 2).toUpperCase(),
  type: 'airport',
  timezone: 'UTC',
});

// Helper to convert flight store Airport to unified Airport
const toUnifiedAirport = (airport: FlightAirport | null): UnifiedAirport | null => {
  if (!airport) return null;
  return {
    code: airport.code,
    name: airport.name,
    city: airport.city,
    country: airport.country,
  };
};

export default function FlightSearchScreen({
  onSearch,
  onBack,
}: FlightSearchScreenProps) {
  const { searchParams, setSearchParams } = useFlightStore();

  const handleSearch = useCallback((data: SearchData) => {
    // Type guard to ensure we have flight data
    const flightData = data as FlightSearchData;
    setSearchParams({
      tripType: flightData.tripType,
      origin: flightData.origin ? toFlightAirport(flightData.origin) : null,
      destination: flightData.destination ? toFlightAirport(flightData.destination) : null,
      departureDate: flightData.departureDate,
      returnDate: flightData.returnDate,
      passengers: {
        adults: flightData.passengers.adults,
        children: flightData.passengers.children,
        infants: flightData.passengers.infants,
      },
    });

    onSearch();
  }, [setSearchParams, onSearch]);

  // Map current store data to unified format for initial values
  const initialData = useMemo((): Partial<FlightSearchData> => ({
    tripType: searchParams.tripType as 'one-way' | 'round-trip' | 'multi-city',
    origin: toUnifiedAirport(searchParams.origin),
    destination: toUnifiedAirport(searchParams.destination),
    departureDate: searchParams.departureDate instanceof Date 
      ? searchParams.departureDate 
      : searchParams.departureDate 
        ? new Date(searchParams.departureDate) 
        : null,
    returnDate: searchParams.returnDate instanceof Date 
      ? searchParams.returnDate 
      : searchParams.returnDate 
        ? new Date(searchParams.returnDate) 
        : null,
    passengers: {
      adults: searchParams.passengers.adults || 1,
      children: searchParams.passengers.children || 0,
      infants: searchParams.passengers.infants || 0,
      pets: 0,
    },
  }), [searchParams]);

  return (
    <View style={styles.container}>
      <UnifiedSearchOverlay
        serviceType="flight"
        title="Find a Flight"
        searchButtonLabel="Search"
        backgroundImage={require('../../../../../../assets/images/flightbg.png')}
        onClose={onBack}
        onSearch={handleSearch}
        initialFlightData={initialData}
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
