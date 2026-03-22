import { View, Text, StyleSheet, Dimensions, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { typography, spacing, borderRadius, shadows } from '@/styles';

const { width: screenWidth } = Dimensions.get('window');
const CARD_WIDTH = screenWidth * 0.92;
import { useTheme } from '@/context/ThemeContext';
import { Star1, Location } from 'iconsax-react-native';

interface BudgetFriendlyCardProps {
  name: string;
  location: string;
  rating: number;
  price: string;
  category: string;
  savingsPercent: string;
  imageUrl: string;
}

export default function BudgetFriendlyCard({ 
  name, 
  location, 
  rating, 
  price,
  category,
  savingsPercent,
  imageUrl 
}: BudgetFriendlyCardProps) {
  const { colors } = useTheme();
  const { width: dynamicWidth } = useWindowDimensions();
  return (
    <View style={[styles.container, { backgroundColor: colors.bgCard }]}>
      {/* Image Section */}
      <View style={[styles.imageContainer, { width: dynamicWidth * 0.35 }]}>
        <Image source={imageUrl} style={styles.image} contentFit="cover" transition={200} />
        
        {/* Savings Badge */}
        {savingsPercent ? (
          <View style={styles.savingsBadge}>
            <Text style={styles.savingsText}>Save {savingsPercent}%</Text>
          </View>
        ) : null}
        
      </View>

      {/* Info Section */}
      <View style={styles.infoContainer}>
        {/* Rating */}
        <View style={styles.ratingContainer}>
          <Star1 size={14} color="#FFD700" variant="Bold" />
          <Text style={[styles.ratingText, { color: colors.textSecondary }]}>{rating}</Text>
        </View>
        
        {/* Name */}
        <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={2}>{name}</Text>

        {/* Category */}
        <Text style={[styles.category, { color: colors.textSecondary }]}>{category}</Text>

        {/* Location */}
        <View style={styles.locationContainer}>
          <Location size={12} color={colors.textSecondary} variant="Bold" />
          <Text style={[styles.locationText, { color: colors.textSecondary }]} numberOfLines={1}>{location}</Text>
        </View>

        {/* Price */}
        <Text style={[styles.price, { color: colors.primary }]}>{price}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    flexDirection: 'row',
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginRight: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    ...shadows.cardLight,
  },
  imageContainer: {
    aspectRatio: 1,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginRight: spacing.md,
    position: 'relative',
  },
  savingsBadge: {
    position: 'absolute',
    top: spacing.xs,
    left: spacing.xs,
    backgroundColor: '#FF6B6B',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  savingsText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: '#FFFFFF',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: spacing.xs,
  },
  ratingText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  name: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    marginBottom: 4,
    lineHeight: 20,
  },
  category: {
    fontSize: typography.fontSize.xs,
    marginBottom: spacing.xs,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: spacing.xs,
  },
  locationText: {
    fontSize: typography.fontSize.xs,
    flex: 1,
  },
  price: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
  },
});
