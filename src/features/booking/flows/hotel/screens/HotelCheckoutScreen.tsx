/**
 * HOTEL CHECKOUT SCREEN
 * 
 * Final checkout screen with guest details, extras, and payment.
 * Uses bottom sheets for each section - matches flight checkout pattern.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ImageBackground,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  ArrowLeft,
  TickCircle,
  User,
  Calendar,
  Building,
  Card,
  ArrowRight2,
  CloseCircle,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing } from '@/styles';
import { useHotelStore } from '../../../stores/useHotelStore';

// Import sheets - reuse flight sheets for consistency
import GuestDetailsSheet from '../sheets/GuestDetailsSheet';
import HotelBookingSummarySheet from '../sheets/HotelBookingSummarySheet';
import PaymentSheet from '../sheets/PaymentSheet';
import { CancelBookingModal } from '../../shared';
import { styles } from './HotelCheckoutScreen.styles';

interface HotelCheckoutScreenProps {
  onConfirm: () => void;
  onBack: () => void;
  onClose: () => void;  // Close and go back to homepage
}

export default function HotelCheckoutScreen({
  onConfirm,
  onBack,
  onClose,
}: HotelCheckoutScreenProps) {
  const insets = useSafeAreaInsets();
  const {
    selectedHotel,
    selectedRoom,
    searchParams,
    primaryGuest,
    contactInfo,
    extras,
    priceBreakdown,
    getNights,
    calculatePrice,
  } = useHotelStore();

  // Bottom sheet visibility states
  const [showGuestSheet, setShowGuestSheet] = useState(false);
  const [showPaymentSheet, setShowPaymentSheet] = useState(false);
  const [showSummarySheet, setShowSummarySheet] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Close confirmation handlers
  const handleClosePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowCloseConfirm(true);
  };

  const handleConfirmClose = () => {
    setShowCloseConfirm(false);
    setTimeout(() => {
      onClose();
    }, 100);
  };

  const handleCancelClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowCloseConfirm(false);
  };

  // Payment state
  const [paymentInfo, setPaymentInfo] = useState({
    cardNumber: '',
    cardHolder: '',
    expiryDate: '',
    cvv: '',
  });

  const nights = getNights();
  const hasGuestInfo = primaryGuest && contactInfo;
  const isPaymentComplete = !!(
    paymentInfo.cardNumber.replace(/\s/g, '').length >= 16 &&
    paymentInfo.cardHolder &&
    paymentInfo.expiryDate.length >= 5 &&
    paymentInfo.cvv.length >= 3
  );

  // Calculate price on mount
  React.useEffect(() => {
    calculatePrice();
  }, [extras]);

  const handleConfirmBooking = async () => {
    if (!hasGuestInfo) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setShowGuestSheet(true);
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsProcessing(true);

    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    setIsProcessing(false);
    onConfirm();
  };

  if (!selectedHotel || !selectedRoom) return null;

  const formatDate = (date: Date | string | null) => {
    if (!date) return '';
    // Handle both Date objects and string dates (from persistence)
    const dateObj = date instanceof Date ? date : new Date(date);
    if (isNaN(dateObj.getTime())) return '';
    return dateObj.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <View style={styles.container}>
      {/* Header with hotel background */}
      <ImageBackground
        source={require('../../../../../../assets/images/bookingbg.png')}
        style={[styles.header, { paddingTop: insets.top + spacing.md }]}
        resizeMode="cover"
      >
        <View style={styles.headerOverlay} />
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <ArrowLeft size={24} color={colors.white} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Checkout</Text>
            <Text style={styles.headerSubtitle}>{selectedHotel.name}</Text>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={handleClosePress}>
            <CloseCircle size={24} color={colors.white} variant="Bold" />
          </TouchableOpacity>
        </View>
      </ImageBackground>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hotel Summary Card - Opens Detail Sheet */}
        <TouchableOpacity
          style={styles.summaryCard}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowSummarySheet(true);
          }}
          activeOpacity={0.8}
        >
          <Image
            source={{ uri: selectedHotel.images[0]?.url }}
            style={styles.hotelImage}
          />
          <View style={styles.hotelInfo}>
            <Text style={styles.hotelName} numberOfLines={1}>
              {selectedHotel.name}
            </Text>
            <Text style={styles.roomName}>{selectedRoom.name}</Text>
            <View style={styles.dateRow}>
              <Calendar size={14} color={colors.textSecondary} />
              <Text style={styles.dateText}>
                {formatDate(searchParams.checkIn)} - {formatDate(searchParams.checkOut)}
              </Text>
            </View>
            <Text style={styles.nightsText}>{nights} night{nights > 1 ? 's' : ''}</Text>
          </View>
          <ArrowRight2 size={20} color={colors.gray400} style={styles.summaryArrow} />
        </TouchableOpacity>

        {/* Guest Details Section */}
        <Animated.View entering={FadeInDown.duration(400).delay(100)}>
          <TouchableOpacity
            style={styles.sectionCard}
            onPress={() => setShowGuestSheet(true)}
          >
            <View style={[styles.sectionIcon, hasGuestInfo && styles.sectionIconComplete]}>
              <User size={20} color={hasGuestInfo ? colors.white : colors.primary} />
            </View>
            <View style={styles.sectionInfo}>
              <Text style={styles.sectionTitle}>Guest Details</Text>
              <Text style={styles.sectionSubtitle}>
                {hasGuestInfo
                  ? `${primaryGuest.firstName} ${primaryGuest.lastName}`
                  : 'Add guest information'}
              </Text>
            </View>
            {hasGuestInfo ? (
              <TickCircle size={24} color={colors.success} variant="Bold" />
            ) : (
              <ArrowRight2 size={20} color={colors.gray400} />
            )}
          </TouchableOpacity>
        </Animated.View>

        {/* Price Breakdown */}
        <Animated.View entering={FadeInDown.duration(400).delay(200)} style={styles.priceCard}>
          <Text style={styles.priceCardTitle}>Price Breakdown</Text>
          
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>
              {selectedRoom.name} x {nights} night{nights > 1 ? 's' : ''}
            </Text>
            <Text style={styles.priceValue}>
              ${selectedRoom.price.amount * nights}
            </Text>
          </View>

          {extras.breakfast && (
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Breakfast</Text>
              <Text style={styles.priceValue}>$25</Text>
            </View>
          )}

          {extras.parking && (
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Parking</Text>
              <Text style={styles.priceValue}>$15</Text>
            </View>
          )}

          <View style={styles.priceDivider} />

          <View style={styles.priceRow}>
            <Text style={styles.priceLabelBold}>Taxes & Fees</Text>
            <Text style={styles.priceValue}>
              ${Math.round(selectedRoom.price.amount * nights * 0.12)}
            </Text>
          </View>

          <View style={[styles.priceRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>
              ${Math.round(selectedRoom.price.amount * nights * 1.12)}
            </Text>
          </View>
        </Animated.View>

        {/* Payment Card - Opens Payment Sheet */}
        <Animated.View entering={FadeInDown.duration(400).delay(300)}>
          <TouchableOpacity
            style={styles.sectionCard}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowPaymentSheet(true);
            }}
          >
            <View style={[styles.sectionIcon, isPaymentComplete && styles.sectionIconComplete]}>
              {isPaymentComplete ? (
                <TickCircle size={20} color={colors.white} variant="Bold" />
              ) : (
                <Card size={20} color={colors.primary} />
              )}
            </View>
            <View style={styles.sectionInfo}>
              <Text style={styles.sectionTitle}>Payment Details</Text>
              <Text style={styles.sectionSubtitle}>
                {isPaymentComplete
                  ? `•••• ${paymentInfo.cardNumber.slice(-4)}`
                  : 'Enter card information'}
              </Text>
            </View>
            <ArrowRight2 size={20} color={colors.gray400} />
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <View style={styles.footerPrice}>
          <Text style={styles.footerLabel}>Total</Text>
          <Text style={styles.footerTotal}>
            ${Math.round(selectedRoom.price.amount * nights * 1.12)}
          </Text>
        </View>
        <TouchableOpacity
          style={[
            styles.confirmButton,
            (isProcessing || !hasGuestInfo || !isPaymentComplete) && styles.confirmButtonDisabled,
          ]}
          onPress={handleConfirmBooking}
          disabled={isProcessing || !hasGuestInfo || !isPaymentComplete}
        >
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.confirmGradient}
          >
            <Text style={styles.confirmText}>
              {isProcessing ? 'Processing...' : hasGuestInfo && isPaymentComplete ? 'Confirm Booking' : 'Complete All Details'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Bottom Sheets */}
      <GuestDetailsSheet
        visible={showGuestSheet}
        onClose={() => setShowGuestSheet(false)}
      />

      <PaymentSheet
        visible={showPaymentSheet}
        onClose={() => setShowPaymentSheet(false)}
        paymentInfo={paymentInfo}
        onSavePayment={setPaymentInfo}
      />

      <HotelBookingSummarySheet
        visible={showSummarySheet}
        onClose={() => setShowSummarySheet(false)}
      />

      {/* Close Confirmation Modal */}
      <CancelBookingModal
        visible={showCloseConfirm}
        onCancel={handleCancelClose}
        onConfirm={handleConfirmClose}
      />
    </View>
  );
}
