import { useLocalSearchParams } from 'expo-router';
import TripDetailScreen from '@/features/trips/screens/TripDetailScreen';

export default function TripDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  
  return <TripDetailScreen tripId={id} />;
}
