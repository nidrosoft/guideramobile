/**
 * BUDGET FRIENDLY SECTION
 * 
 * Displays budget-friendly places with horizontal scrolling cards.
 * Extracted from homepage for better modularity.
 */

import { ScrollView, StyleSheet } from 'react-native';
import BudgetFriendlyCard from '@/components/features/home/BudgetFriendlyCard';
import { budgetFriendlyPlaces } from '@/data/budgetFriendly';
import { spacing } from '@/styles';

export default function BudgetFriendlySection() {
  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.budgetFriendlyContainer}
    >
      {budgetFriendlyPlaces.map((place) => (
        <BudgetFriendlyCard
          key={place.id}
          name={place.name}
          location={place.location}
          category={place.category}
          rating={place.rating}
          price={place.price}
          savingsPercent={place.savingsPercent}
          imageUrl={place.imageUrl}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  budgetFriendlyContainer: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
});
