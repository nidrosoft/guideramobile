/**
 * PACKAGE CONFIRMATION STEP
 * 
 * Multi-voucher confirmation with master booking reference.
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
} from 'react-native-reanimated';
import {
  TickCircle,
  Airplane,
  Building,
  Car,
  Calendar,
  DocumentDownload,
  Share as ShareIcon,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, shadows, borderRadius } from '@/styles';
import { usePackageStore } from '../../../stores/usePackageStore';

interface ConfirmationStepProps {
  onNext: () => void;
  onBack: () => void;
  onClose: () => void;
}

export default function ConfirmationStep({ onNext, onBack, onClose }: ConfirmationStepProps) {
  const insets = useSafeAreaInsets();
  const {
    tripSetup,
    selections,
    pricing,
    bookingReference,
    vouchers,
    travelers,
    getNights,
  } = usePackageStore();
  
  // Animation values
  const checkScale = useSharedValue(0);
  const checkOpacity = useSharedValue(0);
  
  useEffect(() => {
    checkOpacity.value = withDelay(300, withSpring(1));
    checkScale.value = withDelay(300, withSequence(
      withSpring(1.2, { damping: 8 }),
      withSpring(1, { damping: 12 })
    ));
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);
  
  const checkAnimatedStyle = useAnimatedStyle(() => ({
    opacity: checkOpacity.value,
    transform: [{ scale: checkScale.value }],
  }));
  
  const nights = getNights();
  
  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  };
  
  const handleShare = async () => {
    try {
      await Share.share({
        message: `I just booked a trip to ${tripSetup.destination?.name}! Confirmation: ${bookingReference}`,
      });
    } catch (error) {
      console.log('Share error:', error);
    }
  };
  
  const handleDownload = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // In a real app, this would generate a PDF
  };
  
  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Success Animation */}
        <Animated.View style={[styles.successContainer, checkAnimatedStyle]}>
          <LinearGradient
            colors={[colors.success, colors.success + 'DD']}
            style={styles.successCircle}
          >
            <TickCircle size={60} color={colors.white} variant="Bold" />
          </LinearGradient>
        </Animated.View>
        
        <Animated.View entering={FadeIn.duration(400).delay(500)}>
          <Text style={styles.successTitle}>Package Booked!</Text>
          <Text style={styles.successSubtitle}>
            Your trip to {tripSetup.destination?.name} is confirmed
          </Text>
        </Animated.View>
        
        {/* Master Confirmation */}
        <Animated.View entering={FadeInDown.duration(400).delay(600)} style={styles.masterCard}>
          <Text style={styles.masterLabel}>Master Confirmation</Text>
          <Text style={styles.masterNumber}>{bookingReference}</Text>
          <Text style={styles.masterNote}>
            A confirmation email has been sent to your email address
          </Text>
        </Animated.View>
        
        {/* Trip Summary */}
        <Animated.View entering={FadeInDown.duration(400).delay(700)} style={styles.summaryCard}>
          <LinearGradient
            colors={[colors.gradientStart, colors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.summaryHeader}
          >
            <Text style={styles.summaryTitle}>Trip Summary</Text>
          </LinearGradient>
          
          <View style={styles.summaryContent}>
            <View style={styles.summaryRow}>
              <Calendar size={18} color={colors.primary} />
              <View style={styles.summaryInfo}>
                <Text style={styles.summaryLabel}>Travel Dates</Text>
                <Text style={styles.summaryValue}>
                  {formatDate(tripSetup.departureDate)} - {formatDate(tripSetup.returnDate)}
                </Text>
              </View>
            </View>
            
            <View style={styles.summaryDivider} />
            
            {/* Flight Voucher */}
            {vouchers?.flight && (
              <>
                <View style={styles.voucherRow}>
                  <View style={[styles.voucherIcon, { backgroundColor: colors.primary + '15' }]}>
                    <Airplane size={18} color={colors.primary} variant="Bold" />
                  </View>
                  <View style={styles.voucherInfo}>
                    <Text style={styles.voucherLabel}>Flight</Text>
                    <Text style={styles.voucherValue}>
                      {selections.flight.outbound?.segments[0]?.airline?.name || 'Airline'}
                    </Text>
                    <Text style={styles.voucherConfirmation}>
                      Confirmation: {vouchers.flight.confirmation}
                    </Text>
                  </View>
                </View>
                <View style={styles.summaryDivider} />
              </>
            )}
            
            {/* Hotel Voucher */}
            {vouchers?.hotel && (
              <>
                <View style={styles.voucherRow}>
                  <View style={[styles.voucherIcon, { backgroundColor: colors.success + '15' }]}>
                    <Building size={18} color={colors.success} variant="Bold" />
                  </View>
                  <View style={styles.voucherInfo}>
                    <Text style={styles.voucherLabel}>Hotel</Text>
                    <Text style={styles.voucherValue}>{selections.hotel.hotel?.name}</Text>
                    <Text style={styles.voucherConfirmation}>
                      Confirmation: {vouchers.hotel.confirmation}
                    </Text>
                  </View>
                </View>
                <View style={styles.summaryDivider} />
              </>
            )}
            
            {/* Car Voucher */}
            {vouchers?.car && (
              <>
                <View style={styles.voucherRow}>
                  <View style={[styles.voucherIcon, { backgroundColor: colors.warning + '15' }]}>
                    <Car size={18} color={colors.warning} variant="Bold" />
                  </View>
                  <View style={styles.voucherInfo}>
                    <Text style={styles.voucherLabel}>Car Rental</Text>
                    <Text style={styles.voucherValue}>
                      {selections.car?.make} {selections.car?.model}
                    </Text>
                    <Text style={styles.voucherConfirmation}>
                      Confirmation: {vouchers.car.confirmation}
                    </Text>
                  </View>
                </View>
                <View style={styles.summaryDivider} />
              </>
            )}
            
            {/* Total */}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Paid</Text>
              <Text style={styles.totalAmount}>${pricing.total.toFixed(2)}</Text>
            </View>
            
            {pricing.savings > 0 && (
              <View style={styles.savingsBadge}>
                <TickCircle size={14} color={colors.success} variant="Bold" />
                <Text style={styles.savingsText}>
                  You saved ${pricing.savings.toFixed(0)} by bundling!
                </Text>
              </View>
            )}
          </View>
        </Animated.View>
        
        {/* Action Buttons */}
        <Animated.View entering={FadeInDown.duration(400).delay(800)} style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton} onPress={handleDownload}>
            <DocumentDownload size={22} color={colors.primary} />
            <Text style={styles.actionButtonText}>Download All</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
            <ShareIcon size={22} color={colors.primary} />
            <Text style={styles.actionButtonText}>Share</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
      
      {/* Footer */}
      <Animated.View
        entering={FadeInUp.duration(400).delay(900)}
        style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}
      >
        <TouchableOpacity style={styles.doneButton} onPress={onClose} activeOpacity={0.8}>
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.doneButtonGradient}
          >
            <Text style={styles.doneButtonText}>Done</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollView: { flex: 1 },
  scrollContent: { padding: spacing.lg, alignItems: 'center' },
  
  // Success
  successContainer: { marginBottom: spacing.lg },
  successCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.lg,
  },
  successTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  successSubtitle: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  
  // Master Card
  masterCard: {
    backgroundColor: colors.primary + '10',
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.lg,
    width: '100%',
    borderWidth: 1,
    borderColor: colors.primary + '30',
    borderStyle: 'dashed',
  },
  masterLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  masterNumber: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
    letterSpacing: 2,
    marginBottom: spacing.sm,
  },
  masterNote: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  
  // Summary Card
  summaryCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    width: '100%',
    ...shadows.md,
  },
  summaryHeader: {
    padding: spacing.lg,
  },
  summaryTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
  summaryContent: { padding: spacing.lg },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  summaryInfo: {},
  summaryLabel: { fontSize: typography.fontSize.xs, color: colors.textSecondary },
  summaryValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
    marginTop: 2,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: colors.gray100,
    marginVertical: spacing.md,
  },
  
  // Voucher
  voucherRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  voucherIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  voucherInfo: { flex: 1 },
  voucherLabel: { fontSize: typography.fontSize.xs, color: colors.textSecondary },
  voucherValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
    marginTop: 2,
  },
  voucherConfirmation: {
    fontSize: typography.fontSize.xs,
    color: colors.primary,
    marginTop: 4,
  },
  
  // Total
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: { fontSize: typography.fontSize.base, color: colors.textSecondary },
  totalAmount: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  savingsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.success + '10',
    borderRadius: borderRadius.lg,
  },
  savingsText: {
    fontSize: typography.fontSize.sm,
    color: colors.success,
    fontWeight: typography.fontWeight.medium,
  },
  
  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
    width: '100%',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.white,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.xl,
    ...shadows.sm,
  },
  actionButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
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
  },
  doneButton: { borderRadius: borderRadius.xl, overflow: 'hidden' },
  doneButtonGradient: { paddingVertical: spacing.md, alignItems: 'center' },
  doneButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
});
