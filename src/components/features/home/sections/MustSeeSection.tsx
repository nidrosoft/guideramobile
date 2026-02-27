/**
 * MUST SEE SECTION
 * 
 * Displays must-see attractions with horizontal scrolling cards.
 * Extracted from homepage for better modularity.
 * Now uses real data from database with mock data fallback.
 */

import { ScrollView, StyleSheet } from 'react-native';
import { useMemo } from 'react';
import MustSeeCard from '@/components/features/home/MustSeeCard';
import { mustSeePlaces } from '@/data/mustSee';
import { useHomepageDataSafe } from '@/features/homepage';
import { spacing } from '@/styles';

export default function MustSeeSection() {
  const homepageData = useHomepageDataSafe();
  
  // Map database data to card props format, fallback to mock data
  const displayData = useMemo(() => {
    // Use editors-choice or popular destinations for must-see
    const section = homepageData?.sections?.find(s => s.slug === 'editors-choice' || s.slug === 'popular-destinations');
    
    if (section?.items?.length) {
      return section.items.slice(0, 6).map((item, index) => ({
        id: item.id || index,
        name: item.title,
        location: `${item.location?.city || ''}, ${item.location?.country || ''}`.replace(/^, |, $/g, ''),
        category: item.tags?.[0] || 'Landmark',
        rating: item.rating || 4.8,
        visitors: `${Math.floor((item.matchScore || 50) * 3)}K`,
        imageUrl: item.imageUrl || item.thumbnailUrl || 'https://picsum.photos/seed/mustsee/800/500',
        badge: item.badges?.[0]?.text || (item.rating && item.rating >= 4.5 ? 'Top Rated' : undefined),
      }));
    }
    
    return mustSeePlaces;
  }, [homepageData?.sections]);

  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.mustSeeContainer}
    >
      {displayData.map((place) => (
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
