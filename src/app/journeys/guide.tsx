import { useLocalSearchParams } from 'expo-router';
import { JourneyGuideScreen } from '@/modules/journeys';

export default function JourneyGuideRoute() {
  const { category, country, subhub } = useLocalSearchParams<{
    category?: string;
    country?: string;
    subhub?: string;
  }>();
  return (
    <JourneyGuideScreen
      categorySlug={typeof category === 'string' ? category : ''}
      countryCode={typeof country === 'string' ? country : ''}
      subhubSlug={typeof subhub === 'string' ? subhub : undefined}
    />
  );
}
