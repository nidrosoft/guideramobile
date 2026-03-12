/**
 * LINK FETCHING STEP
 * 
 * Step 5 in link import flow - Polls scan job for progress.
 * Same engine as email scanning, just different entry point.
 */

import React, { useEffect, useState } from 'react';
import { StepComponentProps } from '../../types/import-flow.types';
import LoadingStep from '../../components/shared/LoadingStep';
import { tripImportEngine } from '@/services/trip/trip-import-engine.service';

const PROVIDER_NAMES: Record<string, string> = {
  expedia: 'Expedia',
  booking: 'Booking.com',
  airbnb: 'Airbnb',
  tripadvisor: 'TripAdvisor',
};

export default function LinkFetchingStep({ onNext, data }: StepComponentProps) {
  const provider = data.linkProvider || 'expedia';
  const providerName = PROVIDER_NAMES[provider] || provider;
  const [message, setMessage] = useState(
    data.scanProgressMessage || `Retrieving your bookings from ${providerName}...`
  );

  useEffect(() => {
    let cancelled = false;

    const pollScan = async () => {
      if (data.scanStatus === 'completed' && data.detectedTrips) {
        onNext();
        return;
      }
      if (data.scanStatus === 'failed') {
        onNext();
        return;
      }
      if (!data.scanJobId) {
        onNext({ scanError: 'No scan job found. Please try again.' });
        return;
      }

      try {
        const result = await tripImportEngine.waitForScan(
          data.scanJobId,
          (progress) => {
            if (cancelled) return;
            setMessage(progress.progressMessage || `Fetching from ${providerName}...`);
          },
          120000,
          2000,
        );
        if (cancelled) return;
        onNext({
          scanStatus: result.status,
          detectedTrips: result.trips,
          scanProgressMessage: result.progressMessage,
          scanError: result.error,
        });
      } catch (error: any) {
        if (cancelled) return;
        onNext({ scanStatus: 'failed', scanError: error.message || 'Fetch timed out.' });
      }
    };

    pollScan();
    return () => { cancelled = true; };
  }, []);

  return (
    <LoadingStep
      title="Fetching Trips..."
      message={message}
    />
  );
}
