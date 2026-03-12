/**
 * EMAIL CONNECTING STEP
 * 
 * Step 5 in email import flow - Loading state while connecting to email.
 * Initiates the real scan via the trip import engine.
 */

import React, { useEffect, useState } from 'react';
import { StepComponentProps } from '../../types/import-flow.types';
import LoadingStep from '../../components/shared/LoadingStep';
import { tripImportEngine } from '@/services/trip/trip-import-engine.service';
import { useAuth } from '@/context/AuthContext';

export default function EmailConnectingStep({ onNext, data }: StepComponentProps) {
  const { profile } = useAuth();
  const [message, setMessage] = useState('Securely connecting to your email account...');

  useEffect(() => {
    let cancelled = false;

    const startScan = async () => {
      try {
        // Set userId for the engine (Clerk auth, not Supabase auth)
        if (profile?.id) {
          tripImportEngine.setUserId(profile.id);
        }

        setMessage('Connecting to your email provider...');

        const result = await tripImportEngine.startScan({
          lookbackDays: 60,
        });

        if (cancelled) return;

        if (result.status === 'completed') {
          // Scan completed immediately (fast response)
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
            scanError: result.error || 'Failed to connect to email',
          });
        } else {
          // Scan is in progress — move to scanning step with job ID
          onNext({
            scanJobId: result.scanJobId,
            scanStatus: result.status,
            scanProgress: result.progress,
            scanProgressMessage: result.progressMessage || 'Scanning your inbox...',
          });
        }
      } catch (error: any) {
        if (cancelled) return;
        console.error('Email connect error:', error);
        onNext({
          scanError: error.message || 'Failed to connect. Please try again.',
          scanStatus: 'failed',
        });
      }
    };

    startScan();

    return () => { cancelled = true; };
  }, []);

  return (
    <LoadingStep
      title="Connecting..."
      message={message}
    />
  );
}
