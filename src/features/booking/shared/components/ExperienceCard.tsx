/**
 * PREMIUM EXPERIENCE CARD COMPONENT
 * 
 * A visually stunning, premium experience/activity card designed to disrupt the travel industry.
 * Features elegant image presentation, refined rating displays, category badges,
 * and premium visual polish.
 * 
 * Used in:
 * - ExperienceResultsScreen (standalone experience booking)
 * - PackageBuildScreen (package flow)
 * - ExperienceSelectionSheet (package flow full view)
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Star1, 
  Clock, 
  Heart, 
  TickCircle,
  People,
  Medal,
  Flash,
  Map1,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, typography, borderRadius } from '@/styles';

// Experience display data interface
export interface ExperienceCardData {
  id: string;
  title: string;
  shortDescription?: string;
  images: string[];
  category: string;
  duration: number; // in minutes
  price: number;
  rating: number;
  reviewCount: number;
  bestSeller?: boolean;
  featured?: boolean;
  instantConfirmation?: boolean;
  maxParticipants?: number;
}

interface ExperienceCardProps {
  experience: ExperienceCardData;
  index?: number;
  isSelected?: boolean;
  isFavorite?: boolean;
  compact?: boolean;
  onPress: () => void;
  onFavorite?: () => void;
}

// Category icon and color mapping
const CATEGORY_CONFIG: Record<string, { icon: any; color: string; bg: string }> = {
  'Tours': { icon: Map1, color: '#0EA5E9', bg: '#F0F9FF' },
  'Adventure': { icon: Flash, color: '#F59E0B', bg: '#FFFBEB' },
  'Cultural': { icon: Medal, color: '#8B5CF6', bg: '#F5F3FF' },
  'Food & Drink': { icon: Star1, color: '#EC4899', bg: '#FDF2F8' },
  'Nature': { icon: Map1, color: '#10B981', bg: '#ECFDF5' },
  'Water Sports': { icon: Flash, color: '#0EA5E9', bg: '#F0F9FF' },
  'default': { icon: Star1, color: colors.primary, bg: `${colors.primary}10` },
};

const getCategoryConfig = (category: string) => {
  return CATEGORY_CONFIG[category] || CATEGORY_CONFIG['default'];
};

const formatDuration = (minutes: number): string => {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours} hours`;
};

// Get rating label based on score
const getRatingLabel = (rating: number): string => {
  if (rating >= 4.8) return 'Exceptional';
  if (rating >= 4.5) return 'Excellent';
  if (rating >= 4.0) return 'Very Good';
  if (rating >= 3.5) return 'Good';
  return 'Fair';
};

export default function ExperienceCard({
  experience,
  index = 0,
  isSelected = false,
  isFavorite = false,
  compact = false,
  onPress,
  onFavorite,
}: ExperienceCardProps) {
  const handleFavorite = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onFavorite?.();
  };

  const categoryConfig = getCategoryConfig(experience.category);
  const CategoryIcon = categoryConfig.icon;
  const ratingLabel = getRatingLabel(experience.rating);

  return (
    <Animated.View entering={FadeInDown.duration(400).delay(index * 100)}>
      <TouchableOpacity
        style={[
          styles.container,
          compact && styles.containerCompact,
          isSelected && styles.containerSelected,
        ]}
        onPress={onPress}
        activeOpacity={0.9}
      >
        {/* Image Section */}
        <View style={[styles.imageContainer, compact && styles.imageContainerCompact]}>
          <Image 
            source={{ uri: experience.images[0] }} 
            style={styles.image}
            resizeMode="cover"
          />
          
          {/* Gradient Overlay */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.5)']}
            style={styles.imageGradient}
          />
          
          {/* Favorite Button - Glassmorphism */}
          {!compact && onFavorite && (
            <TouchableOpacity
              style={styles.favoriteButton}
              onPress={handleFavorite}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Heart
                size={18}
                color={isFavorite ? '#FF4757' : colors.white}
                variant={isFavorite ? 'Bold' : 'Linear'}
              />
            </TouchableOpacity>
          )}
          
          {/* Best Seller / Featured Badge */}
          {(experience.bestSeller || experience.featured || index === 0) && !compact && (
            <LinearGradient
              colors={experience.featured ? ['#F59E0B', '#D97706'] : [colors.primary, colors.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.badgeGradient}
            >
              <Medal size={10} color={colors.white} variant="Bold" />
              <Text style={styles.badgeText}>
                {experience.featured ? 'Featured' : 'Best Seller'}
              </Text>
            </LinearGradient>
          )}

          {/* Category Badge - Bottom of image */}
          <View style={[styles.categoryBadge, { backgroundColor: categoryConfig.bg }]}>
            <CategoryIcon size={12} color={categoryConfig.color} variant="Bold" />
            <Text style={[styles.categoryText, { color: categoryConfig.color }]}>
              {experience.category}
            </Text>
          </View>

          {/* Selected Indicator */}
          {isSelected && (
            <LinearGradient
              colors={[colors.primary, colors.primaryDark]}
              style={styles.selectedBadge}
            >
              <TickCircle size={16} color={colors.white} variant="Bold" />
            </LinearGradient>
          )}
        </View>
        
        {/* Content Section */}
        <View style={[styles.content, compact && styles.contentCompact]}>
          {/* Rating Section */}
          <View style={styles.ratingSection}>
            <View style={styles.ratingBadge}>
              <Star1 size={12} color="#FFB800" variant="Bold" />
              <Text style={styles.ratingScore}>{experience.rating.toFixed(1)}</Text>
            </View>
            {!compact && (
              <>
                <Text style={styles.ratingLabel}>{ratingLabel}</Text>
                <Text style={styles.reviewCount}>
                  ({experience.reviewCount.toLocaleString()} reviews)
                </Text>
              </>
            )}
          </View>
          
          {/* Title */}
          <Text 
            style={[styles.title, compact && styles.titleCompact]} 
            numberOfLines={compact ? 1 : 2}
          >
            {experience.title}
          </Text>
          
          {/* Info Row - Duration & Participants */}
          <View style={styles.infoRow}>
            <View style={styles.infoChip}>
              <Clock size={12} color={colors.textSecondary} />
              <Text style={styles.infoText}>{formatDuration(experience.duration)}</Text>
            </View>
            {experience.instantConfirmation && !compact && (
              <View style={[styles.infoChip, styles.instantChip]}>
                <Flash size={12} color={colors.success} variant="Bold" />
                <Text style={[styles.infoText, { color: colors.success }]}>Instant</Text>
              </View>
            )}
          </View>
          
          {/* Divider */}
          <View style={styles.divider} />
          
          {/* Price Section */}
          <View style={styles.priceSection}>
            <View style={styles.priceMain}>
              <Text style={styles.priceFrom}>From</Text>
              <View style={styles.priceValue}>
                <Text style={[styles.priceCurrency, isSelected && styles.priceSelected]}>$</Text>
                <Text style={[styles.price, isSelected && styles.priceSelected]}>
                  {experience.price}
                </Text>
                <Text style={styles.priceUnit}>/ person</Text>
              </View>
            </View>
            
            {/* Quick Book Indicator */}
            {!compact && (
              <View style={styles.bookIndicator}>
                <Text style={styles.bookText}>View Details</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  // Card Container - Premium with depth
  container: {
    backgroundColor: colors.bgElevated,
    borderRadius: 24, // Card container standard
    marginBottom: spacing.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    // Premium shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
  },
  containerCompact: {
    marginBottom: spacing.sm,
    // Keep 24px borderRadius even in compact mode for consistency
  },
  containerSelected: {
    borderColor: colors.primary,
    borderWidth: 2,
    shadowColor: colors.primary,
    shadowOpacity: 0.15,
  },

  // Image Section
  imageContainer: {
    height: 180,
    position: 'relative',
  },
  imageContainerCompact: {
    height: 120,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },

  // Favorite Button - Glassmorphism
  favoriteButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },

  // Badge Gradient (Best Seller / Featured)
  badgeGradient: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  badgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
    letterSpacing: 0.3,
  },

  // Category Badge
  categoryBadge: {
    position: 'absolute',
    bottom: spacing.md,
    left: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 4,
  },
  categoryText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  },

  // Selected Badge
  selectedBadge: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Content Section
  content: {
    padding: spacing.lg,
  },
  contentCompact: {
    padding: spacing.md,
  },

  // Rating Section
  ratingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  ratingScore: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  ratingLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  reviewCount: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },

  // Title
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    lineHeight: 24,
    letterSpacing: -0.3,
  },
  titleCompact: {
    fontSize: typography.fontSize.base,
    lineHeight: 20,
  },

  // Info Row
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  infoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray50,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  instantChip: {
    backgroundColor: `${colors.success}10`,
  },
  infoText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: colors.gray100,
    marginBottom: spacing.md,
  },

  // Price Section
  priceSection: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  priceMain: {
    flex: 1,
  },
  priceFrom: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  priceValue: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceCurrency: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  price: {
    fontSize: 28,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  priceSelected: {
    color: colors.primary,
  },
  priceUnit: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginLeft: 2,
  },

  // Book Indicator
  bookIndicator: {
    backgroundColor: `${colors.primary}10`,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 12,
  },
  bookText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
  },
});
