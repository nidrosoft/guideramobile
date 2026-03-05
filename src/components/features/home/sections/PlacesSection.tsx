/**
 * PLACES SECTION
 * 
 * Displays popular places with horizontal scrolling cards.
 * Extracted from homepage for better modularity.
 * Now uses real data from database with mock data fallback.
 */

import { ScrollView, StyleSheet } from 'react-native';
import { useMemo } from 'react';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import PopularPlaceCard from '@/components/features/home/PopularPlaceCard';
import { useHomepageDataSafe, filterByCategory, useSectionVisibility } from '@/features/homepage';
import { spacing } from '@/styles';
import { SkeletonPlaceCards } from '@/components/common/SkeletonLoader';

export default function PlacesSection() {
  const router = useRouter();
  const homepageData = useHomepageDataSafe();
  
  // Map database data to card props format, fallback to mock data
  const displayData = useMemo(() => {
    const popularSection = homepageData?.sections?.find(s => s.slug === 'places')
      || homepageData?.sections?.find(s => s.slug === 'popular-destinations');
    
    if (popularSection?.items?.length) {
      return popularSection.items.map((item, index) => ({
        id: item.id || index,
        name: item.title,
        country: item.location?.country || 'Unknown',
        visitors: item.matchScore ? `${Math.round(item.matchScore / 10)}K` : '',
        rating: item.rating || 4.5,
        imageUrl: item.imageUrl || item.thumbnailUrl,
      }));
    }
    
    return [];
  }, [homepageData?.sections]);

  const activeCategory = homepageData?.activeCategory ?? 'all';
  const filteredData = filterByCategory(displayData, activeCategory);
  useSectionVisibility('places', filteredData.length);

  if (homepageData?.isLoading && displayData.length === 0) {
    return <SkeletonPlaceCards />;
  }

  if (filteredData.length === 0) return null;

  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.placesContainer}
    >
      {filteredData.map((place) => (
        <PopularPlaceCard
          key={place.id}
          name={place.name}
          country={place.country}
          visitors={place.visitors}
          rating={place.rating}
          imageUrl={place.imageUrl}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push({ pathname: '/destinations/[id]' as any, params: { id: place.id } });
          }}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  placesContainer: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
});
