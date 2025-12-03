import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { colors, typography, spacing } from '@/styles';
import { Heart, Star1, Clock, Ticket } from 'iconsax-react-native';

interface BestDiscoverCardProps {
  name: string;
  category: string;
  rating: number;
  location: string;
  price: string;
  duration: string;
  bestFor: string;
  imageUrl: string;
}

export default function BestDiscoverCard({ 
  name, 
  category, 
  rating, 
  location,
  price, 
  duration,
  bestFor,
  imageUrl 
}: BestDiscoverCardProps) {
  return (
    <View style={styles.container}>
      {/* Image Container */}
      <View style={styles.imageContainer}>
        <Image source={{ uri: imageUrl }} style={styles.image} />
        
        {/* Best For Badge */}
        <View style={styles.bestForBadge}>
          <Text style={styles.bestForText}>{bestFor}</Text>
        </View>
        
        {/* Heart/Save Button */}
        <TouchableOpacity style={styles.heartButton}>
          <Heart size={18} color={colors.error} variant="Outline" />
        </TouchableOpacity>
      </View>

      {/* Info Section */}
      <View style={styles.infoContainer}>
        {/* Name */}
        <Text style={styles.name} numberOfLines={2}>{name}</Text>
        
        {/* Location & Category */}
        <Text style={styles.location}>{location}</Text>
        <Text style={styles.category}>{category}</Text>
        
        {/* Bottom Row - Rating, Duration, Price */}
        <View style={styles.bottomRow}>
          <View style={styles.leftInfo}>
            <View style={styles.ratingContainer}>
              <Star1 size={14} color="#FFD700" variant="Bold" />
              <Text style={styles.ratingText}>{rating}</Text>
            </View>
            <View style={styles.durationContainer}>
              <Clock size={14} color={colors.textSecondary} variant="Outline" />
              <Text style={styles.durationText}>{duration}</Text>
            </View>
          </View>
          <View style={styles.priceContainer}>
            <Ticket size={14} color={colors.primary} variant="Bold" />
            <Text style={styles.priceText}>{price}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 300,
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: spacing.sm,
    marginRight: spacing.md,
  },
  imageContainer: {
    width: '100%',
    height: 200,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: spacing.md,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  bestForBadge: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    backgroundColor: 'rgba(76, 175, 80, 0.9)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 16,
  },
  bestForText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
  heartButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.sm,
  },
  name: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    lineHeight: 20,
  },
  location: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  category: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
  },
  leftInfo: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.semibold,
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  durationText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  priceText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
});
