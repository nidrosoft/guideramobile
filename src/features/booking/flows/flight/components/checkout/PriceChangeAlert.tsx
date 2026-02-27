/**
 * PRICE CHANGE ALERT
 * 
 * Alert shown when flight price has changed since search.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { Warning2, ArrowUp, ArrowDown } from 'iconsax-react-native';
import { colors, spacing, typography, borderRadius } from '@/styles';

interface PriceChangeAlertProps {
  visible: boolean;
  originalPrice: number;
  newPrice: number;
  currency: string;
  onAccept: () => void;
  onCancel: () => void;
}

export default function PriceChangeAlert({
  visible,
  originalPrice,
  newPrice,
  currency,
  onAccept,
  onCancel,
}: PriceChangeAlertProps) {
  const difference = newPrice - originalPrice;
  const isIncrease = difference > 0;
  const percentChange = Math.abs((difference / originalPrice) * 100).toFixed(1);

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={[styles.iconContainer, isIncrease ? styles.iconWarning : styles.iconSuccess]}>
            <Warning2 size={32} color={isIncrease ? colors.warning : colors.success} variant="Bold" />
          </View>

          <Text style={styles.title}>Price {isIncrease ? 'Increased' : 'Decreased'}</Text>
          
          <Text style={styles.description}>
            The price for this flight has changed since you started your search.
          </Text>

          <View style={styles.priceComparison}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Original price</Text>
              <Text style={styles.originalPrice}>{formatPrice(originalPrice)}</Text>
            </View>
            
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>New price</Text>
              <View style={styles.newPriceContainer}>
                <Text style={[styles.newPrice, isIncrease ? styles.priceUp : styles.priceDown]}>
                  {formatPrice(newPrice)}
                </Text>
                <View style={[styles.changeBadge, isIncrease ? styles.changeBadgeUp : styles.changeBadgeDown]}>
                  {isIncrease ? (
                    <ArrowUp size={12} color={colors.error} />
                  ) : (
                    <ArrowDown size={12} color={colors.success} />
                  )}
                  <Text style={[styles.changeText, isIncrease ? styles.changeTextUp : styles.changeTextDown]}>
                    {percentChange}%
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
              <Text style={styles.cancelButtonText}>Go Back</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.acceptButton} onPress={onAccept}>
              <Text style={styles.acceptButtonText}>Accept New Price</Text>
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
  container: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  iconWarning: {
    backgroundColor: `${colors.warning}15`,
  },
  iconSuccess: {
    backgroundColor: `${colors.success}15`,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold as any,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  description: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  priceComparison: {
    width: '100%',
    backgroundColor: colors.gray50,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  priceLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  originalPrice: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  newPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  newPrice: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold as any,
  },
  priceUp: {
    color: colors.error,
  },
  priceDown: {
    color: colors.success,
  },
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    gap: 2,
  },
  changeBadgeUp: {
    backgroundColor: `${colors.error}15`,
  },
  changeBadgeDown: {
    backgroundColor: `${colors.success}15`,
  },
  changeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium as any,
  },
  changeTextUp: {
    color: colors.error,
  },
  changeTextDown: {
    color: colors.success,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.gray100,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.textSecondary,
  },
  acceptButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  acceptButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.white,
  },
});
