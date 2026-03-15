// DEPRECATED: Orphaned screen — not part of active onboarding flow.
import { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function Preferences4() {
  const router = useRouter();
  useEffect(() => { router.replace('/(onboarding)/intro'); }, []);
  return null;
}
