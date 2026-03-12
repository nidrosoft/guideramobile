/**
 * LINK CONNECTING STEP
 * 
 * Step 4 in link import flow - Connects to the user's travel platform
 * via the trip import engine (Traxo handles all OTA/supplier sources).
 */

import React, { useEffect, useState } from 'react';
import { StepComponentProps } from '../../types/import-flow.types';
import LoadingStep from '../../components/shared/LoadingStep';
import { tripImportEngine } from '@/services/trip/trip-import-engine.service';
import { useAuth } from '@/context/AuthContext';

const PROVIDER_NAMES: Record<string, string> = {
  expedia: 'Expedia',
  booking: 'Booking.com',
  airbnb: 'Airbnb',
  tripadvisor: 'TripAdvisor',
};

export default function LinkConnectingStep({ onNext, data }: StepComponentProps) {
  const { profile } = useAuth();
  const provider = data.linkProvider || 'expedia';
  const providerName = PROVIDER_NAMES[provider] || provider;
  const [message, setMessage] = useState(`Connecting to your ${providerName} account...`);

  useEffect(() => {
    let cancelled = false;

    const connect = async () => {
      try {
        if (profile?.id) tripImportEngine.setUserId(profile.id);
        setMessage(`Scanning for ${providerName} bookings in your account...`);

        const result = await tripImportEngine.startScan({ lookbackDays: 60 });

        if (cancelled) return;

        if (result.status === 'completed') {
          onNext({
            scanJobId: result.scanJobId,
            scanStatus: 'completed',
            detectedTrips: result.trips,
            scanProgressMessage: result.progressMessage,
          });
        } else if (result.status === 'failed') {
          onNext({
            scanJobId: result.scanJobId,
            scanStatus: 'failed',
            scanError: result.error || `Failed to connect to ${providerName}`,
          });
        } else {
          onNext({
            scanJobId: result.scanJobId,
            scanStatus: result.status,
            scanProgress: result.progress,
            scanProgressMessage: result.progressMessage || 'Scanning...',
          });
        }
      } catch (error: any) {
        if (cancelled) return;
        console.error('Link connect error:', error);
        onNext({
          scanError: error.message || `Failed to connect to ${providerName}. Please try again.`,
          scanStatus: 'failed',
        });
      }
    };

    connect();
    return () => { cancelled = true; };
  }, []);

  return (
    <LoadingStep
      title="Connecting..."
      message={message}
    />
  );
}
