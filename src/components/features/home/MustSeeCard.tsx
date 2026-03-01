import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { typography, spacing, borderRadius, colors } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { Bookmark, Location, Star1, Eye } from 'iconsax-react-native';

interface MustSeeCardProps {
  name: string;
  location: string;
  rating: number;
  visitors: string;
  category: string;
  imageUrl: string;
  badge?: string;
}

export default function MustSeeCard({ 
  name, 
  location, 
  rating,
  visitors,
  category,
  imageUrl,
  badge = 'Must Visit'
}: MustSeeCardProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: colors.bgCard }]}>
      {/* Image Section */}
      <View style={styles.imageContainer}>
        <Image source={{ uri: imageUrl }} style={styles.image} />
        
        {/* Badge */}
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
        
        {/* Bookmark Button */}
        <TouchableOpacity style={styles.bookmarkButton}>
          <Bookmark size={20} color="#1a1a1a" variant="Outline" />
        </TouchableOpacity>
      </View>

      {/* Info Section */}
      <View style={styles.infoContainer}>
        <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={2}>{name}</Text>
        <Text style={[styles.category, { color: colors.textSecondary }]}>{category}</Text>
        
        <View style={styles.detailsRow}>
          <View style={styles.locationContainer}>
            <Location size={14} color={colors.primary} variant="Bold" />
            <Text style={[styles.locationText, { color: colors.textSecondary }]} numberOfLines={1}>{location}</Text>
          </View>
        </View>
        
        <View style={styles.bottomRow}>
          <View style={styles.ratingContainer}>
            <Star1 size={14} color="#FFD700" variant="Bold" />
            <Text style={[styles.ratingText, { color: colors.textPrimary }]}>{rating}</Text>
          </View>
          <View style={styles.visitorsContainer}>
            <Eye size={14} color={colors.textSecondary} variant="Bold" />
            <Text style={[styles.visitorsText, { color: colors.textSecondary }]}>{visitors}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 280,
    borderRadius: 20,
    padding: spacing.sm,
    marginRight: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
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
    color: '#1a1a1a',
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
    marginBottom: 4,
    lineHeight: 22,
  },
  category: {
    fontSize: typography.fontSize.xs,
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
  visitorsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  visitorsText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },
});
