/**
 * CAR DETAIL SHEET
 * 
 * Full car details view with specs and features.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  CloseCircle,
  People,
  Briefcase,
  Setting4,
  Star1,
  TickCircle,
  Wind,
  Speedometer,
  Car as CarIcon,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, borderRadius } from '@/styles';
import { Car } from '../../../types/car.types';
import { useCarStore } from '../../../stores/useCarStore';

interface CarDetailSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelect?: (car: Car) => void;
  car: Car | null;
}

export default function CarDetailSheet({ visible, onClose, onSelect, car }: CarDetailSheetProps) {
  const insets = useSafeAreaInsets();
  const { getRentalDays } = useCarStore();
  const rentalDays = getRentalDays();

  const handleSelectCar = () => {
    if (car && onSelect) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onSelect(car);
    }
  };

  if (!car) return null;

  const transmissionLabel = car.specs.transmission === 'automatic' ? 'Automatic' : 'Manual';

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={[styles.container, { paddingBottom: insets.bottom + spacing.md }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Car Details</Text>
            <TouchableOpacity onPress={onClose}>
              <CloseCircle size={28} color={colors.gray500} variant="Bold" />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.content}
            showsVerticalScrollIndicator={false}
          >
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

            {/* Car Name & Company */}
            <View style={styles.nameSection}>
              <Text style={styles.carName}>{car.name}</Text>
              <Text style={styles.carCategory}>or similar {car.category}</Text>
              <View style={styles.companyRow}>
                <Text style={styles.companyName}>{car.rental.company.name}</Text>
                <View style={styles.ratingContainer}>
                  <Star1 size={14} color={colors.warning} variant="Bold" />
                  <Text style={styles.rating}>{car.rental.company.rating}</Text>
                  <Text style={styles.reviews}>({car.rental.company.reviewCount} reviews)</Text>
                </View>
              </View>
            </View>

            {/* Specifications */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Specifications</Text>
              <View style={styles.specsGrid}>
                <View style={styles.specCard}>
                  <People size={24} color={colors.primary} />
                  <Text style={styles.specValue}>{car.specs.seats}</Text>
                  <Text style={styles.specLabel}>Seats</Text>
                </View>
                <View style={styles.specCard}>
                  <Briefcase size={24} color={colors.primary} />
                  <Text style={styles.specValue}>{car.specs.luggage.large + car.specs.luggage.small}</Text>
                  <Text style={styles.specLabel}>Bags</Text>
                </View>
                <View style={styles.specCard}>
                  <Setting4 size={24} color={colors.primary} />
                  <Text style={styles.specValue}>{transmissionLabel}</Text>
                  <Text style={styles.specLabel}>Transmission</Text>
                </View>
                <View style={styles.specCard}>
                  <Speedometer size={24} color={colors.primary} />
                  <Text style={styles.specValue}>
                    {car.specs.mileage === 'unlimited' ? 'Unlimited' : `${car.specs.mileage}km`}
                  </Text>
                  <Text style={styles.specLabel}>Mileage</Text>
                </View>
              </View>
            </View>

            {/* Features */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Features</Text>
              <View style={styles.featuresList}>
                {car.specs.airConditioning && (
                  <View style={styles.featureItem}>
                    <TickCircle size={18} color={colors.success} variant="Bold" />
                    <Text style={styles.featureText}>Air Conditioning</Text>
                  </View>
                )}
                {car.specs.mileage === 'unlimited' && (
                  <View style={styles.featureItem}>
                    <TickCircle size={18} color={colors.success} variant="Bold" />
                    <Text style={styles.featureText}>Unlimited Mileage</Text>
                  </View>
                )}
                {car.features?.map((feature, index) => (
                  <View key={index} style={styles.featureItem}>
                    <TickCircle size={18} color={feature.included ? colors.success : colors.gray400} variant="Bold" />
                    <Text style={[styles.featureText, !feature.included && styles.featureTextDisabled]}>
                      {feature.name}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Fuel Policy */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Fuel Policy</Text>
              <View style={styles.policyCard}>
                <Wind size={20} color={colors.primary} />
                <Text style={styles.policyText}>
                  {car.specs.fuelPolicy === 'full_to_full' 
                    ? 'Full to Full - Return with a full tank'
                    : car.specs.fuelPolicy === 'full_to_empty'
                    ? 'Full to Empty - No need to refuel'
                    : 'Same to Same - Return with same level'}
                </Text>
              </View>
            </View>

            {/* Spacer for footer */}
            <View style={{ height: 100 }} />
          </ScrollView>

          {/* Footer with Select Button */}
          {onSelect && (
            <View style={styles.footer}>
              <View style={styles.priceContainer}>
                <Text style={styles.priceLabel}>Total for {rentalDays} days</Text>
                <Text style={styles.priceValue}>
                  ${(car.rental.pricePerDay.amount * rentalDays).toFixed(2)}
                </Text>
              </View>
              <TouchableOpacity 
                style={styles.selectButton}
                onPress={handleSelectCar}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[colors.primary, colors.primaryDark]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.selectGradient}
                >
                  <CarIcon size={20} color={colors.white} variant="Bold" />
                  <Text style={styles.selectButtonText}>Select This Car</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    height: '85%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  content: {
    flexGrow: 1,
  },
  imageContainer: {
    height: 180,
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
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.gray400,
  },
  nameSection: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  carName: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  carCategory: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    marginTop: 4,
  },
  companyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  companyName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rating: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  reviews: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  section: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  sectionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  specsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  specCard: {
    width: '48%',
    backgroundColor: colors.gray50,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
  },
  specValue: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  specLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  featuresList: {
    gap: spacing.sm,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  featureText: {
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
  featureTextDisabled: {
    color: colors.gray400,
    textDecorationLine: 'line-through',
  },
  policyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.primary}10`,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  policyText: {
    flex: 1,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
  // Footer styles
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
    gap: spacing.md,
  },
  priceContainer: {
    flex: 1,
  },
  priceLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  priceValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  selectButton: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  selectGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  selectButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
});
