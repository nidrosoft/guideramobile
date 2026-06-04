import { useLocalSearchParams } from 'expo-router';
import { JourneySearchResultsScreen } from '@/modules/journeys';

export default function JourneySearchRoute() {
  const { country } = useLocalSearchParams<{ country?: string }>();
  return <JourneySearchResultsScreen countryCode={typeof country === 'string' ? country : ''} />;
}
