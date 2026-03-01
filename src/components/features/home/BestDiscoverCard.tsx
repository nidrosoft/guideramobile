import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { typography, spacing, colors } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
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
  const { colors } = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: colors.bgCard }]}>
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
        <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={2}>{name}</Text>
        
        {/* Location & Category */}
        <Text style={[styles.location, { color: colors.textSecondary }]}>{location}</Text>
        <Text style={[styles.category, { color: colors.textSecondary }]}>{category}</Text>
        
        {/* Bottom Row - Rating, Duration, Price */}
        <View style={[styles.bottomRow, { borderTopColor: colors.borderSubtle }]}>
          <View style={styles.leftInfo}>
            <View style={styles.ratingContainer}>
              <Star1 size={14} color="#FFD700" variant="Bold" />
              <Text style={[styles.ratingText, { color: colors.textPrimary }]}>{rating}</Text>
            </View>
            <View style={styles.durationContainer}>
              <Clock size={14} color={colors.textSecondary} variant="Outline" />
              <Text style={[styles.durationText, { color: colors.textSecondary }]}>{duration}</Text>
            </View>
          </View>
          <View style={styles.priceContainer}>
            <Ticket size={14} color={colors.primary} variant="Bold" />
            <Text style={[styles.priceText, { color: colors.primary }]}>{price}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 300,
    borderRadius: 24,
    padding: spacing.sm,
    marginRight: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
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
    color: '#FFFFFF',
  },
  heartButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
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
    marginBottom: spacing.xs,
    lineHeight: 20,
  },
  location: {
    fontSize: typography.fontSize.xs,
    marginBottom: 2,
  },
  category: {
    fontSize: typography.fontSize.xs,
    marginBottom: spacing.sm,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
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
    fontWeight: typography.fontWeight.semibold,
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  durationText: {
    fontSize: typography.fontSize.xs,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  priceText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
  },
});
