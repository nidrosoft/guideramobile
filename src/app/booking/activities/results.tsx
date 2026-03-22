import { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function ActivityResults() {
  const router = useRouter();
  useEffect(() => { router.back(); }, []);
  return null;
}
// NOTE: Experience results are handled by the modal flow in src/features/booking/flows/experience/
// This route stub exists to prevent blank screens if deep-linked.
