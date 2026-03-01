import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { colors, typography, spacing } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { Star1, Location, Heart, TickCircle } from 'iconsax-react-native';

interface BudgetFriendlyViewCardProps {
  name: string;
  location: string;
  rating: number;
  price: string;
  category: string;
  savingsPercent: string;
  imageUrl: string;
  onPress: () => void;
}

export default function BudgetFriendlyViewCard({ 
  name, 
  location, 
  rating, 
  price,
  category,
  savingsPercent,
  imageUrl,
  onPress
}: BudgetFriendlyViewCardProps) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.9}>
      {/* Image Section */}
      <View style={styles.imageContainer}>
        <Image source={{ uri: imageUrl }} style={styles.image} />
        
        {/* Savings Badge */}
        <View style={styles.savingsBadge}>
          <Text style={styles.savingsText}>Save {savingsPercent}%</Text>
        </View>
        
        {/* Heart Button */}
        <TouchableOpacity style={styles.heartButton}>
          <Heart size={16} color={colors.error} variant="Outline" />
        </TouchableOpacity>
      </View>

      {/* Info Section */}
      <View style={styles.infoContainer}>
        {/* Rating */}
        <View style={styles.ratingContainer}>
          <Star1 size={14} color="#FFD700" variant="Bold" />
          <Text style={styles.ratingText}>{rating}</Text>
        </View>
        
        {/* Verified Badge */}
        <View style={styles.verifiedBadge}>
          <TickCircle size={12} color="#4CAF50" variant="Bold" />
          <Text style={styles.verifiedText}>Verified</Text>
        </View>

        {/* Name */}
        <Text style={styles.name} numberOfLines={2}>{name}</Text>

        {/* Category */}
        <Text style={styles.category}>{category}</Text>

        {/* Location */}
        <View style={styles.locationContainer}>
          <Location size={12} color={colors.textSecondary} variant="Bold" />
          <Text style={styles.locationText} numberOfLines={1}>{location}</Text>
        </View>

        {/* Price */}
        <Text style={styles.price}>{price}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.bgElevated,
    borderRadius: 20,
    padding: spacing.md,
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  imageContainer: {
    width: 140,
    height: 140,
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: spacing.md,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  savingsBadge: {
    position: 'absolute',
    top: spacing.xs,
    left: spacing.xs,
    backgroundColor: '#FF6B6B',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 8,
  },
  savingsText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
  heartButton: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.bgElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: spacing.xs,
  },
  ratingText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 8,
    marginBottom: spacing.xs,
  },
  verifiedText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: '#4CAF50',
  },
  name: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  category: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
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
    color: colors.textSecondary,
    flex: 1,
  },
  price: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
});
