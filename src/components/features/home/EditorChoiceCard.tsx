import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { colors, typography, spacing, borderRadius } from '@/styles';
import { Bookmark, Location, Star1, ArrowRight, Award } from 'iconsax-react-native';

interface EditorChoiceCardProps {
  name: string;
  location: string;
  reason: string;
  rating: number;
  imageUrl: string;
}

export default function EditorChoiceCard({ name, location, reason, rating, imageUrl }: EditorChoiceCardProps) {
  return (
    <View style={styles.container}>
      {/* Background Image */}
      <Image source={{ uri: imageUrl }} style={styles.backgroundImage} />
      
      {/* Gradient Overlay */}
      <View style={styles.overlay} />

      {/* Top Section */}
      <View style={styles.topSection}>
        {/* Editor Choice Badge */}
        <View style={styles.badge}>
          <Award size={16} color="#FFD700" variant="Bold" />
          <Text style={styles.badgeText}>Editor's Pick</Text>
        </View>
        
        {/* Bookmark Button */}
        <TouchableOpacity style={styles.bookmarkButton}>
          <Bookmark size={20} color={colors.textPrimary} variant="Outline" />
        </TouchableOpacity>
      </View>

      {/* Bottom Section */}
      <View style={styles.bottomSection}>
        {/* Location */}
        <View style={styles.locationContainer}>
          <Location size={14} color={colors.white} variant="Bold" />
          <Text style={styles.locationText}>{location}</Text>
        </View>
        
        {/* Place Name */}
        <Text style={styles.placeName}>{name}</Text>
        
        {/* Why Editor's Choice */}
        <View style={styles.reasonContainer}>
          <Text style={styles.reasonLabel}>Why we love it:</Text>
          <Text style={styles.reasonText}>{reason}</Text>
        </View>
        
        {/* Rating */}
        <View style={styles.ratingContainer}>
          <Star1 size={16} color="#FFD700" variant="Bold" />
          <Text style={styles.ratingText}>{rating} Exceptional</Text>
        </View>
        
        {/* Swipe Button */}
        <TouchableOpacity style={styles.swipeButton}>
          <ArrowRight size={24} color={colors.textPrimary} variant="Outline" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 320,
    height: 420,
    borderRadius: 32,
    overflow: 'hidden',
    marginRight: spacing.md,
    position: 'relative',
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
    color: colors.textPrimary,
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
    color: colors.white,
    fontWeight: typography.fontWeight.medium,
  },
  placeName: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
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
    color: colors.white,
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
    color: colors.white,
    fontWeight: typography.fontWeight.semibold,
  },
  swipeButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
});
