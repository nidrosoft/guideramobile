/**
 * SEARCH RESULT CARD
 * 
 * Reusable card component for displaying search results.
 * Follows the design system with Apple-style border radius.
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Location, Building, Map1, Star1, Heart } from 'iconsax-react-native';
import { typography, spacing, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { SearchResult } from '@/services/search.service';

interface SearchResultCardProps {
  result: SearchResult;
  onPress: () => void;
  onFavoritePress?: () => void;
  isFavorite?: boolean;
}

const TYPE_CONFIG = {
  destination: { icon: Location, label: 'Destination' },
  hotel: { icon: Building, label: 'Hotel' },
  experience: { icon: Map1, label: 'Experience' },
  place: { icon: Map1, label: 'Place' },
  flight: { icon: Location, label: 'Flight' },
  deal: { icon: Location, label: 'Deal' },
};

export default function SearchResultCard({
  result,
  onPress,
  onFavoritePress,
  isFavorite = false,
}: SearchResultCardProps) {
  const { colors } = useTheme();
  
  const typeConfig = TYPE_CONFIG[result.type] || TYPE_CONFIG.destination;
  const TypeIcon = typeConfig.icon;

  const dynamicStyles = useMemo(() => ({
    card: {
      backgroundColor: colors.bgElevated,
      borderColor: colors.gray100,
    },
    typeText: { color: colors.primary },
    title: { color: colors.textPrimary },
    subtitle: { color: colors.textSecondary },
    ratingText: { color: colors.textPrimary },
    priceText: { color: colors.primary },
    favoriteButton: { backgroundColor: colors.bgElevated },
  }), [colors]);

  return (
    <TouchableOpacity
      style={[styles.card, dynamicStyles.card]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Image */}
      <Image source={{ uri: result.image }} style={styles.image} />
      
      {/* Content */}
      <View style={styles.content}>
        {/* Type Badge */}
        <View style={styles.typeRow}>
          <TypeIcon size={14} color={colors.primary} variant="Bold" />
          <Text style={[styles.typeText, dynamicStyles.typeText]}>
            {typeConfig.label}
          </Text>
        </View>
        
        {/* Title */}
        <Text style={[styles.title, dynamicStyles.title]} numberOfLines={1}>
          {result.title}
        </Text>
        
        {/* Subtitle */}
        <Text style={[styles.subtitle, dynamicStyles.subtitle]} numberOfLines={1}>
          {result.subtitle}
        </Text>
        
        {/* Footer: Rating & Price */}
        <View style={styles.footer}>
          {result.rating && (
            <View style={styles.ratingContainer}>
              <Star1 size={14} color={colors.warning} variant="Bold" />
              <Text style={[styles.ratingText, dynamicStyles.ratingText]}>
                {result.rating}
              </Text>
            </View>
          )}
          {result.price && (
            <Text style={[styles.priceText, dynamicStyles.priceText]}>
              From ${result.price}
            </Text>
          )}
        </View>
      </View>
      
      {/* Favorite Button */}
      {onFavoritePress && (
        <TouchableOpacity
          style={[styles.favoriteButton, dynamicStyles.favoriteButton]}
          onPress={onFavoritePress}
          activeOpacity={0.7}
        >
          <Heart
            size={20}
            color={isFavorite ? colors.error : colors.gray400}
            variant={isFavorite ? 'Bold' : 'Outline'}
          />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
  },
  image: {
    width: 100,
    height: 100,
  },
  content: {
    flex: 1,
    padding: spacing.sm,
    justifyContent: 'center',
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  typeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },
  title: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    marginTop: 2,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  priceText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  favoriteButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
});
