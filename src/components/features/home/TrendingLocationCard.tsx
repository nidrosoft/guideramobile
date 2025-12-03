import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import { colors, typography, spacing } from '@/styles';
import { Bookmark, ArrowRight, TrendUp, Star1 } from 'iconsax-react-native';

interface TrendingLocationCardProps {
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
  city, 
  country, 
  placeName, 
  visitorsCount,
  trendPercentage,
  rating,
  category,
  imageUrl 
}: TrendingLocationCardProps) {
  return (
    <View style={styles.container}>
      {/* Background Image */}
      <Image source={{ uri: imageUrl }} style={styles.backgroundImage} />
      
      {/* Top Section */}
      <View style={styles.topSection}>
        {/* Trending Badge */}
        <View style={styles.trendingBadge}>
          <TrendUp size={14} color="#4CAF50" variant="Bold" />
          <Text style={styles.trendingText}>+{trendPercentage}%</Text>
        </View>
        
        {/* Bookmark Button */}
        <TouchableOpacity style={styles.bookmarkButton}>
          <Bookmark size={20} color={colors.textPrimary} variant="Outline" />
        </TouchableOpacity>
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
              <Text style={styles.placeName}>{placeName}</Text>
              
              {/* Rating & Visitors Row */}
              <View style={styles.statsRow}>
                <View style={styles.ratingContainer}>
                  <Star1 size={14} color="#FFD700" variant="Bold" />
                  <Text style={styles.ratingText}>{rating}</Text>
                </View>
                <Text style={styles.visitorsText}>{visitorsCount} visitors</Text>
              </View>
            </View>

            {/* Right Side - Arrow Button */}
            <TouchableOpacity style={styles.arrowButton}>
              <ArrowRight size={24} color={colors.textPrimary} variant="Outline" />
            </TouchableOpacity>
          </View>
        </BlurView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 380,
    height: 360,
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
  bookmarkButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: spacing.lg,
    left: spacing.lg,
    right: spacing.lg,
    borderRadius: 24,
    overflow: 'hidden',
  },
  blurContainer: {
    borderRadius: 24,
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
    color: colors.white,
    marginBottom: 4,
    fontWeight: typography.fontWeight.medium,
  },
  placeName: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
    marginBottom: spacing.sm,
  },
  visitorsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.white,
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
    color: colors.white,
    fontWeight: typography.fontWeight.bold,
  },
  arrowButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.md,
  },
});
