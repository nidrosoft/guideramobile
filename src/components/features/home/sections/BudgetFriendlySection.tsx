/**
 * BUDGET FRIENDLY SECTION
 * 
 * Displays budget-friendly places with horizontal scrolling cards.
 * Extracted from homepage for better modularity.
 * Uses real data from the homepage API.
 */

import { ScrollView, StyleSheet } from 'react-native';
import { useMemo } from 'react';
import BudgetFriendlyCard from '@/components/features/home/BudgetFriendlyCard';
import { TrackableCard } from '@/features/homepage/components/TrackableCard';
import { useHomepageDataSafe, filterByCategory, useSectionVisibility } from '@/features/homepage';
import { spacing } from '@/styles';
import { SkeletonBudgetCards } from '@/components/common/SkeletonLoader';

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
        savingsPercent: '',
        imageUrl: item.imageUrl || item.thumbnailUrl,
      }));
    }
    
    return [];
  }, [homepageData?.sections]);

  const activeCategory = homepageData?.activeCategory ?? 'all';
  const filteredData = filterByCategory(displayData, activeCategory);
  useSectionVisibility('budgetFriendly', filteredData.length);

  if (homepageData?.isLoading && displayData.length === 0) {
    return <SkeletonBudgetCards />;
  }

  if (filteredData.length === 0) return null;

  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.budgetFriendlyContainer}
    >
      {filteredData.map((place, index) => (
        <TrackableCard
          key={place.id}
          itemId={String(place.id)}
          sectionSlug="budget-friendly"
          position={index}
          navigateTo={`/destinations/${place.id}`}
        >
          <BudgetFriendlyCard
            name={place.name}
            location={place.location}
            category={place.category}
            rating={place.rating}
            price={place.price}
            savingsPercent={place.savingsPercent}
            imageUrl={place.imageUrl}
          />
        </TrackableCard>
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
