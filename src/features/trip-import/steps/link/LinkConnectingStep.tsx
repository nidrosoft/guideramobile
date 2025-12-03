/**
 * LINK CONNECTING STEP
 * 
 * Step 4 in link import flow - Loading state while connecting to platform.
 * Shows spinner and connecting message.
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

export default function LinkConnectingStep({ onNext, data }: StepComponentProps) {
  const provider = data.linkProvider || 'expedia';
  const providerName = PROVIDER_NAMES[provider as keyof typeof PROVIDER_NAMES];

  useEffect(() => {
    // Simulate connection delay
    const timer = setTimeout(() => {
      // AI TODO: Actually connect to travel platform
      // const result = await connectTravelPlatform(data.linkProvider, data.linkEmail, data.linkPassword);
      onNext();
    }, 2000);

    return () => clearTimeout(timer);
  }, [onNext]);

  return (
    <LoadingStep
      title="Connecting..."
      message={`Securely connecting to your ${providerName} account. This may take a few moments.`}
    />
  );
}
