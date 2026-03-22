import { View, Text, StyleSheet, Dimensions, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { BlurView } from 'expo-blur';
import { typography, spacing, borderRadius } from '@/styles';

const { width: screenWidth } = Dimensions.get('window');
const CARD_WIDTH = screenWidth * 0.92;
import { useTheme } from '@/context/ThemeContext';
import { TrendUp, Star1 } from 'iconsax-react-native';
import SaveButton from '@/components/common/SaveButton';

interface TrendingLocationCardProps {
  id?: string;
  city: string;
  country: string;
  placeName: string;
  visitorsCount: string;
  trendPercentage: string;
  rating: number;
  category: string;
  imageUrl: string;
}

export default function TrendingLocationCard({ 
  id,
  city, 
  country, 
  placeName, 
  visitorsCount,
  trendPercentage,
  rating,
  category,
  imageUrl 
}: TrendingLocationCardProps) {
  const { colors } = useTheme();
  const { height: screenHeight } = useWindowDimensions();
  return (
    <View style={[styles.container, { height: Math.min(360, screenHeight * 0.5) }]}>
      {/* Background Image */}
      <Image source={imageUrl} style={styles.backgroundImage} contentFit="cover" transition={200} />
      
      {/* Top Section */}
      <View style={styles.topSection}>
        {/* Trending Badge */}
        {trendPercentage ? (
          <View style={styles.trendingBadge}>
            <TrendUp size={14} color="#4CAF50" variant="Bold" />
            <Text style={styles.trendingText}>+{trendPercentage}%</Text>
          </View>
        ) : <View />}
        
        {id ? <SaveButton destinationId={id} /> : null}
      </View>

      {/* Bottom Info Container with Blur */}
      <View style={styles.bottomContainer}>
        <BlurView intensity={80} tint="light" style={styles.blurContainer}>
          <View style={styles.infoSection}>
            {/* Left Side - Text Info */}
            <View style={styles.textContainer}>
              {/* Category */}
              <Text style={styles.category}>{category}</Text>
              
              <Text style={styles.location}>{city}, {country}</Text>
              <Text style={styles.placeName} numberOfLines={1} ellipsizeMode="tail">{placeName}</Text>
              
              {/* Rating & Visitors Row */}
              <View style={styles.statsRow}>
                <View style={styles.ratingContainer}>
                  <Star1 size={14} color="#FFD700" variant="Bold" />
                  <Text style={styles.ratingText}>{rating}</Text>
                </View>
                {visitorsCount ? <Text style={styles.visitorsText}>{visitorsCount} visitors</Text> : null}
              </View>
            </View>

          </View>
        </BlurView>
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
    borderColor: 'rgba(255, 255, 255, 0.05)',
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
  trendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  trendingText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: '#4CAF50',
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
    overflow: 'hidden',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: spacing.lg,
  },
  infoSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  category: {
    fontSize: typography.fontSize.xs,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
    fontWeight: typography.fontWeight.medium,
  },
  location: {
    fontSize: typography.fontSize.sm,
    color: '#FFFFFF',
    marginBottom: 4,
    fontWeight: typography.fontWeight.medium,
  },
  placeName: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: '#FFFFFF',
    marginBottom: spacing.sm,
  },
  visitorsText: {
    fontSize: typography.fontSize.xs,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: typography.fontWeight.medium,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: typography.fontSize.sm,
    color: '#FFFFFF',
    fontWeight: typography.fontWeight.bold,
  },
});
