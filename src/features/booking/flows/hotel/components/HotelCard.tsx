/**
 * HOTEL CARD
 * 
 * Card displaying hotel in search results
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Star1, Location, Heart } from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, typography, shadows, borderRadius } from '@/styles';
import { Hotel } from '../../../types/hotel.types';

interface HotelCardProps {
  hotel: Hotel;
  nights: number;
  onSelect: () => void;
  onFavorite?: () => void;
  isFavorite?: boolean;
}

export default function HotelCard({
  hotel,
  nights,
  onSelect,
  onFavorite,
  isFavorite = false,
}: HotelCardProps) {
  const totalPrice = hotel.pricePerNight.amount * nights;
  const mainImage = hotel.images[0]?.url || 'https://via.placeholder.com/300x200';
  
  // Get top 3 amenities
  const topAmenities = hotel.amenities.slice(0, 3).map(a => a.name);

  const handleFavorite = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onFavorite?.();
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onSelect}
      activeOpacity={0.9}
    >
      {/* Image */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: mainImage }}
          style={styles.image}
          resizeMode="cover"
        />
        
        {/* Favorite Button */}
        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={handleFavorite}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Heart
            size={20}
            color={isFavorite ? colors.error : colors.white}
            variant={isFavorite ? 'Bold' : 'Linear'}
          />
        </TouchableOpacity>
        
        {/* Rating Badge */}
        <View style={styles.ratingBadge}>
          <Star1 size={12} color={colors.warning} variant="Bold" />
          <Text style={styles.ratingText}>{hotel.userRating.toFixed(1)}</Text>
        </View>
      </View>
      
      {/* Content */}
      <View style={styles.content}>
        {/* Star Rating */}
        <View style={styles.starRow}>
          {Array.from({ length: hotel.starRating }).map((_, i) => (
            <Star1 key={i} size={12} color={colors.warning} variant="Bold" />
          ))}
        </View>
        
        {/* Name */}
        <Text style={styles.name} numberOfLines={1}>{hotel.name}</Text>
        
        {/* Location */}
        <View style={styles.locationRow}>
          <Location size={14} color={colors.textSecondary} />
          <Text style={styles.location} numberOfLines={1}>
            {hotel.location.neighborhood || hotel.location.city}
          </Text>
        </View>
        
        {/* Amenities */}
        <View style={styles.amenitiesRow}>
          {topAmenities.map((amenity, index) => (
            <View key={index} style={styles.amenityBadge}>
              <Text style={styles.amenityText}>{amenity}</Text>
            </View>
          ))}
        </View>
        
        {/* Price */}
        <View style={styles.priceRow}>
          <View>
            <Text style={styles.priceLabel}>From</Text>
            <Text style={styles.price}>
              ${hotel.pricePerNight.amount}
              <Text style={styles.priceUnit}>/night</Text>
            </Text>
          </View>
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>{nights} nights</Text>
            <Text style={styles.totalPrice}>${totalPrice}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.xl,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    ...shadows.sm,
  },
  imageContainer: {
    height: 160,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  favoriteButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ratingBadge: {
    position: 'absolute',
    bottom: spacing.sm,
    left: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    gap: 4,
  },
  ratingText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  content: {
    padding: spacing.md,
  },
  starRow: {
    flexDirection: 'row',
    gap: 2,
    marginBottom: spacing.xs,
  },
  name: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: spacing.sm,
  },
  location: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    flex: 1,
  },
  amenitiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  amenityBadge: {
    backgroundColor: colors.gray50,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  amenityText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  priceLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  price: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  priceUnit: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.regular,
    color: colors.textSecondary,
  },
  totalContainer: {
    alignItems: 'flex-end',
  },
  totalLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  totalPrice: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
});
