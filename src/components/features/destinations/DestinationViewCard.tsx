import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { BlurView } from 'expo-blur';
import { colors, typography, spacing, borderRadius } from '@/styles';
import { Bookmark, ArrowRight, Star1, Ticket, TrendUp, Crown } from 'iconsax-react-native';

interface DestinationViewCardProps {
  city: string;
  country: string;
  name: string;
  rating: number;
  visitors: string;
  entryFee: string;
  bestTime: string;
  image: string;
  isUNESCO: boolean;
  trending: string;
  onPress: () => void;
}

export default function DestinationViewCard({
  city,
  country,
  name,
  rating,
  visitors,
  entryFee,
  bestTime,
  image,
  isUNESCO,
  trending,
  onPress,
}: DestinationViewCardProps) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.9}
    >
      {/* Background Image */}
      <Image source={{ uri: image }} style={styles.cardImage} />

      {/* Top Badges */}
      <View style={styles.topContainer}>
        {isUNESCO && (
          <View style={styles.unescoBadge}>
            <Crown size={14} color="#FFD700" variant="Bold" />
            <Text style={styles.unescoBadgeText}>UNESCO</Text>
          </View>
        )}
        <View style={styles.trendingBadge}>
          <TrendUp size={14} color="#4CAF50" variant="Bold" />
          <Text style={styles.trendingText}>{trending}</Text>
        </View>
        <TouchableOpacity style={styles.bookmarkButton}>
          <Bookmark size={20} color={colors.textPrimary} variant="Outline" />
        </TouchableOpacity>
      </View>

      {/* Bottom Info with Blur */}
      <BlurView intensity={30} tint="light" style={styles.bottomContainer}>
        <View style={styles.infoContainer}>
          <View style={styles.textContainer}>
            <Text style={styles.location}>{city}, {country}</Text>
            <Text style={styles.name}>{name}</Text>
            
            {/* Key Info Row */}
            <View style={styles.keyInfoRow}>
              <View style={styles.infoItem}>
                <Star1 size={14} color="#FFD700" variant="Bold" />
                <Text style={styles.infoText}>{rating}</Text>
              </View>
              <View style={styles.infoItem}>
                <Ticket size={14} color={colors.white} variant="Bold" />
                <Text style={styles.infoText}>{entryFee}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Best:</Text>
                <Text style={styles.infoText}>{bestTime}</Text>
              </View>
            </View>
            
            {/* Visitors */}
            <Text style={styles.visitors}>{visitors} visitors</Text>
          </View>

          <TouchableOpacity style={styles.arrowButton}>
            <ArrowRight size={20} color={colors.textPrimary} variant="Outline" />
          </TouchableOpacity>
        </View>
      </BlurView>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    height: 420,
    borderRadius: 32,
    overflow: 'hidden',
    backgroundColor: colors.bgElevated,
    marginBottom: spacing.lg,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  topContainer: {
    position: 'absolute',
    top: spacing.lg,
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  unescoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
  },
  unescoBadgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: '#FFD700',
  },
  trendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
  },
  trendingText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: '#4CAF50',
  },
  bookmarkButton: {
    marginLeft: 'auto',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: spacing.md,
    left: spacing.md,
    right: spacing.md,
    borderRadius: 24,
    overflow: 'hidden',
  },
  infoContainer: {
    flexDirection: 'row',
    padding: spacing.lg,
    gap: spacing.md,
  },
  textContainer: {
    flex: 1,
  },
  location: {
    fontSize: typography.fontSize.sm,
    color: colors.white,
    marginBottom: 4,
  },
  name: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  keyInfoRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xs,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoLabel: {
    fontSize: typography.fontSize.xs,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: typography.fontWeight.medium,
  },
  infoText: {
    fontSize: typography.fontSize.sm,
    color: colors.white,
    fontWeight: typography.fontWeight.semibold,
  },
  visitors: {
    fontSize: typography.fontSize.xs,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: typography.fontWeight.medium,
  },
  arrowButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
