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
} from 'react-native';
import { CloseCircle, DollarCircle } from 'iconsax-react-native';
import { colors, spacing, typography } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { useToast } from '@/contexts/ToastContext';

interface BudgetSetupModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (budget: number) => void;
  currentBudget?: number;
}

export default function BudgetSetupModal({
  visible,
  onClose,
  onSave,
  currentBudget,
}: BudgetSetupModalProps) {
  const { showSuccess } = useToast();
  const { colors: tc } = useTheme();
  const [budget, setBudget] = useState(currentBudget?.toString() || '');

  const handleSave = () => {
    const budgetValue = parseFloat(budget);
    if (!budget.trim() || isNaN(budgetValue) || budgetValue <= 0) {
      return;
    }

    onSave(budgetValue);
    showSuccess('Budget updated!');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <DollarCircle size={32} color={colors.primary} variant="Bold" />
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <CloseCircle size={28} color={colors.gray400} variant="Linear" />
            </TouchableOpacity>
          </View>

          <Text style={styles.title}>Set Your Budget</Text>
          <Text style={styles.subtitle}>
            How much do you plan to spend on this trip?
          </Text>

          {/* Budget Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.currencySymbol}>$</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              placeholderTextColor={colors.gray400}
              value={budget}
              onChangeText={setBudget}
              keyboardType="decimal-pad"
              autoFocus
            />
          </View>

          {/* Quick Amounts */}
          <View style={styles.quickAmounts}>
            {[500, 1000, 2000, 5000].map(amount => (
              <TouchableOpacity
                key={amount}
                style={styles.quickButton}
                onPress={() => setBudget(amount.toString())}
              >
                <Text style={styles.quickButtonText}>${amount}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[
              styles.saveButton,
              (!budget.trim() || parseFloat(budget) <= 0) && styles.saveButtonDisabled,
            ]}
            onPress={handleSave}
            disabled={!budget.trim() || parseFloat(budget) <= 0}
          >
            <Text style={styles.saveButtonText}>Save Budget</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modal: {
    backgroundColor: colors.bgModal,
    borderRadius: 24,
    padding: spacing.xl,
    width: '85%',
    maxWidth: 400,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: `${colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: '700',
    color: colors.gray900,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.gray600,
    marginBottom: spacing.xl,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray50,
    borderRadius: 16,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderWidth: 2,
    borderColor: colors.primary,
    marginBottom: spacing.lg,
  },
  currencySymbol: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: '700',
    color: colors.gray900,
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: typography.fontSize['2xl'],
    fontWeight: '700',
    color: colors.gray900,
  },
  quickAmounts: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  quickButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: 12,
    backgroundColor: colors.gray100,
    alignItems: 'center',
  },
  quickButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.gray700,
  },
  saveButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonDisabled: {
    backgroundColor: colors.gray300,
    shadowOpacity: 0,
  },
  saveButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: '700',
    color: colors.white,
  },
});
