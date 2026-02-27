/**
 * TRENDING SECTION
 * 
 * Displays trending locations with horizontal scrolling cards.
 * Extracted from homepage for better modularity.
 * Now uses real data from database with mock data fallback.
 */

import { ScrollView, StyleSheet } from 'react-native';
import { useMemo } from 'react';
import TrendingLocationCard from '@/components/features/home/TrendingLocationCard';
import { trendingLocations } from '@/data/trendingLocations';
import { useHomepageDataSafe } from '@/features/homepage';
import { spacing } from '@/styles';

export default function TrendingSection() {
  const homepageData = useHomepageDataSafe();
  
  // Map database data to card props format, fallback to mock data
  const displayData = useMemo(() => {
    const trendingSection = homepageData?.sections?.find(s => s.slug === 'trending');
    
    if (trendingSection?.items?.length) {
      return trendingSection.items.map((item, index) => ({
        id: item.id || index,
        city: item.location?.country || 'Unknown',
        country: item.location?.city || 'Unknown',
        placeName: item.title,
        visitorsCount: item.matchScore > 50 ? `${Math.floor(item.matchScore * 3)}K` : '100K',
        trendPercentage: String(Math.floor(Math.random() * 40) + 20),
        rating: item.rating || 4.5,
        category: item.tags?.[0] || 'Destination',
        imageUrl: item.imageUrl || item.thumbnailUrl || 'https://picsum.photos/seed/trending/800/500',
      }));
    }
    
    return trendingLocations;
  }, [homepageData?.sections]);

  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.trendingContainer}
    >
      {displayData.map((location) => (
        <TrendingLocationCard
          key={location.id}
          city={location.city}
          country={location.country}
          placeName={location.placeName}
          visitorsCount={location.visitorsCount}
          trendPercentage={location.trendPercentage}
          rating={location.rating}
          category={location.category}
          imageUrl={location.imageUrl}
        />
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
