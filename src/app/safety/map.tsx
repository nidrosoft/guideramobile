import { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function SafetyMap() {
  const router = useRouter();
  useEffect(() => { router.back(); }, []);
  return null;
}
// Safety map is handled within the DangerAlerts AR plugin
