/**
 * LUXURY ESCAPES SECTION
 * 
 * Displays luxury escapes with horizontal scrolling cards.
 * Extracted from homepage for better modularity.
 * Uses real data from the homepage API.
 */

import { ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useMemo } from 'react';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import LuxuryEscapeCard from '@/components/features/home/LuxuryEscapeCard';
import { useHomepageDataSafe, filterByCategory, useSectionVisibility } from '@/features/homepage';
import { spacing } from '@/styles';
import { SkeletonFullBleedCards } from '@/components/common/SkeletonLoader';

export default function LuxuryEscapesSection() {
  const router = useRouter();
  const homepageData = useHomepageDataSafe();

  const handleCardPress = (id: string | number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: '/destinations/[id]' as any, params: { id: String(id) } });
  };
  
  // Map database data to card props format, fallback to mock data
  const displayData = useMemo(() => {
    const luxurySection = homepageData?.sections?.find(s => s.slug === 'luxury-escapes');
    
    if (luxurySection?.items?.length) {
      return luxurySection.items.map((item, index) => ({
        id: item.id || index,
        name: item.title,
        location: `${item.location?.city || ''}, ${item.location?.country || ''}`.replace(/^, |, $/g, ''),
        rating: item.rating || 4.8,
        price: item.price?.formatted || `$${item.price?.amount || 500}/night`,
        duration: item.tags?.includes('weekend') ? '2-3 nights' : '3-7 nights',
        category: item.tags?.[0] || 'Luxury Resort',
        imageUrl: item.imageUrl || item.thumbnailUrl,
      }));
    }
    
    return [];
  }, [homepageData?.sections]);

  const activeCategory = homepageData?.activeCategory ?? 'all';
  const filteredData = filterByCategory(displayData, activeCategory);
  useSectionVisibility('luxuryEscapes', filteredData.length);

  if (homepageData?.isLoading && displayData.length === 0) {
    return <SkeletonFullBleedCards width={320} height={420} radius={28} />;
  }

  if (filteredData.length === 0) return null;

  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.luxuryContainer}
    >
      {filteredData.map((escape) => (
        <TouchableOpacity key={escape.id} activeOpacity={0.8} onPress={() => handleCardPress(escape.id)}>
          <LuxuryEscapeCard
            id={String(escape.id)}
            name={escape.name}
            location={escape.location}
            rating={escape.rating}
            price={escape.price}
            duration={escape.duration}
            category={escape.category}
            imageUrl={escape.imageUrl}
          />
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  luxuryContainer: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
});
