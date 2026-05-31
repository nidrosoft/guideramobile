/**
 * EMAIL SUCCESS STEP
 * 
 * Step 8 (final) in email import flow - Success confirmation.
 * Shows real import results and navigates to the imported trip.
 */

import React from 'react';
import { StepComponentProps } from '../../types/import-flow.types';
import SuccessStep from '../../components/shared/SuccessStep';

export default function EmailSuccessStep({ data, onNext }: StepComponentProps) {
  const importedTrip = data.importedTrip;

  const message = importedTrip?.title
    ? `"${importedTrip.title}" has been added to your trips. Tap below to view it.`
    : `Your booking has been added to your trips. Tap below to view it.`;

  return (
    <SuccessStep
      title="Successfully Imported!"
      message={message}
      buttonText="Check My Trips"
      onButtonPress={() => {
        onNext(data);
      }}
    />
  );
}
