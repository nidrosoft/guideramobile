/**
 * BEST DISCOVER SECTION
 * 
 * Displays best discover hidden gems with horizontal scrolling cards.
 * Extracted from homepage for better modularity.
 */

import { ScrollView, StyleSheet } from 'react-native';
import BestDiscoverCard from '@/components/features/home/BestDiscoverCard';
import { bestDiscoverPlaces } from '@/data/bestDiscover';
import { spacing } from '@/styles';

export default function BestDiscoverSection() {
  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.bestDiscoverContainer}
    >
      {bestDiscoverPlaces.map((place) => (
        <BestDiscoverCard
          key={place.id}
          name={place.name}
          category={place.category}
          location={place.location}
          rating={place.rating}
          price={place.price}
          duration={place.duration}
          bestFor={place.bestFor}
          imageUrl={place.imageUrl}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  bestDiscoverContainer: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
});
