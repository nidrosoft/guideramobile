/**
 * VIEW ALL DEALS PAGE
 *
 * Shows all deals from the GIL engine with category filtering.
 * Users can filter by: All, Flights, Hotels, Experiences.
 * Each deal card navigates to the deal detail screen.
 */

import { View, Text, StyleSheet, ScrollView, FlatList, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { ArrowLeft2, Star1 } from 'iconsax-react-native';
import { typography, spacing, fontFamily } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { useGilDeals } from '@/hooks/useDeals';
import type { PersonalizedDeal, DealType } from '@/services/deal';
import { SkeletonDealListCards } from '@/components/common/SkeletonLoader';

const PRIMARY = '#3FC39E';

const CATEGORIES = [
  { id: 'all', label: 'All Deals', icon: 'grid-outline' },
  { id: 'flight', label: 'Flights', icon: 'airplane-outline' },
  { id: 'hotel', label: 'Hotels', icon: 'bed-outline' },
  { id: 'experience', label: 'Experiences', icon: 'compass-outline' },
];

const DEAL_TYPE_COLORS: Record<string, string> = {
  flight: '#2563EB',
  hotel: '#9333EA',
  experience: '#D97706',
  car: '#059669',
};

const DEAL_TYPE_ICONS: Record<string, string> = {
  flight: 'airplane',
  hotel: 'bed',
  experience: 'compass',
  car: 'car-sport',
};

const BADGE_MAP: Record<string, { text: string; bg: string; fg: string }> = {
  record_low: { text: 'LOWEST EVER', bg: '#FEE2E2', fg: '#DC2626' },
  near_record_low: { text: 'NEAR RECORD LOW', bg: '#FFEDD5', fg: '#EA580C' },
  great_deal: { text: 'GREAT DEAL', bg: '#D1FAE5', fg: '#059669' },
  good_deal: { text: 'GOOD DEAL', bg: '#DBEAFE', fg: '#2563EB' },
  price_drop: { text: 'PRICE DROP', bg: '#EDE9FE', fg: '#7C3AED' },
  new: { text: 'NEW', bg: '#E0E7FF', fg: '#4F46E5' },
};

const PLACEHOLDER_IMG: Record<string, string> = {
  flight: 'https://images.unsplash.com/photo-1436491865332-7a61a109db05?w=600',
  hotel: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600',
  experience: 'https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=600',
  car: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0afa?w=600',
};

export default function ViewAllDeals() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const PAGE_SIZE = 20;
  const { deals, isLoading } = useGilDeals(undefined, 50);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loadingMore, setLoadingMore] = useState(false);

  const filteredDeals = useMemo(() => {
    if (selectedCategory === 'all') return deals;
    return deals.filter(d => d.deal_type === selectedCategory);
  }, [deals, selectedCategory]);

  const paginatedDeals = useMemo(() => {
    return filteredDeals.slice(0, visibleCount);
  }, [filteredDeals, visibleCount]);

  const handleLoadMore = useCallback(() => {
    if (loadingMore || visibleCount >= filteredDeals.length) return;
    setLoadingMore(true);
    setTimeout(() => {
      setVisibleCount(prev => Math.min(prev + PAGE_SIZE, filteredDeals.length));
      setLoadingMore(false);
    }, 300);
  }, [loadingMore, visibleCount, filteredDeals.length]);

  const handleBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  }, [router]);

  const handleCategoryPress = useCallback((id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCategory(id);
    setVisibleCount(PAGE_SIZE);
  }, []);

  const handleDealPress = useCallback((deal: PersonalizedDeal) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: '/deals/[id]' as any,
      params: { id: deal.deal_cache_id || deal.id, title: deal.deal_title, type: deal.deal_type },
    });
  }, [router]);

  // Count per category
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: deals.length };
    deals.forEach(d => { c[d.deal_type] = (c[d.deal_type] || 0) + 1; });
    return c;
  }, [deals]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={[styles.backBtn, { backgroundColor: colors.bgCard }]} activeOpacity={0.7}>
          <ArrowLeft2 size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>All Deals</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Category Tabs */}
      <View style={styles.tabsWrapper}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContainer}>
        {CATEGORIES.map(cat => {
          const isActive = selectedCategory === cat.id;
          const count = counts[cat.id] || 0;
          return (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.tab,
                { backgroundColor: isActive ? colors.primary : (isDark ? colors.bgCard : '#F1F5F9'), borderColor: isActive ? colors.primary : colors.borderSubtle },
              ]}
              onPress={() => handleCategoryPress(cat.id)}
              activeOpacity={0.7}
            >
              <Ionicons name={cat.icon as any} size={16} color={isActive ? '#FFFFFF' : colors.textSecondary} />
              <Text style={[styles.tabText, { color: isActive ? colors.white : colors.textPrimary }]}>
                {cat.label}
              </Text>
              {count > 0 && (
                <View style={[styles.countBadge, { backgroundColor: isActive ? 'rgba(255,255,255,0.3)' : colors.borderSubtle }]}>
                  <Text style={[styles.countText, { color: isActive ? colors.white : colors.textSecondary }]}>{count}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      </View>

      {/* Deals List */}
      {isLoading ? (
        <ScrollView style={styles.dealsList} showsVerticalScrollIndicator={false}>
          <SkeletonDealListCards />
        </ScrollView>
      ) : (
        <FlatList
          data={paginatedDeals}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <DealListCard deal={item} colors={colors} isDark={isDark} onPress={() => handleDealPress(item)} />
          )}
          style={styles.dealsList}
          contentContainerStyle={styles.dealsContent}
          showsVerticalScrollIndicator={false}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={48} color={colors.textTertiary} />
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No deals found</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                {selectedCategory === 'all' ? 'Check back soon for new deals' : `No ${selectedCategory} deals right now`}
              </Text>
            </View>
          }
          ListFooterComponent={
            loadingMore ? (
              <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}

function DealListCard({ deal, colors, isDark, onPress }: { deal: PersonalizedDeal; colors: any; isDark: boolean; onPress: () => void }) {
  const typeColor = DEAL_TYPE_COLORS[deal.deal_type] || '#2563EB';
  const typeIcon = DEAL_TYPE_ICONS[deal.deal_type] || 'airplane';
  const badge = deal.deal_badges?.[0] ? BADGE_MAP[deal.deal_badges[0]] : null;
  const imageUrl = deal.deal_image_url || PLACEHOLDER_IMG[deal.deal_type] || PLACEHOLDER_IMG.flight;

  return (
    <TouchableOpacity style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.borderSubtle }]} onPress={onPress} activeOpacity={0.8}>
      {/* Image */}
      <View style={styles.cardImageContainer}>
        <Image source={imageUrl} style={styles.cardImage} contentFit="cover" />
        {/* Type badge on image */}
        <View style={[styles.cardTypeBadge, { backgroundColor: typeColor }]}>
          <Ionicons name={typeIcon as any} size={11} color={colors.white} />
          <Text style={styles.cardTypeText}>{deal.deal_type.toUpperCase()}</Text>
        </View>
      </View>

      {/* Content */}
      <View style={styles.cardContent}>
        {/* Badge row */}
        {badge && (
          <View style={[styles.cardBadge, { backgroundColor: badge.bg }]}>
            <Text style={[styles.cardBadgeText, { color: badge.fg }]}>{badge.text}</Text>
          </View>
        )}

        {/* Title */}
        <Text style={[styles.cardTitle, { color: colors.textPrimary }]} numberOfLines={2}>
          {deal.deal_title}
        </Text>

        {/* Subtitle / match reason */}
        {deal.deal_subtitle || deal.match_reasons?.[0] ? (
          <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
            {deal.match_reasons?.[0] || deal.deal_subtitle}
          </Text>
        ) : null}

        {/* Bottom row: price + provider */}
        <View style={styles.cardBottom}>
          <Text style={[styles.cardPrice, { color: colors.textPrimary }]}>
            ${Math.round(deal.price_amount)}
          </Text>
          <Text style={[styles.cardPriceLabel, { color: colors.textSecondary }]}>
            {deal.deal_type === 'hotel' ? '/night' : deal.deal_type === 'experience' ? '/person' : ' RT'}
          </Text>
          <View style={{ flex: 1 }} />
          <View style={[styles.viewDealBtn, { backgroundColor: colors.primary }]}>
            <Text style={styles.viewDealText}>View</Text>
            <Ionicons name="arrow-forward" size={12} color={colors.white} />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingVertical: 12,
  },
  backBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontFamily: fontFamily.bold, fontSize: typography.fontSize.kpiValue },

  // Category tabs
  tabsWrapper: { height: 52, marginBottom: 4 },
  tabsContainer: { paddingHorizontal: spacing.lg, gap: 8, alignItems: 'center', height: 52 },
  tab: {
    flexDirection: 'row', alignItems: 'center', gap: 6, height: 38,
    paddingHorizontal: 14, borderRadius: 20, borderWidth: 1,
  },
  tabText: { fontFamily: fontFamily.semibold, fontSize: typography.fontSize.body },
  countBadge: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 10, minWidth: 22, alignItems: 'center' },
  countText: { fontFamily: fontFamily.medium, fontSize: typography.fontSize.caption },

  // Loading / Empty
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontFamily: fontFamily.regular, fontSize: typography.fontSize.bodyLg },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8, paddingBottom: 60 },
  emptyTitle: { fontFamily: fontFamily.semibold, fontSize: typography.fontSize.heading2 },
  emptySubtitle: { fontFamily: fontFamily.regular, fontSize: typography.fontSize.bodyLg },

  // Deal list
  dealsList: { flex: 1 },
  dealsContent: { paddingHorizontal: spacing.lg, paddingBottom: 40, gap: 14 },

  // Deal card
  card: {
    flexDirection: 'row', borderRadius: 18, overflow: 'hidden', borderWidth: 1,
  },
  cardImageContainer: { width: 120, height: 130, position: 'relative' },
  cardImage: { width: '100%', height: '100%' },
  cardTypeBadge: {
    position: 'absolute', bottom: 6, left: 6,
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 6, paddingVertical: 3, borderRadius: 8,
  },
  cardTypeText: { fontFamily: fontFamily.bold, fontSize: 8, color: '#FFF', letterSpacing: 0.5 },

  cardContent: { flex: 1, padding: 12, justifyContent: 'space-between' },
  cardBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginBottom: 4 },
  cardBadgeText: { fontFamily: fontFamily.bold, fontSize: 9, letterSpacing: 0.6 },
  cardTitle: { fontFamily: fontFamily.semibold, fontSize: typography.fontSize.bodyLg, lineHeight: 19, marginBottom: 2 },
  cardSubtitle: { fontFamily: fontFamily.regular, fontSize: typography.fontSize.bodySm, marginBottom: 6 },
  cardBottom: { flexDirection: 'row', alignItems: 'baseline' },
  cardPrice: { fontFamily: fontFamily.display, fontSize: typography.fontSize.kpiValue },
  cardPriceLabel: { fontFamily: fontFamily.regular, fontSize: typography.fontSize.caption, marginLeft: 2 },
  viewDealBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14,
  },
  viewDealText: { fontFamily: fontFamily.bold, fontSize: typography.fontSize.bodySm, color: '#FFF' },
});
