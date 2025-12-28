/**
 * BOOKINGS STEP
 * 
 * Step 9: Add bookings to your trip
 * Link existing bookings or create new ones.
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown,
  FadeInUp,
  FadeIn,
} from 'react-native-reanimated';
import {
  ArrowRight2,
  Airplane,
  Building,
  Car,
  Map1,
  Add,
  TickCircle,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, shadows, borderRadius } from '@/styles';
import { useAdvancedPlanningStore } from '../../../stores/useAdvancedPlanningStore';

interface BookingsStepProps {
  onNext: () => void;
  onBack: () => void;
  onClose: () => void;
  onSkip?: () => void;
  isOptional?: boolean;
}

// Booking type configuration
const BOOKING_TYPES = [
  {
    id: 'flight',
    label: 'Flights',
    description: 'Book your flights',
    icon: Airplane,
    color: colors.primary,
  },
  {
    id: 'hotel',
    label: 'Hotels',
    description: 'Find accommodation',
    icon: Building,
    color: colors.info,
  },
  {
    id: 'car',
    label: 'Car Rental',
    description: 'Rent a vehicle',
    icon: Car,
    color: colors.warning,
  },
  {
    id: 'experience',
    label: 'Experiences',
    description: 'Tours & activities',
    icon: Map1,
    color: colors.success,
  },
];

export default function BookingsStep({
  onNext,
  onBack,
  onClose,
  onSkip,
  isOptional,
}: BookingsStepProps) {
  const insets = useSafeAreaInsets();
  const {
    advancedTripData,
    addLinkedBooking,
    removeLinkedBooking,
  } = useAdvancedPlanningStore();
  
  const getBookingCount = (type: string) => {
    const key = `${type}Ids` as keyof typeof advancedTripData.linkedBookings;
    return advancedTripData.linkedBookings[key].length;
  };
  
  const handleAddBooking = useCallback((type: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // TODO: Open respective booking flow
    console.log('Open booking flow for:', type);
  }, []);
  
  const handleSkip = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onNext();
  }, [onNext]);
  
  const handleContinue = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onNext();
  }, [onNext]);
  
  const hasAnyBookings = Object.values(advancedTripData.linkedBookings).some(arr => arr.length > 0);
  
  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(400)}>
          <Text style={styles.title}>Add Bookings</Text>
          <Text style={styles.subtitle}>
            Link bookings now or add them later
          </Text>
        </Animated.View>
        
        {/* Info Card */}
        <Animated.View 
          entering={FadeInDown.duration(400).delay(50)}
          style={styles.infoCard}
        >
          <Text style={styles.infoEmoji}>💡</Text>
          <Text style={styles.infoText}>
            You can skip this step and add bookings later from your trip dashboard.
          </Text>
        </Animated.View>
        
        {/* Booking Options */}
        <Animated.View 
          entering={FadeInDown.duration(400).delay(100)}
          style={styles.bookingsContainer}
        >
          {BOOKING_TYPES.map((booking, index) => {
            const Icon = booking.icon;
            const count = getBookingCount(booking.id);
            
            return (
              <Animated.View
                key={booking.id}
                entering={FadeIn.duration(300).delay(index * 50)}
              >
                <TouchableOpacity
                  style={styles.bookingCard}
                  onPress={() => handleAddBooking(booking.id)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.bookingIcon, { backgroundColor: booking.color + '15' }]}>
                    <Icon size={28} color={booking.color} variant="Bold" />
                  </View>
                  
                  <View style={styles.bookingContent}>
                    <Text style={styles.bookingLabel}>{booking.label}</Text>
                    <Text style={styles.bookingDescription}>{booking.description}</Text>
                  </View>
                  
                  {count > 0 ? (
                    <View style={styles.countBadge}>
                      <TickCircle size={16} color={colors.white} variant="Bold" />
                      <Text style={styles.countText}>{count}</Text>
                    </View>
                  ) : (
                    <View style={styles.addButton}>
                      <Add size={20} color={colors.primary} />
                    </View>
                  )}
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </Animated.View>
        
        {/* Summary */}
        {hasAnyBookings && (
          <Animated.View 
            entering={FadeIn.duration(300)}
            style={styles.summaryCard}
          >
            <Text style={styles.summaryTitle}>Linked Bookings</Text>
            <View style={styles.summaryList}>
              {BOOKING_TYPES.map((booking) => {
                const count = getBookingCount(booking.id);
                if (count === 0) return null;
                
                return (
                  <View key={booking.id} style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>{booking.label}</Text>
                    <Text style={styles.summaryCount}>{count}</Text>
                  </View>
                );
              })}
            </View>
          </Animated.View>
        )}
        
        {/* Later Reminder */}
        <Animated.View 
          entering={FadeInDown.duration(400).delay(200)}
          style={styles.reminderCard}
        >
          <Text style={styles.reminderTitle}>📅 Coming Soon</Text>
          <Text style={styles.reminderText}>
            After creating your trip, you'll be able to:
          </Text>
          <View style={styles.reminderList}>
            <Text style={styles.reminderItem}>• Search and book flights</Text>
            <Text style={styles.reminderItem}>• Find and reserve hotels</Text>
            <Text style={styles.reminderItem}>• Rent cars for your trip</Text>
            <Text style={styles.reminderItem}>• Discover local experiences</Text>
          </View>
        </Animated.View>
      </ScrollView>
      
      {/* Footer */}
      <Animated.View 
        entering={FadeInUp.duration(400).delay(300)}
        style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}
      >
        {isOptional && (
          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
            activeOpacity={0.7}
          >
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={[
            styles.continueButton,
            isOptional && styles.continueButtonWithSkip,
          ]}
          onPress={handleContinue}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[colors.primary, colors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.continueGradient}
          >
            <Text style={styles.continueText}>
              {hasAnyBookings ? 'Continue' : 'Skip & Continue'}
            </Text>
            <ArrowRight2 size={20} color={colors.white} />
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
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  
  // Info Card
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.info + '10',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  infoEmoji: {
    fontSize: 20,
  },
  infoText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.info,
    lineHeight: 20,
  },
  
  // Bookings Container
  bookingsContainer: {
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  bookingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    ...shadows.sm,
  },
  bookingIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  bookingContent: {
    flex: 1,
  },
  bookingLabel: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  bookingDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  countBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    gap: spacing.xs,
  },
  countText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Summary Card
  summaryCard: {
    backgroundColor: colors.primary + '10',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  summaryTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  summaryList: {
    gap: spacing.xs,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
  },
  summaryCount: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  
  // Reminder Card
  reminderCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.sm,
  },
  reminderTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  reminderText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  reminderList: {
    gap: spacing.xs,
  },
  reminderItem: {
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
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  skipButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.xl,
    borderWidth: 2,
    borderColor: colors.gray300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
  },
  continueButton: {
    flex: 1,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.md,
  },
  continueButtonWithSkip: {
    flex: 2,
  },
  continueGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  continueText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
});
