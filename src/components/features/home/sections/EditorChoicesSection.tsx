/**
 * EDITOR CHOICES SECTION
 * 
 * Displays editor's choice destinations with horizontal scrolling cards.
 * Extracted from homepage for better modularity.
 */

import { ScrollView, StyleSheet } from 'react-native';
import EditorChoiceCard from '@/components/features/home/EditorChoiceCard';
import { editorChoices } from '@/data/editorChoices';
import { spacing } from '@/styles';

export default function EditorChoicesSection() {
  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.editorChoiceContainer}
    >
      {editorChoices.map((place) => (
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
