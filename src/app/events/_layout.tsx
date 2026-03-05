import { Stack } from 'expo-router';

export default function EventsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="view-all" />
      <Stack.Screen name="[id]" />
    </Stack>
  );
}
