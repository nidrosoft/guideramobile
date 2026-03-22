import { View, Text, StyleSheet, Dimensions, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { typography, spacing, borderRadius, shadows } from '@/styles';

const { width: screenWidth } = Dimensions.get('window');
const CARD_WIDTH = screenWidth * 0.82;
import { useTheme } from '@/context/ThemeContext';
import { Crown, Star1, Location, Calendar } from 'iconsax-react-native';
import SaveButton from '@/components/common/SaveButton';

interface LuxuryEscapeCardProps {
  id?: string;
  name: string;
  location: string;
  rating: number;
  price: string;
  duration: string;
  category: string;
  imageUrl: string;
}

export default function LuxuryEscapeCard({ 
  id,
  name, 
  location, 
  rating, 
  price, 
  duration, 
  category, 
  imageUrl 
}: LuxuryEscapeCardProps) {
  const { colors } = useTheme();
  const { height: screenHeight } = useWindowDimensions();
  return (
    <View style={styles.container}>
      {/* Card with shadow */}
      <View style={[styles.card, { height: Math.min(420, screenHeight * 0.55) }]}>
        {/* Background Image */}
        <Image source={imageUrl} style={styles.backgroundImage} contentFit="cover" transition={200} />
        
        {/* Dark Gradient Overlay */}
        <LinearGradient
          colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']}
          style={styles.gradient}
        />

        {/* Premium Badge */}
        <View style={styles.premiumBadge}>
          <Crown size={16} color="#FFD700" variant="Bold" />
          <Text style={styles.premiumText}>LUXURY</Text>
        </View>

        {/* Save Button */}
        {id ? <SaveButton destinationId={id} style={styles.saveButton} /> : null}

        {/* Content */}
        <View style={styles.content}>
          {/* Location */}
          <View style={styles.locationContainer}>
            <Location size={14} color="#FFFFFF" variant="Bold" />
            <Text style={styles.locationText}>{location}</Text>
          </View>

          {/* Name */}
          <Text style={styles.name} numberOfLines={2} ellipsizeMode="tail">{name}</Text>

          {/* Category */}
          <Text style={styles.category}>{category}</Text>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Bottom Info */}
          <View style={styles.bottomInfo}>
            {/* Left Side - Rating & Duration */}
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

            {/* Right Side - Price */}
            <View style={styles.priceContainer}>
              <Text style={styles.priceLabel}>From</Text>
              <Text style={styles.price}>{price}</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginRight: spacing.md,
  },
  card: {
    width: CARD_WIDTH,
    borderRadius: borderRadius['2xl'],
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    ...shadows.cardHover,
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  premiumBadge: {
    position: 'absolute',
    top: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  premiumText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: '#FFD700',
    letterSpacing: 1,
  },
  saveButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    zIndex: 10,
  },
  content: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.xl,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  locationText: {
    fontSize: typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: typography.fontWeight.medium,
  },
  name: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    color: '#FFFFFF',
    marginBottom: spacing.xs,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  category: {
    fontSize: typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: typography.fontWeight.medium,
    marginBottom: spacing.md,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: spacing.md,
  },
  bottomInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  leftInfo: {
    gap: spacing.sm,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  ratingText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: '#FFFFFF',
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  durationText: {
    fontSize: typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: typography.fontWeight.medium,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  priceLabel: {
    fontSize: typography.fontSize.xs,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 2,
  },
  price: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: '#FFD700',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
