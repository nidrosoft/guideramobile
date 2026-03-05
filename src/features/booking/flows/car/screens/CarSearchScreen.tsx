/**
 * CAR SEARCH SCREEN
 * 
 * Car search using the UnifiedSearchOverlay for consistency
 * with Flight and Hotel search screens.
 * Syncs search data back to the car store on search.
 */

import React, { useCallback } from 'react';
import { StatusBar } from 'react-native';
import { useCarStore } from '../../../stores/useCarStore';
import { UnifiedSearchOverlay, CarSearchData } from '@/components/features/search/unified';

interface CarSearchScreenProps {
  onSearch: () => void;
  onBack: () => void;
  onClose: () => void;
}

export default function CarSearchScreen({ onSearch, onBack, onClose }: CarSearchScreenProps) {
  const {
    searchParams,
    setPickupLocation,
    setReturnLocation,
    setSameReturnLocation,
    setPickupDate,
    setPickupTime,
    setReturnDate,
    setReturnTime,
    setDriverAge,
  } = useCarStore();

  const handleSearch = useCallback((data: any) => {
    const carData = data as CarSearchData;

    // Sync search data back to car store
    if (carData.pickupLocation) setPickupLocation(carData.pickupLocation);
    if (carData.returnLocation) setReturnLocation(carData.returnLocation);
    setSameReturnLocation(carData.sameReturnLocation);
    if (carData.pickupDate) setPickupDate(carData.pickupDate);
    setPickupTime(carData.pickupTime);
    if (carData.returnDate) setReturnDate(carData.returnDate);
    setReturnTime(carData.returnTime);
    setDriverAge(carData.driverAge);

    onSearch();
  }, [onSearch, setPickupLocation, setReturnLocation, setSameReturnLocation, setPickupDate, setPickupTime, setReturnDate, setReturnTime, setDriverAge]);

  return (
    <>
      <StatusBar barStyle="light-content" />
      <UnifiedSearchOverlay
        serviceType="car"
        title="Find Your Car"
        searchButtonLabel="Search Cars"
        backgroundImage={require('../../../../../../assets/images/carbg.png')}
        onClose={onClose}
        onSearch={handleSearch}
        initialCarData={{
          pickupLocation: searchParams.pickupLocation,
          returnLocation: searchParams.returnLocation,
          sameReturnLocation: searchParams.sameReturnLocation,
          pickupDate: searchParams.pickupDate ? new Date(searchParams.pickupDate) : null,
          pickupTime: searchParams.pickupTime,
          returnDate: searchParams.returnDate ? new Date(searchParams.returnDate) : null,
          returnTime: searchParams.returnTime,
          driverAge: searchParams.driverAge,
        }}
      />
    </>
  );
}
