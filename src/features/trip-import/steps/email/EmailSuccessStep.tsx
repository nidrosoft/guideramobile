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
  const importResult = data.importResult;
  const totalBookings = importResult?.totalBookingsImported || data.selectedBookings?.length || 0;
  const tripCount = importResult?.trips?.length || 1;

  const message = importResult?.imported
    ? `We've imported ${totalBookings} booking${totalBookings !== 1 ? 's' : ''} across ${tripCount} trip${tripCount !== 1 ? 's' : ''} from your email. Your trip${tripCount !== 1 ? 's are' : ' is'} ready to view!`
    : `Import completed. Check your trips tab to see the results.`;

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
