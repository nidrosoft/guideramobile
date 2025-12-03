/**
 * DEALS SECTION
 * 
 * Displays special deals and offers with category pills.
 * Extracted from homepage for better modularity.
 */

import { ScrollView, StyleSheet } from 'react-native';
import DealCard from '@/components/features/home/DealCard';
import CategoryPills from '@/components/features/home/CategoryPills';
import { spacing } from '@/styles';

export default function DealsSection() {
  return (
    <>
      {/* Deal Cards Horizontal Scroll */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.dealsContainer}
      >
        <DealCard
          title="Get discount for student up to"
          discount="45 %"
          buttonText="Get it Now"
          backgroundColor="#3B82F6"
        />
        <DealCard
          title="Book now and get a chance to win"
          discount="$ 150"
          buttonText="Book Now"
          backgroundColor="#F59E0B"
        />
        <DealCard
          title="Family package special offer"
          discount="30 %"
          buttonText="Claim Now"
          backgroundColor="#EC4899"
        />
        <DealCard
          title="Weekend getaway deals"
          discount="50 %"
          buttonText="Explore"
          backgroundColor="#10B981"
        />
      </ScrollView>
      
      {/* Category Pills */}
      <CategoryPills />
    </>
  );
}

const styles = StyleSheet.create({
  dealsContainer: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
});
