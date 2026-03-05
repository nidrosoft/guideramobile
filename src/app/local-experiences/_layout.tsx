import { Stack } from 'expo-router';

export default function LocalExperiencesLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="[id]" />
      <Stack.Screen name="view-all" />
    </Stack>
  );
}
