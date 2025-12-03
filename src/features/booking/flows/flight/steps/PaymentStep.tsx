/**
 * PAYMENT STEP
 * 
 * Payment form with card input and price summary.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';
import {
  Card,
  Lock,
  TickCircle,
  Shield,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, shadows, borderRadius } from '@/styles';
import { useFlightStore } from '../../../stores/useFlightStore';
import PriceBreakdown from '../../../components/shared/PriceBreakdown';

interface PaymentStepProps {
  onNext: () => void;
  onBack: () => void;
  onClose: () => void;
  stepIndex: number;
  totalSteps: number;
}

export default function PaymentStep({
  onNext,
  onBack,
  onClose,
  stepIndex,
  totalSteps,
}: PaymentStepProps) {
  const insets = useSafeAreaInsets();
  const { 
    selectedOutboundFlight, 
    searchParams, 
    selectedSeats,
    extras,
    calculatePrice,
    priceBreakdown,
    setBookingReference,
    setBookingConfirmed,
  } = useFlightStore();
  
  // Card form state
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [promoCode, setPromoCode] = useState('');
  
  // Payment state
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'card' | 'apple' | 'google'>('card');
  
  // Calculate price on mount
  React.useEffect(() => {
    calculatePrice();
  }, []);
  
  const totalPassengers = searchParams.passengers.adults + searchParams.passengers.children;
  
  // Calculate total
  const basePrice = selectedOutboundFlight ? selectedOutboundFlight.price.amount * totalPassengers : 0;
  const seatPrice = selectedSeats.outbound.reduce((sum, s) => sum + s.seat.price, 0);
  const extrasPrice = extras.baggage.reduce((sum, b) => sum + b.price, 0) * totalPassengers;
  const insurancePrice = extras.insurance ? extras.insurance.price * totalPassengers : 0;
  const taxes = Math.round(basePrice * 0.12);
  const total = basePrice + seatPrice + extrasPrice + insurancePrice + taxes;
  
  const formatCardNumber = (value: string): string => {
    const cleaned = value.replace(/\D/g, '');
    const groups = cleaned.match(/.{1,4}/g);
    return groups ? groups.join(' ').substring(0, 19) : cleaned;
  };
  
  const formatExpiry = (value: string): string => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return cleaned.substring(0, 2) + '/' + cleaned.substring(2, 4);
    }
    return cleaned;
  };
  
  const isFormValid = (): boolean => {
    if (selectedPaymentMethod !== 'card') return true;
    
    return (
      cardNumber.replace(/\s/g, '').length === 16 &&
      cardName.trim().length > 0 &&
      expiry.length === 5 &&
      cvv.length >= 3
    );
  };
  
  const handlePayment = async () => {
    if (!isFormValid()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsProcessing(true);
    
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    // Generate booking reference
    const reference = 'GD' + Math.random().toString(36).substring(2, 8).toUpperCase();
    setBookingReference(reference);
    setBookingConfirmed(true);
    
    setIsProcessing(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onNext();
  };
  
  const getCardBrand = (): string => {
    const number = cardNumber.replace(/\s/g, '');
    if (number.startsWith('4')) return 'Visa';
    if (number.startsWith('5')) return 'Mastercard';
    if (number.startsWith('3')) return 'Amex';
    return '';
  };
  
  return (
    <View style={styles.container}>
      {/* Security Badge */}
      <Animated.View 
        entering={FadeInDown.duration(400)}
        style={styles.securityBadge}
      >
        <Lock size={16} color={colors.success} variant="Bold" />
        <Text style={styles.securityText}>Secure 256-bit SSL encryption</Text>
      </Animated.View>
      
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 120 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Payment Methods */}
          <Animated.View 
            entering={FadeInDown.duration(400).delay(100)}
            style={styles.section}
          >
            <Text style={styles.sectionTitle}>Payment Method</Text>
            
            <View style={styles.paymentMethods}>
              <TouchableOpacity
                style={[
                  styles.paymentMethod,
                  selectedPaymentMethod === 'card' && styles.paymentMethodSelected,
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedPaymentMethod('card');
                }}
              >
                <Card size={24} color={selectedPaymentMethod === 'card' ? colors.primary : colors.gray400} />
                <Text style={[
                  styles.paymentMethodText,
                  selectedPaymentMethod === 'card' && styles.paymentMethodTextSelected,
                ]}>
                  Card
                </Text>
                {selectedPaymentMethod === 'card' && (
                  <TickCircle size={18} color={colors.primary} variant="Bold" />
                )}
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.paymentMethod,
                  selectedPaymentMethod === 'apple' && styles.paymentMethodSelected,
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedPaymentMethod('apple');
                }}
              >
                <Text style={styles.applePayIcon}></Text>
                <Text style={[
                  styles.paymentMethodText,
                  selectedPaymentMethod === 'apple' && styles.paymentMethodTextSelected,
                ]}>
                  Apple Pay
                </Text>
                {selectedPaymentMethod === 'apple' && (
                  <TickCircle size={18} color={colors.primary} variant="Bold" />
                )}
              </TouchableOpacity>
            </View>
          </Animated.View>
          
          {/* Card Form */}
          {selectedPaymentMethod === 'card' && (
            <Animated.View 
              entering={FadeInDown.duration(400).delay(150)}
              style={styles.cardForm}
            >
              {/* Card Preview */}
              <LinearGradient
                colors={[colors.gray800, colors.gray900]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardPreview}
              >
                <View style={styles.cardPreviewHeader}>
                  <Text style={styles.cardBrand}>{getCardBrand() || 'Credit Card'}</Text>
                  <Shield size={24} color={colors.white} />
                </View>
                <Text style={styles.cardPreviewNumber}>
                  {cardNumber || '•••• •••• •••• ••••'}
                </Text>
                <View style={styles.cardPreviewFooter}>
                  <View>
                    <Text style={styles.cardPreviewLabel}>Card Holder</Text>
                    <Text style={styles.cardPreviewValue}>
                      {cardName || 'YOUR NAME'}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.cardPreviewLabel}>Expires</Text>
                    <Text style={styles.cardPreviewValue}>
                      {expiry || 'MM/YY'}
                    </Text>
                  </View>
                </View>
              </LinearGradient>
              
              {/* Card Number */}
              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Card Number</Text>
                <View style={styles.inputWithIcon}>
                  <Card size={20} color={colors.gray400} />
                  <TextInput
                    style={styles.textInputWithIcon}
                    placeholder="1234 5678 9012 3456"
                    placeholderTextColor={colors.gray400}
                    value={cardNumber}
                    onChangeText={(value) => setCardNumber(formatCardNumber(value))}
                    keyboardType="number-pad"
                    maxLength={19}
                  />
                </View>
              </View>
              
              {/* Card Name */}
              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Cardholder Name</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="John Doe"
                  placeholderTextColor={colors.gray400}
                  value={cardName}
                  onChangeText={setCardName}
                  autoCapitalize="words"
                />
              </View>
              
              {/* Expiry & CVV */}
              <View style={styles.formRow}>
                <View style={styles.formFieldHalf}>
                  <Text style={styles.fieldLabel}>Expiry Date</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="MM/YY"
                    placeholderTextColor={colors.gray400}
                    value={expiry}
                    onChangeText={(value) => setExpiry(formatExpiry(value))}
                    keyboardType="number-pad"
                    maxLength={5}
                  />
                </View>
                
                <View style={styles.formFieldHalf}>
                  <Text style={styles.fieldLabel}>CVV</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="123"
                    placeholderTextColor={colors.gray400}
                    value={cvv}
                    onChangeText={setCvv}
                    keyboardType="number-pad"
                    maxLength={4}
                    secureTextEntry
                  />
                </View>
              </View>
            </Animated.View>
          )}
          
          {/* Promo Code */}
          <Animated.View 
            entering={FadeInDown.duration(400).delay(200)}
            style={styles.promoSection}
          >
            <Text style={styles.sectionTitle}>Promo Code</Text>
            <View style={styles.promoInputContainer}>
              <TextInput
                style={styles.promoInput}
                placeholder="Enter promo code"
                placeholderTextColor={colors.gray400}
                value={promoCode}
                onChangeText={setPromoCode}
                autoCapitalize="characters"
              />
              <TouchableOpacity style={styles.promoApplyButton}>
                <Text style={styles.promoApplyText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
          
          {/* Price Summary */}
          <Animated.View 
            entering={FadeInDown.duration(400).delay(250)}
            style={styles.priceSummary}
          >
            <Text style={styles.sectionTitle}>Price Summary</Text>
            
            <View style={styles.priceCard}>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>
                  Flight ({totalPassengers} passenger{totalPassengers > 1 ? 's' : ''})
                </Text>
                <Text style={styles.priceValue}>${basePrice}</Text>
              </View>
              
              {seatPrice > 0 && (
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Seat Selection</Text>
                  <Text style={styles.priceValue}>${seatPrice}</Text>
                </View>
              )}
              
              {extrasPrice > 0 && (
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Extras</Text>
                  <Text style={styles.priceValue}>${extrasPrice}</Text>
                </View>
              )}
              
              {insurancePrice > 0 && (
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Travel Protection</Text>
                  <Text style={styles.priceValue}>${insurancePrice}</Text>
                </View>
              )}
              
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Taxes & Fees</Text>
                <Text style={styles.priceValue}>${taxes}</Text>
              </View>
              
              <View style={styles.priceDivider} />
              
              <View style={styles.priceRowTotal}>
                <Text style={styles.priceLabelTotal}>Total</Text>
                <Text style={styles.priceValueTotal}>${total}</Text>
              </View>
            </View>
          </Animated.View>
          
        </ScrollView>
      </KeyboardAvoidingView>
      
      {/* Footer */}
      <Animated.View 
        entering={FadeInUp.duration(400).delay(300)}
        style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}
      >
        <View style={styles.footerPrice}>
          <Text style={styles.footerPriceLabel}>Total</Text>
          <Text style={styles.footerPriceAmount}>${total}</Text>
        </View>
        
        <TouchableOpacity
          style={[
            styles.payButton,
            (!isFormValid() || isProcessing) && styles.payButtonDisabled,
          ]}
          onPress={handlePayment}
          activeOpacity={0.8}
          disabled={isProcessing}
        >
          <LinearGradient
            colors={isFormValid() && !isProcessing ? [colors.primary, colors.primaryDark] : [colors.gray300, colors.gray400]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.payButtonGradient}
          >
            {isProcessing ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <>
                <Lock size={18} color={colors.white} />
                <Text style={styles.payButtonText}>Pay ${total}</Text>
              </>
            )}
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
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    backgroundColor: colors.success + '10',
    borderBottomWidth: 1,
    borderBottomColor: colors.success + '20',
  },
  securityText: {
    fontSize: typography.fontSize.xs,
    color: colors.success,
    fontWeight: typography.fontWeight.medium,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  
  // Section
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  
  // Payment Methods
  paymentMethods: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  paymentMethod: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.xl,
    gap: spacing.sm,
    borderWidth: 2,
    borderColor: colors.gray200,
    ...shadows.sm,
  },
  paymentMethodSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '08',
  },
  paymentMethodText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
  },
  paymentMethodTextSelected: {
    color: colors.primary,
  },
  applePayIcon: {
    fontSize: 20,
  },
  
  // Card Form
  cardForm: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.card,
  },
  cardPreview: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    aspectRatio: 1.6,
  },
  cardPreviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  cardBrand: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
  cardPreviewNumber: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
    letterSpacing: 2,
    marginBottom: spacing.xl,
  },
  cardPreviewFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardPreviewLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.gray400,
    marginBottom: 2,
  },
  cardPreviewValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.white,
    textTransform: 'uppercase',
  },
  formField: {
    marginBottom: spacing.md,
  },
  formRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  formFieldHalf: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  textInput: {
    backgroundColor: colors.gray50,
    borderRadius: 16,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray50,
    borderRadius: 16,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  textInputWithIcon: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
  
  // Promo
  promoSection: {
    marginBottom: spacing.lg,
  },
  promoInputContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  promoInput: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 16,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  promoApplyButton: {
    backgroundColor: colors.primary + '15',
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
  },
  promoApplyText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
  },
  
  // Price Summary
  priceSummary: {
    marginBottom: spacing.lg,
  },
  priceCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    ...shadows.card,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  priceLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  priceValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  priceDivider: {
    height: 1,
    backgroundColor: colors.gray200,
    marginVertical: spacing.md,
  },
  priceRowTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priceLabelTotal: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  priceValueTotal: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerPrice: {
    flex: 1,
  },
  footerPriceLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  footerPriceAmount: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  payButton: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  payButtonDisabled: {
    opacity: 0.7,
  },
  payButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  payButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
});
