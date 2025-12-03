/**
 * CAR PAYMENT STEP
 * 
 * Full price breakdown and secure checkout.
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
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Card, Lock, TickCircle, InfoCircle } from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, shadows, borderRadius } from '@/styles';
import { useCarStore } from '../../../stores/useCarStore';

interface PaymentStepProps {
  onNext: () => void;
  onBack: () => void;
  onClose: () => void;
}

export default function PaymentStep({ onNext, onBack, onClose }: PaymentStepProps) {
  const insets = useSafeAreaInsets();
  const {
    selectedCar,
    pricing,
    getRentalDays,
    selectedProtection,
    selectedExtras,
    searchParams,
    setBookingReference,
    confirmBooking,
  } = useCarStore();
  
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const rentalDays = getRentalDays();
  
  const formatCardNumber = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    const formatted = cleaned.replace(/(\d{4})/g, '$1 ').trim();
    return formatted.substring(0, 19);
  };
  
  const formatExpiry = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return `${cleaned.substring(0, 2)}/${cleaned.substring(2, 4)}`;
    }
    return cleaned;
  };
  
  const isFormValid = () => {
    return (
      cardNumber.replace(/\s/g, '').length === 16 &&
      expiry.length === 5 &&
      cvv.length >= 3 &&
      cardName.trim().length >= 2
    );
  };
  
  const handlePayment = async () => {
    if (!isFormValid()) return;
    
    setIsProcessing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    // Generate booking reference
    const ref = 'CR' + Math.random().toString(36).substring(2, 8).toUpperCase();
    setBookingReference(ref);
    confirmBooking();
    
    setIsProcessing(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onNext();
  };
  
  return (
    <View style={styles.container}>
      {/* Security Badge */}
      <Animated.View entering={FadeInDown.duration(400)} style={styles.securityBadge}>
        <Lock size={16} color={colors.success} variant="Bold" />
        <Text style={styles.securityText}>Secure 256-bit SSL encryption</Text>
      </Animated.View>
      
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 120 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Price Breakdown */}
          <Animated.View entering={FadeInDown.duration(400).delay(100)} style={styles.section}>
            <Text style={styles.sectionTitle}>Price Summary</Text>
            
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>
                {selectedCar?.name || 'Car rental'} ({rentalDays} days)
              </Text>
              <Text style={styles.priceValue}>${pricing.baseRate.toFixed(2)}</Text>
            </View>
            
            {pricing.protectionCost > 0 && (
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>
                  {selectedProtection?.name} Protection
                </Text>
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
            
            <View style={styles.priceRowTotal}>
              <Text style={styles.priceLabelTotal}>Total</Text>
              <Text style={styles.priceValueTotal}>${pricing.total.toFixed(2)}</Text>
            </View>
          </Animated.View>
          
          {/* Deposit Notice */}
          <Animated.View entering={FadeInDown.duration(400).delay(150)} style={styles.depositCard}>
            <InfoCircle size={18} color={colors.info} />
            <View style={styles.depositContent}>
              <Text style={styles.depositTitle}>Security Deposit</Text>
              <Text style={styles.depositText}>
                A hold of ${selectedCar?.rental.deposit || 200} will be placed on your credit card at pickup. 
                This will be released when you return the car.
              </Text>
            </View>
          </Animated.View>
          
          {/* Payment Method */}
          <Animated.View entering={FadeInDown.duration(400).delay(200)} style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Details</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Card Number</Text>
              <View style={styles.cardInput}>
                <Card size={20} color={colors.gray400} />
                <TextInput
                  style={styles.cardInputText}
                  placeholder="1234 5678 9012 3456"
                  placeholderTextColor={colors.gray400}
                  value={cardNumber}
                  onChangeText={(text) => setCardNumber(formatCardNumber(text))}
                  keyboardType="number-pad"
                  maxLength={19}
                />
              </View>
            </View>
            
            <View style={styles.inputRow}>
              <View style={styles.inputHalf}>
                <Text style={styles.inputLabel}>Expiry</Text>
                <TextInput
                  style={styles.input}
                  placeholder="MM/YY"
                  placeholderTextColor={colors.gray400}
                  value={expiry}
                  onChangeText={(text) => setExpiry(formatExpiry(text))}
                  keyboardType="number-pad"
                  maxLength={5}
                />
              </View>
              <View style={styles.inputHalf}>
                <Text style={styles.inputLabel}>CVV</Text>
                <TextInput
                  style={styles.input}
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
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Cardholder Name</Text>
              <TextInput
                style={styles.input}
                placeholder="John Doe"
                placeholderTextColor={colors.gray400}
                value={cardName}
                onChangeText={setCardName}
                autoCapitalize="words"
              />
            </View>
          </Animated.View>
          
          {/* Terms */}
          <Animated.View entering={FadeInDown.duration(400).delay(250)} style={styles.termsCard}>
            <TickCircle size={16} color={colors.success} variant="Bold" />
            <Text style={styles.termsText}>
              By completing this booking, you agree to the rental terms and conditions, 
              including the cancellation policy.
            </Text>
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
          <Text style={styles.footerPriceAmount}>${pricing.total.toFixed(2)}</Text>
        </View>
        
        <TouchableOpacity
          style={[styles.payButton, (!isFormValid() || isProcessing) && styles.payButtonDisabled]}
          onPress={handlePayment}
          activeOpacity={0.8}
          disabled={isProcessing || !isFormValid()}
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
                <Text style={styles.payButtonText}>Pay ${pricing.total.toFixed(2)}</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
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
  keyboardView: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { padding: spacing.lg },
  
  // Section
  section: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  
  // Price
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  priceLabel: { fontSize: typography.fontSize.sm, color: colors.textSecondary },
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
  priceRowTotal: { flexDirection: 'row', justifyContent: 'space-between' },
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
  
  // Deposit
  depositCard: {
    flexDirection: 'row',
    backgroundColor: colors.info + '10',
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  depositContent: { flex: 1 },
  depositTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.info,
    marginBottom: 4,
  },
  depositText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  
  // Inputs
  inputGroup: { marginBottom: spacing.md },
  inputRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  inputHalf: { flex: 1 },
  inputLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.gray50,
    borderRadius: 16,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  cardInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray50,
    borderRadius: 16,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  cardInputText: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
  
  // Terms
  termsCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
  },
  termsText: {
    flex: 1,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    lineHeight: 18,
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
  footerPrice: { flex: 1 },
  footerPriceLabel: { fontSize: typography.fontSize.xs, color: colors.textSecondary },
  footerPriceAmount: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  payButton: { borderRadius: borderRadius.xl, overflow: 'hidden' },
  payButtonDisabled: { opacity: 0.7 },
  payButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  payButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
});
