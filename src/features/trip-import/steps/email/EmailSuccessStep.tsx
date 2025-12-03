/**
 * EMAIL SUCCESS STEP
 * 
 * Step 8 (final) in email import flow - Success confirmation.
 * Shows success message and button to view imported trip.
 */

import React from 'react';
import { StepComponentProps } from '../../types/import-flow.types';
import SuccessStep from '../../components/shared/SuccessStep';

export default function EmailSuccessStep({ data, onNext }: StepComponentProps) {
  const bookingCount = data.selectedBookings?.length || 0;

  return (
    <SuccessStep
      title="Successfully Imported!"
      message={`We've imported ${bookingCount} booking${bookingCount !== 1 ? 's' : ''} from your email. Your trip is ready to view!`}
      buttonText="Check My Trip"
      onButtonPress={() => {
        // AI TODO: Navigate to trip detail or create trip
        onNext();
      }}
    />
  );
}
