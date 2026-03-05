/**
 * BUDGET FRIENDLY SECTION
 * 
 * Displays budget-friendly places with horizontal scrolling cards.
 * Extracted from homepage for better modularity.
 * Uses real data from the homepage API.
 */

import { ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useMemo } from 'react';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import BudgetFriendlyCard from '@/components/features/home/BudgetFriendlyCard';
import { useHomepageDataSafe, filterByCategory, useSectionVisibility } from '@/features/homepage';
import { spacing } from '@/styles';
import { SkeletonBudgetCards } from '@/components/common/SkeletonLoader';

export default function BudgetFriendlySection() {
  const router = useRouter();
  const homepageData = useHomepageDataSafe();

  const handleCardPress = (id: string | number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: '/destinations/[id]' as any, params: { id: String(id) } });
  };
  
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
        savingsPercent: item.budgetLevel ? String(Math.round((5 - item.budgetLevel) * 15)) : '',
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
      {filteredData.map((place) => (
        <TouchableOpacity key={place.id} activeOpacity={0.8} onPress={() => handleCardPress(place.id)}>
          <BudgetFriendlyCard
            name={place.name}
            location={place.location}
            category={place.category}
            rating={place.rating}
            price={place.price}
            savingsPercent={place.savingsPercent}
            imageUrl={place.imageUrl}
          />
        </TouchableOpacity>
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
