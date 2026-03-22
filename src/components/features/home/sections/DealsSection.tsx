/**
 * DEALS SECTION
 *
 * Shows personalized deals from the GIL engine (user_deal_matches).
 * Falls back to deal_cache hot deals, then promotional cards if empty.
 * Powered by the Guidera Intelligence Layer.
 */

import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { spacing, fontFamily, borderRadius, typography, colors as staticColors } from '@/styles';

const { width: screenWidth } = Dimensions.get('window');
const DEAL_CARD_WIDTH = screenWidth * 0.62;
import { useTheme } from '@/context/ThemeContext';
import { useGilDeals } from '@/hooks/useDeals';
import type { PersonalizedDeal } from '@/services/deal';
import { useHomepageDataSafe, matchesCategory, useSectionVisibility } from '@/features/homepage';
import CategoryPills from '@/components/features/home/CategoryPills';
import { SkeletonDealCards } from '@/components/common/SkeletonLoader';

// Unique rich colors that alternate per card index — visually appealing variety
const CARD_COLORS = [
  '#2563EB',  // Royal Blue
  '#9333EA',  // Vivid Purple
  '#DC2626',  // Bold Red
  '#0891B2',  // Teal Cyan
  '#C026D3',  // Magenta
  '#059669',  // Emerald
  '#D97706',  // Warm Amber
  '#4F46E5',  // Indigo
  '#E11D48',  // Rose
  '#0D9488',  // Deep Teal
];

const DEAL_TYPE_ICONS: Record<string, string> = {
  flight: 'airplane',
  hotel: 'bed',
  experience: 'compass',
  car: 'car-sport',
};

const DEAL_TYPE_LABELS: Record<string, string> = {
  flight: 'FLIGHT',
  hotel: 'HOTEL',
  experience: 'EXPERIENCE',
  car: 'CAR',
};

const BADGE_DISPLAY: Record<string, string> = {
  record_low: 'LOWEST EVER',
  near_record_low: 'NEAR RECORD LOW',
  great_deal: 'GREAT DEAL',
  good_deal: 'GOOD DEAL',
  price_drop: 'PRICE DROP',
  new: 'NEW',
};

export default function DealsSection() {
  const { colors } = useTheme();
  const { deals, isLoading } = useGilDeals(undefined, 8);
  const homepageData = useHomepageDataSafe();
  const activeCategory = homepageData?.activeCategory ?? 'all';

  const filteredDeals = useMemo(() => {
    if (activeCategory === 'all') return deals;
    return deals.filter(deal =>
      matchesCategory(
        { title: deal.deal_title, type: deal.deal_type, deal_type: deal.deal_type, tags: [] },
        activeCategory
      )
    );
  }, [deals, activeCategory]);
  useSectionVisibility('deals', filteredDeals.length);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <SkeletonDealCards />
        <CategoryPills />
      </View>
    );
  }

  if (filteredDeals.length === 0) {
    return <CategoryPills />;
  }

  return (
    <>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        {filteredDeals.map((deal, index) => (
          <GilDealCard
            key={deal.id}
            deal={deal}
            cardColor={CARD_COLORS[index % CARD_COLORS.length]}
          />
        ))}
      </ScrollView>
      <CategoryPills />
    </>
  );
}

function GilDealCard({ deal, cardColor }: { deal: PersonalizedDeal; cardColor: string }) {
  const router = useRouter();
  const typeIcon = DEAL_TYPE_ICONS[deal.deal_type] || 'airplane';
  const typeLabel = DEAL_TYPE_LABELS[deal.deal_type] || 'DEAL';
  const badgeText = deal.deal_badges?.[0] ? BADGE_DISPLAY[deal.deal_badges[0]] : null;

  const handlePress = () => {
    router.push({
      pathname: '/deals/[id]' as any,
      params: {
        id: deal.deal_cache_id || deal.id,
        title: deal.deal_title,
        type: deal.deal_type,
      },
    });
  };

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: cardColor }]}
      onPress={handlePress}
      activeOpacity={0.85}
    >
      {/* Decorative circles */}
      <View style={styles.decoCircle1} />
      <View style={styles.decoCircle2} />
      <View style={styles.decoCircle3} />

      {/* Top row: Type pill + Badge */}
      <View style={styles.topRow}>
        <View style={styles.typePill}>
          <Ionicons name={typeIcon as any} size={13} color="#FFFFFF" />
          <Text style={styles.typePillText}>{typeLabel}</Text>
        </View>
        {badgeText && (
          <View style={styles.badgePill}>
            <Text style={styles.badgePillText}>{badgeText}</Text>
          </View>
        )}
      </View>

      {/* Title */}
      <Text style={styles.cardTitle} numberOfLines={2}>
        {deal.deal_title}
      </Text>

      {/* Price row: original (strikethrough) → current → Save $X */}
      <View style={styles.priceRow}>
        {deal.original_price && deal.original_price > deal.price_amount && (
          <Text style={styles.originalPrice}>
            ${Math.round(deal.original_price)}
          </Text>
        )}
        <Text style={styles.cardPrice}>
          ${Math.round(deal.price_amount)}
        </Text>
      </View>
      {deal.original_price && deal.original_price > deal.price_amount && (
        <Text style={styles.savingsText}>
          Save ${Math.round(deal.original_price - deal.price_amount)}
        </Text>
      )}

      {/* Footer */}
      <View style={styles.cardFooter}>
        <Text style={styles.footerText} numberOfLines={1}>
          {deal.match_reasons?.[0] || 'View Details'}
        </Text>
        <View style={styles.arrowCircle}>
          <Ionicons name="arrow-forward" size={14} color={cardColor} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    gap: 14,
  },
  loadingContainer: {
    minHeight: 180,
  },
  card: {
    width: DEAL_CARD_WIDTH,
    height: 170,
    borderRadius: borderRadius.xl,
    padding: 16,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  decoCircle1: {
    position: 'absolute',
    top: -18,
    right: 28,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  decoCircle2: {
    position: 'absolute',
    bottom: 25,
    right: -10,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  decoCircle3: {
    position: 'absolute',
    top: 45,
    right: 60,
    width: 24,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  typePillText: {
    fontFamily: fontFamily.bold,
    fontSize: typography.fontSize.captionSm,
    color: staticColors.white,
    letterSpacing: 0.5,
  },
  badgePill: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  badgePillText: {
    fontFamily: fontFamily.bold,
    fontSize: 9,
    color: staticColors.white,
    letterSpacing: 0.8,
  },
  cardTitle: {
    fontFamily: fontFamily.semibold,
    fontSize: typography.fontSize.bodyLg,
    color: staticColors.white,
    lineHeight: 19,
    maxWidth: '85%',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  cardPrice: {
    fontFamily: fontFamily.display,
    fontSize: 28,
    color: staticColors.white,
  },
  originalPrice: {
    fontFamily: fontFamily.regular,
    fontSize: typography.fontSize.body,
    color: 'rgba(255,200,200,0.9)',
    textDecorationLine: 'line-through',
  },
  savingsText: {
    fontFamily: fontFamily.bold,
    fontSize: typography.fontSize.caption,
    color: '#86EFAC',
    marginTop: -2,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerText: {
    fontFamily: fontFamily.medium,
    fontSize: typography.fontSize.caption,
    color: 'rgba(255,255,255,0.85)',
    flex: 1,
    marginRight: 10,
  },
  arrowCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: staticColors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
