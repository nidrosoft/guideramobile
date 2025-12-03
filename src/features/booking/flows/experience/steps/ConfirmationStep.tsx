/**
 * EXPERIENCE CONFIRMATION STEP
 * 
 * Booking confirmed with voucher and details.
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import {
  TickCircle,
  Calendar,
  Clock,
  Location,
  People,
  Call,
  Sms,
  DocumentDownload,
  Share as ShareIcon,
  ArrowRight2,
  InfoCircle,
  User,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, shadows, borderRadius } from '@/styles';
import { useExperienceStore } from '../../../stores/useExperienceStore';

interface ConfirmationStepProps {
  onNext: () => void;
  onBack: () => void;
  onClose: () => void;
}

export default function ConfirmationStep({ onNext, onBack, onClose }: ConfirmationStepProps) {
  const insets = useSafeAreaInsets();
  const {
    selectedExperience,
    selectedDate,
    selectedTimeSlot,
    searchParams,
    leadTraveler,
    bookingReference,
    pricing,
    reset,
  } = useExperienceStore();
  
  // Animation values
  const checkScale = useSharedValue(0);
  const checkOpacity = useSharedValue(0);
  const ringScale = useSharedValue(0.8);
  
  useEffect(() => {
    // Trigger success animation
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    checkScale.value = withDelay(
      200,
      withSpring(1, { damping: 8, stiffness: 100 })
    );
    checkOpacity.value = withDelay(200, withTiming(1, { duration: 300 }));
    ringScale.value = withDelay(
      400,
      withSequence(
        withSpring(1.2, { damping: 8 }),
        withSpring(1, { damping: 10 })
      )
    );
  }, []);
  
  const checkAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
    opacity: checkOpacity.value,
  }));
  
  const ringAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: ringScale.value,
  }));
  
  if (!selectedExperience || !selectedTimeSlot) return null;
  
  const experience = selectedExperience;
  const { adults, children, infants } = searchParams.participants;
  
  const formatDate = (date: Date | null): string => {
    if (!date) return '';
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  };
  
  const handleShare = async () => {
    try {
      await Share.share({
        title: 'Experience Booking Confirmation',
        message: `I just booked "${experience.title}" for ${formatDate(selectedDate)} at ${selectedTimeSlot.startTime}! Confirmation: ${bookingReference}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
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
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Success Header */}
        <View style={styles.successHeader}>
          <Animated.View style={[styles.successRing, ringAnimatedStyle]} />
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
            Your experience is booked
          </Animated.Text>
        </View>
        
        {/* Confirmation Number */}
        <Animated.View entering={FadeInDown.duration(400).delay(700)} style={styles.confirmationCard}>
          <Text style={styles.confirmationLabel}>Confirmation Number</Text>
          <Text style={styles.confirmationNumber}>{bookingReference}</Text>
          <Text style={styles.confirmationNote}>
            A confirmation email has been sent to {leadTraveler.email}
          </Text>
        </Animated.View>
        
        {/* Experience Details */}
        <Animated.View entering={FadeInDown.duration(400).delay(800)} style={styles.detailsCard}>
          <Text style={styles.experienceTitle}>{experience.title}</Text>
          
          <View style={styles.detailRow}>
            <Calendar size={18} color={colors.primary} />
            <Text style={styles.detailText}>{formatDate(selectedDate)}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Clock size={18} color={colors.primary} />
            <Text style={styles.detailText}>
              {selectedTimeSlot.startTime} - {selectedTimeSlot.endTime} ({Math.floor(experience.duration / 60)} hours)
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <People size={18} color={colors.primary} />
            <Text style={styles.detailText}>
              {adults} Adult{adults > 1 ? 's' : ''}
              {children > 0 && `, ${children} Child${children > 1 ? 'ren' : ''}`}
              {infants > 0 && `, ${infants} Infant${infants > 1 ? 's' : ''}`}
            </Text>
          </View>
        </Animated.View>
        
        {/* Meeting Point */}
        <Animated.View entering={FadeInDown.duration(400).delay(900)} style={styles.meetingCard}>
          <View style={styles.meetingHeader}>
            <Location size={20} color={colors.primary} />
            <Text style={styles.meetingTitle}>Meeting Point</Text>
          </View>
          
          <View style={styles.mapPlaceholder}>
            <Image
              source={{ uri: `https://maps.googleapis.com/maps/api/staticmap?center=${experience.location.coordinates.lat},${experience.location.coordinates.lng}&zoom=15&size=400x150&markers=color:red%7C${experience.location.coordinates.lat},${experience.location.coordinates.lng}&key=YOUR_API_KEY` }}
              style={styles.mapImage}
              defaultSource={{ uri: 'https://via.placeholder.com/400x150/e0e0e0/999999?text=Map' }}
            />
          </View>
          
          <Text style={styles.meetingName}>{experience.location.meetingPoint.name}</Text>
          <Text style={styles.meetingAddress}>{experience.location.meetingPoint.address}</Text>
          <Text style={styles.meetingInstructions}>{experience.location.meetingPoint.instructions}</Text>
          
          <TouchableOpacity style={styles.directionsButton}>
            <Text style={styles.directionsButtonText}>Get Directions</Text>
            <ArrowRight2 size={16} color={colors.primary} />
          </TouchableOpacity>
        </Animated.View>
        
        {/* Host Contact */}
        <Animated.View entering={FadeInDown.duration(400).delay(1000)} style={styles.hostCard}>
          <View style={styles.hostHeader}>
            <User size={20} color={colors.primary} />
            <Text style={styles.hostTitle}>Your Host</Text>
          </View>
          
          <View style={styles.hostInfo}>
            <Image
              source={{ uri: experience.host.avatar }}
              style={styles.hostAvatar}
            />
            <View style={styles.hostDetails}>
              <Text style={styles.hostName}>{experience.host.name}</Text>
              <Text style={styles.hostResponse}>Usually responds {experience.host.responseTime}</Text>
            </View>
          </View>
          
          <TouchableOpacity style={styles.contactButton}>
            <Call size={18} color={colors.primary} />
            <Text style={styles.contactButtonText}>Contact Host</Text>
          </TouchableOpacity>
        </Animated.View>
        
        {/* What to Bring */}
        {experience.whatToBring.length > 0 && (
          <Animated.View entering={FadeInDown.duration(400).delay(1100)} style={styles.bringCard}>
            <View style={styles.bringHeader}>
              <InfoCircle size={20} color={colors.warning} />
              <Text style={styles.bringTitle}>What to Bring</Text>
            </View>
            
            {experience.whatToBring.map((item, index) => (
              <View key={index} style={styles.bringItem}>
                <View style={styles.bringBullet} />
                <Text style={styles.bringText}>{item}</Text>
              </View>
            ))}
            
            <View style={styles.bringItem}>
              <View style={styles.bringBullet} />
              <Text style={styles.bringText}>This confirmation (digital is OK)</Text>
            </View>
          </Animated.View>
        )}
        
        {/* Price Summary */}
        <Animated.View entering={FadeInDown.duration(400).delay(1200)} style={styles.priceCard}>
          <Text style={styles.priceTitle}>Payment Summary</Text>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Total Paid</Text>
            <Text style={styles.priceValue}>${pricing.total}</Text>
          </View>
        </Animated.View>
        
        {/* Action Buttons */}
        <Animated.View entering={FadeInDown.duration(400).delay(1300)} style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton} onPress={() => {}}>
            <DocumentDownload size={20} color={colors.primary} />
            <Text style={styles.actionButtonText}>Download Voucher</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
            <ShareIcon size={20} color={colors.primary} />
            <Text style={styles.actionButtonText}>Share</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
      
      {/* Footer */}
      <Animated.View
        entering={FadeInDown.duration(400).delay(1400)}
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
  container: { flex: 1, backgroundColor: colors.background },
  scrollView: { flex: 1 },
  scrollContent: { padding: spacing.lg },
  
  successHeader: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    marginBottom: spacing.lg,
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
  
  confirmationCard: {
    backgroundColor: colors.primary + '10',
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  confirmationLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  confirmationNumber: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
    letterSpacing: 2,
    marginBottom: spacing.sm,
  },
  confirmationNote: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  
  detailsCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  experienceTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  detailText: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
    flex: 1,
  },
  
  meetingCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  meetingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  meetingTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  mapPlaceholder: {
    height: 120,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.gray100,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  mapImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  meetingName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  meetingAddress: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  meetingInstructions: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontStyle: 'italic',
    marginBottom: spacing.md,
  },
  directionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary + '15',
  },
  directionsButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
  },
  
  hostCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  hostHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  hostTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  hostInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  hostAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  hostDetails: { marginLeft: spacing.md },
  hostName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  hostResponse: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  contactButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
  },
  
  bringCard: {
    backgroundColor: colors.warning + '15',
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  bringHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  bringTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  bringItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  bringBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.warning,
  },
  bringText: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
  },
  
  priceCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  priceTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priceLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  priceValue: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  actionButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.primary,
  },
  
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
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
});
