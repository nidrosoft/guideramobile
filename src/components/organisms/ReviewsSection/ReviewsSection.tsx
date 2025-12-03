/**
 * REVIEWS SECTION ORGANISM
 * 
 * Displays user reviews with ratings breakdown
 * Universal component used across all detail types
 */

import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Star1 } from 'iconsax-react-native';
import ReviewCard from '@/components/molecules/ReviewCard/ReviewCard';
import { colors, typography, spacing } from '@/styles';
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
  const handleViewAll = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onViewAll?.();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Reviews</Text>
        <Text style={styles.subtitle}>See what travelers are saying about their experience</Text>
      </View>

      {/* Horizontal Reviews List */}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  header: {
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
  },
  reviewsContent: {
    paddingRight: spacing.lg,
    gap: spacing.xs,
  },
});
