/**
 * CAR CARD COMPONENT
 * 
 * Displays car information in results list.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { 
  People, 
  Briefcase, 
  Setting4, 
  Star1, 
  TickCircle,
  Wind,
} from 'iconsax-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { colors, spacing, typography, borderRadius } from '@/styles';
import { Car } from '../../../types/car.types';

interface CarCardProps {
  car: Car;
  onPress: () => void;
  index?: number;
}

export default function CarCard({ car, onPress, index = 0 }: CarCardProps) {
  const transmissionLabel = car.specs.transmission === 'automatic' ? 'Auto' : 'Manual';
  
  return (
    <Animated.View entering={FadeInDown.duration(400).delay(index * 50)}>
      <TouchableOpacity 
        style={styles.container} 
        onPress={onPress}
        activeOpacity={0.7}
      >
        {/* Popular Badge */}
        {car.popularChoice && (
          <View style={styles.popularBadge}>
            <Star1 size={12} color={colors.white} variant="Bold" />
            <Text style={styles.popularText}>Popular Choice</Text>
          </View>
        )}
        
        {/* Car Image */}
        <View style={styles.imageContainer}>
          {car.images?.[0] ? (
            <Image source={{ uri: car.images[0] }} style={styles.image} resizeMode="contain" />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.imagePlaceholderText}>{car.make}</Text>
            </View>
          )}
        </View>
        
        {/* Car Info */}
        <View style={styles.infoContainer}>
          <View style={styles.headerRow}>
            <View style={styles.nameContainer}>
              <Text style={styles.carName}>{car.name}</Text>
              <Text style={styles.carCategory}>or similar {car.category}</Text>
            </View>
            <View style={styles.priceContainer}>
              <Text style={styles.price}>${car.rental.pricePerDay.amount}</Text>
              <Text style={styles.priceLabel}>/day</Text>
            </View>
          </View>
          
          {/* Specs Row */}
          <View style={styles.specsRow}>
            <View style={styles.specItem}>
              <People size={16} color={colors.gray500} />
              <Text style={styles.specText}>{car.specs.seats}</Text>
            </View>
            <View style={styles.specItem}>
              <Briefcase size={16} color={colors.gray500} />
              <Text style={styles.specText}>{car.specs.luggage.large}L + {car.specs.luggage.small}S</Text>
            </View>
            <View style={styles.specItem}>
              <Setting4 size={16} color={colors.gray500} />
              <Text style={styles.specText}>{transmissionLabel}</Text>
            </View>
            {car.specs.airConditioning && (
              <View style={styles.specItem}>
                <Wind size={16} color={colors.gray500} />
                <Text style={styles.specText}>A/C</Text>
              </View>
            )}
          </View>
          
          {/* Company & Features */}
          <View style={styles.bottomRow}>
            <View style={styles.companyInfo}>
              <Text style={styles.companyName}>{car.rental.company.name}</Text>
              <View style={styles.ratingContainer}>
                <Star1 size={12} color={colors.warning} variant="Bold" />
                <Text style={styles.rating}>{car.rental.company.rating}</Text>
              </View>
            </View>
            
            <View style={styles.features}>
              {car.specs.mileage === 'unlimited' && (
                <View style={styles.featureBadge}>
                  <TickCircle size={12} color={colors.success} variant="Bold" />
                  <Text style={styles.featureText}>Unlimited km</Text>
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
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#E6E9EB',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  popularBadge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    gap: 4,
    zIndex: 1,
  },
  popularText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
  imageContainer: {
    height: 120,
    backgroundColor: colors.gray50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '80%',
    height: '80%',
  },
  imagePlaceholder: {
    width: '80%',
    height: '80%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.gray100,
    borderRadius: borderRadius.md,
  },
  imagePlaceholderText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.gray400,
  },
  infoContainer: {
    padding: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  nameContainer: {
    flex: 1,
  },
  carName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  carCategory: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  priceLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  specsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  specItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  specText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  companyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  companyName: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  rating: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  features: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  featureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.success}10`,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    gap: 4,
  },
  featureText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.success,
  },
});
