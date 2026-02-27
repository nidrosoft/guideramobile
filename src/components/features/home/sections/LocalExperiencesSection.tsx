/**
 * LOCAL EXPERIENCES SECTION
 * 
 * Displays local experiences with horizontal scrolling cards.
 * Extracted from homepage for better modularity.
 * Now uses real data from database with mock data fallback.
 */

import { ScrollView, StyleSheet } from 'react-native';
import { useMemo } from 'react';
import LocalExperienceCard from '@/components/features/home/LocalExperienceCard';
import { localExperiences } from '@/data/localExperiences';
import { useHomepageDataSafe } from '@/features/homepage';
import { spacing } from '@/styles';

export default function LocalExperiencesSection() {
  const homepageData = useHomepageDataSafe();
  
  // Map database data to card props format, fallback to mock data
  const displayData = useMemo(() => {
    // Use adventure or nearby section for local experiences
    const section = homepageData?.sections?.find(s => s.slug === 'adventure' || s.slug === 'near-you');
    
    if (section?.items?.length) {
      return section.items.map((item, index) => ({
        id: item.id || index,
        title: item.title,
        hostName: 'Local Guide',
        hostImage: 'https://picsum.photos/seed/host/100/100',
        category: item.tags?.[0] || 'Experience',
        duration: '2-4 hours',
        groupSize: 'Up to 10',
        price: item.price?.formatted || `$${item.price?.amount || 45}`,
        rating: item.rating || 4.7,
        distance: item.distanceText || '15 min away',
        imageUrl: item.imageUrl || item.thumbnailUrl || 'https://picsum.photos/seed/local/800/500',
        isNearby: true,
      }));
    }
    
    return localExperiences;
  }, [homepageData?.sections]);

  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.localContainer}
    >
      {displayData.map((experience) => (
        <LocalExperienceCard
          key={experience.id}
          title={experience.title}
          hostName={experience.hostName}
          hostImage={experience.hostImage}
          category={experience.category}
          duration={experience.duration}
          groupSize={experience.groupSize}
          price={experience.price}
          rating={experience.rating}
          distance={experience.distance}
          imageUrl={experience.imageUrl}
          isNearby={experience.isNearby}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  localContainer: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
});
