import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { colors, typography, spacing } from '@/styles';
import { Bookmark, Location, Star1, Eye } from 'iconsax-react-native';

interface MustSeeViewCardProps {
  name: string;
  location: string;
  rating: number;
  visitors: string;
  category: string;
  imageUrl: string;
  badge?: string;
  onPress: () => void;
}

export default function MustSeeViewCard({ 
  name, 
  location, 
  rating,
  visitors,
  category,
  imageUrl,
  badge = 'Must Visit',
  onPress
}: MustSeeViewCardProps) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.9}>
      {/* Image Section */}
      <View style={styles.imageContainer}>
        <Image source={{ uri: imageUrl }} style={styles.image} />
        
        {/* Badge */}
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
        
        {/* Bookmark Button */}
        <TouchableOpacity style={styles.bookmarkButton}>
          <Bookmark size={20} color={colors.textPrimary} variant="Outline" />
        </TouchableOpacity>
      </View>

      {/* Info Section */}
      <View style={styles.infoContainer}>
        <Text style={styles.name} numberOfLines={2}>{name}</Text>
        <Text style={styles.category}>{category}</Text>
        
        <View style={styles.detailsRow}>
          <View style={styles.locationContainer}>
            <Location size={14} color={colors.primary} variant="Bold" />
            <Text style={styles.locationText} numberOfLines={1}>{location}</Text>
          </View>
        </View>
        
        <View style={styles.bottomRow}>
          <View style={styles.ratingContainer}>
            <Star1 size={14} color="#FFD700" variant="Bold" />
            <Text style={styles.ratingText}>{rating}</Text>
          </View>
          <View style={styles.visitorsContainer}>
            <Eye size={14} color={colors.textSecondary} variant="Bold" />
            <Text style={styles.visitorsText}>{visitors}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: spacing.sm,
    marginBottom: spacing.lg,
  },
  imageContainer: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: spacing.md,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  badge: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  bookmarkButton: {
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
  },
  name: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: 4,
    lineHeight: 22,
  },
  category: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  locationText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
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
  visitorsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  visitorsText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },
});
