/**
 * BEST DISCOVER SECTION
 * 
 * Displays best discover hidden gems with horizontal scrolling cards.
 * Extracted from homepage for better modularity.
 * Now uses real data from database with mock data fallback.
 */

import { ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useMemo } from 'react';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import BestDiscoverCard from '@/components/features/home/BestDiscoverCard';
import { useHomepageDataSafe, filterByCategory, useSectionVisibility } from '@/features/homepage';
import { spacing } from '@/styles';
import { SkeletonBestDiscoverCards } from '@/components/common/SkeletonLoader';

export default function BestDiscoverSection() {
  const router = useRouter();
  const homepageData = useHomepageDataSafe();

  const handleCardPress = (id: string | number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: '/destinations/[id]' as any, params: { id: String(id) } });
  };
  
  // Map database data to card props format, fallback to mock data
  const displayData = useMemo(() => {
    const hiddenGemsSection = homepageData?.sections?.find(s => s.slug === 'hidden-gems');
    
    if (hiddenGemsSection?.items?.length) {
      return hiddenGemsSection.items.map((item, index) => ({
        id: item.id || index,
        name: item.title,
        category: item.tags?.[0] || 'Hidden Gem',
        location: `${item.location?.city || ''}, ${item.location?.country || ''}`.replace(/^, |, $/g, ''),
        rating: item.rating || 4.6,
        price: item.price?.formatted || `$${item.price?.amount || 75}/day`,
        duration: item.tags?.includes('weekend') ? '1-3 days' : '3-5 days',
        bestFor: item.tags?.slice(0, 2).join(', ') || 'Explorers',
        imageUrl: item.imageUrl || item.thumbnailUrl,
      }));
    }
    
    return [];
  }, [homepageData?.sections]);

  const activeCategory = homepageData?.activeCategory ?? 'all';
  const filteredData = filterByCategory(displayData, activeCategory);
  useSectionVisibility('bestDiscover', filteredData.length);

  if (homepageData?.isLoading && displayData.length === 0) {
    return <SkeletonBestDiscoverCards />;
  }

  if (filteredData.length === 0) return null;

  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.bestDiscoverContainer}
    >
      {filteredData.map((place) => (
        <TouchableOpacity key={place.id} activeOpacity={0.8} onPress={() => handleCardPress(place.id)}>
          <BestDiscoverCard
            id={String(place.id)}
            name={place.name}
            category={place.category}
            location={place.location}
            rating={place.rating}
            price={place.price}
            duration={place.duration}
            bestFor={place.bestFor}
            imageUrl={place.imageUrl}
          />
        </TouchableOpacity>
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
