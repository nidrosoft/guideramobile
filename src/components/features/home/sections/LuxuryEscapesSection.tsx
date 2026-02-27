/**
 * LUXURY ESCAPES SECTION
 * 
 * Displays luxury escapes with horizontal scrolling cards.
 * Extracted from homepage for better modularity.
 * Now uses real data from database with mock data fallback.
 */

import { ScrollView, StyleSheet } from 'react-native';
import { useMemo } from 'react';
import LuxuryEscapeCard from '@/components/features/home/LuxuryEscapeCard';
import { luxuryEscapes } from '@/data/luxuryEscapes';
import { useHomepageDataSafe } from '@/features/homepage';
import { spacing } from '@/styles';

export default function LuxuryEscapesSection() {
  const homepageData = useHomepageDataSafe();
  
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
        duration: '3-7 nights',
        category: item.tags?.[0] || 'Luxury Resort',
        imageUrl: item.imageUrl || item.thumbnailUrl || 'https://picsum.photos/seed/luxury/800/500',
      }));
    }
    
    return luxuryEscapes;
  }, [homepageData?.sections]);

  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.luxuryContainer}
    >
      {displayData.map((escape) => (
        <LuxuryEscapeCard
          key={escape.id}
          name={escape.name}
          location={escape.location}
          rating={escape.rating}
          price={escape.price}
          duration={escape.duration}
          category={escape.category}
          imageUrl={escape.imageUrl}
        />
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
