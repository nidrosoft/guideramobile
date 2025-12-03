/**
 * TRENDING SECTION
 * 
 * Displays trending locations with horizontal scrolling cards.
 * Extracted from homepage for better modularity.
 */

import { ScrollView, StyleSheet } from 'react-native';
import TrendingLocationCard from '@/components/features/home/TrendingLocationCard';
import { trendingLocations } from '@/data/trendingLocations';
import { spacing } from '@/styles';

export default function TrendingSection() {
  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.trendingContainer}
    >
      {trendingLocations.map((location) => (
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
