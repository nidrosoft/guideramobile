/**
 * DESTINATION LIST CARD
 * 
 * Universal theme-aware card used in all "View All" list screens.
 * Shows destination image, title, location, rating, budget, and badges.
 * Reused across all homepage section view-all pages.
 */

import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import CachedImage from '@/components/common/CachedImage';
import { Star1, Location, DollarCircle, TrendUp, Crown, Bookmark } from 'iconsax-react-native';
import { typography, spacing, fontFamily } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { useImageFallback } from '@/hooks/useImageFallback';
import type { CuratedDestination } from '@/hooks/useSectionDestinations';

const BUDGET_LABELS: Record<number, string> = {
  1: 'Budget',
  2: 'Affordable',
  3: 'Moderate',
  4: 'Premium',
  5: 'Luxury',
};

interface DestinationListCardProps {
  destination: CuratedDestination;
  onPress: () => void;
  onBookmark?: () => void;
}

export default function DestinationListCard({ destination, onPress, onBookmark }: DestinationListCardProps) {
  const { colors, isDark } = useTheme();

  const rawImageUrl = destination.hero_image_url || destination.thumbnail_url || '';
  const cityName = destination.city || destination.title?.split(' - ')[0] || destination.title;
  const imageUrl = useImageFallback(rawImageUrl, cityName);
  const budgetLabel = BUDGET_LABELS[destination.budget_level] || 'Moderate';

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.borderSubtle }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Image */}
      <View style={styles.imageContainer}>
        <CachedImage uri={imageUrl} style={styles.image} />
        {/* Trending badge */}
        {destination.is_trending ? (
          <View style={styles.trendingBadge}>
            <TrendUp size={11} color="#4CAF50" variant="Bold" />
            <Text style={styles.trendingText}>Trending</Text>
          </View>
        ) : null}
        {/* Featured badge */}
        {destination.is_featured && !destination.is_trending ? (
          <View style={styles.featuredBadge}>
            <Crown size={11} color="#FFD700" variant="Bold" />
            <Text style={styles.featuredText}>Featured</Text>
          </View>
        ) : null}
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Location row */}
        <View style={styles.locationRow}>
          <Location size={12} color={colors.textTertiary} variant="Bold" />
          <Text style={[styles.locationText, { color: colors.textTertiary }]} numberOfLines={1}>
            {destination.city}, {destination.country}
          </Text>
        </View>

        {/* Title */}
        <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={2}>
          {destination.title}
        </Text>

        {/* Subtitle */}
        {destination.short_description ? (
          <Text style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={1}>
            {destination.short_description}
          </Text>
        ) : null}

        {/* Bottom row */}
        <View style={styles.bottomRow}>
          {/* Rating */}
          <View style={styles.ratingRow}>
            <Star1 size={13} color="#FFD700" variant="Bold" />
            <Text style={[styles.ratingText, { color: colors.textPrimary }]}>
              {Number(destination.editor_rating).toFixed(1)}
            </Text>
          </View>

          {/* Budget */}
          <View style={[styles.budgetPill, { backgroundColor: isDark ? 'rgba(63,195,158,0.15)' : 'rgba(63,195,158,0.1)' }]}>
            <DollarCircle size={12} color={colors.primary} variant="Bold" />
            <Text style={[styles.budgetText, { color: colors.primary }]}>
              {destination.estimated_daily_budget_usd ? `$${destination.estimated_daily_budget_usd}/day` : budgetLabel}
            </Text>
          </View>

          <View style={styles.spacer} />

          {/* Explore button */}
          <View style={[styles.exploreBtn, { backgroundColor: colors.primary }]}>
            <Text style={styles.exploreBtnText}>Explore</Text>
          </View>
        </View>
      </View>

      {/* Bookmark */}
      {onBookmark ? (
        <TouchableOpacity style={styles.bookmarkBtn} onPress={onBookmark} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Bookmark size={18} color={colors.textTertiary} variant="Outline" />
        </TouchableOpacity>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    marginBottom: 12,
  },
  imageContainer: {
    width: 120,
    height: 130,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  trendingBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  trendingText: {
    fontFamily: fontFamily.bold,
    fontSize: 8,
    color: '#4CAF50',
    letterSpacing: 0.3,
  },
  featuredBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  featuredText: {
    fontFamily: fontFamily.bold,
    fontSize: 8,
    color: '#FFD700',
    letterSpacing: 0.3,
  },
  content: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  locationText: {
    fontFamily: fontFamily.regular,
    fontSize: 11,
    flex: 1,
  },
  title: {
    fontFamily: fontFamily.semibold,
    fontSize: 14,
    lineHeight: 19,
    marginBottom: 2,
  },
  subtitle: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    marginBottom: 6,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingText: {
    fontFamily: fontFamily.semibold,
    fontSize: 12,
  },
  budgetPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 10,
  },
  budgetText: {
    fontFamily: fontFamily.medium,
    fontSize: 10,
  },
  exploreBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  exploreBtnText: {
    fontFamily: fontFamily.bold,
    fontSize: 12,
    color: '#FFFFFF',
  },
  spacer: {
    flex: 1,
  },
  bookmarkBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
});
