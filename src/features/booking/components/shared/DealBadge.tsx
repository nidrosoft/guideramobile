/**
 * DEAL BADGE
 *
 * Shows deal quality indicators like "Best Price", "Price Drop", etc.
 * Used across all deal screens and result cards.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { DealBadge as DealBadgeType } from '@/services/deal';

interface DealBadgeProps {
  badge: DealBadgeType;
  size?: 'sm' | 'md';
}

const BADGE_CONFIG: Record<
  DealBadgeType,
  { label: string; icon: string; bg: string; text: string }
> = {
  best_price: {
    label: 'Best Price',
    icon: 'trophy',
    bg: '#10B981',
    text: '#FFFFFF',
  },
  price_drop: {
    label: 'Price Drop',
    icon: 'trending-down',
    bg: '#EF4444',
    text: '#FFFFFF',
  },
  near_record_low: {
    label: 'Near Record Low',
    icon: 'flame',
    bg: '#F59E0B',
    text: '#FFFFFF',
  },
  record_low: {
    label: 'Record Low',
    icon: 'flash',
    bg: '#8B5CF6',
    text: '#FFFFFF',
  },
  trending: {
    label: 'Trending',
    icon: 'trending-up',
    bg: '#3B82F6',
    text: '#FFFFFF',
  },
  limited_availability: {
    label: 'Limited',
    icon: 'time',
    bg: '#F97316',
    text: '#FFFFFF',
  },
  editors_pick: {
    label: "Editor's Pick",
    icon: 'star',
    bg: '#6366F1',
    text: '#FFFFFF',
  },
};

export default function DealBadge({ badge, size = 'sm' }: DealBadgeProps) {
  const config = BADGE_CONFIG[badge];
  if (!config) return null;

  const isSmall = size === 'sm';

  return (
    <View style={[styles.container, { backgroundColor: config.bg }]}>
      <Ionicons
        name={config.icon as any}
        size={isSmall ? 10 : 12}
        color={config.text}
      />
      <Text
        style={[
          styles.label,
          { color: config.text, fontSize: isSmall ? 10 : 12 },
        ]}
      >
        {config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  label: {
    fontFamily: 'Rubik-Medium',
    letterSpacing: 0.2,
  },
});
