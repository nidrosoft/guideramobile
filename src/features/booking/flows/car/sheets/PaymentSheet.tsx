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
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  CloseCircle,
  Card,
  Lock,
  TickCircle,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, borderRadius } from '@/styles';

interface PaymentSheetProps {
  visible: boolean;
  onClose: () => void;
  onSave: (paymentData: PaymentData) => void;
  initialData?: PaymentData;
}

export interface PaymentData {
  cardNumber: string;
  expiry: string;
  cvv: string;
  cardholderName: string;
  billingAddress: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export default function PaymentSheet({
  visible,
  onClose,
  onSave,
  initialData,
}: PaymentSheetProps) {
  const insets = useSafeAreaInsets();
  
  const [cardNumber, setCardNumber] = useState(initialData?.cardNumber || '');
  const [expiry, setExpiry] = useState(initialData?.expiry || '');
  const [cvv, setCvv] = useState(initialData?.cvv || '');
  const [cardholderName, setCardholderName] = useState(initialData?.cardholderName || '');
  const [billingAddress, setBillingAddress] = useState(initialData?.billingAddress || '');
  const [city, setCity] = useState(initialData?.city || '');
  const [state, setState] = useState(initialData?.state || '');
  const [zipCode, setZipCode] = useState(initialData?.zipCode || '');
  const [country, setCountry] = useState(initialData?.country || 'United States');

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

  const isValid = () => {
    return (
      cardNumber.replace(/\s/g, '').length === 16 &&
      expiry.length === 5 &&
      cvv.length >= 3 &&
      cardholderName.trim().length >= 2 &&
      billingAddress.trim().length >= 5 &&
      city.trim().length >= 2 &&
      zipCode.trim().length >= 5 &&
      country.trim().length >= 2
    );
  };

  const handleSave = () => {
    if (!isValid()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSave({
      cardNumber,
      expiry,
      cvv,
      cardholderName,
      billingAddress,
      city,
      state,
      zipCode,
      country,
    });
    onClose();
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView 
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Payment Details</Text>
            <TouchableOpacity onPress={handleClose}>
              <CloseCircle size={28} color={colors.gray500} variant="Bold" />
            </TouchableOpacity>
          </View>

          {/* Security Badge */}
          <View style={styles.securityContainer}>
            <View style={styles.securityBadge}>
              <Lock size={14} color={colors.success} variant="Bold" />
              <Text style={styles.securityText}>Secure Payment</Text>
            </View>
            <Text style={styles.securitySubtext}>Your payment info is encrypted</Text>
          </View>

          <ScrollView 
            style={styles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Card Number */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Card Number</Text>
              <View style={styles.inputWithIcon}>
                <Card size={20} color={colors.gray400} />
                <TextInput
                  style={styles.inputText}
                  placeholder="1234 5678 9012 3456"
                  placeholderTextColor={colors.gray400}
                  value={cardNumber}
                  onChangeText={(text) => setCardNumber(formatCardNumber(text))}
                  keyboardType="number-pad"
                  maxLength={19}
                />
              </View>
            </View>

            {/* Expiry and CVV */}
            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Expiry Date</Text>
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
              <View style={[styles.inputGroup, { flex: 1 }]}>
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

            {/* Cardholder Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Cardholder Name</Text>
              <TextInput
                style={styles.input}
                placeholder="John Doe"
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
                autoCapitalize="words"
              />
            </View>

            {/* City and State */}
            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 1.5 }]}>
                <Text style={styles.inputLabel}>City</Text>
                <TextInput
                  style={styles.input}
                  placeholder="New York"
                  placeholderTextColor={colors.gray400}
                  value={city}
                  onChangeText={setCity}
                  autoCapitalize="words"
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>State</Text>
                <TextInput
                  style={styles.input}
                  placeholder="NY"
                  placeholderTextColor={colors.gray400}
                  value={state}
                  onChangeText={setState}
                  autoCapitalize="characters"
                  maxLength={2}
                />
              </View>
            </View>

            {/* Zip Code and Country */}
            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>ZIP Code</Text>
                <TextInput
                  style={styles.input}
                  placeholder="10001"
                  placeholderTextColor={colors.gray400}
                  value={zipCode}
                  onChangeText={setZipCode}
                  keyboardType="number-pad"
                  maxLength={10}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1.5 }]}>
                <Text style={styles.inputLabel}>Country</Text>
                <TextInput
                  style={styles.input}
                  placeholder="United States"
                  placeholderTextColor={colors.gray400}
                  value={country}
                  onChangeText={setCountry}
                  autoCapitalize="words"
                />
              </View>
            </View>

            {/* Spacer for button */}
            <View style={{ height: 120 }} />
          </ScrollView>

          {/* Save Button */}
          <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={isValid() ? [colors.primary, colors.primaryDark] : [colors.gray300, colors.gray400]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.saveGradient}
              >
                <TickCircle size={20} color={colors.white} variant="Bold" />
                <Text style={styles.saveButtonText}>Save Payment Details</Text>
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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
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
  saveButton: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  saveGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  saveButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
});
