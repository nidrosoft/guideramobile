import { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function CarResults() {
  const router = useRouter();
  useEffect(() => { router.back(); }, []);
  return null;
}
// NOTE: Car results are handled by the modal flow in src/features/booking/flows/car/
// This route stub exists to prevent blank screens if deep-linked.
