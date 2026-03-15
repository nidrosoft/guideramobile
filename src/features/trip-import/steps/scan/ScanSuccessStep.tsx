/**
 * SCAN SUCCESS STEP
 * 
 * Final step in scan import flow - Shows real import result.
 */

import React from 'react';
import { StepComponentProps } from '../../types/import-flow.types';
import SuccessStep from '../../components/shared/SuccessStep';

export default function ScanSuccessStep({ data, onNext }: StepComponentProps) {
  const tripTitle = data.importResult?.title || 'your trip';

  return (
    <SuccessStep
      title="Trip Added Successfully!"
      message={`Your booking has been added to "${tripTitle}". Check your Trips tab to view it and plan your itinerary!`}
      buttonText="View My Trip"
      onButtonPress={() => onNext(data)}
    />
  );
}
