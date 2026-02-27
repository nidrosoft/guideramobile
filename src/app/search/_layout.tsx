/**
 * SEARCH LAYOUT
 * 
 * Stack navigator for search-related screens.
 */

import { Stack } from 'expo-router';

export default function SearchLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="results" />
    </Stack>
  );
}
