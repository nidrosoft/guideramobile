import { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function Saved() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the existing saved deals screen which has full functionality
    router.replace('/deals/saved');
  }, []);

  return null;
}
