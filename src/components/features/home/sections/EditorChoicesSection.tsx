/**
 * EDITOR CHOICES SECTION
 * 
 * Displays editor's choice destinations with horizontal scrolling cards.
 * Extracted from homepage for better modularity.
 * Now uses real data from database with mock data fallback.
 */

import { ScrollView, StyleSheet } from 'react-native';
import { useMemo } from 'react';
import EditorChoiceCard from '@/components/features/home/EditorChoiceCard';
import { editorChoices } from '@/data/editorChoices';
import { useHomepageDataSafe } from '@/features/homepage';
import { spacing } from '@/styles';

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
        imageUrl: item.imageUrl || item.thumbnailUrl || 'https://picsum.photos/seed/editor/800/500',
      }));
    }
    
    return editorChoices;
  }, [homepageData?.sections]);

  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.editorChoiceContainer}
    >
      {displayData.map((place) => (
        <EditorChoiceCard
          key={place.id}
          name={place.name}
          location={place.location}
          reason={place.reason}
          rating={place.rating}
          imageUrl={place.imageUrl}
        />
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
