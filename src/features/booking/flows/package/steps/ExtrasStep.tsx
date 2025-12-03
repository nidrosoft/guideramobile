/**
 * EXTRAS STEP
 * 
 * Consolidated extras for all package components (flight, hotel, car, insurance).
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
  Airplane,
  Building,
  Car,
  Shield,
  Coffee,
  Briefcase,
  Clock,
  TickCircle,
  ArrowRight2,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, shadows, borderRadius } from '@/styles';
import { usePackageStore } from '../../../stores/usePackageStore';

interface ExtrasStepProps {
  onNext: () => void;
  onBack: () => void;
  onClose: () => void;
}

const HOTEL_EXTRAS = [
  { id: 'breakfast', name: 'Breakfast', icon: Coffee, price: 25, unit: '/person/night' },
  { id: 'parking', name: 'Parking', icon: Car, price: 20, unit: '/night' },
  { id: 'earlyCheckIn', name: 'Early Check-in', icon: Clock, price: 30, unit: 'one-time' },
  { id: 'lateCheckOut', name: 'Late Check-out', icon: Clock, price: 30, unit: 'one-time' },
];

export default function ExtrasStep({ onNext, onBack, onClose }: ExtrasStepProps) {
  const insets = useSafeAreaInsets();
  const {
    selections,
    extras,
    pricing,
    toggleHotelExtra,
    toggleTravelInsurance,
    getNights,
    getTotalTravelers,
  } = usePackageStore();
  
  const nights = getNights();
  const travelers = getTotalTravelers();
  
  const handleToggleHotelExtra = (extraId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleHotelExtra(extraId as any);
  };
  
  const handleToggleInsurance = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleTravelInsurance();
  };
  
  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onNext();
  };
  
  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(400)}>
          <Text style={styles.title}>Add Extras</Text>
          <Text style={styles.subtitle}>Enhance your trip with these add-ons</Text>
        </Animated.View>
        
        {/* Hotel Extras */}
        {selections.hotel.hotel && (
          <Animated.View entering={FadeInDown.duration(400).delay(100)} style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, { backgroundColor: colors.success + '15' }]}>
                <Building size={24} color={colors.success} variant="Bold" />
              </View>
              <View>
                <Text style={styles.sectionTitle}>Hotel Extras</Text>
                <Text style={styles.sectionSubtitle}>{selections.hotel.hotel.name}</Text>
              </View>
            </View>
            
            {HOTEL_EXTRAS.map((extra) => {
              const Icon = extra.icon;
              const isSelected = extras.hotel[extra.id as keyof typeof extras.hotel];
              
              // Skip breakfast if included
              if (extra.id === 'breakfast' && selections.hotel.room?.breakfast === 'included') {
                return null;
              }
              
              return (
                <TouchableOpacity
                  key={extra.id}
                  style={[styles.extraItem, isSelected && styles.extraItemSelected]}
                  onPress={() => handleToggleHotelExtra(extra.id)}
                >
                  <View style={[styles.extraIcon, isSelected && styles.extraIconSelected]}>
                    <Icon size={20} color={isSelected ? colors.white : colors.success} />
                  </View>
                  <View style={styles.extraInfo}>
                    <Text style={styles.extraName}>{extra.name}</Text>
                    <Text style={styles.extraPrice}>+${extra.price} {extra.unit}</Text>
                  </View>
                  <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                    {isSelected && <TickCircle size={20} color={colors.white} variant="Bold" />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </Animated.View>
        )}
        
        {/* Travel Insurance */}
        <Animated.View entering={FadeInDown.duration(400).delay(200)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: colors.primary + '15' }]}>
              <Shield size={24} color={colors.primary} variant="Bold" />
            </View>
            <View>
              <Text style={styles.sectionTitle}>Travel Insurance</Text>
              <Text style={styles.sectionSubtitle}>Recommended for peace of mind</Text>
            </View>
          </View>
          
          <TouchableOpacity
            style={[styles.insuranceCard, extras.travelInsurance && styles.insuranceCardSelected]}
            onPress={handleToggleInsurance}
          >
            <View style={styles.insuranceContent}>
              <Text style={styles.insuranceName}>Comprehensive Travel Protection</Text>
              <Text style={styles.insuranceDesc}>
                Trip cancellation, medical emergencies, lost baggage, and more
              </Text>
              <View style={styles.insuranceFeatures}>
                <Text style={styles.insuranceFeature}>✓ Trip cancellation up to $10,000</Text>
                <Text style={styles.insuranceFeature}>✓ Medical expenses up to $50,000</Text>
                <Text style={styles.insuranceFeature}>✓ 24/7 emergency assistance</Text>
              </View>
            </View>
            <View style={styles.insurancePrice}>
              <Text style={styles.insurancePriceAmount}>${15 * travelers * nights}</Text>
              <Text style={styles.insurancePriceLabel}>total</Text>
              <View style={[styles.checkbox, extras.travelInsurance && styles.checkboxSelected]}>
                {extras.travelInsurance && <TickCircle size={20} color={colors.white} variant="Bold" />}
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>
        
        {/* Extras Summary */}
        {pricing.extras > 0 && (
          <Animated.View entering={FadeInDown.duration(400).delay(300)} style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Extras Total</Text>
            <Text style={styles.summaryAmount}>${pricing.extras}</Text>
          </Animated.View>
        )}
      </ScrollView>
      
      {/* Footer */}
      <Animated.View
        entering={FadeInUp.duration(400).delay(400)}
        style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}
      >
        <View style={styles.footerPrice}>
          <Text style={styles.footerPriceLabel}>Package Total</Text>
          <Text style={styles.footerPriceAmount}>${pricing.total.toFixed(2)}</Text>
        </View>
        
        <TouchableOpacity style={styles.continueButton} onPress={handleContinue} activeOpacity={0.8}>
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.continueGradient}
          >
            <Text style={styles.continueText}>Continue to Payment</Text>
            <ArrowRight2 size={20} color={colors.white} />
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
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  
  // Section
  section: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  sectionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  sectionSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  
  // Extra Item
  extraItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.gray50,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  extraItemSelected: {
    borderColor: colors.success,
    backgroundColor: colors.success + '10',
  },
  extraIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.success + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  extraIconSelected: { backgroundColor: colors.success },
  extraInfo: { flex: 1, marginLeft: spacing.md },
  extraName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  extraPrice: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.gray300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  
  // Insurance
  insuranceCard: {
    flexDirection: 'row',
    padding: spacing.md,
    backgroundColor: colors.gray50,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  insuranceCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  insuranceContent: { flex: 1 },
  insuranceName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  insuranceDesc: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  insuranceFeatures: { gap: 4 },
  insuranceFeature: {
    fontSize: typography.fontSize.xs,
    color: colors.success,
  },
  insurancePrice: { alignItems: 'center', justifyContent: 'center', marginLeft: spacing.md },
  insurancePriceAmount: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  insurancePriceLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  
  // Summary
  summaryCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.primary + '10',
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
  },
  summaryTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.primary,
  },
  summaryAmount: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
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
