/**
 * EXTRAS SHEET
 * 
 * Full bottom sheet for selecting flight extras
 * Baggage, meals, priority boarding, etc.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  CloseCircle,
  TickCircle,
  Bag2,
  Coffee,
  Flash,
  Wifi,
  Headphone,
  ShieldTick,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, typography, borderRadius } from '@/styles';

interface ExtrasSheetProps {
  visible: boolean;
  onClose: () => void;
  selectedExtras: {
    checkedBags: number;
    meal: string | null;
    priorityBoarding: boolean;
    wifi: boolean;
    entertainment: boolean;
    insurance: boolean;
  };
  onSelectExtras: (extras: ExtrasSheetProps['selectedExtras']) => void;
}

const BAGGAGE_OPTIONS = [
  { id: 0, label: 'Carry-on only', price: 0, description: '1 personal item + 1 carry-on' },
  { id: 1, label: '1 Checked bag', price: 35, description: 'Up to 23kg (50lbs)' },
  { id: 2, label: '2 Checked bags', price: 60, description: 'Up to 23kg each' },
];

const MEAL_OPTIONS = [
  { id: null, label: 'No meal', price: 0 },
  { id: 'standard', label: 'Standard meal', price: 12 },
  { id: 'vegetarian', label: 'Vegetarian', price: 12 },
  { id: 'vegan', label: 'Vegan', price: 15 },
  { id: 'halal', label: 'Halal', price: 15 },
  { id: 'kosher', label: 'Kosher', price: 15 },
];

const ADDON_OPTIONS = [
  { id: 'priorityBoarding', label: 'Priority Boarding', price: 15, icon: Flash, description: 'Board first and settle in' },
  { id: 'wifi', label: 'In-flight WiFi', price: 12, icon: Wifi, description: 'Stay connected throughout' },
  { id: 'entertainment', label: 'Premium Entertainment', price: 8, icon: Headphone, description: 'Movies, music & more' },
  { id: 'insurance', label: 'Travel Insurance', price: 25, icon: ShieldTick, description: 'Trip protection coverage' },
];

export default function ExtrasSheet({
  visible,
  onClose,
  selectedExtras,
  onSelectExtras,
}: ExtrasSheetProps) {
  const insets = useSafeAreaInsets();
  const [localExtras, setLocalExtras] = useState(selectedExtras);

  const handleBaggageSelect = (bags: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLocalExtras(prev => ({ ...prev, checkedBags: bags }));
  };

  const handleMealSelect = (meal: string | null) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLocalExtras(prev => ({ ...prev, meal }));
  };

  const handleAddonToggle = (addonId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLocalExtras(prev => ({
      ...prev,
      [addonId]: !prev[addonId as keyof typeof prev],
    }));
  };

  const handleConfirm = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSelectExtras(localExtras);
    onClose();
  };

  const calculateTotal = () => {
    let total = 0;
    const bagOption = BAGGAGE_OPTIONS.find(b => b.id === localExtras.checkedBags);
    if (bagOption) total += bagOption.price;
    
    const mealOption = MEAL_OPTIONS.find(m => m.id === localExtras.meal);
    if (mealOption) total += mealOption.price;
    
    ADDON_OPTIONS.forEach(addon => {
      if (localExtras[addon.id as keyof typeof localExtras]) {
        total += addon.price;
      }
    });
    
    return total;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Flight Extras</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <CloseCircle size={28} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Baggage Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Bag2 size={20} color={colors.primary} variant="Bold" />
              <Text style={styles.sectionTitle}>Checked Baggage</Text>
            </View>
            {BAGGAGE_OPTIONS.map(option => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionCard,
                  localExtras.checkedBags === option.id && styles.optionCardSelected,
                ]}
                onPress={() => handleBaggageSelect(option.id)}
              >
                <View style={styles.optionInfo}>
                  <Text style={styles.optionLabel}>{option.label}</Text>
                  <Text style={styles.optionDescription}>{option.description}</Text>
                </View>
                <View style={styles.optionRight}>
                  <Text style={[
                    styles.optionPrice,
                    localExtras.checkedBags === option.id && styles.optionPriceSelected,
                  ]}>
                    {option.price === 0 ? 'Free' : `+$${option.price}`}
                  </Text>
                  {localExtras.checkedBags === option.id && (
                    <TickCircle size={20} color={colors.primary} variant="Bold" />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Meals Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Coffee size={20} color={colors.primary} variant="Bold" />
              <Text style={styles.sectionTitle}>In-flight Meal</Text>
            </View>
            <View style={styles.mealGrid}>
              {MEAL_OPTIONS.map(option => (
                <TouchableOpacity
                  key={option.id || 'none'}
                  style={[
                    styles.mealCard,
                    localExtras.meal === option.id && styles.mealCardSelected,
                  ]}
                  onPress={() => handleMealSelect(option.id)}
                >
                  <Text style={[
                    styles.mealLabel,
                    localExtras.meal === option.id && styles.mealLabelSelected,
                  ]}>
                    {option.label}
                  </Text>
                  <Text style={[
                    styles.mealPrice,
                    localExtras.meal === option.id && styles.mealPriceSelected,
                  ]}>
                    {option.price === 0 ? 'Free' : `+$${option.price}`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Add-ons Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Flash size={20} color={colors.primary} variant="Bold" />
              <Text style={styles.sectionTitle}>Add-ons</Text>
            </View>
            {ADDON_OPTIONS.map(addon => {
              const Icon = addon.icon;
              const isSelected = !!localExtras[addon.id as keyof typeof localExtras];
              return (
                <TouchableOpacity
                  key={addon.id}
                  style={[
                    styles.addonCard,
                    isSelected ? styles.addonCardSelected : null,
                  ]}
                  onPress={() => handleAddonToggle(addon.id)}
                >
                  <View style={[styles.addonIcon, isSelected ? styles.addonIconSelected : null]}>
                    <Icon size={20} color={isSelected ? colors.white : colors.primary} variant="Bold" />
                  </View>
                  <View style={styles.addonInfo}>
                    <Text style={styles.addonLabel}>{addon.label}</Text>
                    <Text style={styles.addonDescription}>{addon.description}</Text>
                  </View>
                  <View style={styles.addonRight}>
                    <Text style={[styles.addonPrice, isSelected ? styles.addonPriceSelected : null]}>
                      +${addon.price}
                    </Text>
                    <View style={[styles.checkbox, isSelected ? styles.checkboxSelected : null]}>
                      {isSelected && <TickCircle size={16} color={colors.white} variant="Bold" />}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Extras Total</Text>
            <Text style={styles.totalAmount}>
              {calculateTotal() === 0 ? 'Free' : `+$${calculateTotal()}`}
            </Text>
          </View>
          <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
            <Text style={styles.confirmButtonText}>Confirm Extras</Text>
          </TouchableOpacity>
        </View>
      </View>
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
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: '#E6E9EB',
  },
  optionCardSelected: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}08`,
  },
  optionInfo: {
    flex: 1,
  },
  optionLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  optionDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  optionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  optionPrice: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
  },
  optionPriceSelected: {
    color: colors.primary,
  },
  mealGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  mealCard: {
    width: '48%',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#E6E9EB',
    alignItems: 'center',
  },
  mealCardSelected: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}08`,
  },
  mealLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  mealLabelSelected: {
    color: colors.primary,
  },
  mealPrice: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 4,
  },
  mealPriceSelected: {
    color: colors.primary,
  },
  addonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: '#E6E9EB',
  },
  addonCardSelected: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}08`,
  },
  addonIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  addonIconSelected: {
    backgroundColor: colors.primary,
  },
  addonInfo: {
    flex: 1,
  },
  addonLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  addonDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  addonRight: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  addonPrice: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
  },
  addonPriceSelected: {
    color: colors.primary,
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
  footer: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#E6E9EB',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  totalLabel: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
  },
  totalAmount: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  confirmButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
});
