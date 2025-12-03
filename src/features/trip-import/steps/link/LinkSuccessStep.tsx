/**
 * LINK SUCCESS STEP
 * 
 * Step 7 (final) in link import flow - Success confirmation.
 * Shows success message and button to view imported trips.
 */

import React from 'react';
import { StepComponentProps } from '../../types/import-flow.types';
import SuccessStep from '../../components/shared/SuccessStep';

export default function LinkSuccessStep({ data, onNext }: StepComponentProps) {
  const tripCount = data.selectedTrips?.length || 0;

  return (
    <SuccessStep
      title="Successfully Imported!"
      message={`We've imported ${tripCount} trip${tripCount !== 1 ? 's' : ''} from your travel account. Your trips are ready to view!`}
      buttonText="View My Trips"
      onButtonPress={() => {
        // AI TODO: Navigate to trips list or home
        onNext();
      }}
    />
  );
}
