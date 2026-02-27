/**
 * PREFERENCES LAYOUT
 * 
 * Stack navigator for preference sub-screens.
 */

import { Stack } from 'expo-router';

export default function PreferencesLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    />
  );
}
