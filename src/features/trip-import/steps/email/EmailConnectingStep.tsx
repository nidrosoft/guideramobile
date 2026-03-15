/**
 * EMAIL CONNECTING STEP
 * 
 * Polls for forwarded booking emails.
 * The user has forwarded their booking confirmation to their unique import address.
 * This step waits for the email to arrive, be parsed by AI, and shows results.
 */

import React, { useEffect, useState } from 'react';
import { StepComponentProps } from '../../types/import-flow.types';
import LoadingStep from '../../components/shared/LoadingStep';
import { emailImportService } from '@/services/emailImport.service';
import { useAuth } from '@/context/AuthContext';

export default function EmailConnectingStep({ onNext, data }: StepComponentProps) {
  const { profile } = useAuth();
  const [message, setMessage] = useState('Waiting for your forwarded email...');

  useEffect(() => {
    let cancelled = false;

    const pollForEmail = async () => {
      if (!profile?.id) {
        onNext({ scanError: 'Please sign in to continue.', scanStatus: 'failed' });
        return;
      }

      try {
        setMessage('Checking for your forwarded booking email...');

        const result = await emailImportService.waitForImport(
          profile.id,
          (imports) => {
            if (cancelled) return;
            const processing = imports.find(i => i.status === 'processing' || i.status === 'pending');
            const parsed = imports.find(i => i.status === 'parsed');

            if (parsed) {
              setMessage('Booking found! Loading details...');
            } else if (processing) {
              setMessage('Email received! Analyzing your booking...');
            } else {
              setMessage('Waiting for your forwarded email...');
            }
          },
          90000, // 90 second timeout
          4000,  // poll every 4 seconds
        );

        if (cancelled) return;

        if (result && result.status === 'parsed' && result.parsedBooking) {
          // Booking found — pass to bookings step
          onNext({
            scanStatus: 'completed',
            importResult: result,
          });
        } else if (result && result.status === 'no_booking') {
          onNext({
            scanStatus: 'failed',
            scanError: 'We received your email but couldn\'t find any booking details in it. Make sure you\'re forwarding a booking confirmation (not a marketing email).',
          });
        } else {
          onNext({
            scanStatus: 'failed',
            scanError: 'We didn\'t receive your email yet. Please make sure you forwarded your booking confirmation to the correct address and try again.',
          });
        }
      } catch (error: any) {
        if (cancelled) return;
        console.warn('[EmailImport] Polling error:', error);
        onNext({
          scanError: 'Something went wrong while checking for your email. Please try again.',
          scanStatus: 'failed',
        });
      }
    };

    pollForEmail();

    return () => { cancelled = true; };
  }, []);

  return (
    <LoadingStep
      title="Checking for Email..."
      message={message}
    />
  );
}
