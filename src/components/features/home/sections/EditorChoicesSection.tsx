/**
 * EDITOR CHOICES SECTION
 * 
 * Displays editor's choice destinations with horizontal scrolling cards.
 * Extracted from homepage for better modularity.
 * Now uses real data from database with mock data fallback.
 */

import { ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useMemo } from 'react';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import EditorChoiceCard from '@/components/features/home/EditorChoiceCard';
import { useHomepageDataSafe, filterByCategory, useSectionVisibility } from '@/features/homepage';
import { spacing } from '@/styles';
import { SkeletonFullBleedCards } from '@/components/common/SkeletonLoader';

export default function EditorChoicesSection() {
  const router = useRouter();
  const homepageData = useHomepageDataSafe();

  const handleCardPress = (id: string | number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: '/destinations/[id]' as any, params: { id: String(id) } });
  };
  
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
      {filteredData.map((place) => (
        <TouchableOpacity key={place.id} activeOpacity={0.8} onPress={() => handleCardPress(place.id)}>
          <EditorChoiceCard
            id={String(place.id)}
            name={place.name}
            location={place.location}
            reason={place.reason}
            rating={place.rating}
            imageUrl={place.imageUrl}
          />
        </TouchableOpacity>
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
