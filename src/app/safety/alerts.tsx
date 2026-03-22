import { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function SafetyAlerts() {
  const router = useRouter();
  useEffect(() => { router.back(); }, []);
  return null;
}
// Safety alerts are handled within the SafetyScreen plugin on trip detail
