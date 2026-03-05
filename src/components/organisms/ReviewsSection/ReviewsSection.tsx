/**
 * REVIEWS SECTION ORGANISM
 * 
 * Displays user reviews with ratings breakdown
 * Universal component used across all detail types
 */

import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Star1 } from 'iconsax-react-native';
import ReviewCard from '@/components/molecules/ReviewCard/ReviewCard';
import { typography, spacing } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import * as Haptics from 'expo-haptics';

interface Review {
  id: string;
  userName: string;
  userAvatar: string;
  rating: number;
  date: string;
  reviewText: string;
  photos?: string[];
  helpful?: number;
}

interface ReviewsSectionProps {
  averageRating: number;
  totalReviews: number;
  reviews: Review[];
  onViewAll?: () => void;
}

export default function ReviewsSection({
  averageRating,
  totalReviews,
  reviews,
  onViewAll,
}: ReviewsSectionProps) {
  const { colors } = useTheme();
  const handleViewAll = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onViewAll?.();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Reviews</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>See what travelers are saying about their experience</Text>
      </View>

      {/* Horizontal Reviews List or Empty State */}
      {reviews.length === 0 ? (
        <View style={[styles.emptyState, { backgroundColor: colors.bgElevated, borderColor: colors.borderMedium }]}>
          <Star1 size={32} color={colors.textTertiary} variant="Bold" />
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No reviews yet</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>Be the first to share your experience</Text>
        </View>
      ) : (
        <ScrollView 
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.reviewsContent}
        >
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              userName={review.userName}
              userAvatar={review.userAvatar}
              rating={review.rating}
              date={review.date}
              reviewText={review.reviewText}
              compact
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  header: {
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
  },
  reviewsContent: {
    paddingRight: spacing.lg,
    gap: spacing.xs,
  },
  emptyState: {
    borderRadius: 24,
    borderWidth: 1,
    paddingVertical: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
  emptySubtitle: {
    fontSize: typography.fontSize.sm,
  },
});
