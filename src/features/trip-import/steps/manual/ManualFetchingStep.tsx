/**
 * MANUAL FETCHING STEP
 * 
 * Step 4 in manual import flow - Processes user-entered booking data.
 * Formats dates, validates fields, and prepares the booking summary
 * for the result step.
 */

import React, { useEffect } from 'react';
import { StepComponentProps } from '../../types/import-flow.types';
import LoadingStep from '../../components/shared/LoadingStep';

const TYPE_MESSAGES = {
  flight: 'Processing your flight details...',
  hotel: 'Processing your hotel reservation...',
  car: 'Processing your car rental details...',
  activity: 'Processing your activity details...',
};

function formatDate(date: Date | string | undefined): string {
  if (!date) return 'N/A';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return 'N/A';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function daysBetween(start: Date | undefined, end: Date | undefined): number {
  if (!start || !end) return 0;
  return Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000));
}

function buildBookingSummary(data: any): any {
  const type = data.manualType || 'flight';

  if (type === 'flight') {
    return {
      type: 'flight',
      title: `${data.airline || 'Airline'} ${data.flightNumber || ''}`.trim(),
      details: [
        { label: 'Confirmation', value: data.confirmationCode || 'Not provided' },
        { label: 'From', value: data.fromAirport ? `${data.fromAirport}` : 'Not specified' },
        { label: 'To', value: data.toAirport ? `${data.toAirport}` : 'Not specified' },
        { label: 'Departure', value: formatDate(data.dates?.start) },
        { label: 'Return', value: formatDate(data.dates?.end) },
        { label: 'Cabin', value: data.cabinClass || 'Economy' },
      ].filter(d => d.value !== 'Not provided' || d.label === 'Confirmation'),
      destination: data.toAirport || undefined,
    };
  } else if (type === 'hotel') {
    const nights = daysBetween(data.dates?.start, data.dates?.end);
    return {
      type: 'hotel',
      title: data.hotelName || 'Hotel Reservation',
      details: [
        { label: 'Confirmation', value: data.confirmationCode || 'Not provided' },
        { label: 'Location', value: data.hotelCity || 'Not specified' },
        { label: 'Check-in', value: formatDate(data.dates?.start) },
        { label: 'Check-out', value: formatDate(data.dates?.end) },
        { label: 'Duration', value: `${nights} night${nights !== 1 ? 's' : ''}` },
      ],
      destination: data.hotelCity || undefined,
    };
  } else if (type === 'car') {
    const days = daysBetween(data.dates?.start, data.dates?.end);
    return {
      type: 'car',
      title: data.carCompany || 'Car Rental',
      details: [
        { label: 'Confirmation', value: data.confirmationCode || 'Not provided' },
        { label: 'Company', value: data.carCompany || 'Not specified' },
        { label: 'Pickup', value: `${data.pickupLocation || 'Not specified'} • ${formatDate(data.dates?.start)}` },
        { label: 'Return', value: formatDate(data.dates?.end) },
        { label: 'Duration', value: `${days} day${days !== 1 ? 's' : ''}` },
      ],
      destination: data.pickupLocation || undefined,
    };
  }

  return {
    type: 'activity',
    title: data.activityName || 'Activity',
    details: [
      { label: 'Activity', value: data.activityName || 'Not specified' },
      { label: 'Location', value: data.activityLocation || 'Not specified' },
      { label: 'Date', value: formatDate(data.dates?.start) },
    ],
    destination: data.activityLocation || undefined,
  };
}

export default function ManualFetchingStep({ onNext, data }: StepComponentProps) {
  const type = data.manualType || 'flight';
  const message = TYPE_MESSAGES[type as keyof typeof TYPE_MESSAGES];

  useEffect(() => {
    // Brief processing delay for UX, then build booking summary from user data
    const timer = setTimeout(() => {
      const bookingSummary = buildBookingSummary(data);
      onNext({ confirmedBooking: bookingSummary });
    }, 1200);

    return () => clearTimeout(timer);
  }, []);

  return (
    <LoadingStep
      title="Processing..."
      message={message}
    />
  );
}
