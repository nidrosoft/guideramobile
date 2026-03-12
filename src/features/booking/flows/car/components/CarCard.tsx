/**
 * CAR CARD COMPONENT
 *
 * Displays car information in results list.
 * Theme-aware for dark/light mode.
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
import { spacing, typography, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { Car } from '../../../types/car.types';

interface CarCardProps {
  car: Car;
  onPress: () => void;
  index?: number;
}

export default function CarCard({ car, onPress, index = 0 }: CarCardProps) {
  const { colors: tc } = useTheme();
  const transmissionLabel = car.specs.transmission === 'automatic' ? 'Auto' : 'Manual';

  return (
    <Animated.View entering={FadeInDown.duration(400).delay(index * 50)}>
      <TouchableOpacity
        style={[styles.container, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle }]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        {car.popularChoice && (
          <View style={[styles.popularBadge, { backgroundColor: tc.primary }]}>
            <Star1 size={12} color="#FFFFFF" variant="Bold" />
            <Text style={styles.popularText}>Popular Choice</Text>
          </View>
        )}

        <View style={[styles.imageContainer, { backgroundColor: `${tc.primary}08` }]}>
          {car.images?.[0] ? (
            <Image source={{ uri: car.images[0] }} style={styles.image} resizeMode="contain" />
          ) : (
            <View style={[styles.imagePlaceholder, { backgroundColor: `${tc.primary}08` }]}>
              <Text style={[styles.imagePlaceholderText, { color: tc.textSecondary }]}>{car.name}</Text>
            </View>
          )}
        </View>

        <View style={styles.infoContainer}>
          <View style={styles.headerRow}>
            <View style={styles.nameContainer}>
              <Text style={[styles.carName, { color: tc.textPrimary }]}>{car.name}</Text>
              <Text style={[styles.carCategory, { color: tc.textSecondary }]}>or similar {car.category}</Text>
            </View>
            <View style={styles.priceContainer}>
              <Text style={[styles.price, { color: tc.primary }]}>
                ${(car.rental.pricePerDay.amount || 0).toLocaleString('en-US')}
              </Text>
              <Text style={[styles.priceLabel, { color: tc.textSecondary }]}>/day</Text>
            </View>
          </View>

          <View style={[styles.specsRow, { borderTopColor: tc.borderSubtle, borderBottomColor: tc.borderSubtle }]}>
            <View style={styles.specItem}>
              <People size={16} color={tc.textSecondary} />
              <Text style={[styles.specText, { color: tc.textSecondary }]}>{car.specs.seats}</Text>
            </View>
            <View style={styles.specItem}>
              <Briefcase size={16} color={tc.textSecondary} />
              <Text style={[styles.specText, { color: tc.textSecondary }]}>
                {car.specs.luggage.large}L + {car.specs.luggage.small}S
              </Text>
            </View>
            <View style={styles.specItem}>
              <Setting4 size={16} color={tc.textSecondary} />
              <Text style={[styles.specText, { color: tc.textSecondary }]}>{transmissionLabel}</Text>
            </View>
            {car.specs.airConditioning && (
              <View style={styles.specItem}>
                <Wind size={16} color={tc.textSecondary} />
                <Text style={[styles.specText, { color: tc.textSecondary }]}>A/C</Text>
              </View>
            )}
          </View>

          <View style={styles.bottomRow}>
            <View style={styles.companyInfo}>
              <Text style={[styles.companyName, { color: tc.textPrimary }]}>{car.rental.company.name}</Text>
              <View style={styles.ratingContainer}>
                <Star1 size={12} color={tc.warning} variant="Bold" />
                <Text style={[styles.rating, { color: tc.textPrimary }]}>{car.rental.company.rating}</Text>
              </View>
            </View>

            <View style={styles.features}>
              {car.specs.mileage === 'unlimited' && (
                <View style={[styles.featureBadge, { backgroundColor: `${tc.success}15` }]}>
                  <TickCircle size={12} color={tc.success} variant="Bold" />
                  <Text style={[styles.featureText, { color: tc.success }]}>Unlimited miles</Text>
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
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1.5,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },
  popularBadge: {
    position: 'absolute', top: spacing.sm, left: spacing.sm,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.sm, paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm, gap: 4, zIndex: 1,
  },
  popularText: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.semibold, color: '#FFFFFF' },
  imageContainer: { height: 120, justifyContent: 'center', alignItems: 'center' },
  image: { width: '80%', height: '80%' },
  imagePlaceholder: {
    width: '80%', height: '80%',
    justifyContent: 'center', alignItems: 'center', borderRadius: borderRadius.md,
  },
  imagePlaceholderText: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold },
  infoContainer: { padding: spacing.md },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm },
  nameContainer: { flex: 1 },
  carName: { fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.bold },
  carCategory: { fontSize: typography.fontSize.sm, marginTop: 2 },
  priceContainer: { alignItems: 'flex-end' },
  price: { fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold },
  priceLabel: { fontSize: typography.fontSize.xs },
  specsRow: { flexDirection: 'row', gap: spacing.md, paddingVertical: spacing.sm, borderTopWidth: 1, borderBottomWidth: 1 },
  specItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  specText: { fontSize: typography.fontSize.sm },
  bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.sm },
  companyInfo: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  companyName: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium },
  ratingContainer: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  rating: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium },
  features: { flexDirection: 'row', gap: spacing.sm },
  featureBadge: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.sm, paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm, gap: 4,
  },
  featureText: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.medium },
});
