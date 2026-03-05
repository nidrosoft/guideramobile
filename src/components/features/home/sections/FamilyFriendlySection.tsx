/**
 * FAMILY FRIENDLY SECTION
 * 
 * Displays family-friendly places with horizontal scrolling cards.
 * Extracted from homepage for better modularity.
 * Uses real data from the homepage API.
 */

import { ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useMemo } from 'react';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import FamilyFriendlyCard from '@/components/features/home/FamilyFriendlyCard';
import { useHomepageDataSafe, filterByCategory, useSectionVisibility } from '@/features/homepage';
import { spacing } from '@/styles';
import { SkeletonFullBleedCards } from '@/components/common/SkeletonLoader';

export default function FamilyFriendlySection() {
  const router = useRouter();
  const homepageData = useHomepageDataSafe();

  const handleCardPress = (id: string | number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: '/destinations/[id]' as any, params: { id: String(id) } });
  };
  
  // Map database data to card props format, fallback to mock data
  const displayData = useMemo(() => {
    const familySection = homepageData?.sections?.find(s => s.slug === 'family-friendly');
    
    if (familySection?.items?.length) {
      return familySection.items.map((item, index) => ({
        id: item.id || index,
        name: item.title,
        location: `${item.location?.city || ''}, ${item.location?.country || ''}`.replace(/^, |, $/g, ''),
        rating: item.rating || 4.7,
        reviews: item.matchScore ? String(Math.round(item.matchScore / 5)) : '50',
        distance: item.distanceText || '2-5 hours',
        ageRange: item.bestFor?.includes('families') ? 'All ages' : '12+ years',
        activities: item.tags?.length || 5,
        safetyRating: item.safetyRating ? `${item.safetyRating}/5` : 'High',
        imageUrl: item.imageUrl || item.thumbnailUrl,
      }));
    }
    
    return [];
  }, [homepageData?.sections]);

  const activeCategory = homepageData?.activeCategory ?? 'all';
  const filteredData = filterByCategory(displayData, activeCategory);
  useSectionVisibility('familyFriendly', filteredData.length);

  if (homepageData?.isLoading && displayData.length === 0) {
    return <SkeletonFullBleedCards width={340} height={480} radius={32} />;
  }

  if (filteredData.length === 0) return null;

  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.familyContainer}
    >
      {filteredData.map((place, index) => (
        <TouchableOpacity key={place.id} activeOpacity={0.8} onPress={() => handleCardPress(place.id)}>
          <FamilyFriendlyCard
            id={String(place.id)}
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
        </TouchableOpacity>
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
