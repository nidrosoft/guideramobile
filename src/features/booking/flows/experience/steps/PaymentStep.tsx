/**
 * EXPERIENCE PAYMENT STEP
 * 
 * Collect contact info and payment details.
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
import {
  User,
  Sms,
  Call,
  Card,
  Calendar,
  Lock,
  TickCircle,
  Shield,
  Clock,
  People,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, shadows, borderRadius } from '@/styles';
import { useExperienceStore } from '../../../stores/useExperienceStore';
import { CANCELLATION_POLICY_LABELS } from '../../../types/experience.types';

interface PaymentStepProps {
  onNext: () => void;
  onBack: () => void;
  onClose: () => void;
}

export default function PaymentStep({ onNext, onBack, onClose }: PaymentStepProps) {
  const insets = useSafeAreaInsets();
  const {
    selectedExperience,
    selectedDate,
    selectedTimeSlot,
    searchParams,
    leadTraveler,
    setLeadTraveler,
    specialRequests,
    setSpecialRequests,
    pricing,
    setBookingReference,
    confirmBooking,
  } = useExperienceStore();
  
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  if (!selectedExperience || !selectedTimeSlot) return null;
  
  const experience = selectedExperience;
  const { adults, children, infants } = searchParams.participants;
  
  const formatDate = (date: Date | null): string => {
    if (!date) return '';
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };
  
  const formatCardNumber = (value: string): string => {
    const cleaned = value.replace(/\D/g, '');
    const groups = cleaned.match(/.{1,4}/g);
    return groups ? groups.join(' ').substring(0, 19) : cleaned;
  };
  
  const formatExpiryDate = (value: string): string => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return `${cleaned.substring(0, 2)}/${cleaned.substring(2, 4)}`;
    }
    return cleaned;
  };
  
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!leadTraveler.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!leadTraveler.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    if (!leadTraveler.email.trim() || !leadTraveler.email.includes('@')) {
      newErrors.email = 'Valid email is required';
    }
    if (!leadTraveler.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }
    if (cardNumber.replace(/\s/g, '').length < 16) {
      newErrors.cardNumber = 'Valid card number is required';
    }
    if (expiryDate.length < 5) {
      newErrors.expiryDate = 'Valid expiry date is required';
    }
    if (cvv.length < 3) {
      newErrors.cvv = 'Valid CVV is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handlePayment = async () => {
    if (!validateForm()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    
    setIsProcessing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    // Generate booking reference
    const reference = `EXP-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    setBookingReference(reference);
    confirmBooking();
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsProcessing(false);
    onNext();
  };
  
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Booking Summary */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>{experience.title}</Text>
          <View style={styles.summaryDetails}>
            <View style={styles.summaryItem}>
              <Calendar size={16} color={colors.primary} />
              <Text style={styles.summaryText}>{formatDate(selectedDate)}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Clock size={16} color={colors.primary} />
              <Text style={styles.summaryText}>{selectedTimeSlot.startTime}</Text>
            </View>
            <View style={styles.summaryItem}>
              <People size={16} color={colors.primary} />
              <Text style={styles.summaryText}>
                {adults + children + infants} Guest{adults + children + infants > 1 ? 's' : ''}
              </Text>
            </View>
          </View>
        </Animated.View>
        
        {/* Lead Traveler */}
        <Animated.View entering={FadeInDown.duration(400).delay(100)} style={styles.section}>
          <Text style={styles.sectionTitle}>Lead Traveler</Text>
          <View style={styles.formCard}>
            <View style={styles.inputRow}>
              <View style={styles.inputHalf}>
                <Text style={styles.inputLabel}>First Name</Text>
                <View style={[styles.inputContainer, errors.firstName && styles.inputError]}>
                  <User size={18} color={colors.gray400} />
                  <TextInput
                    style={styles.input}
                    placeholder="First name"
                    placeholderTextColor={colors.gray400}
                    value={leadTraveler.firstName}
                    onChangeText={(text) => setLeadTraveler({ firstName: text })}
                  />
                </View>
              </View>
              <View style={styles.inputHalf}>
                <Text style={styles.inputLabel}>Last Name</Text>
                <View style={[styles.inputContainer, errors.lastName && styles.inputError]}>
                  <TextInput
                    style={styles.input}
                    placeholder="Last name"
                    placeholderTextColor={colors.gray400}
                    value={leadTraveler.lastName}
                    onChangeText={(text) => setLeadTraveler({ lastName: text })}
                  />
                </View>
              </View>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <View style={[styles.inputContainer, errors.email && styles.inputError]}>
                <Sms size={18} color={colors.gray400} />
                <TextInput
                  style={styles.input}
                  placeholder="email@example.com"
                  placeholderTextColor={colors.gray400}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={leadTraveler.email}
                  onChangeText={(text) => setLeadTraveler({ email: text })}
                />
              </View>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone</Text>
              <View style={[styles.inputContainer, errors.phone && styles.inputError]}>
                <Call size={18} color={colors.gray400} />
                <TextInput
                  style={styles.input}
                  placeholder="+1 (555) 123-4567"
                  placeholderTextColor={colors.gray400}
                  keyboardType="phone-pad"
                  value={leadTraveler.phone}
                  onChangeText={(text) => setLeadTraveler({ phone: text })}
                />
              </View>
            </View>
          </View>
        </Animated.View>
        
        {/* Special Requests */}
        <Animated.View entering={FadeInDown.duration(400).delay(150)} style={styles.section}>
          <Text style={styles.sectionTitle}>Special Requests (Optional)</Text>
          <View style={styles.formCard}>
            <TextInput
              style={styles.textArea}
              placeholder="Any dietary restrictions, accessibility needs, or special requests..."
              placeholderTextColor={colors.gray400}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              value={specialRequests}
              onChangeText={setSpecialRequests}
            />
          </View>
        </Animated.View>
        
        {/* Payment */}
        <Animated.View entering={FadeInDown.duration(400).delay(200)} style={styles.section}>
          <Text style={styles.sectionTitle}>Payment</Text>
          <View style={styles.formCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Card Number</Text>
              <View style={[styles.inputContainer, errors.cardNumber && styles.inputError]}>
                <Card size={18} color={colors.gray400} />
                <TextInput
                  style={styles.input}
                  placeholder="1234 5678 9012 3456"
                  placeholderTextColor={colors.gray400}
                  keyboardType="number-pad"
                  maxLength={19}
                  value={cardNumber}
                  onChangeText={(text) => setCardNumber(formatCardNumber(text))}
                />
              </View>
            </View>
            
            <View style={styles.inputRow}>
              <View style={styles.inputHalf}>
                <Text style={styles.inputLabel}>Expiry Date</Text>
                <View style={[styles.inputContainer, errors.expiryDate && styles.inputError]}>
                  <Calendar size={18} color={colors.gray400} />
                  <TextInput
                    style={styles.input}
                    placeholder="MM/YY"
                    placeholderTextColor={colors.gray400}
                    keyboardType="number-pad"
                    maxLength={5}
                    value={expiryDate}
                    onChangeText={(text) => setExpiryDate(formatExpiryDate(text))}
                  />
                </View>
              </View>
              <View style={styles.inputHalf}>
                <Text style={styles.inputLabel}>CVV</Text>
                <View style={[styles.inputContainer, errors.cvv && styles.inputError]}>
                  <Lock size={18} color={colors.gray400} />
                  <TextInput
                    style={styles.input}
                    placeholder="123"
                    placeholderTextColor={colors.gray400}
                    keyboardType="number-pad"
                    maxLength={4}
                    secureTextEntry
                    value={cvv}
                    onChangeText={setCvv}
                  />
                </View>
              </View>
            </View>
            
            <View style={styles.secureNotice}>
              <Shield size={16} color={colors.success} />
              <Text style={styles.secureText}>Your payment is secure and encrypted</Text>
            </View>
          </View>
        </Animated.View>
        
        {/* Price Breakdown */}
        <Animated.View entering={FadeInDown.duration(400).delay(250)} style={styles.section}>
          <Text style={styles.sectionTitle}>Price Summary</Text>
          <View style={styles.priceCard}>
            {adults > 0 && (
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>{adults} Adult{adults > 1 ? 's' : ''}</Text>
                <Text style={styles.priceValue}>${pricing.adultTotal}</Text>
              </View>
            )}
            {children > 0 && (
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>{children} Child{children > 1 ? 'ren' : ''}</Text>
                <Text style={styles.priceValue}>${pricing.childTotal}</Text>
              </View>
            )}
            {infants > 0 && (
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>{infants} Infant{infants > 1 ? 's' : ''}</Text>
                <Text style={styles.priceValue}>Free</Text>
              </View>
            )}
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Service Fee</Text>
              <Text style={styles.priceValue}>${pricing.serviceFee}</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Taxes</Text>
              <Text style={styles.priceValue}>${pricing.taxes}</Text>
            </View>
            <View style={[styles.priceRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>${pricing.total}</Text>
            </View>
          </View>
        </Animated.View>
        
        {/* Cancellation Policy */}
        <Animated.View entering={FadeInDown.duration(400).delay(300)} style={styles.policyCard}>
          <TickCircle size={20} color={colors.success} variant="Bold" />
          <Text style={styles.policyText}>
            {CANCELLATION_POLICY_LABELS[experience.cancellationPolicy]}
          </Text>
        </Animated.View>
      </ScrollView>
      
      {/* Footer */}
      <Animated.View
        entering={FadeInUp.duration(400)}
        style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}
      >
        <TouchableOpacity
          style={[styles.payButton, isProcessing && styles.payButtonDisabled]}
          onPress={handlePayment}
          activeOpacity={0.8}
          disabled={isProcessing}
        >
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.payButtonGradient}
          >
            {isProcessing ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <>
                <Lock size={20} color={colors.white} />
                <Text style={styles.payButtonText}>Pay ${pricing.total}</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollView: { flex: 1 },
  scrollContent: { padding: spacing.lg },
  
  summaryCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  summaryTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  summaryDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  summaryText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  
  section: { marginBottom: spacing.lg },
  sectionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  
  formCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    ...shadows.sm,
  },
  inputRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  inputHalf: { flex: 1 },
  inputGroup: { marginBottom: spacing.md },
  inputLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray50,
    borderRadius: 16,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  inputError: { borderColor: colors.error },
  input: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
  textArea: {
    backgroundColor: colors.gray50,
    borderRadius: 16,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    minHeight: 80,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  secureNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  secureText: {
    fontSize: typography.fontSize.sm,
    color: colors.success,
  },
  
  priceCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    ...shadows.sm,
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
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.medium,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
    paddingTop: spacing.sm,
    marginTop: spacing.xs,
    marginBottom: 0,
  },
  totalLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  totalValue: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  
  policyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.success + '15',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  policyText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.success,
    fontWeight: typography.fontWeight.medium,
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
  payButton: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  payButtonDisabled: { opacity: 0.7 },
  payButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  payButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
});
