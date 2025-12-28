/**
 * EXPERIENCE CHECKOUT SCREEN
 * 
 * Combined checkout with time slot selection, traveler details, and payment.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ImageBackground,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  ArrowLeft,
  CloseCircle,
  Calendar,
  Clock,
  People,
  User,
  Card,
  TickCircle,
  ArrowRight2,
  Edit2,
  Star1,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing } from '@/styles';
import { useExperienceStore } from '../../../stores/useExperienceStore';
import { Experience, TimeSlot } from '../../../types/experience.types';
import { LeadTraveler } from '../../../stores/useExperienceStore';
import { styles } from './ExperienceCheckoutScreen.styles';

// Import sheets
import TimeSlotSheet from '../sheets/TimeSlotSheet';
import ParticipantsSheet from '../sheets/ParticipantsSheet';
import TravelerDetailsSheet from '../sheets/TravelerDetailsSheet';
import PaymentSheet, { PaymentData } from '../sheets/PaymentSheet';

// Import shared
import { CancelBookingModal } from '../../shared';

interface ExperienceCheckoutScreenProps {
  experience: Experience;
  onConfirm: () => void;
  onBack: () => void;
  onClose: () => void;
}

export default function ExperienceCheckoutScreen({
  experience,
  onConfirm,
  onBack,
  onClose,
}: ExperienceCheckoutScreenProps) {
  const insets = useSafeAreaInsets();
  const {
    searchParams,
    selectedDate,
    selectedTimeSlot,
    selectDate,
    selectTimeSlot,
    setParticipants,
    leadTraveler,
    setLeadTraveler,
    pricing,
    calculatePricing,
  } = useExperienceStore();

  // Sheet visibility states
  const [showTimeSlotSheet, setShowTimeSlotSheet] = useState(false);
  const [showParticipantsSheet, setShowParticipantsSheet] = useState(false);
  const [showTravelerSheet, setShowTravelerSheet] = useState(false);
  const [showPaymentSheet, setShowPaymentSheet] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  // Payment state
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Calculate pricing on mount and when participants change
  useEffect(() => {
    calculatePricing();
  }, [searchParams.participants, selectedTimeSlot]);

  // Validation
  const isTravelerComplete = leadTraveler.firstName && leadTraveler.lastName && leadTraveler.email && leadTraveler.phone;
  const isPaymentComplete = paymentData !== null;
  const canConfirm = selectedTimeSlot && isTravelerComplete && isPaymentComplete;

  const handleClose = () => {
    setShowCancelModal(true);
  };

  const handleConfirm = async () => {
    if (!canConfirm) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    setIsProcessing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    setIsProcessing(false);
    onConfirm();
  };

  // Format helpers
  const formatDate = (date: Date | null): string => {
    if (!date) return 'Select date';
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    return `${hours} hours`;
  };

  const getTotalParticipants = (): number => {
    const { adults, children, infants } = searchParams.participants;
    return adults + children + infants;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header with Background Image */}
      <ImageBackground
        source={require('../../../../../../assets/images/experiencebg.png')}
        style={[styles.header, { paddingTop: insets.top + spacing.md }]}
        resizeMode="cover"
      >
        <View style={styles.headerOverlay} />
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <ArrowLeft size={24} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Checkout</Text>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <CloseCircle size={24} color={colors.white} variant="Bold" />
          </TouchableOpacity>
        </View>
      </ImageBackground>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Experience Summary Card */}
        <Animated.View entering={FadeInDown.duration(400).delay(100)} style={styles.summaryCard}>
          <Image source={{ uri: experience.images[0] }} style={styles.summaryImage} />
          <View style={styles.summaryContent}>
            <View style={styles.ratingRow}>
              <Star1 size={12} color={colors.warning} variant="Bold" />
              <Text style={styles.ratingText}>{experience.rating}</Text>
            </View>
            <Text style={styles.summaryTitle} numberOfLines={2}>{experience.title}</Text>
            <View style={styles.summaryInfo}>
              <Clock size={14} color={colors.textSecondary} />
              <Text style={styles.summaryInfoText}>{formatDuration(experience.duration)}</Text>
            </View>
          </View>
        </Animated.View>

        {/* Date & Time Selection */}
        <Animated.View entering={FadeInDown.duration(400).delay(150)}>
          <Text style={styles.sectionTitle}>Date & Time</Text>
          <TouchableOpacity
            style={styles.selectionCard}
            onPress={() => setShowTimeSlotSheet(true)}
            activeOpacity={0.7}
          >
            <View style={[styles.selectionIcon, { backgroundColor: `${colors.primary}15` }]}>
              <Calendar size={20} color={colors.primary} variant="Bold" />
            </View>
            <View style={styles.selectionContent}>
              <Text style={styles.selectionLabel}>
                {selectedDate ? formatDate(selectedDate) : 'Select date'}
              </Text>
              {selectedTimeSlot && (
                <Text style={styles.selectionValue}>
                  {selectedTimeSlot.startTime} - {selectedTimeSlot.endTime}
                </Text>
              )}
            </View>
            {selectedTimeSlot ? (
              <Edit2 size={20} color={colors.primary} />
            ) : (
              <ArrowRight2 size={20} color={colors.gray400} />
            )}
          </TouchableOpacity>
        </Animated.View>

        {/* Participants */}
        <Animated.View entering={FadeInDown.duration(400).delay(200)}>
          <Text style={styles.sectionTitle}>Guests</Text>
          <TouchableOpacity
            style={styles.selectionCard}
            onPress={() => setShowParticipantsSheet(true)}
            activeOpacity={0.7}
          >
            <View style={[styles.selectionIcon, { backgroundColor: `${colors.warning}15` }]}>
              <People size={20} color={colors.warning} variant="Bold" />
            </View>
            <View style={styles.selectionContent}>
              <Text style={styles.selectionLabel}>
                {getTotalParticipants()} {getTotalParticipants() === 1 ? 'Guest' : 'Guests'}
              </Text>
              <Text style={styles.selectionValue}>
                {searchParams.participants.adults} Adults
                {searchParams.participants.children > 0 && `, ${searchParams.participants.children} Children`}
              </Text>
            </View>
            <Edit2 size={20} color={colors.primary} />
          </TouchableOpacity>
        </Animated.View>

        {/* Lead Traveler */}
        <Animated.View entering={FadeInDown.duration(400).delay(250)}>
          <Text style={styles.sectionTitle}>Lead Traveler</Text>
          <TouchableOpacity
            style={styles.selectionCard}
            onPress={() => setShowTravelerSheet(true)}
            activeOpacity={0.7}
          >
            <View style={[styles.selectionIcon, { backgroundColor: `${colors.success}15` }]}>
              <User size={20} color={colors.success} variant="Bold" />
            </View>
            <View style={styles.selectionContent}>
              {isTravelerComplete ? (
                <>
                  <Text style={styles.selectionLabel}>
                    {leadTraveler.firstName} {leadTraveler.lastName}
                  </Text>
                  <Text style={styles.selectionValue}>{leadTraveler.email}</Text>
                </>
              ) : (
                <Text style={styles.selectionPlaceholder}>Add traveler details</Text>
              )}
            </View>
            {isTravelerComplete ? (
              <TickCircle size={20} color={colors.success} variant="Bold" />
            ) : (
              <ArrowRight2 size={20} color={colors.gray400} />
            )}
          </TouchableOpacity>
        </Animated.View>

        {/* Payment */}
        <Animated.View entering={FadeInDown.duration(400).delay(300)}>
          <Text style={styles.sectionTitle}>Payment</Text>
          <TouchableOpacity
            style={styles.selectionCard}
            onPress={() => setShowPaymentSheet(true)}
            activeOpacity={0.7}
          >
            <View style={[styles.selectionIcon, { backgroundColor: `${colors.primary}15` }]}>
              <Card size={20} color={colors.primary} variant="Bold" />
            </View>
            <View style={styles.selectionContent}>
              {isPaymentComplete ? (
                <>
                  <Text style={styles.selectionLabel}>
                    •••• •••• •••• {paymentData?.cardNumber.slice(-4)}
                  </Text>
                  <Text style={styles.selectionValue}>{paymentData?.cardholderName}</Text>
                </>
              ) : (
                <Text style={styles.selectionPlaceholder}>Add payment method</Text>
              )}
            </View>
            {isPaymentComplete ? (
              <TickCircle size={20} color={colors.success} variant="Bold" />
            ) : (
              <ArrowRight2 size={20} color={colors.gray400} />
            )}
          </TouchableOpacity>
        </Animated.View>

        {/* Price Breakdown */}
        <Animated.View entering={FadeInDown.duration(400).delay(350)} style={styles.priceCard}>
          <Text style={styles.priceTitle}>Price Details</Text>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>
              {experience.price.formatted} x {searchParams.participants.adults} adults
            </Text>
            <Text style={styles.priceValue}>${pricing.adultTotal.toFixed(2)}</Text>
          </View>
          {searchParams.participants.children > 0 && (
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>
                Children ({searchParams.participants.children})
              </Text>
              <Text style={styles.priceValue}>${pricing.childTotal.toFixed(2)}</Text>
            </View>
          )}
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Service fee</Text>
            <Text style={styles.priceValue}>${pricing.serviceFee.toFixed(2)}</Text>
          </View>
          <View style={styles.priceDivider} />
          <View style={styles.priceRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>${pricing.total.toFixed(2)}</Text>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <View style={styles.footerPrice}>
          <Text style={styles.footerPriceLabel}>Total</Text>
          <Text style={styles.footerPriceValue}>${pricing.total.toFixed(2)}</Text>
        </View>
        <TouchableOpacity
          style={[styles.confirmButton, !canConfirm && styles.confirmButtonDisabled]}
          onPress={handleConfirm}
          disabled={!canConfirm || isProcessing}
        >
          <LinearGradient
            colors={canConfirm ? [colors.primary, colors.primaryDark] : [colors.gray300, colors.gray400]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.confirmGradient}
          >
            {isProcessing ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.confirmText}>Confirm Booking</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Sheets */}
      <TimeSlotSheet
        visible={showTimeSlotSheet}
        onClose={() => setShowTimeSlotSheet(false)}
        onSelect={(date: Date, slot: TimeSlot) => {
          selectDate(date);
          selectTimeSlot(slot);
          setShowTimeSlotSheet(false);
        }}
        selectedDate={selectedDate}
        selectedTimeSlot={selectedTimeSlot}
      />

      <ParticipantsSheet
        visible={showParticipantsSheet}
        onClose={() => setShowParticipantsSheet(false)}
        participants={searchParams.participants}
        onUpdate={setParticipants}
      />

      <TravelerDetailsSheet
        visible={showTravelerSheet}
        onClose={() => setShowTravelerSheet(false)}
        travelers={leadTraveler.firstName ? [{
          id: '1',
          firstName: leadTraveler.firstName,
          lastName: leadTraveler.lastName,
          email: leadTraveler.email,
          phone: leadTraveler.phone,
        }] : []}
        onSaveTravelers={(travelers: Array<{id: string; firstName: string; lastName: string; email: string; phone: string}>) => {
          if (travelers.length > 0) {
            setLeadTraveler({
              firstName: travelers[0].firstName,
              lastName: travelers[0].lastName,
              email: travelers[0].email,
              phone: travelers[0].phone,
            });
          }
          setShowTravelerSheet(false);
        }}
      />

      <PaymentSheet
        visible={showPaymentSheet}
        onClose={() => setShowPaymentSheet(false)}
        onSave={(data: PaymentData) => {
          setPaymentData(data);
          setShowPaymentSheet(false);
        }}
      />

      {/* Cancel Modal */}
      <CancelBookingModal
        visible={showCancelModal}
        onCancel={() => setShowCancelModal(false)}
        onConfirm={() => {
          setShowCancelModal(false);
          onClose();
        }}
        title="Cancel Booking?"
        message="Are you sure you want to cancel? Your booking progress will be lost."
      />
    </View>
  );
}
