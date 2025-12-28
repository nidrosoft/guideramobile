/**
 * CANCEL BOOKING MODAL
 * 
 * Shared confirmation modal for canceling booking flows.
 * Used across Flight, Hotel, Car, Experience, and Package flows.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { Warning2 } from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, typography, borderRadius, shadows } from '@/styles';

interface CancelBookingModalProps {
  visible: boolean;
  onCancel: () => void;      // Keep editing
  onConfirm: () => void;     // Yes, cancel
  title?: string;
  message?: string;
  cancelText?: string;
  confirmText?: string;
}

export default function CancelBookingModal({
  visible,
  onCancel,
  onConfirm,
  title = 'Cancel Booking?',
  message = "Are you sure you want to cancel? All your progress will be lost and won't be saved.",
  cancelText = 'Keep Editing',
  confirmText = 'Yes, Cancel',
}: CancelBookingModalProps) {
  
  const handleCancel = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onCancel();
  };

  const handleConfirm = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onConfirm();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Warning2 size={48} color={colors.warning} variant="Bold" />
          </View>
          
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          
          <View style={styles.buttons}>
            <TouchableOpacity
              style={styles.buttonSecondary}
              onPress={handleCancel}
              activeOpacity={0.7}
            >
              <Text style={styles.buttonSecondaryText}>{cancelText}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.buttonPrimary}
              onPress={handleConfirm}
              activeOpacity={0.7}
            >
              <Text style={styles.buttonPrimaryText}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  content: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    ...shadows.lg,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.warning + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  message: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  buttons: {
    flexDirection: 'row',
    gap: spacing.md,
    width: '100%',
  },
  buttonSecondary: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.gray100,
    alignItems: 'center',
  },
  buttonSecondaryText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  buttonPrimary: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.error,
    alignItems: 'center',
  },
  buttonPrimaryText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
});
