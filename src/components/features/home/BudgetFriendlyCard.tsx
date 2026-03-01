import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { typography, spacing, colors } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { Star1, Location, Heart, TickCircle } from 'iconsax-react-native';

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
  return (
    <TouchableOpacity style={[styles.container, { backgroundColor: colors.bgCard }]}>
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
          <Text style={[styles.ratingText, { color: colors.textSecondary }]}>{rating}</Text>
        </View>
        
        {/* Verified Badge */}
        <View style={styles.verifiedBadge}>
          <TickCircle size={12} color="#4CAF50" variant="Bold" />
          <Text style={styles.verifiedText}>Verified</Text>
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
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 360,
    flexDirection: 'row',
    borderRadius: 20,
    padding: spacing.md,
    marginRight: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
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
  heartButton: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
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
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    alignSelf: 'flex-start',
    marginBottom: spacing.xs,
  },
  verifiedText: {
    fontSize: typography.fontSize.xs,
    color: '#4CAF50',
    fontWeight: typography.fontWeight.medium,
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
