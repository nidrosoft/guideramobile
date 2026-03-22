import { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function FlightSearch() {
  const router = useRouter();
  useEffect(() => { router.back(); }, []);
  return null;
}
// NOTE: Flight booking is handled by the modal flow in src/features/booking/flows/flight/
// This route stub exists to prevent blank screens if deep-linked.
