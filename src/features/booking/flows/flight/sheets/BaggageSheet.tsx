/**
 * BAGGAGE SHEET
 * 
 * Bottom sheet for selecting checked baggage
 * Uses real pricing from Amadeus API
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CloseCircle, TickCircle, Bag2, Briefcase } from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, typography, borderRadius } from '@/styles';

// Baggage option from API
export interface BaggageOption {
  quantity: number;
  weightKg?: number;
  price: number;
  currency: string;
}

export interface IncludedBaggage {
  cabin: number;
  checked: number;
  cabinWeight?: string;
  checkedWeight?: string;
}

interface BaggageSheetProps {
  visible: boolean;
  onClose: () => void;
  selectedBags: number;
  onSelectBags: (bags: number, totalPrice: number) => void;
  // Real API data
  includedBaggage?: IncludedBaggage;
  addOnOptions?: BaggageOption[];
  isLoading?: boolean;
}

export default function BaggageSheet({
  visible,
  onClose,
  selectedBags,
  onSelectBags,
  includedBaggage,
  addOnOptions,
  isLoading = false,
}: BaggageSheetProps) {
  const insets = useSafeAreaInsets();
  const [localSelectedBags, setLocalSelectedBags] = useState(selectedBags);

  // Reset when sheet opens
  useEffect(() => {
    if (visible) {
      setLocalSelectedBags(selectedBags);
    }
  }, [visible, selectedBags]);

  // Build options from API data
  const options = [
    {
      id: 0,
      label: 'Included baggage only',
      description: includedBaggage 
        ? `${includedBaggage.cabin} cabin bag${includedBaggage.cabin > 1 ? 's' : ''}${includedBaggage.checked > 0 ? ` + ${includedBaggage.checked} checked` : ''}`
        : '1 cabin bag included',
      price: 0,
    },
    ...(addOnOptions || []).map((opt, idx) => ({
      id: idx + 1,
      label: `Add ${opt.quantity} checked bag${opt.quantity > 1 ? 's' : ''}`,
      description: opt.weightKg ? `Up to ${opt.weightKg}kg each` : 'Standard weight allowance',
      price: opt.price,
    })),
  ];

  const handleSelect = (id: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLocalSelectedBags(id);
  };

  const handleConfirm = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const selectedOption = options.find(o => o.id === localSelectedBags);
    onSelectBags(localSelectedBags, selectedOption?.price || 0);
    onClose();
  };

  const selectedOption = options.find(o => o.id === localSelectedBags);
  const totalPrice = selectedOption?.price || 0;

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
          <View style={styles.headerLeft}>
            <Briefcase size={24} color={colors.primary} variant="Bold" />
            <Text style={styles.headerTitle}>Baggage</Text>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <CloseCircle size={28} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading baggage options...</Text>
          </View>
        ) : (
          <>
            <ScrollView 
              style={styles.content}
              contentContainerStyle={styles.contentContainer}
              showsVerticalScrollIndicator={false}
            >
              {/* Included Baggage Info */}
              {includedBaggage && (
                <View style={styles.includedSection}>
                  <Text style={styles.includedTitle}>Included with your fare</Text>
                  <View style={styles.includedItems}>
                    <View style={styles.includedItem}>
                      <Bag2 size={18} color={colors.success} variant="Bold" />
                      <Text style={styles.includedText}>
                        {includedBaggage.cabin} cabin bag{includedBaggage.cabin > 1 ? 's' : ''}
                        {includedBaggage.cabinWeight && ` (${includedBaggage.cabinWeight})`}
                      </Text>
                    </View>
                    {includedBaggage.checked > 0 && (
                      <View style={styles.includedItem}>
                        <Briefcase size={18} color={colors.success} variant="Bold" />
                        <Text style={styles.includedText}>
                          {includedBaggage.checked} checked bag{includedBaggage.checked > 1 ? 's' : ''}
                          {includedBaggage.checkedWeight && ` (${includedBaggage.checkedWeight})`}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              )}

              {/* Baggage Options */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Select your baggage</Text>
                {options.map(option => (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.optionCard,
                      localSelectedBags === option.id && styles.optionCardSelected,
                    ]}
                    onPress={() => handleSelect(option.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.optionLeft}>
                      <View style={[
                        styles.radioOuter,
                        localSelectedBags === option.id && styles.radioOuterSelected,
                      ]}>
                        {localSelectedBags === option.id && (
                          <View style={styles.radioInner} />
                        )}
                      </View>
                      <View style={styles.optionInfo}>
                        <Text style={[
                          styles.optionLabel,
                          localSelectedBags === option.id && styles.optionLabelSelected,
                        ]}>
                          {option.label}
                        </Text>
                        <Text style={styles.optionDescription}>{option.description}</Text>
                      </View>
                    </View>
                    <Text style={[
                      styles.optionPrice,
                      localSelectedBags === option.id && styles.optionPriceSelected,
                    ]}>
                      {option.price === 0 ? 'Included' : `+$${option.price.toFixed(2)}`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* No add-on options message */}
              {(!addOnOptions || addOnOptions.length === 0) && (
                <View style={styles.noOptionsMessage}>
                  <Text style={styles.noOptionsText}>
                    Additional baggage can be purchased at the airport or through the airline website after booking.
                  </Text>
                </View>
              )}
            </ScrollView>

            {/* Footer */}
            <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
              <View style={styles.footerInfo}>
                <Text style={styles.footerLabel}>Additional baggage cost</Text>
                <Text style={styles.footerPrice}>
                  {totalPrice === 0 ? 'No extra cost' : `+$${totalPrice.toFixed(2)}`}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleConfirm}
                activeOpacity={0.8}
              >
                <Text style={styles.confirmButtonText}>Confirm Selection</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
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
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  closeButton: {
    padding: spacing.xs,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  loadingText: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  includedSection: {
    backgroundColor: colors.success + '10',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.success + '30',
  },
  includedTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.success,
    marginBottom: spacing.sm,
  },
  includedItems: {
    gap: spacing.xs,
  },
  includedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  includedText: {
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
  section: {
    gap: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: colors.gray100,
  },
  optionCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '08',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.gray300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioOuterSelected: {
    borderColor: colors.primary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  optionInfo: {
    flex: 1,
  },
  optionLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  optionLabelSelected: {
    color: colors.primary,
  },
  optionDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  optionPrice: {
    fontSize: typography.fontSize.base,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  optionPriceSelected: {
    color: colors.primary,
  },
  noOptionsMessage: {
    backgroundColor: colors.gray50,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  noOptionsText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
    backgroundColor: colors.white,
  },
  footerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  footerLabel: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
  },
  footerPrice: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
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
    fontWeight: '700',
    color: colors.white,
  },
});
