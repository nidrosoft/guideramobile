/**
 * PLACES SECTION
 * 
 * Displays popular places with horizontal scrolling cards.
 * Extracted from homepage for better modularity.
 * Now uses real data from database with mock data fallback.
 */

import { ScrollView, StyleSheet } from 'react-native';
import { useMemo } from 'react';
import PopularPlaceCard from '@/components/features/home/PopularPlaceCard';
import { popularPlaces } from '@/data/places';
import { useHomepageDataSafe } from '@/features/homepage';
import { spacing } from '@/styles';

export default function PlacesSection() {
  const homepageData = useHomepageDataSafe();
  
  // Map database data to card props format, fallback to mock data
  const displayData = useMemo(() => {
    const popularSection = homepageData?.sections?.find(s => s.slug === 'popular-destinations');
    
    if (popularSection?.items?.length) {
      return popularSection.items.map((item, index) => ({
        id: item.id || index,
        name: item.title,
        country: item.location?.country || 'Unknown',
        visitors: `${Math.floor((item.matchScore || 50) * 2)}K`,
        rating: item.rating || 4.5,
        imageUrl: item.imageUrl || item.thumbnailUrl || 'https://picsum.photos/seed/places/800/500',
      }));
    }
    
    return popularPlaces;
  }, [homepageData?.sections]);

  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.placesContainer}
    >
      {displayData.map((place) => (
        <PopularPlaceCard
          key={place.id}
          name={place.name}
          country={place.country}
          visitors={place.visitors}
          rating={place.rating}
          imageUrl={place.imageUrl}
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
