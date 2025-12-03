import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing } from '@/styles';
import { Location, Clock, People, Star1, Heart } from 'iconsax-react-native';

interface LocalExperienceViewCardProps {
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
  onPress: () => void;
}

export default function LocalExperienceViewCard({ 
  title, hostName, hostImage, category, duration, groupSize, price, rating, distance, imageUrl, isNearby, onPress
}: LocalExperienceViewCardProps) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: imageUrl }} style={styles.image} />
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.6)']} style={styles.gradient} />
        {isNearby && (
          <View style={styles.nearbyBadge}>
            <Location size={12} color={colors.white} variant="Bold" />
            <Text style={styles.nearbyText}>Nearby</Text>
          </View>
        )}
        <TouchableOpacity style={styles.heartButton}>
          <Heart size={18} color={colors.error} variant="Outline" />
        </TouchableOpacity>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{category}</Text>
        </View>
      </View>
      <View style={styles.infoContainer}>
        <Text style={styles.title} numberOfLines={2}>{title}</Text>
        <View style={styles.hostContainer}>
          <Image source={{ uri: hostImage }} style={styles.hostAvatar} />
          <Text style={styles.hostText}>Hosted by {hostName}</Text>
        </View>
        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Clock size={14} color={colors.textSecondary} variant="Outline" />
            <Text style={styles.detailText}>{duration}</Text>
          </View>
          <View style={styles.detailItem}>
            <People size={14} color={colors.textSecondary} variant="Outline" />
            <Text style={styles.detailText}>Up to {groupSize}</Text>
          </View>
        </View>
        <View style={styles.bottomRow}>
          <View style={styles.ratingContainer}>
            <Star1 size={14} color="#FFD700" variant="Bold" />
            <Text style={styles.ratingText}>{rating}</Text>
            <Text style={styles.distanceText}>• {distance} away</Text>
          </View>
          <Text style={styles.price}>{price}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: colors.white, borderRadius: 20, overflow: 'hidden', marginBottom: spacing.lg, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 2 },
  imageContainer: { width: '100%', height: 200, position: 'relative' },
  image: { width: '100%', height: '100%' },
  gradient: { ...StyleSheet.absoluteFillObject },
  nearbyBadge: { position: 'absolute', top: spacing.md, left: spacing.md, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.primary, paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: 12 },
  nearbyText: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.bold, color: colors.white },
  heartButton: { position: 'absolute', top: spacing.md, right: spacing.md, width: 36, height: 36, borderRadius: 18, backgroundColor: colors.white, justifyContent: 'center', alignItems: 'center' },
  categoryBadge: { position: 'absolute', bottom: spacing.md, left: spacing.md, backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: 16 },
  categoryText: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colors.textPrimary },
  infoContainer: { padding: spacing.md },
  title: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: colors.textPrimary, marginBottom: spacing.sm },
  hostContainer: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  hostAvatar: { width: 24, height: 24, borderRadius: 12 },
  hostText: { fontSize: typography.fontSize.sm, color: colors.textSecondary },
  detailsRow: { flexDirection: 'row', gap: spacing.lg, marginBottom: spacing.sm },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  detailText: { fontSize: typography.fontSize.xs, color: colors.textSecondary },
  bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ratingContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colors.textPrimary },
  distanceText: { fontSize: typography.fontSize.xs, color: colors.textSecondary },
  price: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: colors.primary },
});
