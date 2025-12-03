/**
 * CONFIRMATION STEP
 * 
 * Booking success screen with animated celebration.
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
  Airplane,
  Calendar,
  Location,
  DocumentDownload,
  Share as ShareIcon,
  Add,
  ArrowRight2,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, shadows, borderRadius } from '@/styles';
import { useFlightStore } from '../../../stores/useFlightStore';

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
    selectedOutboundFlight, 
    searchParams, 
    bookingReference,
    travelers,
    contactInfo,
  } = useFlightStore();
  
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
  
  const flight = selectedOutboundFlight;
  const firstSegment = flight?.segments[0];
  const lastSegment = flight?.segments[flight.segments.length - 1];
  
  const formatTime = (date: Date): string => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };
  
  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };
  
  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Share.share({
        message: `I just booked a flight from ${firstSegment?.origin.code} to ${lastSegment?.destination.code}! Booking reference: ${bookingReference}`,
      });
    } catch (error) {
      console.log('Share error:', error);
    }
  };
  
  const handleDownload = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // In a real app, this would download the e-ticket
  };
  
  const handleAddToTrip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // In a real app, this would add to an existing trip
  };
  
  const handleDone = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onClose();
  };
  
  if (!flight || !firstSegment || !lastSegment) {
    return null;
  }
  
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
        <View style={styles.successContainer}>
          {/* Animated Ring */}
          <Animated.View style={[styles.successRing, ringAnimatedStyle]} />
          
          {/* Check Icon */}
          <Animated.View style={[styles.successIcon, checkAnimatedStyle]}>
            <LinearGradient
              colors={[colors.success, '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.successIconGradient}
            >
              <TickCircle size={48} color={colors.white} variant="Bold" />
            </LinearGradient>
          </Animated.View>
        </View>
        
        {/* Success Message */}
        <Animated.View 
          entering={FadeInDown.duration(400).delay(500)}
          style={styles.successMessage}
        >
          <Text style={styles.successTitle}>Booking Confirmed!</Text>
          <Text style={styles.successSubtitle}>
            Your flight has been successfully booked
          </Text>
        </Animated.View>
        
        {/* Booking Reference */}
        <Animated.View 
          entering={FadeInDown.duration(400).delay(600)}
          style={styles.referenceCard}
        >
          <Text style={styles.referenceLabel}>Booking Reference</Text>
          <Text style={styles.referenceCode}>{bookingReference}</Text>
          <Text style={styles.referenceNote}>
            Save this code for check-in
          </Text>
        </Animated.View>
        
        {/* Flight Summary Card */}
        <Animated.View 
          entering={FadeInDown.duration(400).delay(700)}
          style={styles.flightCard}
        >
          <View style={styles.flightHeader}>
            <View style={styles.airlineBadge}>
              <Text style={styles.airlineCode}>{firstSegment.airline.code}</Text>
            </View>
            <Text style={styles.airlineName}>{firstSegment.airline.name}</Text>
            <Text style={styles.flightNumber}>{firstSegment.flightNumber}</Text>
          </View>
          
          <View style={styles.flightRoute}>
            <View style={styles.routePoint}>
              <Text style={styles.routeCode}>{firstSegment.origin.code}</Text>
              <Text style={styles.routeCity}>{firstSegment.origin.city}</Text>
              <Text style={styles.routeTime}>{formatTime(firstSegment.departureTime)}</Text>
            </View>
            
            <View style={styles.routeMiddle}>
              <View style={styles.routeLine}>
                <View style={styles.routeDot} />
                <View style={styles.routeLineBar} />
                <Airplane size={20} color={colors.primary} style={styles.planeIcon} />
              </View>
              <Text style={styles.routeStops}>
                {flight.stops === 0 ? 'Direct' : `${flight.stops} stop`}
              </Text>
            </View>
            
            <View style={[styles.routePoint, styles.routePointRight]}>
              <Text style={styles.routeCode}>{lastSegment.destination.code}</Text>
              <Text style={styles.routeCity}>{lastSegment.destination.city}</Text>
              <Text style={styles.routeTime}>{formatTime(lastSegment.arrivalTime)}</Text>
            </View>
          </View>
          
          <View style={styles.flightDetails}>
            <View style={styles.detailItem}>
              <Calendar size={16} color={colors.textSecondary} />
              <Text style={styles.detailText}>
                {formatDate(firstSegment.departureTime)}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Location size={16} color={colors.textSecondary} />
              <Text style={styles.detailText}>
                {searchParams.passengers.adults + searchParams.passengers.children} Passenger(s)
              </Text>
            </View>
          </View>
        </Animated.View>
        
        {/* Traveler Info */}
        <Animated.View 
          entering={FadeInDown.duration(400).delay(800)}
          style={styles.travelerCard}
        >
          <Text style={styles.cardTitle}>Travelers</Text>
          {travelers.map((traveler, index) => (
            <View key={traveler.id} style={styles.travelerItem}>
              <View style={styles.travelerAvatar}>
                <Text style={styles.travelerInitial}>
                  {traveler.firstName.charAt(0)}
                </Text>
              </View>
              <View style={styles.travelerInfo}>
                <Text style={styles.travelerName}>
                  {traveler.firstName} {traveler.lastName}
                </Text>
                <Text style={styles.travelerType}>
                  {traveler.type === 'adult' ? 'Adult' : 'Child'}
                </Text>
              </View>
            </View>
          ))}
        </Animated.View>
        
        {/* Confirmation Sent */}
        <Animated.View 
          entering={FadeInDown.duration(400).delay(900)}
          style={styles.confirmationSent}
        >
          <TickCircle size={20} color={colors.success} variant="Bold" />
          <Text style={styles.confirmationSentText}>
            Confirmation sent to {contactInfo?.email}
          </Text>
        </Animated.View>
        
        {/* Action Buttons */}
        <Animated.View 
          entering={FadeInDown.duration(400).delay(1000)}
          style={styles.actionButtons}
        >
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleDownload}
          >
            <View style={[styles.actionIcon, { backgroundColor: colors.primary + '15' }]}>
              <DocumentDownload size={22} color={colors.primary} />
            </View>
            <Text style={styles.actionText}>Download E-Ticket</Text>
            <ArrowRight2 size={18} color={colors.gray400} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleAddToTrip}
          >
            <View style={[styles.actionIcon, { backgroundColor: colors.success + '15' }]}>
              <Add size={22} color={colors.success} />
            </View>
            <Text style={styles.actionText}>Add to Trip</Text>
            <ArrowRight2 size={18} color={colors.gray400} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleShare}
          >
            <View style={[styles.actionIcon, { backgroundColor: colors.info + '15' }]}>
              <ShareIcon size={22} color={colors.info} />
            </View>
            <Text style={styles.actionText}>Share Booking</Text>
            <ArrowRight2 size={18} color={colors.gray400} />
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
      
      {/* Footer */}
      <Animated.View 
        entering={FadeInUp.duration(400).delay(1100)}
        style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}
      >
        <TouchableOpacity
          style={styles.doneButton}
          onPress={handleDone}
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
  },
  
  // Success Animation
  successContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 140,
    marginBottom: spacing.lg,
  },
  successRing: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: colors.success,
  },
  successIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
  },
  successIconGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Success Message
  successMessage: {
    alignItems: 'center',
    marginBottom: spacing.xl,
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
  
  // Reference Card
  referenceCard: {
    backgroundColor: colors.primary + '10',
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.lg,
    borderWidth: 2,
    borderColor: colors.primary + '30',
    borderStyle: 'dashed',
  },
  referenceLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  referenceCode: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
    letterSpacing: 4,
    marginBottom: spacing.xs,
  },
  referenceNote: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  
  // Flight Card
  flightCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.card,
  },
  flightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  airlineBadge: {
    backgroundColor: colors.gray100,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  airlineCode: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  airlineName: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
    flex: 1,
  },
  flightNumber: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  flightRoute: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  routePoint: {},
  routePointRight: {
    alignItems: 'flex-end',
  },
  routeCode: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  routeCity: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  routeTime: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.primary,
    marginTop: 4,
  },
  routeMiddle: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  routeLine: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  routeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.gray400,
  },
  routeLineBar: {
    flex: 1,
    height: 2,
    backgroundColor: colors.gray200,
  },
  planeIcon: {
    transform: [{ rotate: '45deg' }],
  },
  routeStops: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  flightDetails: {
    flexDirection: 'row',
    gap: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  detailText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  
  // Traveler Card
  travelerCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.card,
  },
  cardTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  travelerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  travelerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  travelerInitial: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  travelerInfo: {
    marginLeft: spacing.md,
  },
  travelerName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  travelerType: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  
  // Confirmation Sent
  confirmationSent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.success + '10',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
  },
  confirmationSentText: {
    fontSize: typography.fontSize.sm,
    color: colors.success,
    fontWeight: typography.fontWeight.medium,
  },
  
  // Action Buttons
  actionButtons: {
    gap: spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: borderRadius.xl,
    ...shadows.sm,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: {
    flex: 1,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
    marginLeft: spacing.md,
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
