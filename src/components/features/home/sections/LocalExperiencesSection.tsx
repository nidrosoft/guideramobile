/**
 * LOCAL EXPERIENCES SECTION
 * 
 * Displays local experiences with horizontal scrolling cards.
 * Extracted from homepage for better modularity.
 */

import { ScrollView, StyleSheet } from 'react-native';
import LocalExperienceCard from '@/components/features/home/LocalExperienceCard';
import { localExperiences } from '@/data/localExperiences';
import { spacing } from '@/styles';

export default function LocalExperiencesSection() {
  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.localContainer}
    >
      {localExperiences.map((experience) => (
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
