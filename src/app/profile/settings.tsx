import { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function Settings() {
  const router = useRouter();
  useEffect(() => { router.replace('/(tabs)/account'); }, []);
  return null;
}
// Redirects to the real account settings screen
