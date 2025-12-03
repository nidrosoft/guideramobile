/**
 * LUXURY ESCAPES SECTION
 * 
 * Displays luxury escapes with horizontal scrolling cards.
 * Extracted from homepage for better modularity.
 */

import { ScrollView, StyleSheet } from 'react-native';
import LuxuryEscapeCard from '@/components/features/home/LuxuryEscapeCard';
import { luxuryEscapes } from '@/data/luxuryEscapes';
import { spacing } from '@/styles';

export default function LuxuryEscapesSection() {
  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.luxuryContainer}
    >
      {luxuryEscapes.map((escape) => (
        <LuxuryEscapeCard
          key={escape.id}
          name={escape.name}
          location={escape.location}
          rating={escape.rating}
          price={escape.price}
          duration={escape.duration}
          category={escape.category}
          imageUrl={escape.imageUrl}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  luxuryContainer: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
});
