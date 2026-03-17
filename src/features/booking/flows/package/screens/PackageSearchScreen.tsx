/**
 * PACKAGE SEARCH SCREEN
 * 
 * Package search using the UnifiedSearchOverlay for consistency
 * with Flight, Hotel, and Car search screens.
 * Syncs search data back to the package store on search.
 */

import React, { useCallback } from 'react';
import { StatusBar } from 'react-native';
import { usePackageStore } from '../../../stores/usePackageStore';
import { UnifiedSearchOverlay, PackageSearchData } from '@/components/features/search/unified';

interface PackageSearchScreenProps {
  onContinue: () => void;
  onClose: () => void;
}

export default function PackageSearchScreen({
  onContinue,
  onClose,
}: PackageSearchScreenProps) {
  const {
    tripSetup,
    setOrigin,
    setDestination,
    setDepartureDate,
    setReturnDate,
    setTravelers,
    setPackageType,
  } = usePackageStore();

  const handleSearch = useCallback((data: any) => {
    const pkgData = data as PackageSearchData;

    // Sync search data back to package store
    if (pkgData.origin) setOrigin(pkgData.origin);
    if (pkgData.destination) setDestination(pkgData.destination);
    if (pkgData.departureDate) setDepartureDate(pkgData.departureDate);
    if (pkgData.returnDate) setReturnDate(pkgData.returnDate);
    setPackageType(pkgData.packageType);
    setTravelers({
      adults: pkgData.travelers.adults,
      children: pkgData.travelers.children,
      infants: pkgData.travelers.infants,
    });

    onContinue();
  }, [onContinue, setOrigin, setDestination, setDepartureDate, setReturnDate, setTravelers, setPackageType]);

  // Safely convert persisted dates
  const toDate = (d: Date | null): Date | null => {
    if (!d) return null;
    const date = d instanceof Date ? d : new Date(d);
    return isNaN(date.getTime()) ? null : date;
  };

  return (
    <>
      <StatusBar barStyle="light-content" />
      <UnifiedSearchOverlay
        serviceType="package"
        title="Build Your Package"
        searchButtonLabel="Build Your Package"
        backgroundImage={require('../../../../../../assets/images/packagebg.jpg')}
        onClose={onClose}
        onSearch={handleSearch}
        initialPackageData={{
          packageType: tripSetup.packageType,
          origin: tripSetup.origin,
          destination: tripSetup.destination,
          departureDate: toDate(tripSetup.departureDate),
          returnDate: toDate(tripSetup.returnDate),
          travelers: {
            adults: tripSetup.travelers.adults,
            children: tripSetup.travelers.children,
            infants: tripSetup.travelers.infants,
            pets: 0,
          },
        }}
      />
    </>
  );
}
