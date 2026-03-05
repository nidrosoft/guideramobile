import { Stack } from 'expo-router';

export default function DealsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="[id]" />
      <Stack.Screen name="view-all" />
      <Stack.Screen name="saved" />
    </Stack>
  );
}
