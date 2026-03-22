import { View, Text, StyleSheet, Dimensions, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { typography, spacing, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';

const { width: screenWidth } = Dimensions.get('window');
const CARD_WIDTH = screenWidth * 0.82;
import { Location, Star1, Award } from 'iconsax-react-native';
import SaveButton from '@/components/common/SaveButton';

interface EditorChoiceCardProps {
  id?: string;
  name: string;
  location: string;
  reason: string;
  rating: number;
  imageUrl: string;
}

export default function EditorChoiceCard({ id, name, location, reason, rating, imageUrl }: EditorChoiceCardProps) {
  const { colors } = useTheme();
  const { height: screenHeight } = useWindowDimensions();
  return (
    <View style={[styles.container, { height: Math.min(420, screenHeight * 0.55), borderColor: colors.borderSubtle }]}>
      {/* Background Image */}
      <Image source={imageUrl} style={styles.backgroundImage} contentFit="cover" transition={200} />
      
      {/* Gradient Overlay */}
      <View style={styles.overlay} />

      {/* Top Section */}
      <View style={styles.topSection}>
        {/* Editor Choice Badge */}
        <View style={styles.badge}>
          <Award size={16} color="#FFD700" variant="Bold" />
          <Text style={styles.badgeText}>Editor's Pick</Text>
        </View>
        
        {id ? <SaveButton destinationId={id} /> : null}
      </View>

      {/* Bottom Section */}
      <View style={styles.bottomSection}>
        {/* Location */}
        <View style={styles.locationContainer}>
          <Location size={14} color="#FFFFFF" variant="Bold" />
          <Text style={styles.locationText}>{location}</Text>
        </View>
        
        {/* Place Name */}
        <Text style={styles.placeName} numberOfLines={1} ellipsizeMode="tail">{name}</Text>
        
        {/* Why Editor's Choice */}
        <View style={styles.reasonContainer}>
          <Text style={styles.reasonLabel}>Why we love it:</Text>
          <Text style={styles.reasonText} numberOfLines={3} ellipsizeMode="tail">{reason}</Text>
        </View>
        
        {/* Rating */}
        <View style={styles.ratingContainer}>
          <Star1 size={16} color="#FFD700" variant="Bold" />
          <Text style={styles.ratingText}>{rating} Exceptional</Text>
        </View>
        
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    borderRadius: borderRadius['3xl'],
    overflow: 'hidden',
    marginRight: spacing.md,
    position: 'relative',
    borderWidth: 1,
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  topSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
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
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  locationText: {
    fontSize: typography.fontSize.sm,
    color: '#FFFFFF',
    fontWeight: typography.fontWeight.medium,
  },
  placeName: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: '#FFFFFF',
    marginBottom: spacing.sm,
  },
  reasonContainer: {
    marginBottom: spacing.md,
  },
  reasonLabel: {
    fontSize: typography.fontSize.xs,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: typography.fontWeight.semibold,
    marginBottom: 4,
  },
  reasonText: {
    fontSize: typography.fontSize.sm,
    color: '#FFFFFF',
    fontWeight: typography.fontWeight.medium,
    lineHeight: 18,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: spacing.md,
  },
  ratingText: {
    fontSize: typography.fontSize.sm,
    color: '#FFFFFF',
    fontWeight: typography.fontWeight.semibold,
  },
});
