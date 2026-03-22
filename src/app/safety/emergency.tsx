import { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function Emergency() {
  const router = useRouter();
  useEffect(() => { router.back(); }, []);
  return null;
}
// Safety emergency is handled within the SafetyScreen plugin on trip detail
