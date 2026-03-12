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
import { PackingCategory } from '../types/packing.types';
import { useToast } from '@/contexts/ToastContext';

interface AddItemBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (itemName: string, category: PackingCategory, quantity: number) => void;
}

const CATEGORIES = [
  { id: PackingCategory.ESSENTIALS, name: 'Essentials', emoji: '🎒' },
  { id: PackingCategory.CLOTHING, name: 'Clothing', emoji: '👕' },
  { id: PackingCategory.TOILETRIES, name: 'Toiletries', emoji: '🧴' },
  { id: PackingCategory.ELECTRONICS, name: 'Electronics', emoji: '💻' },
  { id: PackingCategory.HEALTH, name: 'Health & Safety', emoji: '🏥' },
  { id: PackingCategory.DOCUMENTS, name: 'Documents', emoji: '📄' },
  { id: PackingCategory.ACCESSORIES, name: 'Accessories', emoji: '🎒' },
  { id: PackingCategory.ACTIVITIES, name: 'Activities', emoji: '⚽' },
  { id: PackingCategory.CUSTOM, name: 'Custom', emoji: '✨' },
];

export default function AddItemBottomSheet({
  visible,
  onClose,
  onAdd,
}: AddItemBottomSheetProps) {
  const { showSuccess } = useToast();
  const { colors: tc } = useTheme();
  const [itemName, setItemName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<PackingCategory>(PackingCategory.CUSTOM);
  const [quantity, setQuantity] = useState('1');

  const handleAdd = () => {
    if (!itemName.trim()) {
      return;
    }

    const qty = parseInt(quantity) || 1;
    onAdd(itemName.trim(), selectedCategory, qty);
    
    showSuccess('Item added to packing list!');

    // Reset form
    setItemName('');
    setSelectedCategory(PackingCategory.CUSTOM);
    setQuantity('1');
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
        
        <View style={[styles.bottomSheet, { backgroundColor: tc.bgPrimary }]}>
          {/* Handle Bar */}
          <View style={[styles.handleBar, { backgroundColor: tc.borderSubtle }]} />

          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: tc.textPrimary }]}>Add Item</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <CloseCircle size={28} color={tc.textTertiary} variant="Linear" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Item Name */}
            <View style={styles.field}>
              <Text style={[styles.label, { color: tc.textPrimary }]}>Item Name</Text>
              <TextInput
                style={[styles.input, { backgroundColor: tc.bgInput, color: tc.textPrimary, borderColor: tc.borderSubtle }]}
                placeholder="e.g. Sunglasses"
                placeholderTextColor={tc.textTertiary}
                value={itemName}
                onChangeText={setItemName}
                autoFocus
              />
            </View>

            {/* Quantity */}
            <View style={styles.field}>
              <Text style={[styles.label, { color: tc.textPrimary }]}>Quantity</Text>
              <TextInput
                style={[styles.input, { backgroundColor: tc.bgInput, color: tc.textPrimary, borderColor: tc.borderSubtle }]}
                placeholder="1"
                placeholderTextColor={tc.textTertiary}
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="number-pad"
              />
            </View>

            {/* Category */}
            <View style={styles.field}>
              <Text style={[styles.label, { color: tc.textPrimary }]}>Category</Text>
              <View style={styles.categoryGrid}>
                {CATEGORIES.map(category => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryChip,
                      { backgroundColor: tc.bgInput, borderColor: 'transparent' },
                      selectedCategory === category.id && { backgroundColor: `${tc.primary}15`, borderColor: tc.primary },
                    ]}
                    onPress={() => setSelectedCategory(category.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.categoryEmoji}>{category.emoji}</Text>
                    <Text style={[
                      styles.categoryChipText,
                      { color: tc.textSecondary },
                      selectedCategory === category.id && { color: tc.primary, fontWeight: '600' },
                    ]}>
                      {category.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          {/* Add Button */}
          <TouchableOpacity
            style={[
              styles.addButton,
              { backgroundColor: tc.primary },
              !itemName.trim() && { backgroundColor: tc.borderMedium, shadowOpacity: 0 },
            ]}
            onPress={handleAdd}
            disabled={!itemName.trim()}
          >
            <Text style={styles.addButtonText}>Add Item</Text>
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
  input: {
    backgroundColor: colors.gray50,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.gray900,
    borderWidth: 1,
    borderColor: colors.gray200,
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
    backgroundColor: `${colors.primary}15`,
    borderColor: colors.primary,
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
  categoryChipTextSelected: {
    color: colors.primary,
    fontWeight: '600',
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
