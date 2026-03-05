/**
 * EXPERIENCE SEARCH SCREEN
 * 
 * Experience search using the UnifiedSearchOverlay for consistency
 * with Flight, Hotel, Car, and Package search screens.
 * Syncs search data back to the experience store on search.
 */

import React, { useCallback } from 'react';
import { StatusBar } from 'react-native';
import { useExperienceStore } from '../../../stores/useExperienceStore';
import { UnifiedSearchOverlay, ExperienceSearchData } from '@/components/features/search/unified';

interface ExperienceSearchScreenProps {
  onSearch: () => void;
  onBack: () => void;
  onClose: () => void;
}

export default function ExperienceSearchScreen({
  onSearch,
  onBack,
  onClose,
}: ExperienceSearchScreenProps) {
  const {
    searchParams,
    setDestination,
    setDate,
    setParticipants,
    setCategory,
  } = useExperienceStore();

  const handleSearch = useCallback((data: any) => {
    const expData = data as ExperienceSearchData;

    // Sync search data back to experience store
    if (expData.destination) setDestination(expData.destination);
    if (expData.date) setDate(expData.date);
    setCategory(expData.category);
    setParticipants({
      adults: expData.participants.adults,
      children: expData.participants.children,
      infants: expData.participants.infants,
    });

    onSearch();
  }, [onSearch, setDestination, setDate, setParticipants, setCategory]);

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
        serviceType="experience"
        title="Find Experiences"
        searchButtonLabel="Search Experiences"
        backgroundImage={require('../../../../../../assets/images/experiencebg.png')}
        onClose={onClose}
        onSearch={handleSearch}
        initialExperienceData={{
          destination: searchParams.destination,
          date: toDate(searchParams.date),
          participants: {
            adults: searchParams.participants.adults,
            children: searchParams.participants.children,
            infants: searchParams.participants.infants,
            pets: 0,
          },
          category: searchParams.category,
        }}
      />
    </>
  );
}
