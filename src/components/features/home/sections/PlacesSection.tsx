/**
 * PLACES SECTION
 * 
 * Displays popular places with horizontal scrolling cards.
 * Extracted from homepage for better modularity.
 * Uses real data from the homepage API.
 */

import { ScrollView, StyleSheet } from 'react-native';
import { useMemo } from 'react';
import PopularPlaceCard from '@/components/features/home/PopularPlaceCard';
import { TrackableCard } from '@/features/homepage/components/TrackableCard';
import { useHomepageDataSafe, filterByCategory, useSectionVisibility } from '@/features/homepage';
import { spacing } from '@/styles';
import { SkeletonPlaceCards } from '@/components/common/SkeletonLoader';

export default function PlacesSection() {
  const homepageData = useHomepageDataSafe();
  
  // Map database data to card props format
  const displayData = useMemo(() => {
    const popularSection = homepageData?.sections?.find(s => s.slug === 'places');
    
    if (popularSection?.items?.length) {
      return popularSection.items.map((item, index) => ({
        id: item.id || index,
        name: item.title,
        country: item.location?.country || 'Unknown',
        visitors: '',
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
      {filteredData.map((place, index) => (
        <TrackableCard
          key={place.id}
          itemId={String(place.id)}
          sectionSlug="places"
          position={index}
          navigateTo={`/destinations/${place.id}`}
        >
          <PopularPlaceCard
            name={place.name}
            country={place.country}
            visitors={place.visitors}
            rating={place.rating}
            imageUrl={place.imageUrl}
          />
        </TrackableCard>
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
