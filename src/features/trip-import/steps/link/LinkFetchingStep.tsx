/**
 * LINK FETCHING STEP
 * 
 * Step 5 in link import flow - Loading state while fetching trips.
 * Shows spinner and fetching message.
 */

import React, { useEffect } from 'react';
import { StepComponentProps } from '../../types/import-flow.types';
import LoadingStep from '../../components/shared/LoadingStep';

const PROVIDER_NAMES = {
  expedia: 'Expedia',
  booking: 'Booking.com',
  airbnb: 'Airbnb',
  tripadvisor: 'TripAdvisor',
};

export default function LinkFetchingStep({ onNext, data }: StepComponentProps) {
  const provider = data.linkProvider || 'expedia';
  const providerName = PROVIDER_NAMES[provider as keyof typeof PROVIDER_NAMES];

  useEffect(() => {
    // Simulate fetching delay
    const timer = setTimeout(() => {
      // AI TODO: Actually fetch trips from platform
      // const trips = await fetchTripsFromPlatform(data.linkProvider);
      // onNext({ selectedTrips: trips });
      onNext();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onNext]);

  return (
    <LoadingStep
      title="Fetching Trips..."
      message={`Retrieving your bookings from ${providerName}. We're checking for flights, hotels, and activities.`}
    />
  );
}
