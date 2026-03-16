/**
 * NAVIGATION ROUTE
 *
 * Route for the unified Map & Navigation screen.
 * Launched from Quick Actions → Navigate.
 */

import React from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import MapScreen, { MapMode } from '@/features/navigation/MapScreen';

export default function NavigationRoute() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string }>();

  const initialMode = (params.mode as MapMode) || 'city';

  return (
    <MapScreen
      initialMode={initialMode}
      onClose={() => router.back()}
    />
  );
}
