import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing } from '@/styles';
import { Location, Clock, People, Star1, Heart } from 'iconsax-react-native';

interface LocalExperienceCardProps {
  title: string;
  hostName: string;
  hostImage: string;
  category: string;
  duration: string;
  groupSize: string;
  price: string;
  rating: number;
  distance: string;
  imageUrl: string;
  isNearby: boolean;
}

export default function LocalExperienceCard({ 
  title,
  hostName,
  hostImage,
  category,
  duration,
  groupSize,
  price,
  rating,
  distance,
  imageUrl,
  isNearby
}: LocalExperienceCardProps) {
  return (
    <View style={styles.container}>
      {/* Image Section */}
      <View style={styles.imageContainer}>
        <Image source={{ uri: imageUrl }} style={styles.image} />
        
        {/* Gradient Overlay */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.6)']}
          style={styles.gradient}
        />

        {/* Nearby Badge */}
        {isNearby && (
          <View style={styles.nearbyBadge}>
            <Location size={12} color={colors.white} variant="Bold" />
            <Text style={styles.nearbyText}>Nearby</Text>
          </View>
        )}

        {/* Heart Button */}
        <TouchableOpacity style={styles.heartButton}>
          <Heart size={18} color={colors.error} variant="Outline" />
        </TouchableOpacity>

        {/* Category Badge */}
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{category}</Text>
        </View>
      </View>

      {/* Info Section */}
      <View style={styles.infoContainer}>
        {/* Title */}
        <Text style={styles.title} numberOfLines={2}>{title}</Text>

        {/* Host Info */}
        <View style={styles.hostContainer}>
          <Image source={{ uri: hostImage }} style={styles.hostAvatar} />
          <Text style={styles.hostText}>Hosted by {hostName}</Text>
        </View>

        {/* Details Row */}
        <View style={styles.detailsRow}>
          {/* Duration */}
          <View style={styles.detailItem}>
            <Clock size={14} color={colors.textSecondary} variant="Outline" />
            <Text style={styles.detailText}>{duration}</Text>
          </View>

          {/* Group Size */}
          <View style={styles.detailItem}>
            <People size={14} color={colors.textSecondary} variant="Outline" />
            <Text style={styles.detailText}>{groupSize}</Text>
          </View>

          {/* Distance */}
          <View style={styles.detailItem}>
            <Location size={14} color={colors.textSecondary} variant="Bold" />
            <Text style={styles.detailText}>{distance}</Text>
          </View>
        </View>

        {/* Bottom Row - Rating & Price */}
        <View style={styles.bottomRow}>
          <View style={styles.ratingContainer}>
            <Star1 size={14} color="#FFA500" variant="Bold" />
            <Text style={styles.ratingText}>{rating}</Text>
          </View>
          <Text style={styles.price}>{price}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 280,
    backgroundColor: colors.white,
    borderRadius: 20,
    overflow: 'hidden',
    marginRight: spacing.md,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  imageContainer: {
    width: '100%',
    height: 180,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  nearbyBadge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  nearbyText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
  heartButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryBadge: {
    position: 'absolute',
    bottom: spacing.sm,
    left: spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  infoContainer: {
    padding: spacing.md,
  },
  title: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    lineHeight: 20,
  },
  hostContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  hostAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  hostText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  detailsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
    flexWrap: 'wrap',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  price: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
});
