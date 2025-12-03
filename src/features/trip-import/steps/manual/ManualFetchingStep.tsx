/**
 * MANUAL FETCHING STEP
 * 
 * Step 4 in manual import flow - Loading state while fetching booking.
 * Shows spinner and fetching message based on booking type.
 */

import React, { useEffect } from 'react';
import { StepComponentProps } from '../../types/import-flow.types';
import LoadingStep from '../../components/shared/LoadingStep';

const TYPE_MESSAGES = {
  flight: 'Fetching your flight details from the airline...',
  hotel: 'Retrieving your hotel reservation details...',
  car: 'Looking up your car rental booking...',
  activity: 'Finding your activity booking...',
};

export default function ManualFetchingStep({ onNext, data }: StepComponentProps) {
  const type = data.manualType || 'flight';
  const message = TYPE_MESSAGES[type as keyof typeof TYPE_MESSAGES];

  useEffect(() => {
    // Simulate fetching delay
    const timer = setTimeout(() => {
      // AI TODO: Actually fetch booking details from provider
      // const booking = await fetchBookingDetails(data.confirmationCode, data.airline, etc.);
      onNext();
    }, 2500);

    return () => clearTimeout(timer);
  }, [onNext]);

  return (
    <LoadingStep
      title="Fetching Details..."
      message={message}
    />
  );
}
