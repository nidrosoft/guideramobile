/**
 * HOTEL CONFIRMATION SCREEN
 * 
 * Success screen after booking completion
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  FadeInDown,
} from 'react-native-reanimated';
import { TickCircle, DocumentDownload, Share as ShareIcon, Calendar, Building } from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, borderRadius, shadows } from '@/styles';
import { useHotelStore } from '../../../stores/useHotelStore';

interface HotelConfirmationScreenProps {
  onDone: () => void;
}

export default function HotelConfirmationScreen({
  onDone,
}: HotelConfirmationScreenProps) {
  const insets = useSafeAreaInsets();
  const {
    selectedHotel,
    selectedRoom,
    searchParams,
    bookingReference,
    primaryGuest,
    getNights,
  } = useHotelStore();

  const checkScale = useSharedValue(0);
  const nights = getNights();

  useEffect(() => {
    // Success haptic
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    // Animate checkmark
    checkScale.value = withDelay(300, withSpring(1, { damping: 12 }));
  }, []);

  const checkAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
  }));

  const formatDate = (date: Date | string | null) => {
    if (!date) return '';
    const dateObj = date instanceof Date ? date : new Date(date);
    if (isNaN(dateObj.getTime())) return '';
    return dateObj.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `I just booked ${selectedHotel?.name} for ${nights} nights! Booking reference: ${bookingReference}`,
      });
    } catch (error) {
      console.log('Share error:', error);
    }
  };

  const handleDownload = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // TODO: Implement voucher download
  };

  return (
    <View style={styles.container}>
      <View style={[styles.content, { paddingTop: insets.top + spacing.xl }]}>
        {/* Success Checkmark */}
        <Animated.View style={[styles.checkContainer, checkAnimatedStyle]}>
          <LinearGradient
            colors={[colors.success, '#059669']}
            style={styles.checkCircle}
          >
            <TickCircle size={60} color={colors.white} variant="Bold" />
          </LinearGradient>
        </Animated.View>

        {/* Success Message */}
        <Animated.Text 
          entering={FadeInDown.duration(400).delay(400)}
          style={styles.title}
        >
          Booking Confirmed!
        </Animated.Text>

        <Animated.Text 
          entering={FadeInDown.duration(400).delay(500)}
          style={styles.subtitle}
        >
          Your reservation has been successfully made
        </Animated.Text>

        {/* Booking Reference */}
        <Animated.View 
          entering={FadeInDown.duration(400).delay(600)}
          style={styles.referenceCard}
        >
          <Text style={styles.referenceLabel}>Booking Reference</Text>
          <Text style={styles.referenceValue}>{bookingReference}</Text>
        </Animated.View>

        {/* Booking Summary */}
        <Animated.View 
          entering={FadeInDown.duration(400).delay(700)}
          style={styles.summaryCard}
        >
          {/* Hotel Info */}
          <View style={styles.summaryRow}>
            <View style={styles.summaryIcon}>
              <Building size={20} color={colors.primary} />
            </View>
            <View style={styles.summaryInfo}>
              <Text style={styles.summaryLabel}>Hotel</Text>
              <Text style={styles.summaryValue}>{selectedHotel?.name}</Text>
              <Text style={styles.summarySubvalue}>{selectedRoom?.name}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Dates */}
          <View style={styles.summaryRow}>
            <View style={styles.summaryIcon}>
              <Calendar size={20} color={colors.primary} />
            </View>
            <View style={styles.summaryInfo}>
              <Text style={styles.summaryLabel}>Dates</Text>
              <Text style={styles.summaryValue}>
                {formatDate(searchParams.checkIn)} - {formatDate(searchParams.checkOut)}
              </Text>
              <Text style={styles.summarySubvalue}>{nights} night{nights > 1 ? 's' : ''}</Text>
            </View>
          </View>

          {primaryGuest && (
            <>
              <View style={styles.divider} />
              <View style={styles.summaryRow}>
                <View style={styles.summaryInfo}>
                  <Text style={styles.summaryLabel}>Guest</Text>
                  <Text style={styles.summaryValue}>
                    {primaryGuest.firstName} {primaryGuest.lastName}
                  </Text>
                </View>
              </View>
            </>
          )}
        </Animated.View>

        {/* Action Buttons */}
        <Animated.View 
          entering={FadeInDown.duration(400).delay(800)}
          style={styles.actions}
        >
          <TouchableOpacity style={styles.actionButton} onPress={handleDownload}>
            <DocumentDownload size={20} color={colors.primary} />
            <Text style={styles.actionText}>Download Voucher</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
            <ShareIcon size={20} color={colors.primary} />
            <Text style={styles.actionText}>Share</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Done Button */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <TouchableOpacity style={styles.doneButton} onPress={onDone}>
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.doneGradient}
          >
            <Text style={styles.doneText}>Done</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  checkContainer: {
    marginBottom: spacing.xl,
  },
  checkCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  referenceCard: {
    backgroundColor: `${colors.primary}10`,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  referenceLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  referenceValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
    letterSpacing: 2,
  },
  summaryCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    width: '100%',
    ...shadows.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  summaryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  summaryInfo: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  summarySubvalue: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.gray100,
    marginVertical: spacing.md,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  actionText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.primary,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  doneButton: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  doneGradient: {
    paddingVertical: spacing.md + 2,
    alignItems: 'center',
  },
  doneText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
});
