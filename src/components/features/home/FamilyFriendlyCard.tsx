import { View, Text, StyleSheet, Dimensions, useWindowDimensions } from 'react-native';
import CachedImage from '@/components/common/CachedImage';
import { BlurView } from 'expo-blur';
import { typography, spacing, borderRadius } from '@/styles';

const { width: screenWidth } = Dimensions.get('window');
const CARD_WIDTH = screenWidth * 0.87;
import { useTheme } from '@/context/ThemeContext';
import { Star1, Location, People, TickCircle } from 'iconsax-react-native';
import SaveButton from '@/components/common/SaveButton';

interface FamilyFriendlyCardProps {
  id?: string;
  name: string;
  location: string;
  rating: number;
  reviews: string;
  distance: string;
  ageRange: string;
  activities: number;
  safetyRating: string;
  imageUrl: string;
  index: number;
}

export default function FamilyFriendlyCard({ 
  id,
  name, 
  location, 
  rating, 
  reviews,
  distance,
  ageRange,
  activities,
  safetyRating,
  imageUrl,
  index
}: FamilyFriendlyCardProps) {
  const { colors } = useTheme();
  const { height: screenHeight } = useWindowDimensions();
  return (
    <View style={styles.container}>
      <View style={[styles.card, { height: Math.min(480, screenHeight * 0.6), borderColor: colors.borderSubtle }]}>
        {/* Background Image */}
        <CachedImage uri={imageUrl} style={styles.backgroundImage} />
        
        {/* Top Section */}
        <View style={styles.topSection}>
          {/* Family Trusted Badge */}
          <View style={styles.familyBadge}>
            <Text style={styles.familyBadgeIcon}>👍</Text>
            <Text style={styles.familyBadgeText}>Family Trusted</Text>
          </View>
          
          {id ? <SaveButton destinationId={id} /> : null}
        </View>

        {/* Bottom Info Container with Blur */}
        <View style={styles.bottomContainer}>
          <BlurView intensity={60} tint="dark" style={styles.blurContainer}>
            {/* Location */}
            <Text style={styles.locationText}>{location}</Text>
            
            {/* Name */}
            <Text style={styles.name} numberOfLines={2} ellipsizeMode="tail">{name}</Text>
            
            {/* Details Row */}
            <View style={styles.detailsRow}>
              {/* Rating */}
              <View style={styles.detailItem}>
                <Star1 size={16} color="#FFA500" variant="Bold" />
                <Text style={styles.detailText}>{rating} ({reviews} Review)</Text>
              </View>
              
              {/* Distance */}
              <View style={styles.detailItem}>
                <Location size={16} color={colors.primary} variant="Bold" />
                <Text style={styles.detailText}>{distance}</Text>
              </View>
            </View>

            {/* Family Info Row */}
            <View style={styles.familyInfoRow}>
              {/* Age Range */}
              <View style={styles.familyInfoItem}>
                <People size={14} color={colors.white} variant="Outline" />
                <Text style={styles.familyInfoText}>Ages {ageRange}</Text>
              </View>
              
              {/* Activities */}
              <View style={styles.familyInfoItem}>
                <TickCircle size={14} color="#4CAF50" variant="Bold" />
                <Text style={styles.familyInfoText}>{activities} Activities</Text>
              </View>
              
              {/* Safety */}
              <View style={styles.familyInfoItem}>
                <TickCircle size={14} color="#4CAF50" variant="Bold" />
                <Text style={styles.familyInfoText}>{safetyRating} Safe</Text>
              </View>
            </View>

          </BlurView>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginRight: spacing.lg,
  },
  card: {
    width: CARD_WIDTH,
    borderRadius: borderRadius['3xl'],
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  topSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
  },
  familyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
  },
  familyBadgeIcon: {
    fontSize: 16,
  },
  familyBadgeText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: '#1a1a1a',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: spacing.lg,
    left: spacing.lg,
    right: spacing.lg,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  blurContainer: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  locationText: {
    fontSize: typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: spacing.xs,
  },
  name: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: '#FFFFFF',
    marginBottom: spacing.sm,
  },
  detailsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: typography.fontSize.sm,
    color: '#FFFFFF',
    fontWeight: typography.fontWeight.medium,
  },
  familyInfoRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
    flexWrap: 'wrap',
  },
  familyInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },
  familyInfoText: {
    fontSize: typography.fontSize.xs,
    color: '#FFFFFF',
    fontWeight: typography.fontWeight.medium,
  },
});
