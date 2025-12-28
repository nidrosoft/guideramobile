/**
 * CAR CHECKOUT SCREEN
 * 
 * Combined checkout with car details, protection, extras, driver, and payment.
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
  Location,
  Calendar,
  Shield,
  Add,
  User,
  Card,
  TickCircle,
  ArrowRight2,
  Edit2,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing } from '@/styles';
import { useCarStore } from '../../../stores/useCarStore';
import { styles } from './CarCheckoutScreen.styles';
import { Car } from '../../../types/car.types';

// Import sheets
import ProtectionSheet from '../sheets/ProtectionSheet';
import ExtrasSheet from '../sheets/ExtrasSheet';
import DriverDetailsSheet from '../sheets/DriverDetailsSheet';
import PaymentSheet, { PaymentData } from '../sheets/PaymentSheet';

// Import shared components
import { CancelBookingModal } from '../../shared';

interface CarCheckoutScreenProps {
  car: Car;
  onConfirm: () => void;
  onBack: () => void;
  onClose: () => void;
}

export default function CarCheckoutScreen({
  car,
  onConfirm,
  onBack,
  onClose,
}: CarCheckoutScreenProps) {
  const insets = useSafeAreaInsets();
  const {
    searchParams,
    selectedProtection,
    selectedExtras,
    primaryDriver,
    pricing,
    getRentalDays,
    calculatePricing,
  } = useCarStore();

  // Sheet visibility
  const [showProtectionSheet, setShowProtectionSheet] = useState(false);
  const [showExtrasSheet, setShowExtrasSheet] = useState(false);
  const [showDriverSheet, setShowDriverSheet] = useState(false);
  const [showPaymentSheet, setShowPaymentSheet] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  // Payment data
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const rentalDays = getRentalDays();

  // Recalculate pricing when component mounts
  React.useEffect(() => {
    calculatePricing();
  }, []);

  const formatDate = (date: Date | null): string => {
    if (!date) return '';
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const formatTime = (time: string): string => {
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const isDriverComplete = () => {
    return primaryDriver && 
      primaryDriver.firstName && 
      primaryDriver.lastName && 
      primaryDriver.email && 
      primaryDriver.licenseNumber;
  };

  const isPaymentComplete = () => {
    return paymentData !== null;
  };

  const canConfirm = isDriverComplete() && isPaymentComplete();

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

  const handleClose = () => {
    setShowCancelModal(true);
  };

  const extrasCount = selectedExtras.reduce((sum, e) => sum + e.quantity, 0);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      {/* Header with Background Image */}
      <ImageBackground
        source={require('../../../../../../assets/images/carbg.png')}
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
        {/* Car Summary */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.section}>
          <View style={styles.carSummary}>
            <View style={styles.carImageContainer}>
              {car.images?.[0] ? (
                <Image source={{ uri: car.images[0] }} style={styles.carImage} resizeMode="contain" />
              ) : (
                <View style={styles.carImagePlaceholder}>
                  <Text style={styles.carImagePlaceholderText}>{car.make}</Text>
                </View>
              )}
            </View>
            <View style={styles.carInfo}>
              <Text style={styles.carName}>{car.name}</Text>
              <Text style={styles.carCategory}>or similar {car.category}</Text>
              <Text style={styles.carCompany}>{car.rental.company.name}</Text>
            </View>
          </View>
        </Animated.View>

        {/* Rental Details */}
        <Animated.View entering={FadeInDown.duration(400).delay(100)} style={styles.section}>
          <Text style={styles.sectionTitle}>Rental Details</Text>
          <View style={styles.rentalCard}>
            <View style={styles.rentalRow}>
              <View style={styles.rentalItem}>
                <View style={[styles.rentalIcon, { backgroundColor: `${colors.primary}15` }]}>
                  <Location size={16} color={colors.primary} variant="Bold" />
                </View>
                <View>
                  <Text style={styles.rentalLabel}>Pickup</Text>
                  <Text style={styles.rentalValue}>{searchParams.pickupLocation?.name}</Text>
                  <Text style={styles.rentalDate}>
                    {formatDate(searchParams.pickupDate)} at {formatTime(searchParams.pickupTime)}
                  </Text>
                </View>
              </View>
            </View>
            <View style={styles.rentalDivider} />
            <View style={styles.rentalRow}>
              <View style={styles.rentalItem}>
                <View style={[styles.rentalIcon, { backgroundColor: `${colors.success}15` }]}>
                  <Location size={16} color={colors.success} variant="Bold" />
                </View>
                <View>
                  <Text style={styles.rentalLabel}>Return</Text>
                  <Text style={styles.rentalValue}>
                    {searchParams.sameReturnLocation 
                      ? searchParams.pickupLocation?.name 
                      : searchParams.returnLocation?.name}
                  </Text>
                  <Text style={styles.rentalDate}>
                    {formatDate(searchParams.returnDate)} at {formatTime(searchParams.returnTime)}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Protection */}
        <Animated.View entering={FadeInDown.duration(400).delay(150)} style={styles.section}>
          <TouchableOpacity 
            style={styles.optionCard}
            onPress={() => setShowProtectionSheet(true)}
          >
            <View style={[styles.optionIcon, { backgroundColor: `${colors.warning}15` }]}>
              <Shield size={20} color={colors.warning} variant="Bold" />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Protection Package</Text>
              <Text style={styles.optionValue}>
                {selectedProtection?.name || 'Basic'} 
                {selectedProtection?.pricePerDay ? ` (+$${selectedProtection.pricePerDay}/day)` : ' (Included)'}
              </Text>
            </View>
            <ArrowRight2 size={20} color={colors.gray400} />
          </TouchableOpacity>
        </Animated.View>

        {/* Extras */}
        <Animated.View entering={FadeInDown.duration(400).delay(200)} style={styles.section}>
          <TouchableOpacity 
            style={styles.optionCard}
            onPress={() => setShowExtrasSheet(true)}
          >
            <View style={[styles.optionIcon, { backgroundColor: `${colors.primary}15` }]}>
              <Add size={20} color={colors.primary} />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Extras & Add-ons</Text>
              <Text style={styles.optionValue}>
                {extrasCount > 0 ? `${extrasCount} item${extrasCount > 1 ? 's' : ''} selected` : 'None selected'}
              </Text>
            </View>
            <ArrowRight2 size={20} color={colors.gray400} />
          </TouchableOpacity>
        </Animated.View>

        {/* Driver Details */}
        <Animated.View entering={FadeInDown.duration(400).delay(250)} style={styles.section}>
          <TouchableOpacity 
            style={[styles.optionCard, !isDriverComplete() && styles.optionCardRequired]}
            onPress={() => setShowDriverSheet(true)}
          >
            <View style={[
              styles.optionIcon, 
              { backgroundColor: isDriverComplete() ? `${colors.success}15` : `${colors.error}15` }
            ]}>
              <User size={20} color={isDriverComplete() ? colors.success : colors.error} variant="Bold" />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Driver Details</Text>
              <Text style={[styles.optionValue, !isDriverComplete() && styles.optionValueRequired]}>
                {isDriverComplete() 
                  ? `${primaryDriver?.firstName} ${primaryDriver?.lastName}`
                  : 'Required - Tap to add'}
              </Text>
            </View>
            {isDriverComplete() ? (
              <Edit2 size={20} color={colors.gray400} />
            ) : (
              <ArrowRight2 size={20} color={colors.error} />
            )}
          </TouchableOpacity>
        </Animated.View>

        {/* Price Breakdown */}
        <Animated.View entering={FadeInDown.duration(400).delay(300)} style={styles.section}>
          <Text style={styles.sectionTitle}>Price Summary</Text>
          <View style={styles.priceCard}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>{car.name} ({rentalDays} days)</Text>
              <Text style={styles.priceValue}>${pricing.baseRate.toFixed(2)}</Text>
            </View>
            {pricing.protectionCost > 0 && (
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>{selectedProtection?.name} Protection</Text>
                <Text style={styles.priceValue}>${pricing.protectionCost.toFixed(2)}</Text>
              </View>
            )}
            {pricing.extrasCost > 0 && (
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Extras & Add-ons</Text>
                <Text style={styles.priceValue}>${pricing.extrasCost.toFixed(2)}</Text>
              </View>
            )}
            {pricing.airportFee > 0 && (
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Airport surcharge</Text>
                <Text style={styles.priceValue}>${pricing.airportFee.toFixed(2)}</Text>
              </View>
            )}
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Taxes & fees</Text>
              <Text style={styles.priceValue}>${pricing.taxes.toFixed(2)}</Text>
            </View>
            <View style={styles.priceDivider} />
            <View style={styles.priceRow}>
              <Text style={styles.priceTotalLabel}>Total</Text>
              <Text style={styles.priceTotalValue}>${pricing.total.toFixed(2)}</Text>
            </View>
          </View>
        </Animated.View>

        {/* Payment Details */}
        <Animated.View entering={FadeInDown.duration(400).delay(350)} style={styles.section}>
          <Text style={styles.sectionTitle}>Payment</Text>
          <TouchableOpacity
            style={[styles.optionCard, !isPaymentComplete() && styles.optionCardRequired]}
            onPress={() => setShowPaymentSheet(true)}
          >
            <View style={[
              styles.optionIcon, 
              { backgroundColor: isPaymentComplete() ? `${colors.success}15` : `${colors.error}15` }
            ]}>
              <Card size={20} color={isPaymentComplete() ? colors.success : colors.error} variant="Bold" />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Payment Details</Text>
              <Text style={[styles.optionValue, !isPaymentComplete() && styles.optionValueRequired]}>
                {isPaymentComplete() 
                  ? `•••• •••• •••• ${paymentData?.cardNumber.slice(-4)}`
                  : 'Required - Tap to add'}
              </Text>
            </View>
            {isPaymentComplete() ? (
              <Edit2 size={20} color={colors.gray400} />
            ) : (
              <ArrowRight2 size={20} color={colors.error} />
            )}
          </TouchableOpacity>
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
          {isProcessing ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <>
              <TickCircle size={20} color={colors.white} variant="Bold" />
              <Text style={styles.confirmButtonText}>Confirm Booking</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Sheets */}
      <ProtectionSheet
        visible={showProtectionSheet}
        onClose={() => setShowProtectionSheet(false)}
      />

      <ExtrasSheet
        visible={showExtrasSheet}
        onClose={() => setShowExtrasSheet(false)}
      />

      <DriverDetailsSheet
        visible={showDriverSheet}
        onClose={() => setShowDriverSheet(false)}
      />

      <PaymentSheet
        visible={showPaymentSheet}
        onClose={() => setShowPaymentSheet(false)}
        onSave={setPaymentData}
        initialData={paymentData || undefined}
      />

      {/* Cancel Modal */}
      <CancelBookingModal
        visible={showCancelModal}
        onCancel={() => setShowCancelModal(false)}
        onConfirm={() => {
          setShowCancelModal(false);
          onClose();
        }}
        title="Cancel Car Booking?"
        message="Are you sure you want to cancel? Your car selection and details will be lost."
      />
    </View>
  );
}
