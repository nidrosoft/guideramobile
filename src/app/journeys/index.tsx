import { useLocalSearchParams } from 'expo-router';
import { JourneysHubScreen } from '@/modules/journeys';

export default function JourneysHubRoute() {
  const { category, continent } = useLocalSearchParams<{ category?: string; continent?: string }>();
  return (
    <JourneysHubScreen
      initialCategorySlug={typeof category === 'string' ? category : undefined}
      initialContinent={typeof continent === 'string' ? continent : undefined}
    />
  );
}
