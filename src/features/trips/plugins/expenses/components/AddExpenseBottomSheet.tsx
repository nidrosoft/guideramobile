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
import { CloseCircle } from 'iconsax-react-native';
import { colors, spacing, typography } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { Expense, ExpenseCategory, CategoryInfo, PaymentMethod } from '../types/expense.types';
import { useToast } from '@/contexts/ToastContext';

const COMMON_CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'THB', symbol: '฿', name: 'Thai Baht' },
  { code: 'MXN', symbol: 'Mex$', name: 'Mexican Peso' },
];

interface AddExpenseBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (expense: Omit<Expense, 'id' | 'tripId' | 'createdAt'>) => void;
  categories: CategoryInfo[];
  editingExpense?: Expense | null;
  defaultCurrency?: string;
}

export default function AddExpenseBottomSheet({
  visible,
  onClose,
  onAdd,
  categories,
  editingExpense,
  defaultCurrency = 'USD',
}: AddExpenseBottomSheetProps) {
  const { showSuccess } = useToast();
  const { colors: tc } = useTheme();
  const [amount, setAmount] = useState(editingExpense?.amount.toString() || '');
  const [description, setDescription] = useState(editingExpense?.description || '');
  const [merchant, setMerchant] = useState(editingExpense?.merchant || '');
  const [selectedCurrency, setSelectedCurrency] = useState(editingExpense?.currency || defaultCurrency);
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory>(editingExpense?.category || ExpenseCategory.FOOD);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>(editingExpense?.paymentMethod || PaymentMethod.CREDIT_CARD);
  const [notes, setNotes] = useState(editingExpense?.notes || '');
  const [date, setDate] = useState(editingExpense?.date || new Date());
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);

  const paymentMethods = [
    { id: PaymentMethod.CREDIT_CARD, name: 'Credit Card', icon: '💳' },
    { id: PaymentMethod.DEBIT_CARD, name: 'Debit Card', icon: '💳' },
    { id: PaymentMethod.CASH, name: 'Cash', icon: '💵' },
    { id: PaymentMethod.DIGITAL_WALLET, name: 'Digital', icon: '📱' },
    { id: PaymentMethod.OTHER, name: 'Other', icon: '💰' },
  ];

  const handleAdd = () => {
    if (!amount.trim() || !description.trim()) {
      return;
    }

    const expense: Omit<Expense, 'id' | 'tripId' | 'createdAt'> = {
      amount: parseFloat(amount),
      currency: selectedCurrency,
      category: selectedCategory,
      description: description.trim(),
      merchant: merchant.trim() || undefined,
      date,
      paymentMethod: selectedPaymentMethod,
      notes: notes.trim() || undefined,
      source: 'manual',
    };

    onAdd(expense);
    showSuccess(editingExpense ? 'Expense updated!' : 'Expense added!');

    // Reset form
    setAmount('');
    setDescription('');
    setMerchant('');
    setSelectedCurrency(defaultCurrency);
    setSelectedCategory(ExpenseCategory.FOOD);
    setSelectedPaymentMethod(PaymentMethod.CREDIT_CARD);
    setNotes('');
    setDate(new Date());
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
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
        
        <View style={styles.bottomSheet}>
          {/* Handle Bar */}
          <View style={styles.handleBar} />

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{editingExpense ? 'Edit Expense' : 'Add Expense'}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <CloseCircle size={28} color={colors.gray400} variant="Linear" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Amount + Currency */}
            <View style={styles.field}>
              <Text style={styles.label}>Amount</Text>
              <View style={styles.amountRow}>
                <TouchableOpacity
                  style={styles.currencyToggle}
                  onPress={() => setShowCurrencyPicker(!showCurrencyPicker)}
                >
                  <Text style={styles.currencyToggleText}>{selectedCurrency}</Text>
                  <Text style={styles.currencyToggleArrow}>{showCurrencyPicker ? '▲' : '▼'}</Text>
                </TouchableOpacity>
                <View style={[styles.amountInput, { flex: 1 }]}>
                  <Text style={styles.currencySymbol}>
                    {COMMON_CURRENCIES.find(c => c.code === selectedCurrency)?.symbol || '$'}
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0.00"
                    placeholderTextColor={colors.gray400}
                    value={amount}
                    onChangeText={setAmount}
                    keyboardType="decimal-pad"
                    autoFocus
                  />
                </View>
              </View>
              {showCurrencyPicker && (
                <View style={styles.currencyPickerContainer}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.currencyPickerScroll}>
                    {COMMON_CURRENCIES.map(cur => (
                      <TouchableOpacity
                        key={cur.code}
                        style={[
                          styles.currencyChip,
                          selectedCurrency === cur.code && styles.currencyChipSelected,
                        ]}
                        onPress={() => { setSelectedCurrency(cur.code); setShowCurrencyPicker(false); }}
                      >
                        <Text style={[
                          styles.currencyChipText,
                          selectedCurrency === cur.code && styles.currencyChipTextSelected,
                        ]}>{cur.symbol} {cur.code}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* Category */}
            <View style={styles.field}>
              <Text style={styles.label}>Category</Text>
              <View style={styles.categoryGrid}>
                {categories.map(category => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryChip,
                      selectedCategory === category.id && [
                        styles.categoryChipSelected,
                        { borderColor: category.color, backgroundColor: `${category.color}15` },
                      ],
                    ]}
                    onPress={() => setSelectedCategory(category.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.categoryEmoji}>{category.emoji}</Text>
                    <Text style={[
                      styles.categoryChipText,
                      selectedCategory === category.id && { color: category.color },
                    ]}>
                      {category.name.split(' ')[0]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Merchant (Optional) */}
            <View style={styles.field}>
              <Text style={styles.label}>Merchant (Optional)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Starbucks, Uber, Hotel Marrakech"
                placeholderTextColor={colors.gray400}
                value={merchant}
                onChangeText={setMerchant}
              />
            </View>

            {/* Description */}
            <View style={styles.field}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Lunch at restaurant"
                placeholderTextColor={colors.gray400}
                value={description}
                onChangeText={setDescription}
              />
            </View>

            {/* Payment Method */}
            <View style={styles.field}>
              <Text style={styles.label}>Payment Method</Text>
              <View style={styles.categoryGrid}>
                {paymentMethods.map(method => (
                  <TouchableOpacity
                    key={method.id}
                    style={[
                      styles.categoryChip,
                      selectedPaymentMethod === method.id && [
                        styles.categoryChipSelected,
                        { borderColor: colors.primary, backgroundColor: `${colors.primary}15` },
                      ],
                    ]}
                    onPress={() => setSelectedPaymentMethod(method.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.categoryEmoji}>{method.icon}</Text>
                    <Text style={[
                      styles.categoryChipText,
                      selectedPaymentMethod === method.id && { color: colors.primary },
                    ]}>
                      {method.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Notes */}
            <View style={styles.field}>
              <Text style={styles.label}>Notes (Optional)</Text>
              <TextInput
                style={[styles.textInput, styles.notesInput]}
                placeholder="Add any additional notes..."
                placeholderTextColor={colors.gray400}
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </ScrollView>

          {/* Add Button */}
          <TouchableOpacity
            style={[
              styles.addButton,
              (!amount.trim() || !description.trim()) && styles.addButtonDisabled,
            ]}
            onPress={handleAdd}
            disabled={!amount.trim() || !description.trim()}
          >
            <Text style={styles.addButtonText}>{editingExpense ? 'Update Expense' : 'Add Expense'}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  bottomSheet: {
    backgroundColor: colors.bgModal,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: spacing.xl,
    maxHeight: '85%',
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: colors.gray300,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: '700',
    color: colors.gray900,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  field: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.gray900,
    marginBottom: spacing.sm,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  currencyToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray100,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray200,
    gap: 4,
  },
  currencyToggleText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
    color: colors.gray900,
  },
  currencyToggleArrow: {
    fontSize: 8,
    color: colors.gray500,
  },
  currencyPickerContainer: {
    marginTop: spacing.sm,
  },
  currencyPickerScroll: {
    gap: spacing.xs,
  },
  currencyChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 16,
    backgroundColor: colors.gray100,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  currencyChipSelected: {
    backgroundColor: `${colors.primary}15`,
    borderColor: colors.primary,
  },
  currencyChipText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    color: colors.gray600,
  },
  currencyChipTextSelected: {
    color: colors.primary,
  },
  amountInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray50,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  currencySymbol: {
    fontSize: typography.fontSize.xl,
    fontWeight: '700',
    color: colors.gray900,
    marginRight: spacing.xs,
  },
  input: {
    flex: 1,
    paddingVertical: spacing.md,
    fontSize: typography.fontSize.xl,
    fontWeight: '700',
    color: colors.gray900,
  },
  textInput: {
    backgroundColor: colors.gray50,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.gray900,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  notesInput: {
    minHeight: 80,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    backgroundColor: colors.gray100,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  categoryChipSelected: {
    borderWidth: 2,
  },
  categoryEmoji: {
    fontSize: 16,
    marginRight: spacing.xs,
  },
  categoryChipText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '500',
    color: colors.gray700,
  },
  addButton: {
    backgroundColor: colors.primary,
    marginHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addButtonDisabled: {
    backgroundColor: colors.gray300,
    shadowOpacity: 0,
  },
  addButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: '700',
    color: colors.white,
  },
});
