/**
 * PREMIUM CAR CARD COMPONENT
 *
 * Theme-aware car rental card — all colors from useTheme().
 *
 * Used in:
 * - CarResultsScreen (standalone car booking)
 * - PackageBuildScreen (package flow)
 * - CarSelectionSheet (package flow full view)
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  People,
  Briefcase,
  Setting4,
  Star1,
  TickCircle,
  Wind,
  Car,
  Speedometer,
} from 'iconsax-react-native';
import { spacing, typography, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';

export interface CarCardData {
  id: string;
  name: string;
  make: string;
  model: string;
  category: string;
  pricePerDay: number;
  images?: string[];
  specs: {
    seats: number;
    luggage: { large: number; small: number };
    transmission: 'automatic' | 'manual';
    airConditioning?: boolean;
    mileage?: 'unlimited' | 'limited';
  };
  company: {
    name: string;
    rating: number;
    logo?: string;
  };
  popularChoice?: boolean;
  bestValue?: boolean;
}

interface CarCardProps {
  car: CarCardData;
  days?: number;
  index?: number;
  isSelected?: boolean;
  compact?: boolean;
  onPress: () => void;
}

const getCategoryStyle = (category: string, primary: string): { bg: string; text: string } => {
  const c = category.toLowerCase();
  if (c.includes('suv')) return { bg: '#059669', text: '#FFFFFF' };
  if (c.includes('luxury')) return { bg: '#7C3AED', text: '#FFFFFF' };
  if (c.includes('convertible') || c.includes('sport')) return { bg: '#EC4899', text: '#FFFFFF' };
  if (c.includes('compact')) return { bg: '#0EA5E9', text: '#FFFFFF' };
  if (c.includes('economy')) return { bg: primary, text: '#FFFFFF' };
  if (c.includes('full')) return { bg: '#6366F1', text: '#FFFFFF' };
  if (c.includes('minivan')) return { bg: '#F59E0B', text: '#FFFFFF' };
  if (c.includes('standard')) return { bg: '#8B5CF6', text: '#FFFFFF' };
  if (c.includes('midsize')) return { bg: '#14B8A6', text: '#FFFFFF' };
  return { bg: primary, text: '#FFFFFF' };
};

export default function CarCard({
  car,
  days = 1,
  index = 0,
  isSelected = false,
  compact = false,
  onPress,
}: CarCardProps) {
  const { colors: tc } = useTheme();
  const totalPrice = car.pricePerDay * days;
  const catColor = getCategoryStyle(car.category, tc.primary);
  const initials = car.company.name.substring(0, 2).toUpperCase();

  return (
    <Animated.View entering={FadeInDown.duration(400).delay(index * 80)}>
      <TouchableOpacity
        style={[
          styles.container,
          { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle },
          compact && styles.containerCompact,
          isSelected && { borderColor: tc.primary, borderWidth: 2 },
        ]}
        onPress={onPress}
        activeOpacity={0.9}
      >
        {/* Popular / Best Value Badge */}
        {(car.popularChoice || car.bestValue || index === 0) && !compact && (
          <View style={[styles.popularBadge, { backgroundColor: car.bestValue ? '#059669' : tc.primary }]}>
            <Star1 size={10} color="#FFFFFF" variant="Bold" />
            <Text style={styles.popularText}>
              {car.bestValue ? 'Best Value' : 'Popular Choice'}
            </Text>
          </View>
        )}

        {/* Selected check */}
        {isSelected && (
          <View style={[styles.selectedBadge, { backgroundColor: tc.primary }]}>
            <TickCircle size={16} color="#FFFFFF" variant="Bold" />
          </View>
        )}

        {/* Image Section */}
        <View
          style={[
            styles.imageSection,
            { backgroundColor: `${tc.primary}08` },
            compact && styles.imageSectionCompact,
          ]}
        >
          <View style={[styles.categoryBadge, { backgroundColor: catColor.bg }]}>
            <Text style={[styles.categoryText, { color: catColor.text }]}>{car.category}</Text>
          </View>

          <View style={styles.imageContainer}>
            {car.images?.[0] ? (
              <Image source={{ uri: car.images[0] }} style={styles.image} resizeMode="contain" />
            ) : (
              <View style={styles.imagePlaceholder}>
                <View style={[styles.placeholderIconCircle, { backgroundColor: `${tc.primary}15` }]}>
                  <Car size={compact ? 32 : 44} color={tc.primary} variant="Bold" />
                </View>
                <Text style={[styles.placeholderLabel, { color: tc.textSecondary }]}>
                  {car.name}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Info Section */}
        <View style={[styles.infoSection, compact && styles.infoSectionCompact]}>
          {/* Name + Price */}
          <View style={styles.headerRow}>
            <View style={styles.nameContainer}>
              <Text
                style={[styles.carName, { color: tc.textPrimary }, compact && styles.carNameCompact]}
                numberOfLines={1}
              >
                {car.name}
              </Text>
              <Text style={[styles.carSubtitle, { color: tc.textSecondary }]}>
                or similar {car.category.toLowerCase()}
              </Text>
            </View>
            <View style={styles.priceContainer}>
              <View style={styles.priceRow}>
                <Text style={[styles.priceCurrency, { color: isSelected ? tc.primary : tc.textPrimary }]}>$</Text>
                <Text style={[styles.priceAmount, { color: isSelected ? tc.primary : tc.textPrimary }]}>
                  {car.pricePerDay.toLocaleString('en-US')}
                </Text>
              </View>
              <Text style={[styles.priceLabel, { color: tc.textSecondary }]}>per day</Text>
            </View>
          </View>

          {/* Specs chips */}
          <View style={styles.specsRow}>
            <View style={[styles.specChip, { backgroundColor: `${tc.primary}10` }]}>
              <People size={14} color={tc.primary} variant="Bold" />
              <Text style={[styles.specValue, { color: tc.textPrimary }]}>{car.specs.seats}</Text>
              <Text style={[styles.specLabel, { color: tc.textSecondary }]}>seats</Text>
            </View>
            <View style={[styles.specChip, { backgroundColor: `${tc.primary}10` }]}>
              <Briefcase size={14} color={tc.primary} variant="Bold" />
              <Text style={[styles.specValue, { color: tc.textPrimary }]}>
                {car.specs.luggage.large + car.specs.luggage.small}
              </Text>
              <Text style={[styles.specLabel, { color: tc.textSecondary }]}>bags</Text>
            </View>
            <View style={[styles.specChip, { backgroundColor: `${tc.primary}10` }]}>
              <Setting4 size={14} color={tc.primary} variant="Bold" />
              <Text style={[styles.specValue, { color: tc.textPrimary }]}>
                {car.specs.transmission === 'automatic' ? 'Auto' : 'Manual'}
              </Text>
            </View>
            {car.specs.airConditioning && (
              <View style={[styles.specChip, { backgroundColor: `${tc.primary}10` }]}>
                <Wind size={14} color={tc.primary} variant="Bold" />
                <Text style={[styles.specValue, { color: tc.textPrimary }]}>A/C</Text>
              </View>
            )}
          </View>

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: tc.borderSubtle }]} />

          {/* Company + Features */}
          <View style={styles.bottomRow}>
            <View style={styles.companySection}>
              {car.company.logo ? (
                <Image
                  source={{ uri: car.company.logo }}
                  style={[styles.companyLogo, { backgroundColor: `${tc.primary}10` }]}
                  resizeMode="contain"
                />
              ) : (
                <View style={[styles.companyLogo, { backgroundColor: `${tc.primary}15` }]}>
                  <Text style={[styles.companyInitials, { color: tc.primary }]}>{initials}</Text>
                </View>
              )}
              <View>
                <Text style={[styles.companyName, { color: tc.textPrimary }]}>{car.company.name}</Text>
                <View style={styles.ratingRow}>
                  <Star1 size={12} color="#FFB800" variant="Bold" />
                  <Text style={[styles.ratingText, { color: tc.textPrimary }]}>
                    {car.company.rating.toFixed(1)}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.featuresSection}>
              {car.specs.mileage === 'unlimited' && (
                <View style={[styles.unlimitedBadge, { backgroundColor: `${tc.success}12` }]}>
                  <Speedometer size={12} color={tc.success} variant="Bold" />
                  <Text style={[styles.unlimitedText, { color: tc.success }]}>Unlimited miles</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius['2xl'],
    marginBottom: spacing.md,
    borderWidth: 1.5,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },
  containerCompact: {
    marginBottom: spacing.sm,
  },
  popularBadge: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    gap: 4,
    zIndex: 10,
  },
  popularText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  selectedBadge: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  imageSection: {
    height: 160,
    position: 'relative',
  },
  imageSectionCompact: {
    height: 110,
  },
  categoryBadge: {
    position: 'absolute',
    bottom: spacing.md,
    right: spacing.md,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 5,
    borderRadius: borderRadius.sm,
    zIndex: 5,
  },
  categoryText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 0.5,
    textTransform: 'capitalize',
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '80%',
    height: '80%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    marginTop: spacing.xs,
  },
  infoSection: {
    padding: spacing.lg,
  },
  infoSectionCompact: {
    padding: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  nameContainer: {
    flex: 1,
    marginRight: spacing.md,
  },
  carName: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: -0.3,
  },
  carNameCompact: {
    fontSize: typography.fontSize.base,
  },
  carSubtitle: {
    fontSize: typography.fontSize.xs,
    marginTop: 2,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceCurrency: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  priceAmount: {
    fontSize: 28,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: -0.5,
  },
  priceLabel: {
    fontSize: typography.fontSize.xs,
    marginTop: 2,
  },
  specsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  specChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: borderRadius.md,
    gap: 4,
  },
  specValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  specLabel: {
    fontSize: typography.fontSize.xs,
  },
  divider: {
    height: 1,
    marginBottom: spacing.md,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  companySection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  companyLogo: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  companyInitials: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
  },
  companyName: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  },
  featuresSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  unlimitedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: borderRadius.sm,
  },
  unlimitedText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  },
});
