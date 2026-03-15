import { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function Onboarding() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to intro screen (animated feature cards)
    router.replace('/(onboarding)/intro');
  }, []);

  return null;
}
