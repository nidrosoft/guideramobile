import { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function FlightResults() {
  const router = useRouter();
  useEffect(() => { router.back(); }, []);
  return null;
}
// NOTE: Flight results are handled by the modal flow in src/features/booking/flows/flight/
// This route stub exists to prevent blank screens if deep-linked.
