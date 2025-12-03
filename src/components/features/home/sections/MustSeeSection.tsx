/**
 * MUST SEE SECTION
 * 
 * Displays must-see attractions with horizontal scrolling cards.
 * Extracted from homepage for better modularity.
 */

import { ScrollView, StyleSheet } from 'react-native';
import MustSeeCard from '@/components/features/home/MustSeeCard';
import { mustSeePlaces } from '@/data/mustSee';
import { spacing } from '@/styles';

export default function MustSeeSection() {
  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.mustSeeContainer}
    >
      {mustSeePlaces.map((place) => (
        <MustSeeCard
          key={place.id}
          name={place.name}
          location={place.location}
          category={place.category}
          rating={place.rating}
          visitors={place.visitors}
          imageUrl={place.imageUrl}
          badge={place.badge}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  mustSeeContainer: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
});
