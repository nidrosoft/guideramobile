import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { colors, typography, spacing } from '@/styles';
import { Star1, People } from 'iconsax-react-native';

interface PlaceViewCardProps {
  name: string;
  country: string;
  visitors: string;
  rating: number;
  imageUrl: string;
  onPress: () => void;
}

export default function PlaceViewCard({ 
  name, 
  country, 
  visitors, 
  rating, 
  imageUrl,
  onPress 
}: PlaceViewCardProps) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: imageUrl }} style={styles.image} />
        
        {/* Rating Badge */}
        <View style={styles.ratingBadge}>
          <Star1 size={12} color="#FFD700" variant="Bold" />
          <Text style={styles.ratingText}>{rating}</Text>
        </View>
      </View>
      
      <View style={styles.infoContainer}>
        <Text style={styles.name} numberOfLines={1}>{name}</Text>
        <Text style={styles.country}>{country}</Text>
        
        {/* Visitors */}
        <View style={styles.visitorsContainer}>
          <People size={14} color={colors.primary} variant="Bold" />
          <Text style={styles.visitorsText}>{visitors} visitors</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgElevated,
    borderRadius: 24,
    padding: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
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
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
  infoContainer: {
    paddingHorizontal: spacing.xs,
    paddingBottom: spacing.sm,
  },
  name: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  country: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
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
