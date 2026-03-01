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
import { spacing, typography, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
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
  const { colors } = useTheme();
  
  return (
    <View style={[styles.lineItem, isTotal && styles.lineItemTotal]}>
      <View style={styles.lineItemLeft}>
        <Text style={[
          styles.lineItemLabel,
          { color: colors.textSecondary },
          isTotal && [styles.lineItemLabelTotal, { color: colors.textPrimary }],
          isDiscount && { color: colors.success },
        ]}>
          {label}
        </Text>
        {subLabel && (
          <Text style={[styles.lineItemSubLabel, { color: colors.textSecondary }]}>{subLabel}</Text>
        )}
      </View>
      <Text style={[
        styles.lineItemAmount,
        { color: colors.textPrimary },
        isTotal && styles.lineItemAmountTotal,
        isDiscount && { color: colors.success },
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
  const { colors } = useTheme();
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
          <Text style={[styles.compactLabel, { color: colors.textSecondary }]}>Total</Text>
          <Text style={[styles.compactTotal, { color: colors.textPrimary }]}>{formatPrice(breakdown.total)}</Text>
        </View>
        {perPersonPrice && (
          <Text style={[styles.compactSubtext, { color: colors.textSecondary }]}>
            {formatPrice(perPersonPrice)} per person
          </Text>
        )}
      </View>
    );
  }
  
  return (
    <View style={[
      styles.container,
      { backgroundColor: colors.bgElevated },
      variant === 'card' && [styles.containerCard, { borderColor: colors.borderSubtle }],
    ]}>
      {/* Header with toggle */}
      {collapsible && (
        <TouchableOpacity 
          style={[styles.header, { backgroundColor: colors.bgCard }]} 
          onPress={toggleExpanded}
          activeOpacity={0.7}
        >
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Price Details</Text>
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
          
          <View style={[styles.divider, { backgroundColor: colors.borderSubtle }]} />
        </View>
      )}
      
      {/* Total */}
      <View style={[styles.totalSection, { backgroundColor: colors.bgCard }]}>
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
              <Text style={[styles.perUnitText, { color: colors.textSecondary }]}>
                {formatPrice(perPersonPrice)}/person
              </Text>
            )}
            {perNightPrice && (
              <Text style={[styles.perUnitText, { color: colors.textSecondary }]}>
                {formatPrice(perNightPrice)}/night
              </Text>
            )}
            {perDayPrice && (
              <Text style={[styles.perUnitText, { color: colors.textSecondary }]}>
                {formatPrice(perDayPrice)}/day
              </Text>
            )}
          </View>
        )}
      </View>
      
      {/* Savings badge */}
      {hasDiscount && (
        <View style={[styles.savingsBadge, { backgroundColor: colors.success + '10' }]}>
          <TickCircle size={16} color={colors.success} variant="Bold" />
          <Text style={[styles.savingsText, { color: colors.success }]}>
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
  const { colors } = useTheme();
  
  return (
    <View style={styles.summaryContainer}>
      <View>
        <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>{label}</Text>
        {perPerson && (
          <Text style={[styles.summarySubtext, { color: colors.textSecondary }]}>
            {formatPrice(perPerson)}/person
          </Text>
        )}
      </View>
      <Text style={[styles.summaryTotal, { color: colors.textPrimary }]}>{formatPrice(total)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
  },
  containerCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  headerTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
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
  },
  lineItemLabelTotal: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
  },
  lineItemSubLabel: {
    fontSize: typography.fontSize.xs,
    marginTop: 2,
  },
  lineItemAmount: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  lineItemAmountTotal: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
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
    marginVertical: spacing.sm,
  },
  totalSection: {
    padding: spacing.md,
  },
  perUnitRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  perUnitText: {
    fontSize: typography.fontSize.xs,
  },
  savingsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.sm,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderRadius: borderRadius.md,
  },
  savingsText: {
    fontSize: typography.fontSize.sm,
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
  },
  compactTotal: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
  },
  compactSubtext: {
    fontSize: typography.fontSize.xs,
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
  },
  summarySubtext: {
    fontSize: typography.fontSize.xs,
  },
  summaryTotal: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
  },
});
