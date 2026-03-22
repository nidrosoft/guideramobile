import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { typography, spacing, borderRadius, shadows } from '@/styles';

const { width: screenWidth } = Dimensions.get('window');
const CARD_WIDTH = screenWidth * 0.72;
import { useTheme } from '@/context/ThemeContext';
import { Clock, Star1, TickCircle } from 'iconsax-react-native';

export interface LocalExperienceCardProps {
  id: string;
  title: string;
  imageUrl: string;
  category: string;
  duration: string;
  rating: number;
  reviewCount: number;
  price: string;
  originalPrice?: string;
  discountPercent?: number;
  freeCancellation: boolean;
  instantConfirmation?: boolean;
  city?: string;
}

export default function LocalExperienceCard({ 
  title,
  imageUrl,
  category,
  duration,
  rating,
  reviewCount,
  price,
  originalPrice,
  discountPercent,
  freeCancellation,
  city,
}: LocalExperienceCardProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.bgCard }]}>
      {/* Image Section */}
      <View style={styles.imageContainer}>
        <Image source={{ uri: imageUrl }} style={styles.image} contentFit="cover" />
        
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.5)']}
          style={styles.gradient}
        />

        {/* Discount Badge */}
        {discountPercent && discountPercent > 0 ? (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{discountPercent}% OFF</Text>
          </View>
        ) : null}

        {/* Category Badge */}
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText} numberOfLines={1}>{category}</Text>
        </View>
      </View>

      {/* Info Section */}
      <View style={styles.infoContainer}>
        <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1} ellipsizeMode="tail">{title}</Text>

        {/* Details Row */}
        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Clock size={13} color={colors.textSecondary} variant="Outline" />
            <Text style={[styles.detailText, { color: colors.textSecondary }]}>{duration}</Text>
          </View>

          {city ? (
            <Text style={[styles.detailText, { color: colors.textSecondary }]}>• {city}</Text>
          ) : null}
        </View>

        {/* Free Cancellation */}
        {freeCancellation ? (
          <View style={styles.cancellationRow}>
            <TickCircle size={12} color="#3FC39E" variant="Bold" />
            <Text style={styles.cancellationText}>Free cancellation</Text>
          </View>
        ) : null}

        {/* Bottom Row - Rating & Price */}
        <View style={[styles.bottomRow, { borderTopColor: colors.borderSubtle }]}>
          <View style={styles.ratingContainer}>
            <Star1 size={13} color="#FFA500" variant="Bold" />
            <Text style={[styles.ratingText, { color: colors.textPrimary }]}>{rating > 0 ? rating.toFixed(1) : '—'}</Text>
            {reviewCount > 0 ? (
              <Text style={[styles.reviewCount, { color: colors.textSecondary }]}>({reviewCount.toLocaleString()})</Text>
            ) : null}
          </View>
          <View style={styles.priceContainer}>
            {originalPrice ? (
              <Text style={[styles.originalPrice, { color: colors.textSecondary }]}>{originalPrice}</Text>
            ) : null}
            <Text style={[styles.price, { color: colors.primary }]}>{price}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    ...shadows.cardLight,
  },
  imageContainer: {
    width: '100%',
    height: 170,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  discountBadge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    backgroundColor: '#FF4757',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: 10,
  },
  discountText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  categoryBadge: {
    position: 'absolute',
    bottom: spacing.sm,
    left: spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
    maxWidth: 180,
  },
  categoryText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: '#1a1a1a',
  },
  infoContainer: {
    padding: spacing.md,
  },
  title: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    marginBottom: 6,
    lineHeight: 20,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: typography.fontSize.xs,
  },
  cancellationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  cancellationText: {
    fontSize: 11,
    color: '#3FC39E',
    fontWeight: '500' as const,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  reviewCount: {
    fontSize: 11,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  originalPrice: {
    fontSize: typography.fontSize.xs,
    textDecorationLine: 'line-through',
    color: '#999',
    opacity: 0.7,
  },
  price: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
});
