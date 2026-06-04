import { useLocalSearchParams } from 'expo-router';
import { JourneyChatScreen } from '@/modules/journeys';

export default function JourneyChatRoute() {
  const { category, country } = useLocalSearchParams<{ category?: string; country?: string }>();
  return (
    <JourneyChatScreen
      categorySlug={typeof category === 'string' ? category : ''}
      countryCode={typeof country === 'string' ? country : ''}
    />
  );
}
