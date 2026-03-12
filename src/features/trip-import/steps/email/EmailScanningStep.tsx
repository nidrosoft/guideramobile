/**
 * EMAIL SCANNING STEP
 * 
 * Step 6 in email import flow - Polls scan job for progress.
 * Shows dynamic progress message from the import engine.
 */

import React, { useEffect, useState } from 'react';
import { StepComponentProps } from '../../types/import-flow.types';
import LoadingStep from '../../components/shared/LoadingStep';
import { tripImportEngine } from '@/services/trip/trip-import-engine.service';

export default function EmailScanningStep({ onNext, data }: StepComponentProps) {
  const [message, setMessage] = useState(
    data.scanProgressMessage || 'Looking for travel bookings in your email...'
  );

  useEffect(() => {
    let cancelled = false;

    const pollScan = async () => {
      // If scan already completed in the connecting step, skip directly
      if (data.scanStatus === 'completed' && data.detectedTrips) {
        onNext();
        return;
      }

      // If scan failed in connecting step, pass through
      if (data.scanStatus === 'failed') {
        onNext();
        return;
      }

      // Poll the scan job for progress
      if (!data.scanJobId) {
        onNext({ scanError: 'No scan job found. Please try again.' });
        return;
      }

      try {
        const result = await tripImportEngine.waitForScan(
          data.scanJobId,
          (progress) => {
            if (cancelled) return;
            setMessage(progress.progressMessage || 'Scanning your inbox...');
          },
          120000,  // 2 min timeout
          2000,    // poll every 2s
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
        console.error('Scan polling error:', error);
        onNext({
          scanStatus: 'failed',
          scanError: error.message || 'Scan timed out. Please try again.',
        });
      }
    };

    pollScan();

    return () => { cancelled = true; };
  }, []);

  return (
    <LoadingStep
      title="Scanning Inbox..."
      message={message}
    />
  );
}
