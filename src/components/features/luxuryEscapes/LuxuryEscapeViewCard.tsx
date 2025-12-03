import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing } from '@/styles';
import { Crown, Star1, Location, Calendar } from 'iconsax-react-native';

interface LuxuryEscapeViewCardProps {
  name: string;
  location: string;
  rating: number;
  price: string;
  duration: string;
  category: string;
  imageUrl: string;
  onPress: () => void;
}

export default function LuxuryEscapeViewCard({ 
  name, 
  location, 
  rating, 
  price, 
  duration, 
  category, 
  imageUrl,
  onPress
}: LuxuryEscapeViewCardProps) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.card}>
        <Image source={{ uri: imageUrl }} style={styles.backgroundImage} />
        <LinearGradient colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']} style={styles.gradient} />
        <View style={styles.premiumBadge}>
          <Crown size={16} color="#FFD700" variant="Bold" />
          <Text style={styles.premiumText}>LUXURY</Text>
        </View>
        <View style={styles.content}>
          <View style={styles.locationContainer}>
            <Location size={14} color={colors.white} variant="Bold" />
            <Text style={styles.locationText}>{location}</Text>
          </View>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.category}>{category}</Text>
          <View style={styles.divider} />
          <View style={styles.bottomInfo}>
            <View style={styles.leftInfo}>
              <View style={styles.ratingContainer}>
                <Star1 size={16} color="#FFD700" variant="Bold" />
                <Text style={styles.ratingText}>{rating}</Text>
              </View>
              <View style={styles.durationContainer}>
                <Calendar size={14} color="rgba(255,255,255,0.8)" variant="Outline" />
                <Text style={styles.durationText}>{duration}</Text>
              </View>
            </View>
            <View style={styles.priceContainer}>
              <Text style={styles.priceLabel}>From</Text>
              <Text style={styles.price}>{price}</Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.lg },
  card: { height: 320, borderRadius: 24, overflow: 'hidden', position: 'relative' },
  backgroundImage: { width: '100%', height: '100%', position: 'absolute' },
  gradient: { ...StyleSheet.absoluteFillObject },
  premiumBadge: { position: 'absolute', top: spacing.lg, right: spacing.lg, flexDirection: 'row', alignItems: 'center', gap: spacing.xs, backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: 20 },
  premiumText: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.bold, color: '#FFD700' },
  content: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: spacing.lg },
  locationContainer: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.xs },
  locationText: { fontSize: typography.fontSize.sm, color: colors.white, fontWeight: typography.fontWeight.medium },
  name: { fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, color: colors.white, marginBottom: 4 },
  category: { fontSize: typography.fontSize.sm, color: 'rgba(255,255,255,0.8)', marginBottom: spacing.md },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginBottom: spacing.md },
  bottomInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  leftInfo: { flexDirection: 'row', gap: spacing.md },
  ratingContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: typography.fontSize.sm, color: colors.white, fontWeight: typography.fontWeight.bold },
  durationContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  durationText: { fontSize: typography.fontSize.sm, color: 'rgba(255,255,255,0.8)' },
  priceContainer: { alignItems: 'flex-end' },
  priceLabel: { fontSize: typography.fontSize.xs, color: 'rgba(255,255,255,0.7)', marginBottom: 2 },
  price: { fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, color: colors.white },
});
