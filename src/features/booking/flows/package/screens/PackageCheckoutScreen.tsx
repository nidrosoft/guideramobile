/**
 * PACKAGE CHECKOUT SCREEN
 * 
 * Final screen for package booking - review, traveler details, extras, and payment.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  ArrowLeft,
  CloseCircle,
  Airplane,
  Building,
  Car,
  Map1,
  Profile,
  Shield,
  TickCircle,
  Edit2,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, borderRadius } from '@/styles';
import { usePackageStore } from '../../../stores/usePackageStore';

// Import styles
import { styles } from './PackageCheckoutScreen.styles';

// Import shared components
import { CancelBookingModal } from '../../shared';

interface PackageCheckoutScreenProps {
  onComplete: () => void;
  onBack: () => void;
  onClose: () => void;
}

export default function PackageCheckoutScreen({
  onComplete,
  onBack,
  onClose,
}: PackageCheckoutScreenProps) {
  const insets = useSafeAreaInsets();
  const {
    tripSetup,
    selections,
    pricing,
    extras,
    toggleTravelInsurance,
    calculatePricing,
  } = usePackageStore();
  
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Format date helper
  const formatDate = (date: Date | null): string => {
    if (!date) return '';
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };
  
  const handlePayment = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsProcessing(true);
    
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsProcessing(false);
    onComplete();
  }, [onComplete]);
  
  const handleClose = () => {
    setShowCancelModal(true);
  };
  
  const handleConfirmCancel = () => {
    setShowCancelModal(false);
    onClose();
  };
  
  // Render selection summary card
  const renderSelectionCard = (
    type: 'flight' | 'hotel' | 'car' | 'experience',
    icon: React.ReactNode,
    title: string,
    subtitle: string,
    price: number
  ) => (
    <View style={styles.selectionCard}>
      <View style={styles.selectionIcon}>{icon}</View>
      <View style={styles.selectionInfo}>
        <Text style={styles.selectionTitle}>{title}</Text>
        <Text style={styles.selectionSubtitle}>{subtitle}</Text>
      </View>
      <Text style={styles.selectionPrice}>${price}</Text>
    </View>
  );
  
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
          <ArrowLeft size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Checkout</Text>
        
        <TouchableOpacity style={styles.closeButton} onPress={handleClose} activeOpacity={0.7}>
          <CloseCircle size={24} color={colors.textSecondary} variant="Bold" />
        </TouchableOpacity>
      </View>
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Trip Summary */}
        <Animated.View entering={FadeInDown.duration(300).delay(100)}>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Trip Summary</Text>
              <TouchableOpacity onPress={onBack}>
                <Edit2 size={18} color={colors.primary} />
              </TouchableOpacity>
            </View>
            <View style={styles.tripSummaryCard}>
              <Text style={styles.tripDestination}>
                {tripSetup.origin?.name} → {tripSetup.destination?.name}
              </Text>
              <Text style={styles.tripDates}>
                {formatDate(tripSetup.departureDate)} - {formatDate(tripSetup.returnDate)}
              </Text>
              <Text style={styles.tripTravelers}>
                {tripSetup.travelers.adults + tripSetup.travelers.children} travelers
              </Text>
            </View>
          </View>
        </Animated.View>
        
        {/* Selected Items */}
        <Animated.View entering={FadeInDown.duration(300).delay(150)}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Package</Text>
            
            {/* Flight */}
            {selections.flight.outbound && renderSelectionCard(
              'flight',
              <Airplane size={20} color={colors.primary} variant="Bold" />,
              (selections.flight.outbound as any).segments?.[0]?.airline?.name || 'Flight',
              'Round trip',
              pricing.flight
            )}
            
            {/* Hotel */}
            {selections.hotel.hotel && renderSelectionCard(
              'hotel',
              <Building size={20} color={colors.success} variant="Bold" />,
              selections.hotel.hotel.name,
              selections.hotel.room?.name || 'Standard Room',
              pricing.hotel
            )}
            
            {/* Car */}
            {selections.car && renderSelectionCard(
              'car',
              <Car size={20} color={colors.warning} variant="Bold" />,
              `${selections.car.make} ${selections.car.model}`,
              selections.car.category,
              pricing.car
            )}
            
            {/* Experiences */}
            {selections.experiences.length > 0 && renderSelectionCard(
              'experience',
              <Map1 size={20} color={colors.info} variant="Bold" />,
              `${selections.experiences.length} Experience${selections.experiences.length > 1 ? 's' : ''}`,
              selections.experiences.map(e => e.title).join(', '),
              pricing.experiences
            )}
          </View>
        </Animated.View>
        
        {/* Traveler Details */}
        <Animated.View entering={FadeInDown.duration(300).delay(200)}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Traveler Details</Text>
            <TouchableOpacity style={styles.travelerCard} activeOpacity={0.7}>
              <View style={styles.travelerIcon}>
                <Profile size={20} color={colors.primary} variant="Bold" />
              </View>
              <View style={styles.travelerInfo}>
                <Text style={styles.travelerName}>Lead Traveler</Text>
                <Text style={styles.travelerHint}>Tap to add details</Text>
              </View>
              <Edit2 size={18} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </Animated.View>
        
        {/* Extras */}
        <Animated.View entering={FadeInDown.duration(300).delay(250)}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Travel Protection</Text>
            <TouchableOpacity 
              style={[styles.extraCard, extras.travelInsurance && styles.extraCardSelected]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                toggleTravelInsurance();
                calculatePricing();
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.extraIcon, extras.travelInsurance && styles.extraIconSelected]}>
                <Shield size={20} color={extras.travelInsurance ? colors.white : colors.primary} variant="Bold" />
              </View>
              <View style={styles.extraInfo}>
                <Text style={[styles.extraTitle, extras.travelInsurance && styles.extraTitleSelected]}>
                  Travel Insurance
                </Text>
                <Text style={styles.extraDescription}>
                  Trip cancellation, medical coverage, baggage protection
                </Text>
              </View>
              <View style={styles.extraPrice}>
                <Text style={[styles.extraPriceText, extras.travelInsurance && styles.extraPriceSelected]}>
                  +$49
                </Text>
                {extras.travelInsurance && (
                  <TickCircle size={20} color={colors.primary} variant="Bold" />
                )}
              </View>
            </TouchableOpacity>
          </View>
        </Animated.View>
        
        {/* Pricing Breakdown */}
        <Animated.View entering={FadeInDown.duration(300).delay(300)}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Price Breakdown</Text>
            <View style={styles.pricingCard}>
              {pricing.flight > 0 && (
                <View style={styles.pricingRow}>
                  <Text style={styles.pricingLabel}>Flights</Text>
                  <Text style={styles.pricingValue}>${pricing.flight}</Text>
                </View>
              )}
              {pricing.hotel > 0 && (
                <View style={styles.pricingRow}>
                  <Text style={styles.pricingLabel}>Hotel</Text>
                  <Text style={styles.pricingValue}>${pricing.hotel}</Text>
                </View>
              )}
              {pricing.car > 0 && (
                <View style={styles.pricingRow}>
                  <Text style={styles.pricingLabel}>Car Rental</Text>
                  <Text style={styles.pricingValue}>${pricing.car}</Text>
                </View>
              )}
              {pricing.experiences > 0 && (
                <View style={styles.pricingRow}>
                  <Text style={styles.pricingLabel}>Experiences</Text>
                  <Text style={styles.pricingValue}>${pricing.experiences}</Text>
                </View>
              )}
              {pricing.extras > 0 && (
                <View style={styles.pricingRow}>
                  <Text style={styles.pricingLabel}>Extras</Text>
                  <Text style={styles.pricingValue}>${pricing.extras}</Text>
                </View>
              )}
              
              {/* Bundle Discount */}
              {pricing.bundleDiscount > 0 && (
                <View style={[styles.pricingRow, styles.discountRow]}>
                  <Text style={styles.discountLabel}>Bundle Discount</Text>
                  <Text style={styles.discountValue}>-${pricing.bundleDiscount}</Text>
                </View>
              )}
              
              <View style={styles.pricingDivider} />
              
              <View style={styles.pricingRow}>
                <Text style={styles.pricingLabel}>Taxes & Fees</Text>
                <Text style={styles.pricingValue}>${pricing.taxes + pricing.fees}</Text>
              </View>
              
              <View style={[styles.pricingRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>${pricing.total.toFixed(2)}</Text>
              </View>
              
              {/* Savings Badge */}
              {pricing.savings > 0 && (
                <View style={styles.savingsBadge}>
                  <TickCircle size={16} color={colors.success} variant="Bold" />
                  <Text style={styles.savingsText}>
                    You save ${pricing.savings.toFixed(0)} ({pricing.savingsPercentage.toFixed(0)}% off)
                  </Text>
                </View>
              )}
            </View>
          </View>
        </Animated.View>
      </ScrollView>
      
      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <View style={styles.footerTotal}>
          <Text style={styles.footerTotalLabel}>Total</Text>
          <Text style={styles.footerTotalValue}>${pricing.total.toFixed(2)}</Text>
        </View>
        <TouchableOpacity
          style={[styles.payButton, isProcessing && styles.payButtonDisabled]}
          onPress={handlePayment}
          disabled={isProcessing}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.payButtonGradient}
          >
            <Text style={styles.payButtonText}>
              {isProcessing ? 'Processing...' : 'Pay Now'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
      
      {/* Cancel Modal */}
      <CancelBookingModal
        visible={showCancelModal}
        onCancel={() => setShowCancelModal(false)}
        onConfirm={handleConfirmCancel}
      />
    </View>
  );
}
