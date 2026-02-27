/**
 * HOTEL PAYMENT SHEET
 * 
 * Simple payment sheet for hotel bookings
 * Will be replaced with Stripe integration
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
import { CloseCircle, Card, TickCircle } from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, typography, borderRadius } from '@/styles';

interface PaymentSheetProps {
  visible: boolean;
  onClose: () => void;
  paymentInfo: {
    cardNumber: string;
    cardHolder: string;
    expiryDate: string;
    cvv: string;
  };
  onSavePayment: (payment: PaymentSheetProps['paymentInfo']) => void;
}

export default function PaymentSheet({
  visible,
  onClose,
  paymentInfo,
  onSavePayment,
}: PaymentSheetProps) {
  const insets = useSafeAreaInsets();
  const [localPayment, setLocalPayment] = useState(paymentInfo);

  const formatCardNumber = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    const groups = cleaned.match(/.{1,4}/g);
    return groups ? groups.join(' ').substring(0, 19) : '';
  };

  const formatExpiryDate = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return `${cleaned.substring(0, 2)}/${cleaned.substring(2, 4)}`;
    }
    return cleaned;
  };

  const handleConfirm = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSavePayment(localPayment);
    onClose();
  };

  const isValid = 
    localPayment.cardNumber.replace(/\s/g, '').length >= 16 &&
    localPayment.cardHolder.length > 0 &&
    localPayment.expiryDate.length >= 5 &&
    localPayment.cvv.length >= 3;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <Card size={24} color={colors.primary} variant="Bold" />
          <Text style={styles.headerTitle}>Payment Details</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <CloseCircle size={28} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Card Number</Text>
            <TextInput
              style={styles.input}
              value={localPayment.cardNumber}
              onChangeText={(text) => setLocalPayment(prev => ({
                ...prev,
                cardNumber: formatCardNumber(text),
              }))}
              placeholder="1234 5678 9012 3456"
              placeholderTextColor={colors.gray400}
              keyboardType="number-pad"
              maxLength={19}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Cardholder Name</Text>
            <TextInput
              style={styles.input}
              value={localPayment.cardHolder}
              onChangeText={(text) => setLocalPayment(prev => ({
                ...prev,
                cardHolder: text.toUpperCase(),
              }))}
              placeholder="JOHN DOE"
              placeholderTextColor={colors.gray400}
              autoCapitalize="characters"
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: spacing.md }]}>
              <Text style={styles.label}>Expiry Date</Text>
              <TextInput
                style={styles.input}
                value={localPayment.expiryDate}
                onChangeText={(text) => setLocalPayment(prev => ({
                  ...prev,
                  expiryDate: formatExpiryDate(text),
                }))}
                placeholder="MM/YY"
                placeholderTextColor={colors.gray400}
                keyboardType="number-pad"
                maxLength={5}
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>CVV</Text>
              <TextInput
                style={styles.input}
                value={localPayment.cvv}
                onChangeText={(text) => setLocalPayment(prev => ({
                  ...prev,
                  cvv: text.replace(/\D/g, ''),
                }))}
                placeholder="123"
                placeholderTextColor={colors.gray400}
                keyboardType="number-pad"
                maxLength={4}
                secureTextEntry
              />
            </View>
          </View>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
          <TouchableOpacity
            style={[styles.confirmButton, !isValid && styles.confirmButtonDisabled]}
            onPress={handleConfirm}
            disabled={!isValid}
          >
            <TickCircle size={20} color={colors.white} variant="Bold" />
            <Text style={styles.confirmButtonText}>Save Payment Info</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
    gap: spacing.sm,
  },
  headerTitle: {
    flex: 1,
    fontSize: typography.fontSize.xl,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  closeButton: {
    padding: spacing.xs,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  inputGroup: {
    gap: spacing.xs,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  input: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.gray200,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
  row: {
    flexDirection: 'row',
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
    backgroundColor: colors.white,
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  confirmButtonDisabled: {
    backgroundColor: colors.gray300,
  },
  confirmButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: '700',
    color: colors.white,
  },
});
