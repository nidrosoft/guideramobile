import { useLocalSearchParams } from 'expo-router';
import { ToolkitScreen } from '@/modules/journeys';

export default function JourneyToolkitRoute() {
  const { category, country } = useLocalSearchParams<{ category?: string; country?: string }>();
  return (
    <ToolkitScreen
      categorySlug={typeof category === 'string' ? category : undefined}
      countryCode={typeof country === 'string' ? country : undefined}
    />
  );
}
