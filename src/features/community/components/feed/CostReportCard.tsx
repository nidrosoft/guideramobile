/**
 * COST REPORT CARD
 * 
 * Structured budget breakdown display for cost_report post type.
 * Shows itemized costs with category icons and total.
 */

import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  Airplane,
  Building,
  Coffee,
  Bus,
  Activity,
  ShoppingBag,
  Wallet2,
} from 'iconsax-react-native';
import { useTheme } from '@/context/ThemeContext';
import { spacing, typography, borderRadius } from '@/styles';
import { CostReportItem } from '../../types/feed.types';

const CATEGORY_ICONS: Record<string, any> = {
  flights: Airplane,
  hotel: Building,
  food: Coffee,
  transport: Bus,
  activities: Activity,
  shopping: ShoppingBag,
};

interface CostReportCardProps {
  items: CostReportItem[];
}

function CostReportCard({ items }: CostReportCardProps) {
  const { colors: tc } = useTheme();

  const total = items.reduce((sum, item) => sum + item.amount, 0);
  const currency = items[0]?.currency || 'USD';

  const formatAmount = (amount: number) => {
    return `$${amount.toLocaleString()}`;
  };

  return (
    <View style={[styles.container, { backgroundColor: tc.bgCard, borderColor: tc.borderSubtle }]}>
      <View style={[styles.headerRow, { borderBottomColor: tc.borderSubtle }]}>
        <Wallet2 size={16} color="#F97316" variant="Bold" />
        <Text style={[styles.headerText, { color: tc.textPrimary }]}>Budget Breakdown</Text>
      </View>

      {items.map((item, index) => {
        const Icon = CATEGORY_ICONS[item.category] || Wallet2;
        return (
          <View
            key={index}
            style={[
              styles.itemRow,
              index < items.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: tc.borderSubtle },
            ]}
          >
            <View style={styles.itemLeft}>
              <Icon size={15} color={tc.textSecondary} variant="Linear" />
              <Text style={[styles.itemLabel, { color: tc.textSecondary }]}>{item.label}</Text>
            </View>
            <Text style={[styles.itemAmount, { color: tc.textPrimary }]}>
              {formatAmount(item.amount)}
            </Text>
          </View>
        );
      })}

      <View style={[styles.totalRow, { borderTopColor: tc.borderMedium }]}>
        <Text style={[styles.totalLabel, { color: tc.textPrimary }]}>Total</Text>
        <Text style={[styles.totalAmount, { color: '#F97316' }]}>
          {formatAmount(total)}
        </Text>
      </View>

      <View style={styles.perDayRow}>
        <Text style={[styles.perDayText, { color: tc.textTertiary }]}>
          ~{formatAmount(Math.round(total / 3))}/day
        </Text>
      </View>
    </View>
  );
}

export default memo(CostReportCard);

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerText: {
    ...typography.heading3,
    fontSize: 13,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  itemLabel: {
    ...typography.bodySm,
  },
  itemAmount: {
    ...typography.bodySm,
    fontWeight: '600',
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
  },
  totalLabel: {
    ...typography.heading3,
  },
  totalAmount: {
    ...typography.heading3,
    fontSize: 16,
  },
  perDayRow: {
    alignItems: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  perDayText: {
    ...typography.captionSm,
  },
});
