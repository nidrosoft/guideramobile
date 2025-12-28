/**
 * PAYMENT SHEET
 * 
 * Bottom sheet for entering payment details.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CloseCircle, Card, Calendar, Lock, Shield } from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, borderRadius } from '@/styles';

export interface PaymentData {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardholderName: string;
  billingAddress: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

interface PaymentSheetProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: PaymentData) => void;
}

export default function PaymentSheet({
  visible,
  onClose,
  onSave,
}: PaymentSheetProps) {
  const insets = useSafeAreaInsets();
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [country, setCountry] = useState('United States');

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

  const isValid = 
    cardNumber.replace(/\s/g, '').length >= 16 &&
    expiryDate.length === 5 &&
    cvv.length >= 3 &&
    cardholderName.trim().length > 0 &&
    billingAddress.trim().length > 0 &&
    city.trim().length > 0 &&
    state.trim().length > 0 &&
    zipCode.trim().length > 0;

  const handleSave = () => {
    if (!isValid) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSave({
      cardNumber: cardNumber.replace(/\s/g, ''),
      expiryDate,
      cvv,
      cardholderName: cardholderName.trim(),
      billingAddress: billingAddress.trim(),
      city: city.trim(),
      state: state.trim(),
      zipCode: zipCode.trim(),
      country,
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={[styles.container, { paddingBottom: insets.bottom + spacing.md }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Payment Details</Text>
            <TouchableOpacity onPress={onClose}>
              <CloseCircle size={28} color={colors.gray500} variant="Bold" />
            </TouchableOpacity>
          </View>

          {/* Security Badge */}
          <View style={styles.securityContainer}>
            <View style={styles.securityBadge}>
              <Shield size={16} color={colors.success} variant="Bold" />
              <Text style={styles.securityText}>Secure Payment</Text>
            </View>
            <Text style={styles.securitySubtext}>Your payment info is encrypted</Text>
          </View>

          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Card Number */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Card Number</Text>
              <View style={styles.inputWithIcon}>
                <Card size={18} color={colors.gray400} />
                <TextInput
                  style={styles.inputText}
                  placeholder="1234 5678 9012 3456"
                  placeholderTextColor={colors.gray400}
                  value={formatCardNumber(cardNumber)}
                  onChangeText={(text) => setCardNumber(text.replace(/\s/g, ''))}
                  keyboardType="number-pad"
                  maxLength={19}
                />
              </View>
            </View>

            {/* Expiry & CVV Row */}
            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Expiry Date</Text>
                <View style={styles.inputWithIcon}>
                  <Calendar size={18} color={colors.gray400} />
                  <TextInput
                    style={styles.inputText}
                    placeholder="MM/YY"
                    placeholderTextColor={colors.gray400}
                    value={formatExpiryDate(expiryDate)}
                    onChangeText={(text) => setExpiryDate(text.replace(/\D/g, ''))}
                    keyboardType="number-pad"
                    maxLength={5}
                  />
                </View>
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>CVV</Text>
                <View style={styles.inputWithIcon}>
                  <Lock size={18} color={colors.gray400} />
                  <TextInput
                    style={styles.inputText}
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
            </View>

            {/* Cardholder Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Cardholder Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Name on card"
                placeholderTextColor={colors.gray400}
                value={cardholderName}
                onChangeText={setCardholderName}
                autoCapitalize="words"
              />
            </View>

            {/* Billing Address Section */}
            <Text style={styles.sectionTitle}>Billing Address</Text>

            {/* Street Address */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Street Address</Text>
              <TextInput
                style={styles.input}
                placeholder="123 Main Street"
                placeholderTextColor={colors.gray400}
                value={billingAddress}
                onChangeText={setBillingAddress}
              />
            </View>

            {/* City & State Row */}
            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 2 }]}>
                <Text style={styles.inputLabel}>City</Text>
                <TextInput
                  style={styles.input}
                  placeholder="City"
                  placeholderTextColor={colors.gray400}
                  value={city}
                  onChangeText={setCity}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>State</Text>
                <TextInput
                  style={styles.input}
                  placeholder="CA"
                  placeholderTextColor={colors.gray400}
                  value={state}
                  onChangeText={setState}
                  maxLength={2}
                  autoCapitalize="characters"
                />
              </View>
            </View>

            {/* Zip & Country Row */}
            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>ZIP Code</Text>
                <TextInput
                  style={styles.input}
                  placeholder="12345"
                  placeholderTextColor={colors.gray400}
                  value={zipCode}
                  onChangeText={setZipCode}
                  keyboardType="number-pad"
                  maxLength={10}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Country</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Country"
                  placeholderTextColor={colors.gray400}
                  value={country}
                  onChangeText={setCountry}
                />
              </View>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.saveButton, !isValid && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={!isValid}
            >
              <LinearGradient
                colors={isValid ? [colors.primary, colors.primaryDark] : [colors.gray300, colors.gray400]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.saveGradient}
              >
                <Text style={styles.saveText}>Save Payment Method</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    height: '92%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  securityContainer: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.success}15`,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  securityText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.success,
  },
  securitySubtext: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  inputRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  inputLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.gray50,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.gray200,
    height: 52,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray50,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray200,
    height: 52,
    gap: spacing.sm,
  },
  inputText: {
    flex: 1,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
  },
  saveButton: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveGradient: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  saveText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
});
