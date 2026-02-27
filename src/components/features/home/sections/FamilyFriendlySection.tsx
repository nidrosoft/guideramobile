/**
 * FAMILY FRIENDLY SECTION
 * 
 * Displays family-friendly places with horizontal scrolling cards.
 * Extracted from homepage for better modularity.
 * Now uses real data from database with mock data fallback.
 */

import { ScrollView, StyleSheet } from 'react-native';
import { useMemo } from 'react';
import FamilyFriendlyCard from '@/components/features/home/FamilyFriendlyCard';
import { familyFriendlyPlaces } from '@/data/familyFriendly';
import { useHomepageDataSafe } from '@/features/homepage';
import { spacing } from '@/styles';

export default function FamilyFriendlySection() {
  const homepageData = useHomepageDataSafe();
  
  // Map database data to card props format, fallback to mock data
  const displayData = useMemo(() => {
    const familySection = homepageData?.sections?.find(s => s.slug === 'family-friendly');
    
    if (familySection?.items?.length) {
      return familySection.items.map((item, index) => ({
        id: item.id || index,
        name: item.title,
        location: `${item.location?.city || ''}, ${item.location?.country || ''}`.replace(/^, |, $/g, ''),
        rating: item.rating || 4.7,
        reviews: String(Math.floor(Math.random() * 500) + 100),
        distance: item.distanceText || '2-5 hours',
        ageRange: 'All ages',
        activities: item.tags?.length || 5,
        safetyRating: 'High',
        imageUrl: item.imageUrl || item.thumbnailUrl || 'https://picsum.photos/seed/family/800/500',
      }));
    }
    
    return familyFriendlyPlaces;
  }, [homepageData?.sections]);

  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.familyContainer}
    >
      {displayData.map((place, index) => (
        <FamilyFriendlyCard
          key={place.id}
          name={place.name}
          location={place.location}
          rating={place.rating}
          reviews={place.reviews}
          distance={place.distance}
          ageRange={place.ageRange}
          activities={place.activities}
          safetyRating={place.safetyRating}
          imageUrl={place.imageUrl}
          index={index}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  familyContainer: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
});
