/**
 * VIEW ALL LOCAL EXPERIENCES
 * 
 * Full-page view of local experiences with Viator category filters.
 * Uses real Viator data based on user's detected city.
 */

import { View, Text, StyleSheet, ScrollView, FlatList, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { useCallback, useState, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { ArrowLeft2, Location } from 'iconsax-react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Clock, Star1, TickCircle } from 'iconsax-react-native';
import { typography, spacing, fontFamily } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { useLocalExperiences } from '@/hooks/useLocalExperiences';
import type { LocalExperience } from '@/services/localExperiences.service';
import { SkeletonExperienceListCards } from '@/components/common/SkeletonLoader';

const PRIMARY = '#3FC39E';

export default function ViewAllLocalExperiences() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const PAGE_SIZE = 15;
  const {
    experiences,
    categories,
    selectedCategory,
    setSelectedCategory,
    city,
    usedFallback,
    isLoading,
    isCategoriesLoading,
    error,
  } = useLocalExperiences({ limit: 30 });
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loadingMore, setLoadingMore] = useState(false);

  const paginatedExperiences = useMemo(() => {
    return experiences.slice(0, visibleCount);
  }, [experiences, visibleCount]);

  const handleLoadMore = useCallback(() => {
    if (loadingMore || visibleCount >= experiences.length) return;
    setLoadingMore(true);
    setTimeout(() => {
      setVisibleCount(prev => Math.min(prev + PAGE_SIZE, experiences.length));
      setLoadingMore(false);
    }, 300);
  }, [loadingMore, visibleCount, experiences.length]);

  const handleBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  }, [router]);

  const handleCategoryPress = useCallback((tagId: number | null) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCategory(tagId);
    setVisibleCount(PAGE_SIZE);
  }, [setSelectedCategory]);

  const handleExperiencePress = useCallback((experience: LocalExperience) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({ pathname: '/local-experiences/[id]' as any, params: { id: experience.productCode } });
  }, [router]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleBack}
          style={[styles.backBtn, { backgroundColor: colors.bgCard }]}
          activeOpacity={0.7}
        >
          <ArrowLeft2 size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Local Experiences</Text>
          {city ? (
            <View style={styles.locationRow}>
              <Location size={12} color={colors.primary} variant="Bold" />
              <Text style={[styles.locationText, { color: colors.textSecondary }]}>{usedFallback ? `Near ${city}` : city}</Text>
            </View>
          ) : null}
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Category Filter Chips */}
      {categories.length > 1 ? (
        <View style={styles.tabsWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsContainer}
          >
            {categories.map((cat) => {
              const isActive = selectedCategory === cat.tagId;
              return (
                <TouchableOpacity
                  key={cat.tagId ?? 'all'}
                  style={[
                    styles.tab,
                    {
                      backgroundColor: isActive ? colors.primary : (isDark ? colors.bgCard : '#F1F5F9'),
                      borderColor: isActive ? colors.primary : colors.borderSubtle,
                    },
                  ]}
                  onPress={() => handleCategoryPress(cat.tagId)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.tabText,
                      { color: isActive ? colors.white : colors.textPrimary },
                    ]}
                    numberOfLines={1}
                  >
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      ) : null}

      {/* Content */}
      {isLoading ? (
        <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
          <SkeletonExperienceListCards />
        </ScrollView>
      ) : error ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Something went wrong</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={paginatedExperiences}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          renderItem={({ item }) => (
            <ExperienceListCard
              experience={item}
              onPress={() => handleExperiencePress(item)}
              colors={colors}
            />
          )}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No experiences found</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                {selectedCategory ? 'Try a different category' : 'Check back soon for new content'}
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

// ─── Experience List Card (View All variant) ──────────────────

function ExperienceListCard({
  experience: exp,
  onPress,
  colors,
}: {
  experience: LocalExperience;
  onPress: () => void;
  colors: any;
}) {
  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.bgCard }]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={styles.cardImageContainer}>
        <Image source={{ uri: exp.heroImage }} style={styles.cardImage} contentFit="cover" />
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.5)']} style={styles.cardGradient} />

        {exp.price.discountPercent && exp.price.discountPercent > 0 ? (
          <View style={styles.cardDiscountBadge}>
            <Text style={styles.cardDiscountText}>
              {exp.price.discountPercent}% OFF
            </Text>
          </View>
        ) : null}

        <View style={styles.cardCategoryBadge}>
          <Text style={styles.cardCategoryText} numberOfLines={1}>{exp.category}</Text>
        </View>
      </View>

      <View style={styles.cardInfo}>
        <Text style={[styles.cardTitle, { color: colors.textPrimary }]} numberOfLines={1} ellipsizeMode="tail">{exp.title}</Text>

        <View style={styles.cardDetailsRow}>
          <View style={styles.cardDetailItem}>
            <Clock size={13} color={colors.textSecondary} variant="Outline" />
            <Text style={[styles.cardDetailText, { color: colors.textSecondary }]}>{exp.duration.formatted}</Text>
          </View>
          {exp.location.city ? (
            <Text style={[styles.cardDetailText, { color: colors.textSecondary }]}>• {exp.location.city}</Text>
          ) : null}
        </View>

        {exp.freeCancellation ? (
          <View style={styles.cardCancellationRow}>
            <TickCircle size={12} color="#3FC39E" variant="Bold" />
            <Text style={styles.cardCancellationText}>Free cancellation</Text>
          </View>
        ) : null}

        <View style={styles.cardBottomRow}>
          <View style={styles.cardRating}>
            <Star1 size={13} color="#FFA500" variant="Bold" />
            <Text style={[styles.cardRatingText, { color: colors.textPrimary }]}>
              {exp.rating.score > 0 ? exp.rating.score.toFixed(1) : '—'}
            </Text>
            {exp.rating.reviewCount > 0 ? (
              <Text style={[styles.cardReviewCount, { color: colors.textSecondary }]}>
                ({exp.rating.reviewCount.toLocaleString()})
              </Text>
            ) : null}
          </View>
          <View style={styles.cardPriceContainer}>
            {exp.price.originalPrice && exp.price.originalPrice > exp.price.amount ? (
              <Text style={[styles.cardOriginalPrice, { color: colors.textSecondary }]}>
                ${Math.round(exp.price.originalPrice)}
              </Text>
            ) : null}
            <Text style={[styles.cardPrice, { color: colors.primary }]}>{exp.price.formatted}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: fontFamily.bold,
    fontSize: typography.fontSize.kpiValue,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  locationText: {
    fontFamily: fontFamily.regular,
    fontSize: typography.fontSize.bodySm,
  },

  // Category Tabs
  tabsWrapper: { height: 52, marginBottom: 4 },
  tabsContainer: {
    paddingHorizontal: spacing.lg,
    gap: 8,
    alignItems: 'center',
    height: 52,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 38,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
  },
  tabText: { fontFamily: fontFamily.semibold, fontSize: typography.fontSize.body },

  // Loading / Empty
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontFamily: fontFamily.regular, fontSize: typography.fontSize.bodyLg },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8, paddingBottom: 60 },
  emptyTitle: { fontFamily: fontFamily.semibold, fontSize: typography.fontSize.heading2 },
  emptySubtitle: { fontFamily: fontFamily.regular, fontSize: typography.fontSize.bodyLg },

  // List
  list: { flex: 1 },
  listContent: { paddingHorizontal: spacing.lg, paddingBottom: 40 },

  // Experience List Card
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  cardImageContainer: {
    width: '100%',
    height: 200,
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  cardDiscountBadge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    backgroundColor: '#FF4757',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: 10,
  },
  cardDiscountText: {
    fontSize: typography.fontSize.captionSm,
    fontWeight: typography.fontWeight.bold,
    color: '#FFFFFF',
  },
  cardCategoryBadge: {
    position: 'absolute',
    bottom: spacing.sm,
    left: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 14,
    maxWidth: 220,
  },
  cardCategoryText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: '#1a1a1a',
  },
  cardInfo: {
    padding: spacing.md,
  },
  cardTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    marginBottom: 6,
    lineHeight: 22,
  },
  cardDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  cardDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardDetailText: {
    fontSize: typography.fontSize.xs,
  },
  cardCancellationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  cardCancellationText: {
    fontSize: typography.fontSize.caption,
    color: '#3FC39E',
    fontWeight: typography.fontWeight.medium,
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  cardRatingText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  cardReviewCount: {
    fontSize: typography.fontSize.caption,
  },
  cardPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardOriginalPrice: {
    fontSize: typography.fontSize.xs,
    textDecorationLine: 'line-through',
  },
  cardPrice: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
  },
});
