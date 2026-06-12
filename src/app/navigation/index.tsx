/**
 * NAVIGATION ROUTE
 *
 * Route for the unified Map & Navigation screen.
 * Launched from Quick Actions → Navigate.
 */

import React, { useCallback } from 'react';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import MapScreen, { MapMode } from '@/features/navigation/MapScreen';
import { useGuidance } from '@/features/guidance';

export default function NavigationRoute() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string }>();
  const guidance = useGuidance();

  // Suppress guidance prompts/tips while the full-screen map is visible.
  useFocusEffect(
    useCallback(() => {
      guidance.setSuppressed(true);
      return () => guidance.setSuppressed(false);
    }, [guidance])
  );

  const initialMode = (params.mode as MapMode) || 'city';

  const handleOpenAIVision = () => {
    // Navigate to the AR navigation screen with AI Vision live mode
    router.push('/ar-navigation' as any);
  };

  return (
    <MapScreen
      initialMode={initialMode}
      onClose={() => router.back()}
      onOpenAIVision={handleOpenAIVision}
    />
  );
}
