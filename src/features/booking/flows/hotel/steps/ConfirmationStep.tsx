/**
 * HOTEL CONFIRMATION STEP
 * 
 * Booking success with voucher display.
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
  Location,
  Calendar,
  People,
  DocumentDownload,
  Share as ShareIcon,
  Building,
  Clock,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, shadows, borderRadius } from '@/styles';
import { useHotelStore } from '../../../stores/useHotelStore';

interface ConfirmationStepProps {
  onNext: () => void;
  onBack: () => void;
  onClose: () => void;
  stepIndex: number;
  totalSteps: number;
}

export default function ConfirmationStep({
  onNext,
  onBack,
  onClose,
  stepIndex,
  totalSteps,
}: ConfirmationStepProps) {
  const insets = useSafeAreaInsets();
  const {
    selectedHotel,
    selectedRoom,
    searchParams,
    bookingReference,
    priceBreakdown,
    primaryGuest,
    getNights,
  } = useHotelStore();
  
  // Animation values
  const checkScale = useSharedValue(0);
  const checkOpacity = useSharedValue(0);
  
  useEffect(() => {
    // Animate success checkmark
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
  
  if (!selectedHotel || !selectedRoom) return null;
  
  const nights = getNights();
  
  const handleShare = async () => {
    try {
      await Share.share({
        message: `I just booked ${selectedHotel.name} for ${nights} nights! Confirmation: ${bookingReference}`,
      });
    } catch (error) {
      console.log('Share error:', error);
    }
  };
  
  const handleDownload = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // In a real app, this would generate a PDF voucher
  };
  
  const formatDate = (date: Date | null): string => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
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
          <Text style={styles.successTitle}>Booking Confirmed!</Text>
          <Text style={styles.successSubtitle}>
            Your reservation has been successfully made
          </Text>
        </Animated.View>
        
        {/* Confirmation Number */}
        <Animated.View 
          entering={FadeInDown.duration(400).delay(600)}
          style={styles.confirmationCard}
        >
          <Text style={styles.confirmationLabel}>Confirmation Number</Text>
          <Text style={styles.confirmationNumber}>{bookingReference}</Text>
          <Text style={styles.confirmationNote}>
            A confirmation email has been sent to your email address
          </Text>
        </Animated.View>
        
        {/* Voucher Card */}
        <Animated.View 
          entering={FadeInDown.duration(400).delay(700)}
          style={styles.voucherCard}
        >
          <LinearGradient
            colors={[colors.gradientStart, colors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.voucherHeader}
          >
            <Building size={24} color={colors.white} variant="Bold" />
            <Text style={styles.voucherTitle}>Hotel Voucher</Text>
          </LinearGradient>
          
          <View style={styles.voucherContent}>
            {/* Hotel Info */}
            <View style={styles.voucherSection}>
              <Text style={styles.hotelName}>{selectedHotel.name}</Text>
              <View style={styles.locationRow}>
                <Location size={16} color={colors.textSecondary} />
                <Text style={styles.locationText}>
                  {selectedHotel.location.address}, {selectedHotel.location.city}
                </Text>
              </View>
            </View>
            
            <View style={styles.voucherDivider} />
            
            {/* Dates */}
            <View style={styles.voucherRow}>
              <View style={styles.voucherItem}>
                <Calendar size={18} color={colors.primary} />
                <View style={styles.voucherItemInfo}>
                  <Text style={styles.voucherItemLabel}>Check-in</Text>
                  <Text style={styles.voucherItemValue}>
                    {formatDate(searchParams.checkIn)}
                  </Text>
                  <Text style={styles.voucherItemTime}>
                    From {selectedHotel.policies.checkIn.from}
                  </Text>
                </View>
              </View>
              
              <View style={styles.voucherItem}>
                <Calendar size={18} color={colors.primary} />
                <View style={styles.voucherItemInfo}>
                  <Text style={styles.voucherItemLabel}>Check-out</Text>
                  <Text style={styles.voucherItemValue}>
                    {formatDate(searchParams.checkOut)}
                  </Text>
                  <Text style={styles.voucherItemTime}>
                    Until {selectedHotel.policies.checkOut.until}
                  </Text>
                </View>
              </View>
            </View>
            
            <View style={styles.voucherDivider} />
            
            {/* Room & Guest */}
            <View style={styles.voucherRow}>
              <View style={styles.voucherItem}>
                <Building size={18} color={colors.primary} />
                <View style={styles.voucherItemInfo}>
                  <Text style={styles.voucherItemLabel}>Room</Text>
                  <Text style={styles.voucherItemValue}>{selectedRoom.name}</Text>
                  <Text style={styles.voucherItemTime}>{nights} night{nights > 1 ? 's' : ''}</Text>
                </View>
              </View>
              
              <View style={styles.voucherItem}>
                <People size={18} color={colors.primary} />
                <View style={styles.voucherItemInfo}>
                  <Text style={styles.voucherItemLabel}>Guest</Text>
                  <Text style={styles.voucherItemValue}>
                    {primaryGuest?.firstName} {primaryGuest?.lastName}
                  </Text>
                  <Text style={styles.voucherItemTime}>
                    {searchParams.guests.adults} adult{searchParams.guests.adults > 1 ? 's' : ''}
                  </Text>
                </View>
              </View>
            </View>
            
            <View style={styles.voucherDivider} />
            
            {/* Total */}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Paid</Text>
              <Text style={styles.totalAmount}>
                ${priceBreakdown?.total.toFixed(2)}
              </Text>
            </View>
          </View>
        </Animated.View>
        
        {/* Action Buttons */}
        <Animated.View 
          entering={FadeInDown.duration(400).delay(800)}
          style={styles.actionButtons}
        >
          <TouchableOpacity style={styles.actionButton} onPress={handleDownload}>
            <DocumentDownload size={22} color={colors.primary} />
            <Text style={styles.actionButtonText}>Download</Text>
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
        <TouchableOpacity
          style={styles.doneButton}
          onPress={onClose}
          activeOpacity={0.8}
        >
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
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  
  // Success
  successContainer: {
    marginBottom: spacing.lg,
  },
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
  
  // Confirmation Card
  confirmationCard: {
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
  confirmationLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  confirmationNumber: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
    letterSpacing: 2,
    marginBottom: spacing.sm,
  },
  confirmationNote: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  
  // Voucher Card
  voucherCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    width: '100%',
    ...shadows.md,
  },
  voucherHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.lg,
  },
  voucherTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
  voucherContent: {
    padding: spacing.lg,
  },
  voucherSection: {
    marginBottom: spacing.md,
  },
  hotelName: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  locationText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  voucherDivider: {
    height: 1,
    backgroundColor: colors.gray100,
    marginVertical: spacing.md,
  },
  voucherRow: {
    flexDirection: 'row',
  },
  voucherItem: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  voucherItemInfo: {},
  voucherItemLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  voucherItemValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginTop: 2,
  },
  voucherItemTime: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
  },
  totalAmount: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  
  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
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
  doneButton: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  doneButtonGradient: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  doneButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
});
