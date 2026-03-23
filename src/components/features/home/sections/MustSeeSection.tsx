/**
 * MUST SEE SECTION
 * 
 * Displays must-see attractions with horizontal scrolling cards.
 * Extracted from homepage for better modularity.
 * Uses real data from the homepage API.
 */

import { ScrollView, StyleSheet } from 'react-native';
import { useMemo } from 'react';
import MustSeeCard from '@/components/features/home/MustSeeCard';
import { TrackableCard } from '@/features/homepage/components/TrackableCard';
import { useHomepageDataSafe, filterByCategory, useSectionVisibility } from '@/features/homepage';
import { spacing } from '@/styles';
import { SkeletonMustSeeCards } from '@/components/common/SkeletonLoader';

export default function MustSeeSection() {
  const homepageData = useHomepageDataSafe();
  
  // Map database data to card props format
  const displayData = useMemo(() => {
    const section = homepageData?.sections?.find(s => s.slug === 'must-see');
    
    if (section?.items?.length) {
      return section.items.slice(0, 6).map((item, index) => ({
        id: item.id || index,
        name: item.title,
        location: `${item.location?.city || ''}, ${item.location?.country || ''}`.replace(/^, |, $/g, ''),
        category: item.tags?.[0] || 'Landmark',
        rating: item.rating || 4.8,
        visitors: '',
        imageUrl: item.imageUrl || item.thumbnailUrl,
        badge: item.badges?.[0]?.text || (item.rating && item.rating >= 4.5 ? 'Top Rated' : undefined),
      }));
    }
    
    return [];
  }, [homepageData?.sections]);

  const activeCategory = homepageData?.activeCategory ?? 'all';
  const filteredData = filterByCategory(displayData, activeCategory);
  useSectionVisibility('mustSee', filteredData.length);

  if (homepageData?.isLoading && displayData.length === 0) {
    return <SkeletonMustSeeCards />;
  }

  if (filteredData.length === 0) return null;

  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.mustSeeContainer}
    >
      {filteredData.map((place, index) => (
        <TrackableCard
          key={place.id}
          itemId={String(place.id)}
          sectionSlug="must-see"
          position={index}
          navigateTo={`/destinations/${place.id}`}
        >
          <MustSeeCard
            id={String(place.id)}
            name={place.name}
            location={place.location}
            category={place.category}
            rating={place.rating}
            visitors={place.visitors}
            imageUrl={place.imageUrl}
            badge={place.badge}
          />
        </TrackableCard>
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
