import { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function HotelResults() {
  const router = useRouter();
  useEffect(() => { router.back(); }, []);
  return null;
}
// NOTE: Hotel results are handled by the modal flow in src/features/booking/flows/hotel/
// This route stub exists to prevent blank screens if deep-linked.
