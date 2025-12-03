/**
 * PRICE BREAKDOWN
 * 
 * Displays itemized pricing with base price, taxes, fees, and total.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { ArrowDown2, ArrowUp2, TickCircle, PercentageCircle } from 'iconsax-react-native';
import Animated, { 
  useAnimatedStyle, 
  withTiming,
  useSharedValue,
} from 'react-native-reanimated';
import { colors, spacing, typography, borderRadius } from '@/styles';
import { PriceBreakdown as PriceBreakdownType } from '../../types/booking.types';
import { usePricing } from '../../hooks/usePricing';

interface PriceBreakdownProps {
  breakdown: PriceBreakdownType;
  showDetails?: boolean;
  collapsible?: boolean;
  variant?: 'default' | 'compact' | 'card';
  passengers?: number;
  nights?: number;
  days?: number;
}

interface LineItemProps {
  label: string;
  amount: number;
  currency: string;
  isDiscount?: boolean;
  isTotal?: boolean;
  subLabel?: string;
}

function LineItem({ 
  label, 
  amount, 
  currency, 
  isDiscount = false, 
  isTotal = false,
  subLabel,
}: LineItemProps) {
  const { formatPrice } = usePricing({ currency });
  
  return (
    <View style={[styles.lineItem, isTotal && styles.lineItemTotal]}>
      <View style={styles.lineItemLeft}>
        <Text style={[
          styles.lineItemLabel,
          isTotal && styles.lineItemLabelTotal,
          isDiscount && styles.lineItemLabelDiscount,
        ]}>
          {label}
        </Text>
        {subLabel && (
          <Text style={styles.lineItemSubLabel}>{subLabel}</Text>
        )}
      </View>
      <Text style={[
        styles.lineItemAmount,
        isTotal && styles.lineItemAmountTotal,
        isDiscount && styles.lineItemAmountDiscount,
      ]}>
        {isDiscount ? '-' : ''}{formatPrice(amount)}
      </Text>
    </View>
  );
}

export default function PriceBreakdown({
  breakdown,
  showDetails = true,
  collapsible = true,
  variant = 'default',
  passengers,
  nights,
  days,
}: PriceBreakdownProps) {
  const [isExpanded, setIsExpanded] = useState(!collapsible);
  const { formatPrice, calculatePerPerson, calculatePerNight, calculatePerDay } = usePricing({ 
    currency: breakdown.currency 
  });
  
  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };
  
  // Calculate per-unit prices if applicable
  const perPersonPrice = passengers ? calculatePerPerson(breakdown.total, passengers) : null;
  const perNightPrice = nights ? calculatePerNight(breakdown.total, nights) : null;
  const perDayPrice = days ? calculatePerDay(breakdown.total, days) : null;
  
  const hasDiscount = breakdown.discount > 0;
  const hasExtras = breakdown.extras > 0;
  
  if (variant === 'compact') {
    return (
      <View style={styles.compactContainer}>
        <View style={styles.compactRow}>
          <Text style={styles.compactLabel}>Total</Text>
          <Text style={styles.compactTotal}>{formatPrice(breakdown.total)}</Text>
        </View>
        {perPersonPrice && (
          <Text style={styles.compactSubtext}>
            {formatPrice(perPersonPrice)} per person
          </Text>
        )}
      </View>
    );
  }
  
  return (
    <View style={[
      styles.container,
      variant === 'card' && styles.containerCard,
    ]}>
      {/* Header with toggle */}
      {collapsible && (
        <TouchableOpacity 
          style={styles.header} 
          onPress={toggleExpanded}
          activeOpacity={0.7}
        >
          <Text style={styles.headerTitle}>Price Details</Text>
          {isExpanded ? (
            <ArrowUp2 size={20} color={colors.textSecondary} />
          ) : (
            <ArrowDown2 size={20} color={colors.textSecondary} />
          )}
        </TouchableOpacity>
      )}
      
      {/* Expanded Details */}
      {(isExpanded || !collapsible) && showDetails && (
        <View style={styles.details}>
          {/* Base Price */}
          <LineItem
            label="Base fare"
            amount={breakdown.basePrice}
            currency={breakdown.currency}
            subLabel={passengers ? `${passengers} traveler${passengers > 1 ? 's' : ''}` : undefined}
          />
          
          {/* Extras */}
          {hasExtras && (
            <LineItem
              label="Extras & add-ons"
              amount={breakdown.extras}
              currency={breakdown.currency}
            />
          )}
          
          {/* Taxes */}
          <LineItem
            label="Taxes & fees"
            amount={breakdown.taxes + breakdown.fees}
            currency={breakdown.currency}
          />
          
          {/* Discount */}
          {hasDiscount && (
            <View style={styles.discountRow}>
              <View style={styles.discountIcon}>
                <PercentageCircle size={16} color={colors.success} />
              </View>
              <LineItem
                label="Discount applied"
                amount={breakdown.discount}
                currency={breakdown.currency}
                isDiscount
              />
            </View>
          )}
          
          <View style={styles.divider} />
        </View>
      )}
      
      {/* Total */}
      <View style={styles.totalSection}>
        <LineItem
          label="Total"
          amount={breakdown.total}
          currency={breakdown.currency}
          isTotal
        />
        
        {/* Per-unit breakdown */}
        {(perPersonPrice || perNightPrice || perDayPrice) && (
          <View style={styles.perUnitRow}>
            {perPersonPrice && (
              <Text style={styles.perUnitText}>
                {formatPrice(perPersonPrice)}/person
              </Text>
            )}
            {perNightPrice && (
              <Text style={styles.perUnitText}>
                {formatPrice(perNightPrice)}/night
              </Text>
            )}
            {perDayPrice && (
              <Text style={styles.perUnitText}>
                {formatPrice(perDayPrice)}/day
              </Text>
            )}
          </View>
        )}
      </View>
      
      {/* Savings badge */}
      {hasDiscount && (
        <View style={styles.savingsBadge}>
          <TickCircle size={16} color={colors.success} variant="Bold" />
          <Text style={styles.savingsText}>
            You're saving {formatPrice(breakdown.discount)}!
          </Text>
        </View>
      )}
    </View>
  );
}

// Compact price summary for sticky footers
interface PriceSummaryProps {
  total: number;
  currency: string;
  label?: string;
  perPerson?: number;
}

export function PriceSummary({ 
  total, 
  currency, 
  label = 'Total',
  perPerson,
}: PriceSummaryProps) {
  const { formatPrice } = usePricing({ currency });
  
  return (
    <View style={styles.summaryContainer}>
      <View>
        <Text style={styles.summaryLabel}>{label}</Text>
        {perPerson && (
          <Text style={styles.summarySubtext}>
            {formatPrice(perPerson)}/person
          </Text>
        )}
      </View>
      <Text style={styles.summaryTotal}>{formatPrice(total)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
  },
  containerCard: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.gray200,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    backgroundColor: colors.gray50,
  },
  headerTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  details: {
    padding: spacing.md,
    paddingTop: spacing.sm,
  },
  lineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  lineItemTotal: {
    paddingVertical: spacing.sm,
  },
  lineItemLeft: {
    flex: 1,
  },
  lineItemLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  lineItemLabelTotal: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  lineItemLabelDiscount: {
    color: colors.success,
  },
  lineItemSubLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.gray400,
    marginTop: 2,
  },
  lineItemAmount: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.medium,
  },
  lineItemAmountTotal: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  lineItemAmountDiscount: {
    color: colors.success,
  },
  discountRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  discountIcon: {
    marginRight: spacing.xs,
  },
  divider: {
    height: 1,
    backgroundColor: colors.gray200,
    marginVertical: spacing.sm,
  },
  totalSection: {
    padding: spacing.md,
    backgroundColor: colors.gray50,
  },
  perUnitRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  perUnitText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  savingsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.sm,
    backgroundColor: colors.success + '10',
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderRadius: borderRadius.md,
  },
  savingsText: {
    fontSize: typography.fontSize.sm,
    color: colors.success,
    fontWeight: typography.fontWeight.medium,
  },
  // Compact variant
  compactContainer: {
    alignItems: 'flex-end',
  },
  compactRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
  },
  compactLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  compactTotal: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  compactSubtext: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  // Summary styles
  summaryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  summarySubtext: {
    fontSize: typography.fontSize.xs,
    color: colors.gray400,
  },
  summaryTotal: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
});
