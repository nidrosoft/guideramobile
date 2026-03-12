/**
 * LINK SUCCESS STEP
 * 
 * Step 7 (final) in link import flow - Shows real import results.
 */

import React from 'react';
import { StepComponentProps } from '../../types/import-flow.types';
import SuccessStep from '../../components/shared/SuccessStep';

export default function LinkSuccessStep({ data, onNext }: StepComponentProps) {
  const importResult = data.importResult;
  const tripCount = importResult?.trips?.length || data.selectedTrips?.length || 0;
  const totalBookings = importResult?.totalBookingsImported || 0;

  const message = importResult?.imported
    ? `We've imported ${totalBookings} booking${totalBookings !== 1 ? 's' : ''} across ${tripCount} trip${tripCount !== 1 ? 's' : ''}. Check your Trips tab to see them!`
    : `Import completed. Check your trips tab to see the results.`;

  return (
    <SuccessStep
      title="Successfully Imported!"
      message={message}
      buttonText="View My Trips"
      onButtonPress={() => onNext(data)}
    />
  );
}
