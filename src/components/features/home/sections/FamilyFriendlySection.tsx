/**
 * FAMILY FRIENDLY SECTION
 * 
 * Displays family-friendly places with horizontal scrolling cards.
 * Extracted from homepage for better modularity.
 */

import { ScrollView, StyleSheet } from 'react-native';
import FamilyFriendlyCard from '@/components/features/home/FamilyFriendlyCard';
import { familyFriendlyPlaces } from '@/data/familyFriendly';
import { spacing } from '@/styles';

export default function FamilyFriendlySection() {
  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.familyContainer}
    >
      {familyFriendlyPlaces.map((place, index) => (
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
