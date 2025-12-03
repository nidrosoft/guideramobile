/**
 * EMAIL CONNECTING STEP
 * 
 * Step 5 in email import flow - Loading state while connecting to email.
 * Shows spinner and connecting message.
 */

import React, { useEffect } from 'react';
import { StepComponentProps } from '../../types/import-flow.types';
import LoadingStep from '../../components/shared/LoadingStep';

export default function EmailConnectingStep({ onNext }: StepComponentProps) {
  useEffect(() => {
    // Simulate connection delay
    const timer = setTimeout(() => {
      // AI TODO: Actually connect to email provider
      // const result = await connectEmailProvider(data.emailProvider, data.email, data.password);
      onNext();
    }, 2000);

    return () => clearTimeout(timer);
  }, [onNext]);

  return (
    <LoadingStep
      title="Connecting..."
      message="Securely connecting to your email account. This may take a few moments."
    />
  );
}
