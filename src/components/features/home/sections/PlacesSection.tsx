/**
 * PLACES SECTION
 * 
 * Displays popular places with horizontal scrolling cards.
 * Extracted from homepage for better modularity.
 * Uses real data from the homepage API.
 */

import { ScrollView, StyleSheet } from 'react-native';
import { useMemo, useEffect, useState } from 'react';
import PopularPlaceCard from '@/components/features/home/PopularPlaceCard';
import { TrackableCard } from '@/features/homepage/components/TrackableCard';
import { useHomepageDataSafe, filterByCategory, useSectionVisibility } from '@/features/homepage';
import { spacing } from '@/styles';
import { SkeletonPlaceCards } from '@/components/common/SkeletonLoader';
import { prefetchMissingImages, getCachedImageUrl } from '@/hooks/useImageFallback';

export default function PlacesSection() {
  const homepageData = useHomepageDataSafe();
  const [imageVersion, setImageVersion] = useState(0);
  
  // Map database data to card props format
  const displayData = useMemo(() => {
    const popularSection = homepageData?.sections?.find(s => s.slug === 'places');
    
    if (popularSection?.items?.length) {
      return popularSection.items.map((item, index) => ({
        id: item.id || index,
        name: item.title,
        country: item.location?.country || 'Unknown',
        city: item.location?.city || item.title?.split(' - ')[0] || item.title,
        visitors: '',
        rating: item.rating || 4.5,
        imageUrl: item.imageUrl || item.thumbnailUrl,
      }));
    }
    
    return [];
  }, [homepageData?.sections]);

  // Prefetch Google Places images for any items with missing imageUrl
  useEffect(() => {
    if (displayData.length === 0) return;
    const missing = displayData.filter(d => !d.imageUrl || d.imageUrl.trim().length <= 10);
    if (missing.length === 0) return;

    prefetchMissingImages(
      missing.map(d => ({ imageUrl: d.imageUrl, cityName: d.city }))
    ).then(() => setImageVersion(v => v + 1));
  }, [displayData]);

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
            imageUrl={getCachedImageUrl(place.imageUrl, place.city)}
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
