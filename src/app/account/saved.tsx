/**
 * SAVED ITEMS SCREEN (Account Profile)
 * 
 * Redirects to the unified /deals/saved screen.
 * Both the homepage bookmark icon and the account profile
 * saved items link point to the same screen for consistency.
 */

import { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function SavedScreen() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/deals/saved' as any);
  }, []);

  return null;
}
