import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { colors, typography, spacing } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { Heart, Star1, Clock, Ticket } from 'iconsax-react-native';

interface BestDiscoverViewCardProps {
  name: string;
  category: string;
  rating: number;
  location: string;
  price: string;
  duration: string;
  bestFor: string;
  imageUrl: string;
  onPress: () => void;
}

export default function BestDiscoverViewCard({ 
  name, category, rating, location, price, duration, bestFor, imageUrl, onPress
}: BestDiscoverViewCardProps) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: imageUrl }} style={styles.image} />
        <View style={styles.bestForBadge}>
          <Text style={styles.bestForText}>{bestFor}</Text>
        </View>
        <TouchableOpacity style={styles.heartButton}>
          <Heart size={18} color={colors.error} variant="Outline" />
        </TouchableOpacity>
      </View>
      <View style={styles.infoContainer}>
        <Text style={styles.name} numberOfLines={2}>{name}</Text>
        <Text style={styles.location}>{location}</Text>
        <Text style={styles.category}>{category}</Text>
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
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: colors.bgElevated, borderRadius: 24, padding: spacing.sm, marginBottom: spacing.lg },
  imageContainer: { width: '100%', height: 200, borderRadius: 20, overflow: 'hidden', position: 'relative', marginBottom: spacing.md },
  image: { width: '100%', height: '100%' },
  bestForBadge: { position: 'absolute', top: spacing.md, left: spacing.md, backgroundColor: 'rgba(76, 175, 80, 0.9)', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: 16 },
  bestForText: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.bold, color: colors.white },
  heartButton: { position: 'absolute', top: spacing.md, right: spacing.md, width: 36, height: 36, borderRadius: 18, backgroundColor: colors.bgElevated, justifyContent: 'center', alignItems: 'center' },
  infoContainer: { paddingHorizontal: spacing.sm },
  name: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: colors.textPrimary, marginBottom: 4 },
  location: { fontSize: typography.fontSize.sm, color: colors.textSecondary, marginBottom: 2 },
  category: { fontSize: typography.fontSize.xs, color: colors.textSecondary, marginBottom: spacing.sm },
  bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  leftInfo: { flexDirection: 'row', gap: spacing.md },
  ratingContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colors.textPrimary },
  durationContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  durationText: { fontSize: typography.fontSize.sm, color: colors.textSecondary },
  priceContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  priceText: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: colors.primary },
});
