/**
 * PROTECTION SHEET
 * 
 * Protection package selection for car rental.
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
import { CloseCircle, Shield, TickCircle } from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, typography, borderRadius } from '@/styles';
import { useCarStore, PROTECTION_PACKAGES, ProtectionPackage } from '../../../stores/useCarStore';

interface ProtectionSheetProps {
  visible: boolean;
  onClose: () => void;
}

export default function ProtectionSheet({ visible, onClose }: ProtectionSheetProps) {
  const insets = useSafeAreaInsets();
  const { selectedProtection, selectProtection, getRentalDays } = useCarStore();
  const rentalDays = getRentalDays();

  const handleSelect = (pkg: ProtectionPackage) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    selectProtection(pkg);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={[styles.container, { paddingBottom: insets.bottom + spacing.md }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <Shield size={24} color={colors.primary} variant="Bold" />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.title}>Protection Package</Text>
              <Text style={styles.subtitle}>Choose your coverage level</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <CloseCircle size={28} color={colors.gray500} variant="Bold" />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {PROTECTION_PACKAGES.map((pkg) => {
              const isSelected = selectedProtection?.id === pkg.id;
              const totalCost = pkg.pricePerDay * rentalDays;

              return (
                <TouchableOpacity
                  key={pkg.id}
                  style={[styles.packageCard, isSelected && styles.packageCardSelected]}
                  onPress={() => handleSelect(pkg)}
                  activeOpacity={0.7}
                >
                  {/* Selected Indicator - Top Right */}
                  {isSelected && (
                    <View style={styles.selectedIndicator}>
                      <TickCircle size={24} color={colors.primary} variant="Bold" />
                    </View>
                  )}

                  {/* Header Row */}
                  <View style={styles.packageHeader}>
                    <View style={styles.packageInfo}>
                      <View style={styles.packageTitleRow}>
                        <Text style={[styles.packageName, isSelected && styles.packageNameSelected]}>
                          {pkg.name}
                        </Text>
                        {pkg.recommended && (
                          <View style={styles.recommendedBadge}>
                            <Text style={styles.recommendedText}>Recommended</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.packageDesc}>{pkg.description}</Text>
                    </View>

                    <View style={styles.priceContainer}>
                      {pkg.pricePerDay === 0 ? (
                        <View style={{ marginRight: isSelected ? 28 : 0 }}>
                          <Text style={styles.includedText}>Included</Text>
                        </View>
                      ) : (
                        <>
                          <Text style={styles.priceAmount}>+${pkg.pricePerDay}</Text>
                          <Text style={styles.priceLabel}>/day</Text>
                        </>
                      )}
                    </View>
                  </View>

                  {/* Coverage List */}
                  <View style={styles.coverageList}>
                    {pkg.coverage.map((item, i) => (
                      <View key={i} style={styles.coverageItem}>
                        <TickCircle size={14} color={isSelected ? colors.primary : colors.success} variant="Bold" />
                        <Text style={styles.coverageText}>{item}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Excess Row */}
                  <View style={styles.excessRow}>
                    <Text style={styles.excessLabel}>Excess/Deductible:</Text>
                    <Text style={[styles.excessValue, pkg.excessAmount === 0 && styles.excessZero]}>
                      {pkg.excessAmount === 0 ? 'None' : `$${pkg.excessAmount}`}
                    </Text>
                  </View>

                  {/* Total Cost */}
                  {pkg.pricePerDay > 0 && (
                    <View style={styles.totalRow}>
                      <Text style={styles.totalLabel}>Total for {rentalDays} days:</Text>
                      <Text style={styles.totalValue}>${totalCost.toFixed(2)}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Confirm Button */}
          <TouchableOpacity style={styles.confirmButton} onPress={onClose}>
            <Text style={styles.confirmButtonText}>Confirm Selection</Text>
          </TouchableOpacity>
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
    backgroundColor: colors.gray50,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    height: '85%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    gap: spacing.md,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
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
  packageCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: colors.gray200,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  packageCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.white,
  },
  packageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  packageInfo: {
    flex: 1,
  },
  packageTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  packageName: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  packageNameSelected: {
    color: colors.primary,
  },
  recommendedBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  recommendedText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
  packageDesc: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  priceAmount: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  priceLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  includedText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.success,
  },
  coverageList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  coverageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  coverageText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  excessRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
  },
  excessLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  excessValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  excessZero: {
    color: colors.success,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  totalLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  totalValue: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  selectedIndicator: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: 12,
  },
  confirmButton: {
    backgroundColor: colors.primary,
    marginHorizontal: spacing.lg,
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
