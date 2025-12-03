/**
 * MANUAL SUCCESS STEP
 * 
 * Step 6 (final) in manual import flow - Success confirmation.
 * Shows success message and button to view trip.
 */

import React from 'react';
import { StepComponentProps } from '../../types/import-flow.types';
import SuccessStep from '../../components/shared/SuccessStep';

const TYPE_NAMES = {
  flight: 'flight',
  hotel: 'hotel reservation',
  car: 'car rental',
  activity: 'activity',
};

export default function ManualSuccessStep({ data, onNext }: StepComponentProps) {
  const type = data.manualType || 'flight';
  const typeName = TYPE_NAMES[type as keyof typeof TYPE_NAMES];

  return (
    <SuccessStep
      title="Successfully Added!"
      message={`Your ${typeName} has been added to your trip. You can view and manage it anytime.`}
      buttonText="View My Trip"
      onButtonPress={() => {
        // AI TODO: Navigate to trip detail
        onNext();
      }}
    />
  );
}
