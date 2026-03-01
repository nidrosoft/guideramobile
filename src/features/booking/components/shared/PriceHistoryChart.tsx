/**
 * PRICE HISTORY CHART
 *
 * Mini sparkline chart showing price trends for a route.
 * Renders a simple SVG-like view using RN primitives.
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import type { PriceHistoryPoint } from '@/services/deal';

interface PriceHistoryChartProps {
  data: PriceHistoryPoint[];
  currentPrice: number;
  currency?: string;
  height?: number;
}

export default function PriceHistoryChart({
  data,
  currentPrice,
  currency = 'USD',
  height = 60,
}: PriceHistoryChartProps) {
  const { colors } = useTheme();

  const stats = useMemo(() => {
    if (data.length === 0) return null;

    const prices = data.map((d) => d.price_amount);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const avg = prices.reduce((s, p) => s + p, 0) / prices.length;
    const range = max - min || 1;

    // Normalize prices to 0-1 for bar heights
    const bars = data.map((d) => ({
      value: (d.price_amount - min) / range,
      isBelow: d.price_amount <= avg,
    }));

    const pctVsAvg = ((currentPrice - avg) / avg) * 100;
    const isGoodDeal = pctVsAvg < -10;
    const isBadDeal = pctVsAvg > 10;

    return { min, max, avg, bars, pctVsAvg, isGoodDeal, isBadDeal };
  }, [data, currentPrice]);

  if (!stats || data.length < 3) {
    return (
      <View style={[styles.empty, { backgroundColor: colors.bgCard }]}>
        <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
          Not enough price data yet
        </Text>
      </View>
    );
  }

  const trendColor = stats.isGoodDeal
    ? '#10B981'
    : stats.isBadDeal
      ? '#EF4444'
      : colors.textSecondary;

  const formatPrice = (amount: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);

  return (
    <View style={[styles.container, { backgroundColor: colors.bgCard }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textSecondary }]}>
          Price Trend (30d)
        </Text>
        <Text style={[styles.trend, { color: trendColor }]}>
          {stats.pctVsAvg > 0 ? '+' : ''}
          {stats.pctVsAvg.toFixed(0)}% vs avg
        </Text>
      </View>

      {/* Bar chart */}
      <View style={[styles.chart, { height }]}>
        {stats.bars.map((bar, i) => (
          <View
            key={i}
            style={[
              styles.bar,
              {
                height: Math.max(4, bar.value * height),
                backgroundColor: bar.isBelow ? '#10B981' : colors.borderSubtle,
              },
            ]}
          />
        ))}
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={[styles.statLabel, { color: colors.textTertiary }]}>
            Low
          </Text>
          <Text style={[styles.statValue, { color: '#10B981' }]}>
            {formatPrice(stats.min)}
          </Text>
        </View>
        <View style={styles.stat}>
          <Text style={[styles.statLabel, { color: colors.textTertiary }]}>
            Avg
          </Text>
          <Text style={[styles.statValue, { color: colors.textSecondary }]}>
            {formatPrice(stats.avg)}
          </Text>
        </View>
        <View style={styles.stat}>
          <Text style={[styles.statLabel, { color: colors.textTertiary }]}>
            High
          </Text>
          <Text style={[styles.statValue, { color: '#EF4444' }]}>
            {formatPrice(stats.max)}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  empty: {
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: 'Rubik-Regular',
    fontSize: 13,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontFamily: 'Rubik-Medium',
    fontSize: 13,
  },
  trend: {
    fontFamily: 'Rubik-SemiBold',
    fontSize: 13,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
  },
  bar: {
    flex: 1,
    borderRadius: 2,
    minHeight: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stat: {
    alignItems: 'center',
  },
  statLabel: {
    fontFamily: 'Rubik-Regular',
    fontSize: 11,
  },
  statValue: {
    fontFamily: 'Rubik-Medium',
    fontSize: 13,
    marginTop: 1,
  },
});
