import { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function CulturalGuide() {
  const router = useRouter();
  useEffect(() => { router.back(); }, []);
  return null;
}
// Cultural guide is handled within the DosDonts plugin on trip detail
