/**
 * CHECKOUT BOTTOM BAR
 * 
 * Fixed bottom bar with price summary and book button.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Lock1 } from 'iconsax-react-native';
import { colors, spacing, typography, borderRadius } from '@/styles';
import { PricingSummary } from '../../types/checkout.types';

interface CheckoutBottomBarProps {
  pricing: PricingSummary;
  onBook: () => void;
  canBook: boolean;
  isProcessing: boolean;
}

export default function CheckoutBottomBar({
  pricing,
  onBook,
  canBook,
  isProcessing,
}: CheckoutBottomBarProps) {
  const insets = useSafeAreaInsets();

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: pricing.currency,
    }).format(amount);
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + spacing.md }]}>
      {/* Price Breakdown */}
      <View style={styles.priceSection}>
        <View style={styles.priceRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalPrice}>{formatPrice(pricing.total)}</Text>
        </View>
        
        {(pricing.baggageFees > 0 || pricing.seatFees > 0) && (
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownText}>
              Base: {formatPrice(pricing.baseFare)}
              {pricing.baggageFees > 0 && ` + Bags: ${formatPrice(pricing.baggageFees)}`}
              {pricing.seatFees > 0 && ` + Seats: ${formatPrice(pricing.seatFees)}`}
            </Text>
          </View>
        )}
      </View>

      {/* Book Button */}
      <TouchableOpacity
        style={[styles.bookButton, !canBook && styles.bookButtonDisabled]}
        onPress={onBook}
        disabled={!canBook || isProcessing}
        activeOpacity={0.8}
      >
        {isProcessing ? (
          <ActivityIndicator size="small" color={colors.white} />
        ) : (
          <>
            <Lock1 size={18} color={colors.white} variant="Bold" />
            <Text style={styles.bookButtonText}>
              {canBook ? 'Book Securely' : 'Complete All Details'}
            </Text>
          </>
        )}
      </TouchableOpacity>

      {/* Security Note */}
      <View style={styles.securityNote}>
        <Lock1 size={12} color={colors.textSecondary} />
        <Text style={styles.securityText}>
          Your payment is secured with 256-bit SSL encryption
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  priceSection: {
    marginBottom: spacing.md,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
  },
  totalPrice: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold as any,
    color: colors.textPrimary,
  },
  breakdownRow: {
    marginTop: 4,
  },
  breakdownText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  bookButtonDisabled: {
    backgroundColor: colors.gray300,
  },
  bookButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.white,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
    gap: 4,
  },
  securityText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
});
