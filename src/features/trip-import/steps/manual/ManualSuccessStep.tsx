/**
 * MANUAL SUCCESS STEP
 * 
 * Step 6 (final) in manual import flow.
 * Creates the trip in Supabase via trip store, then shows success.
 */

import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { spacing, typography } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useTripStore } from '@/features/trips/stores/trip.store';
import { StepComponentProps } from '../../types/import-flow.types';
import SuccessStep from '../../components/shared/SuccessStep';

const TYPE_NAMES: Record<string, string> = {
  flight: 'flight',
  hotel: 'hotel reservation',
  car: 'car rental',
  activity: 'activity',
};

function buildDestinationName(data: any): string {
  const type = data.manualType;
  if (type === 'flight') return data.toAirport || data.fromAirport || 'Trip';
  if (type === 'hotel') return data.hotelCity || data.hotelName || 'Trip';
  if (type === 'car') return data.pickupLocation || 'Trip';
  if (type === 'activity') return data.activityLocation || 'Trip';
  return 'Trip';
}

function buildTripTitle(data: any): string {
  const type = data.manualType;
  const dest = buildDestinationName(data);
  if (type === 'flight') return `${data.airline || 'Flight'} to ${dest}`;
  if (type === 'hotel') return `Stay at ${data.hotelName || dest}`;
  if (type === 'car') return `Car rental in ${dest}`;
  if (type === 'activity') return `${data.activityName || 'Activity'} in ${dest}`;
  return `Trip to ${dest}`;
}

export default function ManualSuccessStep({ data, onNext }: StepComponentProps) {
  const { colors: tc } = useTheme();
  const { profile } = useAuth();
  const createTrip = useTripStore(s => s.createTrip);
  const [creating, setCreating] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tripId, setTripId] = useState<string | null>(null);

  const type = data.manualType || 'flight';
  const typeName = TYPE_NAMES[type] || 'booking';

  useEffect(() => {
    let cancelled = false;

    async function create() {
      if (!profile?.id) {
        setError('Please sign in to create a trip.');
        setCreating(false);
        return;
      }

      try {
        const destName = buildDestinationName(data);
        const title = buildTripTitle(data);

        const startDate = data.dates?.start
          ? (data.dates.start instanceof Date ? data.dates.start : new Date(data.dates.start))
          : new Date();
        const endDate = data.dates?.end
          ? (data.dates.end instanceof Date ? data.dates.end : new Date(data.dates.end))
          : new Date(startDate.getTime() + 7 * 86400000);

        const trip = await createTrip({
          userId: profile.id,
          title,
          destination: {
            id: destName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
            name: destName,
            city: destName,
            country: '',
          },
          startDate,
          endDate,
        });

        if (!cancelled) {
          setTripId(trip.id);
          setCreating(false);
        }
      } catch (err: any) {
        if (!cancelled) {
          console.error('Failed to create trip:', err);
          setError(err?.message || 'Failed to create trip. Please try again.');
          setCreating(false);
        }
      }
    }

    create();
    return () => { cancelled = true; };
  }, []);

  if (creating) {
    return (
      <View style={creatingStyles.container}>
        <ActivityIndicator size="large" color={tc.primary} />
        <Text style={[creatingStyles.text, { color: tc.textSecondary }]}>Creating your trip...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <SuccessStep
        title="Something Went Wrong"
        message={error}
        buttonText="Try Again"
        onButtonPress={() => {
          setCreating(true);
          setError(null);
        }}
      />
    );
  }

  return (
    <SuccessStep
      title="Successfully Added!"
      message={`Your ${typeName} has been added to your trip. You can view and manage it anytime.`}
      buttonText="View My Trip"
      onButtonPress={() => {
        onNext({ importResult: { tripId } });
      }}
    />
  );
}

const creatingStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
    paddingTop: spacing['2xl'],
  },
  text: {
    fontSize: typography.fontSize.base,
    marginTop: spacing.sm,
  },
});
