/**
 * BEST DISCOVER SECTION
 * 
 * Displays best discover hidden gems with horizontal scrolling cards.
 * Extracted from homepage for better modularity.
 * Now uses real data from database with mock data fallback.
 */

import { ScrollView, StyleSheet } from 'react-native';
import { useMemo } from 'react';
import BestDiscoverCard from '@/components/features/home/BestDiscoverCard';
import { bestDiscoverPlaces } from '@/data/bestDiscover';
import { useHomepageDataSafe } from '@/features/homepage';
import { spacing } from '@/styles';

export default function BestDiscoverSection() {
  const homepageData = useHomepageDataSafe();
  
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
        duration: '2-4 days',
        bestFor: item.tags?.slice(0, 2).join(', ') || 'Explorers',
        imageUrl: item.imageUrl || item.thumbnailUrl || 'https://picsum.photos/seed/discover/800/500',
      }));
    }
    
    return bestDiscoverPlaces;
  }, [homepageData?.sections]);

  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.bestDiscoverContainer}
    >
      {displayData.map((place) => (
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
