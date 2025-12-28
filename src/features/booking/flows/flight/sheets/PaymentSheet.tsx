/**
 * PAYMENT SHEET
 * 
 * Bottom sheet for entering payment details
 * Card form for submission to booking provider
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  CloseCircle,
  Card,
  Calendar,
  Lock,
  User,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, typography, borderRadius } from '@/styles';

interface PaymentInfo {
  cardNumber: string;
  cardHolder: string;
  expiryDate: string;
  cvv: string;
}

interface PaymentSheetProps {
  visible: boolean;
  onClose: () => void;
  paymentInfo: PaymentInfo;
  onSavePayment: (payment: PaymentInfo) => void;
}

export default function PaymentSheet({
  visible,
  onClose,
  paymentInfo,
  onSavePayment,
}: PaymentSheetProps) {
  const insets = useSafeAreaInsets();
  const [localPayment, setLocalPayment] = useState<PaymentInfo>(paymentInfo);

  const handleConfirm = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSavePayment(localPayment);
    onClose();
  };

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const groups = cleaned.match(/.{1,4}/g);
    return groups ? groups.join(' ').substring(0, 19) : cleaned;
  };

  const formatExpiryDate = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return `${cleaned.substring(0, 2)}/${cleaned.substring(2, 4)}`;
    }
    return cleaned;
  };

  const isPaymentComplete = !!(
    localPayment.cardNumber.replace(/\s/g, '').length >= 16 &&
    localPayment.cardHolder &&
    localPayment.expiryDate.length >= 5 &&
    localPayment.cvv.length >= 3
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.innerContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Payment Details</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <CloseCircle size={28} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Card Preview */}
            <View style={styles.cardPreview}>
              <View style={styles.cardChip} />
              <Text style={styles.cardNumberPreview}>
                {localPayment.cardNumber || '•••• •••• •••• ••••'}
              </Text>
              <View style={styles.cardBottom}>
                <View>
                  <Text style={styles.cardLabel}>CARD HOLDER</Text>
                  <Text style={styles.cardValue}>
                    {localPayment.cardHolder || 'YOUR NAME'}
                  </Text>
                </View>
                <View>
                  <Text style={styles.cardLabel}>EXPIRES</Text>
                  <Text style={styles.cardValue}>
                    {localPayment.expiryDate || 'MM/YY'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Form */}
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Card Number</Text>
                <View style={styles.inputContainer}>
                  <Card size={18} color={colors.gray400} />
                  <TextInput
                    style={styles.input}
                    value={localPayment.cardNumber}
                    onChangeText={(v) => setLocalPayment(prev => ({
                      ...prev,
                      cardNumber: formatCardNumber(v),
                    }))}
                    placeholder="1234 5678 9012 3456"
                    placeholderTextColor={colors.gray400}
                    keyboardType="number-pad"
                    maxLength={19}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Card Holder Name</Text>
                <View style={styles.inputContainer}>
                  <User size={18} color={colors.gray400} />
                  <TextInput
                    style={styles.input}
                    value={localPayment.cardHolder}
                    onChangeText={(v) => setLocalPayment(prev => ({
                      ...prev,
                      cardHolder: v.toUpperCase(),
                    }))}
                    placeholder="JOHN DOE"
                    placeholderTextColor={colors.gray400}
                    autoCapitalize="characters"
                  />
                </View>
              </View>

              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: spacing.sm }]}>
                  <Text style={styles.inputLabel}>Expiry Date</Text>
                  <View style={styles.inputContainer}>
                    <Calendar size={18} color={colors.gray400} />
                    <TextInput
                      style={styles.input}
                      value={localPayment.expiryDate}
                      onChangeText={(v) => setLocalPayment(prev => ({
                        ...prev,
                        expiryDate: formatExpiryDate(v),
                      }))}
                      placeholder="MM/YY"
                      placeholderTextColor={colors.gray400}
                      keyboardType="number-pad"
                      maxLength={5}
                    />
                  </View>
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>CVV</Text>
                  <View style={styles.inputContainer}>
                    <Lock size={18} color={colors.gray400} />
                    <TextInput
                      style={styles.input}
                      value={localPayment.cvv}
                      onChangeText={(v) => setLocalPayment(prev => ({
                        ...prev,
                        cvv: v.replace(/\D/g, '').substring(0, 4),
                      }))}
                      placeholder="123"
                      placeholderTextColor={colors.gray400}
                      keyboardType="number-pad"
                      secureTextEntry
                      maxLength={4}
                    />
                  </View>
                </View>
              </View>

              {/* Security Note */}
              <View style={styles.securityNote}>
                <Lock size={16} color={colors.textSecondary} />
                <Text style={styles.securityText}>
                  Your payment information is encrypted and secure
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
            <TouchableOpacity
              style={[
                styles.confirmButton,
                !isPaymentComplete && styles.confirmButtonDisabled,
              ]}
              onPress={handleConfirm}
              disabled={!isPaymentComplete}
            >
              <Text style={styles.confirmButtonText}>
                {isPaymentComplete ? 'Save Payment Details' : 'Complete All Fields'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  innerContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#E6E9EB',
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
  },
  cardPreview: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    height: 180,
    justifyContent: 'space-between',
  },
  cardChip: {
    width: 40,
    height: 30,
    backgroundColor: '#D4AF37',
    borderRadius: 6,
  },
  cardNumberPreview: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.medium,
    color: colors.white,
    letterSpacing: 2,
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardLabel: {
    fontSize: typography.fontSize.xs,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 4,
  },
  cardValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.white,
  },
  form: {
    marginTop: spacing.md,
  },
  inputRow: {
    flexDirection: 'row',
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    height: 48,
    borderWidth: 1,
    borderColor: '#E6E9EB',
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
    paddingVertical: spacing.md,
  },
  securityText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  footer: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#E6E9EB',
  },
  confirmButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: colors.gray300,
  },
  confirmButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
});
