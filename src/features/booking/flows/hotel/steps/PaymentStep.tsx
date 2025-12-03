/**
 * HOTEL PAYMENT STEP
 * 
 * Payment form with extras and price breakdown.
 */

import React, { useState, useEffect } from 'react';
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
  Coffee,
  Car,
  Airplane,
  Clock,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, shadows, borderRadius } from '@/styles';
import { useHotelStore } from '../../../stores/useHotelStore';

interface PaymentStepProps {
  onNext: () => void;
  onBack: () => void;
  onClose: () => void;
  stepIndex: number;
  totalSteps: number;
}

const EXTRAS = [
  { id: 'breakfast', name: 'Breakfast', icon: Coffee, price: 25, unit: '/person/night' },
  { id: 'parking', name: 'Parking', icon: Car, price: 20, unit: '/night' },
  { id: 'airportTransfer', name: 'Airport Transfer', icon: Airplane, price: 50, unit: 'one-time' },
  { id: 'earlyCheckIn', name: 'Early Check-in', icon: Clock, price: 30, unit: 'one-time' },
  { id: 'lateCheckOut', name: 'Late Check-out', icon: Clock, price: 30, unit: 'one-time' },
];

export default function PaymentStep({
  onNext,
  onBack,
  onClose,
  stepIndex,
  totalSteps,
}: PaymentStepProps) {
  const insets = useSafeAreaInsets();
  const {
    selectedHotel,
    selectedRoom,
    extras,
    priceBreakdown,
    toggleBreakfast,
    toggleParking,
    toggleAirportTransfer,
    toggleEarlyCheckIn,
    toggleLateCheckOut,
    calculatePrice,
    setBookingReference,
    setBookingConfirmed,
    getNights,
  } = useHotelStore();
  
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const nights = getNights();
  
  // Calculate price when extras change
  useEffect(() => {
    calculatePrice();
  }, [extras, selectedRoom]);
  
  const toggleExtra = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    switch (id) {
      case 'breakfast': toggleBreakfast(); break;
      case 'parking': toggleParking(); break;
      case 'airportTransfer': toggleAirportTransfer(); break;
      case 'earlyCheckIn': toggleEarlyCheckIn(); break;
      case 'lateCheckOut': toggleLateCheckOut(); break;
    }
  };
  
  const isExtraSelected = (id: string): boolean => {
    return extras[id as keyof typeof extras] || false;
  };
  
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
    
    const reference = 'GH' + Math.random().toString(36).substring(2, 8).toUpperCase();
    setBookingReference(reference);
    setBookingConfirmed(true);
    
    setIsProcessing(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onNext();
  };
  
  if (!selectedHotel || !selectedRoom) return null;
  
  const total = priceBreakdown?.total || 0;
  
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
          {/* Extras */}
          <Animated.View 
            entering={FadeInDown.duration(400).delay(100)}
            style={styles.section}
          >
            <Text style={styles.sectionTitle}>Add Extras</Text>
            <Text style={styles.sectionSubtitle}>Enhance your stay</Text>
            
            {EXTRAS.map((extra) => {
              const Icon = extra.icon;
              const isSelected = isExtraSelected(extra.id);
              
              // Skip breakfast if already included
              if (extra.id === 'breakfast' && selectedRoom.breakfast === 'included') {
                return null;
              }
              
              return (
                <TouchableOpacity
                  key={extra.id}
                  style={[styles.extraItem, isSelected && styles.extraItemSelected]}
                  onPress={() => toggleExtra(extra.id)}
                >
                  <View style={[styles.extraIcon, isSelected && styles.extraIconSelected]}>
                    <Icon size={20} color={isSelected ? colors.white : colors.primary} />
                  </View>
                  <View style={styles.extraInfo}>
                    <Text style={styles.extraName}>{extra.name}</Text>
                    <Text style={styles.extraPrice}>
                      +${extra.price} {extra.unit}
                    </Text>
                  </View>
                  <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                    {isSelected && <TickCircle size={20} color={colors.white} variant="Bold" />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </Animated.View>
          
          {/* Payment Method */}
          <Animated.View 
            entering={FadeInDown.duration(400).delay(150)}
            style={styles.section}
          >
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
          
          {/* Price Breakdown */}
          <Animated.View 
            entering={FadeInDown.duration(400).delay(200)}
            style={styles.section}
          >
            <Text style={styles.sectionTitle}>Price Summary</Text>
            
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>
                {selectedRoom.name} × {nights} night{nights > 1 ? 's' : ''}
              </Text>
              <Text style={styles.priceValue}>${priceBreakdown?.basePrice || 0}</Text>
            </View>
            
            {(priceBreakdown?.extras || 0) > 0 && (
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Extras</Text>
                <Text style={styles.priceValue}>${priceBreakdown?.extras}</Text>
              </View>
            )}
            
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Taxes & Fees</Text>
              <Text style={styles.priceValue}>
                ${((priceBreakdown?.taxes || 0) + (priceBreakdown?.fees || 0)).toFixed(2)}
              </Text>
            </View>
            
            <View style={styles.priceDivider} />
            
            <View style={styles.priceRowTotal}>
              <Text style={styles.priceLabelTotal}>Total</Text>
              <Text style={styles.priceValueTotal}>${total.toFixed(2)}</Text>
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
          <Text style={styles.footerPriceAmount}>${total.toFixed(2)}</Text>
        </View>
        
        <TouchableOpacity
          style={[
            styles.payButton,
            (!isFormValid() || isProcessing) && styles.payButtonDisabled,
          ]}
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
                <Text style={styles.payButtonText}>Pay ${total.toFixed(2)}</Text>
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
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  
  // Extras
  extraItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.gray50,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  extraItemSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  extraIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  extraIconSelected: {
    backgroundColor: colors.primary,
  },
  extraInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  extraName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  extraPrice: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.gray300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  
  // Inputs
  inputGroup: {
    marginBottom: spacing.md,
  },
  inputRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  inputHalf: {
    flex: 1,
  },
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
  
  // Price
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
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.medium,
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
    fontSize: typography.fontSize.xl,
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
