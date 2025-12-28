/**
 * EXTRAS SHEET
 * 
 * Add-ons selection for car rental (GPS, child seats, etc.).
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CloseCircle, Add, Minus, Gps, User, Wifi, Shield } from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, typography, borderRadius } from '@/styles';
import { useCarStore, AVAILABLE_EXTRAS, CarExtra } from '../../../stores/useCarStore';

interface ExtrasSheetProps {
  visible: boolean;
  onClose: () => void;
}

export default function ExtrasSheet({ visible, onClose }: ExtrasSheetProps) {
  const insets = useSafeAreaInsets();
  const { selectedExtras, toggleExtra, setExtraQuantity, getRentalDays } = useCarStore();
  const rentalDays = getRentalDays();

  const getExtraIcon = (iconName: string) => {
    switch (iconName) {
      case 'gps': return Gps;
      case 'user': return User;
      case 'wifi': return Wifi;
      default: return Shield;
    }
  };

  const isExtraSelected = (extraId: string) => {
    return selectedExtras.some(e => e.extra.id === extraId);
  };

  const getExtraQuantity = (extraId: string) => {
    const found = selectedExtras.find(e => e.extra.id === extraId);
    return found?.quantity || 0;
  };

  const handleToggle = (extra: CarExtra) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleExtra(extra);
  };

  const handleQuantityChange = (extraId: string, delta: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const current = getExtraQuantity(extraId);
    setExtraQuantity(extraId, current + delta);
  };

  const totalExtrasCost = selectedExtras.reduce(
    (sum, { extra, quantity }) => sum + (extra.pricePerDay * quantity * rentalDays),
    0
  );

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={[styles.container, { paddingBottom: insets.bottom + spacing.md }]}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Extras & Add-ons</Text>
              <Text style={styles.subtitle}>Enhance your rental experience</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <CloseCircle size={28} color={colors.gray500} variant="Bold" />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {AVAILABLE_EXTRAS.map((extra) => {
              const Icon = getExtraIcon(extra.icon);
              const isSelected = isExtraSelected(extra.id);
              const quantity = getExtraQuantity(extra.id);
              const totalCost = extra.pricePerDay * quantity * rentalDays;

              return (
                <View
                  key={extra.id}
                  style={[styles.extraCard, isSelected && styles.extraCardSelected]}
                >
                  <TouchableOpacity
                    style={styles.extraMain}
                    onPress={() => handleToggle(extra)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.extraIcon, isSelected && styles.extraIconSelected]}>
                      <Icon size={20} color={isSelected ? colors.primary : colors.gray500} />
                    </View>
                    <View style={styles.extraInfo}>
                      <Text style={[styles.extraName, isSelected && styles.extraNameSelected]}>
                        {extra.name}
                      </Text>
                      <Text style={styles.extraDesc}>{extra.description}</Text>
                    </View>
                    <View style={styles.extraPrice}>
                      <Text style={styles.priceAmount}>${extra.pricePerDay}</Text>
                      <Text style={styles.priceLabel}>/day</Text>
                    </View>
                  </TouchableOpacity>

                  {/* Quantity Selector */}
                  {isSelected && extra.maxQuantity > 1 && (
                    <View style={styles.quantityRow}>
                      <Text style={styles.quantityLabel}>Quantity:</Text>
                      <View style={styles.quantitySelector}>
                        <TouchableOpacity
                          style={[styles.quantityButton, quantity <= 1 && styles.quantityButtonDisabled]}
                          onPress={() => handleQuantityChange(extra.id, -1)}
                          disabled={quantity <= 1}
                        >
                          <Minus size={16} color={quantity <= 1 ? colors.gray400 : colors.primary} />
                        </TouchableOpacity>
                        <Text style={styles.quantityValue}>{quantity}</Text>
                        <TouchableOpacity
                          style={[styles.quantityButton, quantity >= extra.maxQuantity && styles.quantityButtonDisabled]}
                          onPress={() => handleQuantityChange(extra.id, 1)}
                          disabled={quantity >= extra.maxQuantity}
                        >
                          <Add size={16} color={quantity >= extra.maxQuantity ? colors.gray400 : colors.primary} />
                        </TouchableOpacity>
                      </View>
                      <Text style={styles.totalCost}>${totalCost.toFixed(2)}</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            {totalExtrasCost > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total extras for {rentalDays} days:</Text>
                <Text style={styles.totalValue}>${totalExtrasCost.toFixed(2)}</Text>
              </View>
            )}
            <TouchableOpacity style={styles.confirmButton} onPress={onClose}>
              <Text style={styles.confirmButtonText}>
                {selectedExtras.length > 0 ? 'Confirm Selection' : 'Skip Extras'}
              </Text>
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
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    height: '80%',
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
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  extraCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.gray200,
    overflow: 'hidden',
  },
  extraCardSelected: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}05`,
  },
  extraMain: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  extraIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  extraIconSelected: {
    backgroundColor: `${colors.primary}15`,
  },
  extraInfo: {
    flex: 1,
  },
  extraName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  extraNameSelected: {
    color: colors.primary,
  },
  extraDesc: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  extraPrice: {
    alignItems: 'flex-end',
  },
  priceAmount: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  priceLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
    paddingTop: spacing.sm,
  },
  quantityLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonDisabled: {
    backgroundColor: colors.gray100,
  },
  quantityValue: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    minWidth: 24,
    textAlign: 'center',
  },
  totalCost: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
    paddingTop: spacing.md,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  totalLabel: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
  },
  totalValue: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  confirmButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
});
