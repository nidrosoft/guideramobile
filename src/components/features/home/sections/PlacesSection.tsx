/**
 * PLACES SECTION
 * 
 * Displays popular places with horizontal scrolling cards.
 * Extracted from homepage for better modularity.
 */

import { ScrollView, StyleSheet } from 'react-native';
import PopularPlaceCard from '@/components/features/home/PopularPlaceCard';
import { popularPlaces } from '@/data/places';
import { spacing } from '@/styles';

export default function PlacesSection() {
  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.placesContainer}
    >
      {popularPlaces.map((place) => (
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
