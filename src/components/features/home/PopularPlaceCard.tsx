import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { typography, spacing, borderRadius, colors } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { Star1, People } from 'iconsax-react-native';

interface PopularPlaceCardProps {
  name: string;
  country: string;
  visitors: string;
  rating: number;
  imageUrl: string;
}

export default function PopularPlaceCard({ 
  name, 
  country, 
  visitors, 
  rating, 
  imageUrl 
}: PopularPlaceCardProps) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity style={[styles.container, { backgroundColor: colors.bgCard, shadowColor: '#000' }]}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: imageUrl }} style={styles.image} />
        
        {/* Rating Badge */}
        <View style={[styles.ratingBadge, { backgroundColor: colors.bgOverlay }]}>
          <Star1 size={12} color={colors.primary} variant="Bold" />
          <Text style={[styles.ratingText, { color: colors.textPrimary }]}>{rating}</Text>
        </View>
      </View>
      
      <View style={styles.infoContainer}>
        <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={1}>{name}</Text>
        <Text style={[styles.country, { color: colors.textSecondary }]}>{country}</Text>
        
        {/* Visitors */}
        <View style={styles.visitorsContainer}>
          <People size={14} color={colors.primary} variant="Bold" />
          <Text style={[styles.visitorsText, { color: colors.textSecondary }]}>{visitors} visitors</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 180,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    padding: spacing.sm,
    marginRight: spacing.md,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: spacing.sm,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  ratingBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },
  infoContainer: {
    paddingHorizontal: spacing.xs,
    paddingBottom: spacing.sm,
  },
  name: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.xs,
  },
  country: {
    fontSize: typography.fontSize.xs,
    marginBottom: spacing.xs,
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
