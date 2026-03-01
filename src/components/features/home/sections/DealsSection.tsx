/**
 * DEALS SECTION
 *
 * Shows hot deals from the deal_cache table.
 * Falls back to promotional cards if no cached deals exist.
 */

import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Linking } from 'react-native';
import { spacing, typography, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { useHotDeals } from '@/hooks/useDeals';
import { DealBadge } from '@/features/booking/components/shared';
import { getProviderDisplayName, getProviderColor } from '@/services/deal';
import type { CachedDeal, DealBadge as DealBadgeType } from '@/services/deal';
import CategoryPills from '@/components/features/home/CategoryPills';

export default function DealsSection() {
  const { colors: tc } = useTheme();
  const { deals, isLoading } = useHotDeals(undefined, 8);

  if (deals.length === 0 && !isLoading) {
    return <CategoryPills />;
  }

  return (
    <>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        {deals.map((deal) => (
          <HotDealCard key={deal.id} deal={deal} colors={tc} />
        ))}
      </ScrollView>
      <CategoryPills />
    </>
  );
}

function HotDealCard({ deal, colors: tc }: { deal: CachedDeal; colors: any }) {
  const snapshot = deal.deal_data as any;
  const providerColor = getProviderColor(deal.provider);
  const badges = (deal.deal_badges || []) as DealBadgeType[];

  const handlePress = async () => {
    const deepLink = snapshot?.bookingUrl || snapshot?.deep_link;
    if (deepLink) {
      await Linking.openURL(deepLink);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: providerColor }]}
      onPress={handlePress}
      activeOpacity={0.85}
    >
      <View style={styles.cardDecoCircle} />

      {/* Badges */}
      {badges.length > 0 && (
        <View style={styles.badgeRow}>
          {badges.slice(0, 2).map((b, i) => (
            <DealBadge key={i} badge={b} size="sm" />
          ))}
        </View>
      )}

      {/* Title */}
      <Text style={styles.cardTitle} numberOfLines={2}>
        {snapshot?.title || deal.route_key}
      </Text>

      {/* Price */}
      <Text style={styles.cardPrice}>
        ${Math.round(deal.price_amount)}
      </Text>

      {/* Provider */}
      <View style={styles.cardFooter}>
        <Text style={styles.cardProvider}>
          {getProviderDisplayName(deal.provider)}
        </Text>
        <Ionicons name="open-outline" size={14} color="rgba(255,255,255,0.7)" />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  card: {
    width: 220,
    height: 160,
    borderRadius: 20,
    padding: 16,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  cardDecoCircle: {
    position: 'absolute',
    top: -15,
    right: 30,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 4,
  },
  cardTitle: {
    fontFamily: 'Rubik-SemiBold',
    fontSize: 15,
    color: '#FFFFFF',
    lineHeight: 20,
  },
  cardPrice: {
    fontFamily: 'HostGrotesk-Bold',
    fontSize: 28,
    color: '#FFFFFF',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardProvider: {
    fontFamily: 'Rubik-Regular',
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
});
