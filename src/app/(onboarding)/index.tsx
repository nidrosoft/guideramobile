import { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function Onboarding() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to first walkthrough screen
    router.replace('/(onboarding)/welcome-1');
  }, []);

  return null;
}
