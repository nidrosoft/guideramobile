/**
 * PREMIUM HOTEL CARD COMPONENT
 * 
 * A visually stunning, premium hotel card designed to disrupt the travel industry.
 * Features elegant image presentation, refined typography, beautiful rating displays,
 * and premium visual polish.
 * 
 * Used in:
 * - HotelResultsScreen (standalone hotel booking)
 * - PackageBuildScreen (package flow)
 * - HotelSelectionSheet (package flow full view)
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ImageBackground } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Star1, 
  Location, 
  Heart, 
  TickCircle,
  Wifi,
  Car,
  Coffee,
  Wind,
  People,
  Lovely,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, typography, borderRadius } from '@/styles';

// Hotel display data interface
export interface HotelCardData {
  id: string;
  name: string;
  starRating: number;
  userRating: number;
  reviewCount?: number;
  location: {
    city?: string;
    neighborhood?: string;
    address?: string;
  };
  pricePerNight: number;
  totalPrice?: number;
  images?: string[];
  amenities?: string[];
  isPopular?: boolean;
  isBestValue?: boolean;
}

interface HotelCardProps {
  hotel: HotelCardData;
  nights?: number;
  index?: number;
  isSelected?: boolean;
  isFavorite?: boolean;
  compact?: boolean;
  onPress: () => void;
  onFavorite?: () => void;
}

// Amenity icon mapping
const AMENITY_CONFIG: Record<string, { icon: any; color: string }> = {
  'WiFi': { icon: Wifi, color: '#6366F1' },
  'Free WiFi': { icon: Wifi, color: '#6366F1' },
  'Parking': { icon: Car, color: '#059669' },
  'Free Parking': { icon: Car, color: '#059669' },
  'Breakfast': { icon: Coffee, color: '#D97706' },
  'Free Breakfast': { icon: Coffee, color: '#D97706' },
  'Pool': { icon: Lovely, color: '#0EA5E9' },
  'Swimming Pool': { icon: Lovely, color: '#0EA5E9' },
  'Spa': { icon: Wind, color: '#EC4899' },
  'Gym': { icon: People, color: '#8B5CF6' },
  'Fitness': { icon: People, color: '#8B5CF6' },
};

const getAmenityIcon = (amenity: string) => {
  return AMENITY_CONFIG[amenity] || { icon: Star1, color: colors.primary };
};

// Get rating label based on score
const getRatingLabel = (rating: number): string => {
  if (rating >= 4.5) return 'Exceptional';
  if (rating >= 4.0) return 'Excellent';
  if (rating >= 3.5) return 'Very Good';
  if (rating >= 3.0) return 'Good';
  return 'Fair';
};

export default function HotelCard({
  hotel,
  nights = 1,
  index = 0,
  isSelected = false,
  isFavorite = false,
  compact = false,
  onPress,
  onFavorite,
}: HotelCardProps) {
  const totalPrice = hotel.pricePerNight * nights;
  const mainImage = hotel.images?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400';
  const topAmenities = hotel.amenities?.slice(0, compact ? 2 : 4) || ['WiFi', 'Pool', 'Spa'];
  const ratingLabel = getRatingLabel(hotel.userRating);

  const handleFavorite = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onFavorite?.();
  };

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
        {/* Image Section with Gradient Overlay */}
        <View style={[styles.imageContainer, compact && styles.imageContainerCompact]}>
          <Image
            source={{ uri: mainImage }}
            style={styles.image}
            resizeMode="cover"
          />
          
          {/* Gradient Overlay for better text visibility */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.6)']}
            style={styles.imageGradient}
          />
          
          {/* Favorite Button - Premium glassmorphism style */}
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

          {/* Popular/Best Value Badge */}
          {(hotel.isPopular || hotel.isBestValue || index === 0) && !compact && (
            <LinearGradient
              colors={hotel.isBestValue ? ['#10B981', '#059669'] : [colors.primary, colors.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.popularBadge}
            >
              <Star1 size={10} color={colors.white} variant="Bold" />
              <Text style={styles.popularBadgeText}>
                {hotel.isBestValue ? 'Best Value' : 'Popular'}
              </Text>
            </LinearGradient>
          )}
          
          {/* Rating Badge - Bottom left with glassmorphism */}
          <View style={styles.ratingContainer}>
            <View style={styles.ratingBadge}>
              <Star1 size={14} color="#FFB800" variant="Bold" />
              <Text style={styles.ratingScore}>{hotel.userRating.toFixed(1)}</Text>
            </View>
            {!compact && (
              <View style={styles.ratingInfo}>
                <Text style={styles.ratingLabel}>{ratingLabel}</Text>
                {hotel.reviewCount && (
                  <Text style={styles.reviewCount}>{hotel.reviewCount} reviews</Text>
                )}
              </View>
            )}
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
          {/* Star Rating Row */}
          <View style={styles.starRow}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Star1 
                key={i} 
                size={compact ? 10 : 12} 
                color={i < hotel.starRating ? '#FFB800' : colors.gray200} 
                variant="Bold" 
              />
            ))}
            <Text style={styles.starLabel}>{hotel.starRating}-Star Hotel</Text>
          </View>
          
          {/* Hotel Name */}
          <Text style={[styles.name, compact && styles.nameCompact]} numberOfLines={compact ? 1 : 2}>
            {hotel.name}
          </Text>
          
          {/* Location with icon */}
          <View style={styles.locationRow}>
            <View style={styles.locationIcon}>
              <Location size={12} color={colors.primary} variant="Bold" />
            </View>
            <Text style={[styles.location, compact && styles.locationCompact]} numberOfLines={1}>
              {hotel.location.neighborhood || hotel.location.city || hotel.location.address}
            </Text>
          </View>
          
          {/* Amenities with icons - only show if not compact */}
          {!compact && (
            <View style={styles.amenitiesRow}>
              {topAmenities.map((amenity, idx) => {
                const config = getAmenityIcon(amenity);
                const IconComponent = config.icon;
                return (
                  <View key={idx} style={styles.amenityChip}>
                    <IconComponent size={12} color={config.color} variant="Bold" />
                    <Text style={[styles.amenityText, { color: config.color }]}>{amenity}</Text>
                  </View>
                );
              })}
            </View>
          )}
          
          {/* Divider */}
          <View style={styles.divider} />
          
          {/* Price Section */}
          <View style={styles.priceRow}>
            <View style={styles.priceMain}>
              <Text style={styles.priceFrom}>From</Text>
              <View style={styles.priceValue}>
                <Text style={[styles.priceCurrency, isSelected && styles.priceSelected]}>$</Text>
                <Text style={[styles.price, isSelected && styles.priceSelected]}>
                  {hotel.pricePerNight}
                </Text>
                <Text style={styles.priceUnit}>/night</Text>
              </View>
            </View>
            
            {nights > 1 && (
              <View style={styles.totalContainer}>
                <Text style={styles.totalLabel}>{nights} nights total</Text>
                <LinearGradient
                  colors={[colors.success, '#059669']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.totalBadge}
                >
                  <Text style={styles.totalPrice}>${totalPrice}</Text>
                </LinearGradient>
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
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg, // Use design system: 24px
    marginBottom: spacing.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.gray200, // Use design system border color
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
    backdropFilter: 'blur(10px)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },

  // Popular Badge
  popularBadge: {
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
  popularBadgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
    letterSpacing: 0.3,
  },

  // Rating Section - Bottom of image
  ratingContainer: {
    position: 'absolute',
    bottom: spacing.md,
    left: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  ratingScore: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  ratingInfo: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ratingLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  reviewCount: {
    fontSize: 10,
    color: colors.textSecondary,
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

  // Star Rating
  starRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
    gap: 2,
  },
  starLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },

  // Hotel Name
  name: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    letterSpacing: -0.3,
  },
  nameCompact: {
    fontSize: typography.fontSize.base,
  },

  // Location
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.md,
  },
  locationIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: `${colors.primary}10`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  location: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    flex: 1,
  },
  locationCompact: {
    fontSize: typography.fontSize.xs,
  },

  // Amenities
  amenitiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  amenityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray50,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  amenityText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: colors.gray100,
    marginBottom: spacing.md,
  },

  // Price Section
  priceRow: {
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

  // Total Price
  totalContainer: {
    alignItems: 'flex-end',
  },
  totalLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  totalBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 20,
  },
  totalPrice: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
});
