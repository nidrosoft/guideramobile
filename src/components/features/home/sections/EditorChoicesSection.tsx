/**
 * EDITOR CHOICES SECTION
 * 
 * Displays editor's choice destinations with horizontal scrolling cards.
 * Extracted from homepage for better modularity.
 * Uses real data from the homepage API.
 */

import { ScrollView, StyleSheet } from 'react-native';
import { useMemo } from 'react';
import EditorChoiceCard from '@/components/features/home/EditorChoiceCard';
import { TrackableCard } from '@/features/homepage/components/TrackableCard';
import { useHomepageDataSafe, filterByCategory, useSectionVisibility } from '@/features/homepage';
import { spacing } from '@/styles';
import { SkeletonFullBleedCards } from '@/components/common/SkeletonLoader';

export default function EditorChoicesSection() {
  const homepageData = useHomepageDataSafe();
  
  // Map database data to card props format, fallback to mock data
  const displayData = useMemo(() => {
    const editorSection = homepageData?.sections?.find(s => s.slug === 'editors-choice');
    
    if (editorSection?.items?.length) {
      return editorSection.items.map((item, index) => ({
        id: item.id || index,
        name: item.title,
        location: `${item.location?.city || ''}, ${item.location?.country || ''}`.replace(/^, |, $/g, ''),
        reason: item.matchReasons?.[0] || item.subtitle || 'Exceptional experience',
        rating: item.rating || 4.9,
        imageUrl: item.imageUrl || item.thumbnailUrl,
      }));
    }
    
    return [];
  }, [homepageData?.sections]);

  const activeCategory = homepageData?.activeCategory ?? 'all';
  const filteredData = filterByCategory(displayData, activeCategory);
  useSectionVisibility('editorChoices', filteredData.length);

  if (homepageData?.isLoading && displayData.length === 0) {
    return <SkeletonFullBleedCards width={320} height={420} radius={32} />;
  }

  if (filteredData.length === 0) return null;

  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.editorChoiceContainer}
    >
      {filteredData.map((place, index) => (
        <TrackableCard
          key={place.id}
          itemId={String(place.id)}
          sectionSlug="editors-choice"
          position={index}
          navigateTo={`/destinations/${place.id}`}
        >
          <EditorChoiceCard
            id={String(place.id)}
            name={place.name}
            location={place.location}
            reason={place.reason}
            rating={place.rating}
            imageUrl={place.imageUrl}
          />
        </TrackableCard>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  editorChoiceContainer: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
});
