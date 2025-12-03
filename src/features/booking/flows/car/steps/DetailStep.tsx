/**
 * CAR DETAIL STEP
 * 
 * Full vehicle info, specs, policies, and what's included.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import {
  Car as CarIcon,
  People,
  Bag2,
  Setting4,
  Drop,
  TickCircle,
  CloseCircle,
  Star1,
  InfoCircle,
  ArrowRight2,
  Shield,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, shadows, borderRadius } from '@/styles';
import { useCarStore } from '../../../stores/useCarStore';
import { CAR_CATEGORY_LABELS } from '../../../types/car.types';

interface DetailStepProps {
  onNext: () => void;
  onBack: () => void;
  onClose: () => void;
}

export default function DetailStep({ onNext, onBack, onClose }: DetailStepProps) {
  const insets = useSafeAreaInsets();
  const { selectedCar, getRentalDays, pricing, searchParams } = useCarStore();
  
  if (!selectedCar) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No car selected</Text>
      </View>
    );
  }
  
  const rentalDays = getRentalDays();
  const totalPrice = selectedCar.rental.pricePerDay.amount * rentalDays;
  
  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onNext();
  };
  
  const getFuelPolicyLabel = (policy: string) => {
    switch (policy) {
      case 'full_to_full': return 'Full to Full';
      case 'full_to_empty': return 'Prepaid Fuel';
      case 'same_to_same': return 'Same to Same';
      default: return policy;
    }
  };
  
  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Car Header */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.headerCard}>
          <View style={styles.carImageContainer}>
            <CarIcon size={64} color={colors.primary} />
          </View>
          
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>
              {CAR_CATEGORY_LABELS[selectedCar.category] || selectedCar.category}
            </Text>
          </View>
          
          <Text style={styles.carName}>{selectedCar.name}</Text>
          
          {/* Specs Grid */}
          <View style={styles.specsGrid}>
            <View style={styles.specBox}>
              <People size={20} color={colors.primary} />
              <Text style={styles.specValue}>{selectedCar.specs.seats}</Text>
              <Text style={styles.specLabel}>Seats</Text>
            </View>
            <View style={styles.specBox}>
              <Bag2 size={20} color={colors.primary} />
              <Text style={styles.specValue}>{selectedCar.specs.luggage.large}</Text>
              <Text style={styles.specLabel}>Large bags</Text>
            </View>
            <View style={styles.specBox}>
              <Setting4 size={20} color={colors.primary} />
              <Text style={styles.specValue}>
                {selectedCar.specs.transmission === 'automatic' ? 'Auto' : 'Manual'}
              </Text>
              <Text style={styles.specLabel}>Transmission</Text>
            </View>
            <View style={styles.specBox}>
              <Drop size={20} color={colors.primary} />
              <Text style={styles.specValue}>
                {selectedCar.specs.fuelType.charAt(0).toUpperCase() + selectedCar.specs.fuelType.slice(1)}
              </Text>
              <Text style={styles.specLabel}>Fuel</Text>
            </View>
          </View>
        </Animated.View>
        
        {/* Rental Company */}
        <Animated.View entering={FadeInDown.duration(400).delay(100)} style={styles.section}>
          <Text style={styles.sectionTitle}>Rental Company</Text>
          <View style={styles.companyCard}>
            <View style={styles.companyLogo}>
              <CarIcon size={24} color={colors.primary} />
            </View>
            <View style={styles.companyInfo}>
              <Text style={styles.companyName}>{selectedCar.rental.company.name}</Text>
              <View style={styles.companyRating}>
                <Star1 size={14} color={colors.warning} variant="Bold" />
                <Text style={styles.ratingText}>
                  {selectedCar.rental.company.rating} ({selectedCar.rental.company.reviewCount} reviews)
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>
        
        {/* What's Included */}
        <Animated.View entering={FadeInDown.duration(400).delay(150)} style={styles.section}>
          <Text style={styles.sectionTitle}>What's Included</Text>
          <View style={styles.includedCard}>
            <View style={styles.includedItem}>
              <TickCircle size={18} color={colors.success} variant="Bold" />
              <Text style={styles.includedText}>
                {selectedCar.specs.mileage === 'unlimited' ? 'Unlimited mileage' : `${selectedCar.specs.mileage} miles/day`}
              </Text>
            </View>
            <View style={styles.includedItem}>
              <TickCircle size={18} color={colors.success} variant="Bold" />
              <Text style={styles.includedText}>Collision Damage Waiver (CDW)</Text>
            </View>
            <View style={styles.includedItem}>
              <TickCircle size={18} color={colors.success} variant="Bold" />
              <Text style={styles.includedText}>Theft Protection</Text>
            </View>
            <View style={styles.includedItem}>
              <TickCircle size={18} color={colors.success} variant="Bold" />
              <Text style={styles.includedText}>Third Party Liability</Text>
            </View>
            <View style={styles.includedItem}>
              <TickCircle size={18} color={colors.success} variant="Bold" />
              <Text style={styles.includedText}>Local taxes included</Text>
            </View>
          </View>
        </Animated.View>
        
        {/* Fuel Policy */}
        <Animated.View entering={FadeInDown.duration(400).delay(200)} style={styles.section}>
          <Text style={styles.sectionTitle}>Fuel Policy</Text>
          <View style={styles.policyCard}>
            <Drop size={24} color={colors.primary} />
            <View style={styles.policyInfo}>
              <Text style={styles.policyTitle}>
                {getFuelPolicyLabel(selectedCar.specs.fuelPolicy)}
              </Text>
              <Text style={styles.policyDesc}>
                {selectedCar.specs.fuelPolicy === 'full_to_full'
                  ? 'Pick up with a full tank and return it full'
                  : 'Fuel is prepaid, return empty'}
              </Text>
            </View>
          </View>
        </Animated.View>
        
        {/* Important Policies */}
        <Animated.View entering={FadeInDown.duration(400).delay(250)} style={styles.section}>
          <Text style={styles.sectionTitle}>Important Information</Text>
          <View style={styles.policiesCard}>
            <View style={styles.policyRow}>
              <Text style={styles.policyLabel}>Minimum age</Text>
              <Text style={styles.policyValue}>{selectedCar.rental.policies.minAge} years</Text>
            </View>
            <View style={styles.policyRow}>
              <Text style={styles.policyLabel}>Deposit required</Text>
              <Text style={styles.policyValue}>${selectedCar.rental.deposit}</Text>
            </View>
            <View style={styles.policyRow}>
              <Text style={styles.policyLabel}>Free cancellation</Text>
              <Text style={styles.policyValue}>
                Up to {selectedCar.rental.policies.cancellation.freeBefore}h before
              </Text>
            </View>
            {searchParams.driverAge < 25 && (
              <View style={styles.policyRow}>
                <Text style={[styles.policyLabel, { color: colors.warning }]}>Young driver fee</Text>
                <Text style={[styles.policyValue, { color: colors.warning }]}>
                  ${selectedCar.rental.policies.youngDriverFee?.fee || 15}/day
                </Text>
              </View>
            )}
          </View>
          
          <View style={styles.documentsNote}>
            <InfoCircle size={18} color={colors.info} />
            <Text style={styles.documentsText}>
              Driver must present valid license, credit card in their name, and ID at pickup
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
      
      {/* Footer */}
      <Animated.View
        entering={FadeInUp.duration(400).delay(300)}
        style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}
      >
        <View style={styles.footerPrice}>
          <Text style={styles.footerPriceLabel}>{rentalDays} day{rentalDays > 1 ? 's' : ''}</Text>
          <Text style={styles.footerPriceAmount}>${totalPrice}</Text>
        </View>
        
        <TouchableOpacity style={styles.continueButton} onPress={handleContinue} activeOpacity={0.8}>
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.continueGradient}
          >
            <Shield size={18} color={colors.white} />
            <Text style={styles.continueText}>Add Protection</Text>
            <ArrowRight2 size={18} color={colors.white} />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollView: { flex: 1 },
  scrollContent: { padding: spacing.lg },
  
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: typography.fontSize.lg,
    color: colors.textSecondary,
  },
  
  // Header Card
  headerCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  carImageContainer: {
    width: 120,
    height: 80,
    backgroundColor: colors.gray50,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  categoryBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: spacing.sm,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
    textTransform: 'uppercase',
  },
  carName: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  specsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
  },
  specBox: {
    width: '23%',
    alignItems: 'center',
    padding: spacing.sm,
  },
  specValue: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  specLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  
  // Section
  section: { marginBottom: spacing.lg },
  sectionTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  
  // Company
  companyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    ...shadows.sm,
  },
  companyLogo: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  companyInfo: { marginLeft: spacing.md },
  companyName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  companyRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  ratingText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  
  // Included
  includedCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    ...shadows.sm,
  },
  includedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  includedText: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
  },
  
  // Policy
  policyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    ...shadows.sm,
  },
  policyInfo: { marginLeft: spacing.md, flex: 1 },
  policyTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  policyDesc: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  
  // Policies Card
  policiesCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  policyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  policyLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  policyValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  
  documentsNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.info + '10',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  documentsText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.info,
    lineHeight: 20,
  },
  
  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerPrice: { flex: 1 },
  footerPriceLabel: { fontSize: typography.fontSize.xs, color: colors.textSecondary },
  footerPriceAmount: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  continueButton: { borderRadius: borderRadius.xl, overflow: 'hidden' },
  continueGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.xs,
  },
  continueText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
});
