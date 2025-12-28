/**
 * PREMIUM CAR CARD COMPONENT
 * 
 * A visually stunning, premium car rental card designed to disrupt the travel industry.
 * Features elegant car presentation, refined specs display, beautiful company badges,
 * and premium visual polish.
 * 
 * Used in:
 * - CarResultsScreen (standalone car booking)
 * - PackageBuildScreen (package flow)
 * - CarSelectionSheet (package flow full view)
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  People, 
  Briefcase, 
  Setting4, 
  Star1, 
  TickCircle,
  Wind,
  Car,
  Speedometer,
  Shield,
} from 'iconsax-react-native';
import { colors, spacing, typography, borderRadius } from '@/styles';

// Car display data interface
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

// Get category color
const getCategoryColor = (category: string): { bg: string; text: string } => {
  const lowerCategory = category.toLowerCase();
  if (lowerCategory.includes('suv')) return { bg: '#059669', text: '#ECFDF5' };
  if (lowerCategory.includes('luxury')) return { bg: '#7C3AED', text: '#F5F3FF' };
  if (lowerCategory.includes('sport')) return { bg: '#DC2626', text: '#FEF2F2' };
  if (lowerCategory.includes('compact')) return { bg: '#0EA5E9', text: '#F0F9FF' };
  if (lowerCategory.includes('economy')) return { bg: '#10B981', text: '#ECFDF5' };
  return { bg: colors.primary, text: colors.white };
};

// Get make logo initials
const getMakeInitials = (make: string): string => {
  return make.substring(0, 2).toUpperCase();
};

export default function CarCard({
  car,
  days = 1,
  index = 0,
  isSelected = false,
  compact = false,
  onPress,
}: CarCardProps) {
  const transmissionLabel = car.specs.transmission === 'automatic' ? 'Automatic' : 'Manual';
  const totalPrice = car.pricePerDay * days;
  const categoryColor = getCategoryColor(car.category);
  const makeInitials = getMakeInitials(car.make);

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
        {/* Popular/Best Value Badge */}
        {(car.popularChoice || car.bestValue || index === 0) && !compact && (
          <LinearGradient
            colors={car.bestValue ? ['#10B981', '#059669'] : [colors.primary, colors.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.popularBadge}
          >
            <Star1 size={10} color={colors.white} variant="Bold" />
            <Text style={styles.popularText}>
              {car.bestValue ? 'Best Value' : 'Popular Choice'}
            </Text>
          </LinearGradient>
        )}

        {/* Selected Badge */}
        {isSelected && (
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            style={styles.selectedBadge}
          >
            <TickCircle size={16} color={colors.white} variant="Bold" />
          </LinearGradient>
        )}
        
        {/* Car Image Section */}
        <View style={[styles.imageSection, compact && styles.imageSectionCompact]}>
          {/* Category Badge */}
          <View style={[styles.categoryBadge, { backgroundColor: categoryColor.bg }]}>
            <Text style={[styles.categoryText, { color: categoryColor.text }]}>
              {car.category}
            </Text>
          </View>

          {/* Car Image */}
          <View style={styles.imageContainer}>
            {car.images?.[0] ? (
              <Image source={{ uri: car.images[0] }} style={styles.image} resizeMode="contain" />
            ) : (
              <LinearGradient
                colors={[colors.gray100, colors.gray50]}
                style={styles.imagePlaceholder}
              >
                <Car size={compact ? 40 : 56} color={colors.gray400} variant="Bold" />
                <Text style={styles.imagePlaceholderText}>{car.make} {car.model}</Text>
              </LinearGradient>
            )}
          </View>
        </View>
        
        {/* Car Info Section */}
        <View style={[styles.infoSection, compact && styles.infoSectionCompact]}>
          {/* Header: Name + Price */}
          <View style={styles.headerRow}>
            <View style={styles.nameContainer}>
              <Text style={[styles.carName, compact && styles.carNameCompact]} numberOfLines={1}>
                {car.name}
              </Text>
              <Text style={styles.carSubtitle}>or similar {car.category.toLowerCase()}</Text>
            </View>
            <View style={styles.priceContainer}>
              <View style={styles.priceValue}>
                <Text style={[styles.priceCurrency, isSelected && styles.priceSelected]}>$</Text>
                <Text style={[styles.price, isSelected && styles.priceSelected]}>
                  {car.pricePerDay}
                </Text>
              </View>
              <Text style={styles.priceLabel}>per day</Text>
            </View>
          </View>
          
          {/* Specs Row - Premium chips */}
          <View style={styles.specsRow}>
            <View style={styles.specChip}>
              <People size={14} color={colors.primary} variant="Bold" />
              <Text style={styles.specValue}>{car.specs.seats}</Text>
              <Text style={styles.specLabel}>seats</Text>
            </View>
            <View style={styles.specChip}>
              <Briefcase size={14} color={colors.primary} variant="Bold" />
              <Text style={styles.specValue}>{car.specs.luggage.large + car.specs.luggage.small}</Text>
              <Text style={styles.specLabel}>bags</Text>
            </View>
            <View style={styles.specChip}>
              <Setting4 size={14} color={colors.primary} variant="Bold" />
              <Text style={styles.specValue}>{car.specs.transmission === 'automatic' ? 'Auto' : 'Manual'}</Text>
            </View>
            {car.specs.airConditioning && (
              <View style={styles.specChip}>
                <Wind size={14} color={colors.primary} variant="Bold" />
                <Text style={styles.specValue}>A/C</Text>
              </View>
            )}
          </View>
          
          {/* Divider */}
          <View style={styles.divider} />
          
          {/* Bottom Row: Company + Features */}
          <View style={styles.bottomRow}>
            {/* Company Info */}
            <View style={styles.companySection}>
              <View style={styles.companyLogo}>
                <Text style={styles.companyInitials}>{makeInitials}</Text>
              </View>
              <View style={styles.companyInfo}>
                <Text style={styles.companyName}>{car.company.name}</Text>
                <View style={styles.ratingRow}>
                  <Star1 size={12} color="#FFB800" variant="Bold" />
                  <Text style={styles.rating}>{car.company.rating.toFixed(1)}</Text>
                </View>
              </View>
            </View>
            
            {/* Features & Total */}
            <View style={styles.featuresSection}>
              {car.specs.mileage === 'unlimited' && (
                <View style={styles.unlimitedBadge}>
                  <Speedometer size={12} color={colors.success} variant="Bold" />
                  <Text style={styles.unlimitedText}>Unlimited km</Text>
                </View>
              )}
              {days > 1 && (
                <LinearGradient
                  colors={[colors.success, '#059669']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.totalBadge}
                >
                  <Text style={styles.totalPrice}>${totalPrice} total</Text>
                </LinearGradient>
              )}
            </View>
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
    borderWidth: 1,
    borderColor: colors.gray200, // Use design system border color
    overflow: 'hidden',
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
    zIndex: 10,
  },
  popularText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
    letterSpacing: 0.3,
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
    zIndex: 10,
  },

  // Image Section
  imageSection: {
    height: 140,
    backgroundColor: colors.gray50,
    position: 'relative',
  },
  imageSectionCompact: {
    height: 100,
  },
  categoryBadge: {
    position: 'absolute',
    bottom: spacing.md,
    right: spacing.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 8,
    zIndex: 5,
  },
  categoryText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 0.5,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '85%',
    height: '85%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.gray400,
    marginTop: spacing.xs,
  },

  // Info Section
  infoSection: {
    padding: spacing.lg,
  },
  infoSectionCompact: {
    padding: spacing.md,
  },

  // Header Row
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
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  carNameCompact: {
    fontSize: typography.fontSize.base,
  },
  carSubtitle: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  priceContainer: {
    alignItems: 'flex-end',
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
  priceLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },

  // Specs Row
  specsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  specChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.primary}08`,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 4,
  },
  specValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  specLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: colors.gray100,
    marginBottom: spacing.md,
  },

  // Bottom Row
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
    borderRadius: 10,
    backgroundColor: colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  companyInitials: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.gray500,
  },
  companyInfo: {
    gap: 2,
  },
  companyName: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rating: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },

  // Features Section
  featuresSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  unlimitedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: `${colors.success}10`,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: 8,
  },
  unlimitedText: {
    fontSize: typography.fontSize.xs,
    color: colors.success,
    fontWeight: typography.fontWeight.semibold,
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
