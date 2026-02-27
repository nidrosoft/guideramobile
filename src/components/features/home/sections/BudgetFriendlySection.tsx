/**
 * BUDGET FRIENDLY SECTION
 * 
 * Displays budget-friendly places with horizontal scrolling cards.
 * Extracted from homepage for better modularity.
 * Now uses real data from database with mock data fallback.
 */

import { ScrollView, StyleSheet } from 'react-native';
import { useMemo } from 'react';
import BudgetFriendlyCard from '@/components/features/home/BudgetFriendlyCard';
import { budgetFriendlyPlaces } from '@/data/budgetFriendly';
import { useHomepageDataSafe } from '@/features/homepage';
import { spacing } from '@/styles';

export default function BudgetFriendlySection() {
  const homepageData = useHomepageDataSafe();
  
  // Map database data to card props format, fallback to mock data
  const displayData = useMemo(() => {
    const budgetSection = homepageData?.sections?.find(s => s.slug === 'budget-friendly');
    
    if (budgetSection?.items?.length) {
      return budgetSection.items.map((item, index) => ({
        id: item.id || index,
        name: item.title,
        location: `${item.location?.city || ''}, ${item.location?.country || ''}`.replace(/^, |, $/g, ''),
        category: item.tags?.[0] || 'Budget Travel',
        rating: item.rating || 4.5,
        price: item.price?.formatted || `$${item.price?.amount || 50}/day`,
        savingsPercent: String(Math.floor(Math.random() * 30) + 15),
        imageUrl: item.imageUrl || item.thumbnailUrl || 'https://picsum.photos/seed/budget/800/500',
      }));
    }
    
    return budgetFriendlyPlaces;
  }, [homepageData?.sections]);

  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.budgetFriendlyContainer}
    >
      {displayData.map((place) => (
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
