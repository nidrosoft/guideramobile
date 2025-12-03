/**
 * CAR CONFIRMATION STEP
 * 
 * Booking confirmed with voucher and pickup details.
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withDelay,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import {
  TickCircle,
  Car as CarIcon,
  Location,
  Calendar,
  Clock,
  User,
  DocumentText,
  Share as ShareIcon,
  Add,
  InfoCircle,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, shadows, borderRadius } from '@/styles';
import { useCarStore } from '../../../stores/useCarStore';
import { CAR_CATEGORY_LABELS } from '../../../types/car.types';

interface ConfirmationStepProps {
  onNext: () => void;
  onBack: () => void;
  onClose: () => void;
}

export default function ConfirmationStep({ onNext, onBack, onClose }: ConfirmationStepProps) {
  const insets = useSafeAreaInsets();
  const {
    selectedCar,
    searchParams,
    primaryDriver,
    bookingReference,
    pricing,
    getRentalDays,
    reset,
  } = useCarStore();
  
  // Animation values
  const checkScale = useSharedValue(0);
  const checkOpacity = useSharedValue(0);
  const ringScale = useSharedValue(0);
  const confettiProgress = useSharedValue(0);
  
  useEffect(() => {
    // Trigger celebration animation
    checkScale.value = withDelay(
      200,
      withSpring(1, { damping: 8, stiffness: 100 })
    );
    checkOpacity.value = withDelay(200, withTiming(1, { duration: 300 }));
    ringScale.value = withDelay(
      400,
      withSequence(
        withSpring(1.2, { damping: 5 }),
        withSpring(1, { damping: 10 })
      )
    );
    confettiProgress.value = withDelay(
      600,
      withTiming(1, { duration: 1000, easing: Easing.out(Easing.cubic) })
    );
    
    // Haptic feedback
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);
  
  const checkAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
    opacity: checkOpacity.value,
  }));
  
  const ringAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: interpolate(ringScale.value, [0, 1], [0, 0.3]),
  }));
  
  const rentalDays = getRentalDays();
  
  const formatDate = (date: Date | null): string => {
    if (!date) return '';
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  };
  
  const formatTime = (time: string): string => {
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };
  
  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Share.share({
        message: `Car Rental Confirmation\n\nReference: ${bookingReference}\nCar: ${selectedCar?.name}\nPickup: ${formatDate(searchParams.pickupDate)} at ${formatTime(searchParams.pickupTime)}\nLocation: ${searchParams.pickupLocation?.name}\n\nTotal: $${pricing.total.toFixed(2)}`,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };
  
  const handleDone = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    reset();
    onClose();
  };
  
  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Success Header with Animation */}
        <View style={styles.successHeader}>
          {/* Animated Ring */}
          <Animated.View style={[styles.successRing, ringAnimatedStyle]} />
          
          {/* Animated Checkmark */}
          <Animated.View style={[styles.successIcon, checkAnimatedStyle]}>
            <TickCircle size={48} color={colors.white} variant="Bold" />
          </Animated.View>
          
          <Animated.Text 
            entering={FadeIn.delay(500).duration(400)} 
            style={styles.successTitle}
          >
            Booking Confirmed!
          </Animated.Text>
          <Animated.Text 
            entering={FadeIn.delay(600).duration(400)} 
            style={styles.successSubtitle}
          >
            Your car rental is ready
          </Animated.Text>
        </View>
        
        {/* Confirmation Number */}
        <Animated.View entering={FadeInDown.duration(400).delay(200)} style={styles.confirmationCard}>
          <Text style={styles.confirmationLabel}>Confirmation Number</Text>
          <Text style={styles.confirmationNumber}>{bookingReference}</Text>
          <Text style={styles.confirmationHint}>Show this at the rental counter</Text>
        </Animated.View>
        
        {/* Car Details */}
        <Animated.View entering={FadeInDown.duration(400).delay(250)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <CarIcon size={20} color={colors.primary} variant="Bold" />
            <Text style={styles.sectionTitle}>Your Vehicle</Text>
          </View>
          
          <View style={styles.carInfo}>
            <View style={styles.carImagePlaceholder}>
              <CarIcon size={40} color={colors.gray300} />
            </View>
            <View style={styles.carDetails}>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>
                  {CAR_CATEGORY_LABELS[selectedCar?.category || 'compact']}
                </Text>
              </View>
              <Text style={styles.carName}>{selectedCar?.name}</Text>
              <Text style={styles.carCompany}>{selectedCar?.rental.company.name}</Text>
            </View>
          </View>
        </Animated.View>
        
        {/* Pickup Details */}
        <Animated.View entering={FadeInDown.duration(400).delay(300)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Location size={20} color={colors.success} variant="Bold" />
            <Text style={styles.sectionTitle}>Pickup</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Calendar size={16} color={colors.textSecondary} />
            <Text style={styles.detailText}>{formatDate(searchParams.pickupDate)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Clock size={16} color={colors.textSecondary} />
            <Text style={styles.detailText}>{formatTime(searchParams.pickupTime)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Location size={16} color={colors.textSecondary} />
            <Text style={styles.detailText}>{searchParams.pickupLocation?.name}</Text>
          </View>
        </Animated.View>
        
        {/* Return Details */}
        <Animated.View entering={FadeInDown.duration(400).delay(350)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Location size={20} color={colors.warning} variant="Bold" />
            <Text style={styles.sectionTitle}>Return</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Calendar size={16} color={colors.textSecondary} />
            <Text style={styles.detailText}>{formatDate(searchParams.returnDate)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Clock size={16} color={colors.textSecondary} />
            <Text style={styles.detailText}>{formatTime(searchParams.returnTime)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Location size={16} color={colors.textSecondary} />
            <Text style={styles.detailText}>
              {searchParams.sameReturnLocation 
                ? searchParams.pickupLocation?.name 
                : searchParams.returnLocation?.name}
            </Text>
          </View>
        </Animated.View>
        
        {/* Driver */}
        <Animated.View entering={FadeInDown.duration(400).delay(400)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <User size={20} color={colors.info} variant="Bold" />
            <Text style={styles.sectionTitle}>Main Driver</Text>
          </View>
          
          <Text style={styles.driverName}>
            {primaryDriver?.firstName} {primaryDriver?.lastName}
          </Text>
          <Text style={styles.driverEmail}>{primaryDriver?.email}</Text>
        </Animated.View>
        
        {/* What to Bring */}
        <Animated.View entering={FadeInDown.duration(400).delay(450)} style={styles.checklistCard}>
          <Text style={styles.checklistTitle}>What to Bring</Text>
          
          {[
            'Valid driver\'s license',
            'Credit card in driver\'s name',
            'Government-issued ID',
            'This confirmation (printed or digital)',
          ].map((item, index) => (
            <View key={index} style={styles.checklistItem}>
              <TickCircle size={16} color={colors.success} variant="Bold" />
              <Text style={styles.checklistText}>{item}</Text>
            </View>
          ))}
        </Animated.View>
        
        {/* Price Summary */}
        <Animated.View entering={FadeInDown.duration(400).delay(500)} style={styles.priceCard}>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Rental ({rentalDays} days)</Text>
            <Text style={styles.priceValue}>${pricing.baseRate.toFixed(2)}</Text>
          </View>
          {pricing.protectionCost > 0 && (
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Protection</Text>
              <Text style={styles.priceValue}>${pricing.protectionCost.toFixed(2)}</Text>
            </View>
          )}
          {pricing.extrasCost > 0 && (
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Extras</Text>
              <Text style={styles.priceValue}>${pricing.extrasCost.toFixed(2)}</Text>
            </View>
          )}
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Taxes & fees</Text>
            <Text style={styles.priceValue}>${(pricing.taxes + pricing.airportFee).toFixed(2)}</Text>
          </View>
          <View style={styles.priceDivider} />
          <View style={styles.priceRowTotal}>
            <Text style={styles.priceLabelTotal}>Total Paid</Text>
            <Text style={styles.priceValueTotal}>${pricing.total.toFixed(2)}</Text>
          </View>
        </Animated.View>
        
        {/* Actions */}
        <Animated.View entering={FadeInDown.duration(400).delay(550)} style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
            <ShareIcon size={20} color={colors.primary} />
            <Text style={styles.actionText}>Share</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Add size={20} color={colors.primary} />
            <Text style={styles.actionText}>Calendar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <DocumentText size={20} color={colors.primary} />
            <Text style={styles.actionText}>Voucher</Text>
          </TouchableOpacity>
        </Animated.View>
        
        {/* Support */}
        <Animated.View entering={FadeInDown.duration(400).delay(600)} style={styles.supportCard}>
          <InfoCircle size={18} color={colors.info} />
          <View style={styles.supportContent}>
            <Text style={styles.supportTitle}>Need Help?</Text>
            <Text style={styles.supportText}>
              Contact {selectedCar?.rental.company.name} or our support team for assistance.
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
      
      {/* Footer */}
      <Animated.View
        entering={FadeInUp.duration(400).delay(700)}
        style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}
      >
        <TouchableOpacity style={styles.doneButton} onPress={handleDone} activeOpacity={0.8}>
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.doneGradient}
          >
            <Text style={styles.doneText}>Done</Text>
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
  
  // Success Header
  successHeader: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    paddingTop: spacing.xl,
  },
  successRing: {
    position: 'absolute',
    top: spacing.xl,
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: colors.success,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  successTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  successSubtitle: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
  },
  
  // Confirmation Card
  confirmationCard: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  confirmationLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.white + '80',
    marginBottom: spacing.xs,
  },
  confirmationNumber: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
    letterSpacing: 2,
    marginBottom: spacing.xs,
  },
  confirmationHint: {
    fontSize: typography.fontSize.xs,
    color: colors.white + '80',
  },
  
  // Section
  section: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  
  // Car Info
  carInfo: { flexDirection: 'row', alignItems: 'center' },
  carImagePlaceholder: {
    width: 80,
    height: 60,
    backgroundColor: colors.gray50,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  carDetails: { marginLeft: spacing.md, flex: 1 },
  categoryBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  categoryText: {
    fontSize: 9,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
    textTransform: 'uppercase',
  },
  carName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  carCompany: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  
  // Detail Row
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  detailText: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
  },
  
  // Driver
  driverName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  driverEmail: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  
  // Checklist
  checklistCard: {
    backgroundColor: colors.success + '10',
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  checklistTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.success,
    marginBottom: spacing.md,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  checklistText: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
  },
  
  // Price
  priceCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  priceLabel: { fontSize: typography.fontSize.sm, color: colors.textSecondary },
  priceValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  priceDivider: {
    height: 1,
    backgroundColor: colors.gray200,
    marginVertical: spacing.sm,
  },
  priceRowTotal: { flexDirection: 'row', justifyContent: 'space-between' },
  priceLabelTotal: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  priceValueTotal: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.success,
  },
  
  // Actions
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.md,
  },
  actionButton: {
    alignItems: 'center',
    padding: spacing.md,
  },
  actionText: {
    fontSize: typography.fontSize.xs,
    color: colors.primary,
    marginTop: spacing.xs,
  },
  
  // Support
  supportCard: {
    flexDirection: 'row',
    backgroundColor: colors.info + '10',
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    gap: spacing.sm,
  },
  supportContent: { flex: 1 },
  supportTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.info,
    marginBottom: 4,
  },
  supportText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
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
  },
  doneButton: { borderRadius: borderRadius.xl, overflow: 'hidden' },
  doneGradient: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  doneText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
});
