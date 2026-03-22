import { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function ActivitySearch() {
  const router = useRouter();
  useEffect(() => { router.back(); }, []);
  return null;
}
// NOTE: Experience booking is handled by the modal flow in src/features/booking/flows/experience/
// This route stub exists to prevent blank screens if deep-linked.
