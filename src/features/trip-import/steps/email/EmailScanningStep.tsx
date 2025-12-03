/**
 * EMAIL SCANNING STEP
 * 
 * Step 6 in email import flow - Loading state while scanning inbox.
 * Shows spinner and scanning message.
 */

import React, { useEffect } from 'react';
import { StepComponentProps } from '../../types/import-flow.types';
import LoadingStep from '../../components/shared/LoadingStep';

export default function EmailScanningStep({ onNext }: StepComponentProps) {
  useEffect(() => {
    // Simulate scanning delay
    const timer = setTimeout(() => {
      // AI TODO: Actually scan inbox for bookings
      // const bookings = await scanInboxForBookings(data.email);
      // onNext({ selectedBookings: bookings });
      onNext();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onNext]);

  return (
    <LoadingStep
      title="Scanning Inbox..."
      message="Looking for travel bookings in your email. We're checking for flights, hotels, car rentals, and more."
    />
  );
}
