/**
 * TRENDING SECTION
 * 
 * Displays trending locations with horizontal scrolling cards.
 * Extracted from homepage for better modularity.
 * Uses real data from the homepage API.
 */

import { ScrollView, StyleSheet } from 'react-native';
import { useMemo } from 'react';
import { useRouter } from 'expo-router';
import TrendingLocationCard from '@/components/features/home/TrendingLocationCard';
import { TrackableCard } from '@/features/homepage/components/TrackableCard';
import { useHomepageDataSafe, filterByCategory, useSectionVisibility } from '@/features/homepage';
import { spacing } from '@/styles';
import { SkeletonFullBleedCards } from '@/components/common/SkeletonLoader';

export default function TrendingSection() {
  const router = useRouter();
  const homepageData = useHomepageDataSafe();

  
  // Map database data to card props format, fallback to mock data
  const displayData = useMemo(() => {
    const trendingSection = homepageData?.sections?.find(s => s.slug === 'trending');
    
    if (trendingSection?.items?.length) {
      return trendingSection.items.map((item, index) => ({
        id: item.id || index,
        city: item.location?.city || 'Unknown',
        country: item.location?.country || 'Unknown',
        placeName: item.title,
        visitorsCount: item.matchScore ? `${Math.round(item.matchScore / 10)}K` : '',
        trendPercentage: '',
        rating: item.rating || 4.5,
        category: item.tags?.[0] || 'Destination',
        imageUrl: item.imageUrl || item.thumbnailUrl,
      }));
    }
    
    return [];
  }, [homepageData?.sections]);

  const activeCategory = homepageData?.activeCategory ?? 'all';
  const filteredData = filterByCategory(displayData, activeCategory);
  useSectionVisibility('trending', filteredData.length);

  if (homepageData?.isLoading && displayData.length === 0) {
    return <SkeletonFullBleedCards width={380} height={360} radius={32} />;
  }

  if (filteredData.length === 0) return null;

  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.trendingContainer}
    >
      {filteredData.map((location, index) => (
        <TrackableCard
          key={location.id}
          itemId={String(location.id)}
          sectionSlug="trending"
          position={index}
          navigateTo={`/destinations/${location.id}`}
        >
          <TrendingLocationCard
            id={String(location.id)}
            city={location.city}
            country={location.country}
            placeName={location.placeName}
            visitorsCount={location.visitorsCount}
            trendPercentage={location.trendPercentage}
            rating={location.rating}
            category={location.category}
            imageUrl={location.imageUrl}
          />
        </TrackableCard>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  trendingContainer: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
});
