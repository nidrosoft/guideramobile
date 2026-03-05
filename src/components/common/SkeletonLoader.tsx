/**
 * SkeletonLoader Component
 * 
 * Animated skeleton loading placeholders for consistent loading states.
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle, ScrollView, Dimensions } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useReducedMotion } from '@/utils/accessibility';
import { spacing } from '@/styles';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SkeletonProps {
  width?: number | `${number}%` | 'auto';
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({ 
  width = '100%', 
  height = 16, 
  borderRadius = 8,
  style 
}: SkeletonProps) {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) return;

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => animation.stop();
  }, [animatedValue, reduceMotion]);

  const opacity = reduceMotion 
    ? 0.5 
    : animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [0.3, 0.7],
      });

  const { colors: themeColors } = useTheme();

  return (
    <Animated.View
      style={[
        { backgroundColor: themeColors.gray200 },
        {
          width,
          height,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
}

// Pre-built skeleton layouts
export function SkeletonText({ lines = 3, lastLineWidth = '60%' as `${number}%` }: { lines?: number; lastLineWidth?: `${number}%` }) {
  return (
    <View style={styles.textContainer}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          width={index === lines - 1 ? lastLineWidth : '100%'}
          height={14}
          style={index < lines - 1 ? styles.textLine : undefined}
        />
      ))}
    </View>
  );
}

export function SkeletonCard() {
  return (
    <View style={styles.card}>
      <Skeleton width="100%" height={160} borderRadius={12} />
      <View style={styles.cardContent}>
        <Skeleton width="70%" height={18} style={styles.cardTitle} />
        <Skeleton width="50%" height={14} style={styles.cardSubtitle} />
        <View style={styles.cardFooter}>
          <Skeleton width={80} height={24} borderRadius={6} />
          <Skeleton width={60} height={14} />
        </View>
      </View>
    </View>
  );
}

export function SkeletonListItem() {
  return (
    <View style={styles.listItem}>
      <Skeleton width={48} height={48} borderRadius={24} />
      <View style={styles.listItemContent}>
        <Skeleton width="60%" height={16} style={styles.listItemTitle} />
        <Skeleton width="40%" height={12} />
      </View>
    </View>
  );
}

export function SkeletonFlightCard() {
  return (
    <View style={styles.flightCard}>
      <View style={styles.flightHeader}>
        <Skeleton width={40} height={40} borderRadius={8} />
        <View style={styles.flightHeaderText}>
          <Skeleton width={100} height={14} />
          <Skeleton width={60} height={12} style={{ marginTop: 4 }} />
        </View>
        <Skeleton width={70} height={20} />
      </View>
      <View style={styles.flightRoute}>
        <View style={styles.flightTime}>
          <Skeleton width={50} height={20} />
          <Skeleton width={30} height={12} style={{ marginTop: 4 }} />
        </View>
        <Skeleton width={80} height={2} />
        <View style={styles.flightTime}>
          <Skeleton width={50} height={20} />
          <Skeleton width={30} height={12} style={{ marginTop: 4 }} />
        </View>
      </View>
    </View>
  );
}

export function SkeletonHotelCard() {
  const { colors: themeColors } = useTheme();
  return (
    <View style={[styles.hotelCard, { backgroundColor: themeColors.bgElevated }]}>
      <Skeleton width={120} height={100} borderRadius={12} />
      <View style={styles.hotelContent}>
        <Skeleton width="80%" height={16} />
        <Skeleton width="50%" height={12} style={{ marginTop: 6 }} />
        <View style={styles.hotelFooter}>
          <Skeleton width={60} height={14} />
          <Skeleton width={80} height={18} />
        </View>
      </View>
    </View>
  );
}

export function SkeletonDestinationListCard() {
  const { colors: themeColors } = useTheme();
  return (
    <View style={[styles.destCard, { backgroundColor: themeColors.bgCard, borderColor: themeColors.borderSubtle }]}>
      <Skeleton width={120} height={130} borderRadius={0} />
      <View style={styles.destContent}>
        <Skeleton width="40%" height={11} />
        <Skeleton width="85%" height={16} style={{ marginTop: 6 }} />
        <Skeleton width="65%" height={12} style={{ marginTop: 4 }} />
        <View style={styles.destBottom}>
          <Skeleton width={40} height={14} borderRadius={4} />
          <Skeleton width={70} height={20} borderRadius={10} />
          <View style={{ flex: 1 }} />
          <Skeleton width={60} height={28} borderRadius={14} />
        </View>
      </View>
    </View>
  );
}

// ─── Homepage Section Skeletons ───

/** Deals section: horizontal row of 240×170 colored cards */
export function SkeletonDealCards() {
  const { colors: themeColors } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={sectionStyles.horizontalContainer}>
      {[1, 2, 3].map(i => (
        <View key={i} style={[sectionStyles.dealCard, { backgroundColor: themeColors.bgCard }]}>
          <Skeleton width={80} height={20} borderRadius={10} />
          <Skeleton width="75%" height={14} borderRadius={6} style={{ marginTop: 12 }} />
          <Skeleton width={90} height={28} borderRadius={6} style={{ marginTop: 8 }} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
            <Skeleton width="55%" height={11} borderRadius={6} />
            <Skeleton width={24} height={24} borderRadius={12} />
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

/** Popular Places: 180w compact cards with image + info */
export function SkeletonPlaceCards() {
  const { colors: themeColors } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={sectionStyles.horizontalContainer}>
      {[1, 2, 3].map(i => (
        <View key={i} style={[sectionStyles.placeCard, { backgroundColor: themeColors.bgCard }]}>
          <Skeleton width="100%" height={120} borderRadius={16} />
          <View style={{ padding: 8, gap: 6 }}>
            <Skeleton width="80%" height={14} borderRadius={6} />
            <Skeleton width="55%" height={11} borderRadius={6} />
            <Skeleton width="65%" height={11} borderRadius={6} />
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

/** MustSee: 280w cards with image + info rows */
export function SkeletonMustSeeCards() {
  const { colors: themeColors } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={sectionStyles.horizontalContainer}>
      {[1, 2, 3].map(i => (
        <View key={i} style={[sectionStyles.mustSeeCard, { backgroundColor: themeColors.bgCard }]}>
          <Skeleton width="100%" height={200} borderRadius={16} />
          <View style={{ padding: 10, gap: 6 }}>
            <Skeleton width="80%" height={16} borderRadius={6} />
            <Skeleton width="50%" height={11} borderRadius={6} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
              <Skeleton width={60} height={11} borderRadius={6} />
              <Skeleton width={50} height={11} borderRadius={6} />
            </View>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

/** Full-bleed image cards (EditorChoices 320×420, Trending 380×360, Luxury 320×420, Family 340×480) */
export function SkeletonFullBleedCards({ width = 320, height = 420, radius = 32 }: { width?: number; height?: number; radius?: number }) {
  const { colors: themeColors } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={sectionStyles.horizontalContainer}>
      {[1, 2].map(i => (
        <View key={i} style={[sectionStyles.fullBleedCard, { width, height, borderRadius: radius, backgroundColor: themeColors.bgCard }]}>
          <Skeleton width="100%" height={height} borderRadius={radius} />
          <View style={[sectionStyles.fullBleedOverlay, { borderRadius: radius }]}>
            <View style={{ position: 'absolute', bottom: 20, left: 16, right: 16, gap: 8 }}>
              <Skeleton width="65%" height={18} borderRadius={8} style={{ backgroundColor: 'rgba(255,255,255,0.15)' }} />
              <Skeleton width="45%" height={13} borderRadius={6} style={{ backgroundColor: 'rgba(255,255,255,0.1)' }} />
              <Skeleton width={60} height={13} borderRadius={6} style={{ backgroundColor: 'rgba(255,255,255,0.1)' }} />
            </View>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

/** BestDiscover: 300w cards with image + info + footer */
export function SkeletonBestDiscoverCards() {
  const { colors: themeColors } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={sectionStyles.horizontalContainer}>
      {[1, 2, 3].map(i => (
        <View key={i} style={[sectionStyles.bestDiscoverCard, { backgroundColor: themeColors.bgCard }]}>
          <Skeleton width="100%" height={200} borderRadius={20} />
          <View style={{ padding: 10, gap: 6 }}>
            <Skeleton width="75%" height={14} borderRadius={6} />
            <Skeleton width="50%" height={11} borderRadius={6} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6, paddingTop: 8, borderTopWidth: 1, borderTopColor: themeColors.borderSubtle }}>
              <Skeleton width={70} height={11} borderRadius={6} />
              <Skeleton width={50} height={11} borderRadius={6} />
            </View>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

/** BudgetFriendly: 360w horizontal-layout cards with image left + info right */
export function SkeletonBudgetCards() {
  const { colors: themeColors } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={sectionStyles.horizontalContainer}>
      {[1, 2].map(i => (
        <View key={i} style={[sectionStyles.budgetCard, { backgroundColor: themeColors.bgCard }]}>
          <Skeleton width={140} height={140} borderRadius={16} />
          <View style={{ flex: 1, marginLeft: 12, justifyContent: 'center', gap: 8 }}>
            <Skeleton width="80%" height={14} borderRadius={6} />
            <Skeleton width="55%" height={11} borderRadius={6} />
            <Skeleton width="65%" height={11} borderRadius={6} />
            <Skeleton width={70} height={20} borderRadius={10} style={{ marginTop: 4 }} />
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

/** LocalExperience: 280w cards with image + info lines (matches existing skeleton structure) */
export function SkeletonLocalExperienceCards() {
  const { colors: themeColors } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={sectionStyles.horizontalContainer}>
      {[1, 2, 3].map(i => (
        <View key={i} style={[sectionStyles.localExpCard, { backgroundColor: themeColors.bgCard }]}>
          <Skeleton width="100%" height={170} borderRadius={0} style={{ borderTopLeftRadius: 20, borderTopRightRadius: 20 }} />
          <View style={{ padding: 12, gap: 8 }}>
            <Skeleton width="80%" height={14} borderRadius={6} />
            <Skeleton width="50%" height={11} borderRadius={6} />
            <Skeleton width="60%" height={11} borderRadius={6} />
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

/** Stacked destination cards: centered single card skeleton */
export function SkeletonStackedDestination() {
  const { colors: themeColors } = useTheme();
  const cardWidth = SCREEN_WIDTH - 64;
  return (
    <View style={sectionStyles.stackedContainer}>
      <View style={[sectionStyles.stackedCardBehind2, { width: cardWidth, backgroundColor: themeColors.bgCard, opacity: 0.5 }]}>
        <Skeleton width="100%" height={280} borderRadius={28} />
      </View>
      <View style={[sectionStyles.stackedCardBehind1, { width: cardWidth, backgroundColor: themeColors.bgCard, opacity: 0.7 }]}>
        <Skeleton width="100%" height={280} borderRadius={28} />
      </View>
      <View style={[sectionStyles.stackedCardFront, { width: cardWidth, backgroundColor: themeColors.bgCard }]}>
        <Skeleton width="100%" height={280} borderRadius={28} />
        <View style={sectionStyles.stackedInfoOverlay}>
          <Skeleton width="50%" height={12} borderRadius={6} style={{ backgroundColor: 'rgba(255,255,255,0.15)' }} />
          <Skeleton width="70%" height={18} borderRadius={8} style={{ backgroundColor: 'rgba(255,255,255,0.15)', marginTop: 6 }} />
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
            <Skeleton width={60} height={12} borderRadius={6} style={{ backgroundColor: 'rgba(255,255,255,0.1)' }} />
            <Skeleton width={60} height={12} borderRadius={6} style={{ backgroundColor: 'rgba(255,255,255,0.1)' }} />
          </View>
        </View>
      </View>
    </View>
  );
}

/** Stacked event cards: centered single card skeleton */
export function SkeletonStackedEvents() {
  const { colors: themeColors } = useTheme();
  const cardWidth = SCREEN_WIDTH - 48;
  return (
    <View style={sectionStyles.eventsContainer}>
      <View style={[sectionStyles.eventCardSkeleton, { width: cardWidth, backgroundColor: themeColors.bgCard }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
          <Skeleton width={100} height={28} borderRadius={16} />
          <Skeleton width={50} height={28} borderRadius={16} />
        </View>
        <Skeleton width="100%" height={1} borderRadius={0} style={{ marginBottom: 12 }} />
        <Skeleton width="85%" height={20} borderRadius={8} />
        <Skeleton width="60%" height={14} borderRadius={6} style={{ marginTop: 8 }} />
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
          <Skeleton width={100} height={26} borderRadius={12} />
          <Skeleton width={80} height={26} borderRadius={12} />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
          <Skeleton width={80} height={14} borderRadius={6} />
          <Skeleton width={60} height={18} borderRadius={6} />
        </View>
        <Skeleton width="100%" height={160} borderRadius={20} style={{ marginTop: 12 }} />
      </View>
    </View>
  );
}

// ─── Detail Page Skeletons ───

/** Generic detail page skeleton: hero image + content blocks (for destination, event, experience) */
export function SkeletonDetailPage({ heroHeight = 380 }: { heroHeight?: number } = {}) {
  const { colors: themeColors } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: themeColors.background }}>
      {/* Hero image area */}
      <Skeleton width={SCREEN_WIDTH} height={heroHeight} borderRadius={0} />
      {/* Content */}
      <View style={{ padding: spacing.lg, gap: 14 }}>
        {/* Badges */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Skeleton width={90} height={24} borderRadius={10} />
          <Skeleton width={120} height={24} borderRadius={10} />
        </View>
        {/* Title */}
        <Skeleton width="85%" height={22} borderRadius={8} />
        {/* Subtitle / location */}
        <Skeleton width="55%" height={14} borderRadius={6} />
        {/* Rating row */}
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <Skeleton width={16} height={16} borderRadius={8} />
          <Skeleton width={30} height={14} borderRadius={6} />
          <Skeleton width={80} height={12} borderRadius={6} />
        </View>
        {/* Price */}
        <Skeleton width={120} height={32} borderRadius={8} />
        {/* Quick info bar */}
        <View style={{ flexDirection: 'row', borderRadius: 16, borderWidth: 1, borderColor: themeColors.borderSubtle, padding: 14, gap: 0, marginTop: 4 }}>
          {[1, 2, 3].map(i => (
            <View key={i} style={{ flex: 1, alignItems: 'center', gap: 6 }}>
              <Skeleton width={18} height={18} borderRadius={9} />
              <Skeleton width={40} height={10} borderRadius={4} />
              <Skeleton width={55} height={12} borderRadius={4} />
            </View>
          ))}
        </View>
        {/* Collapsible sections */}
        <Skeleton width="100%" height={1} borderRadius={0} style={{ marginTop: 4 }} />
        <Skeleton width="45%" height={16} borderRadius={6} />
        <Skeleton width="100%" height={14} borderRadius={6} />
        <Skeleton width="90%" height={14} borderRadius={6} />
        <Skeleton width="75%" height={14} borderRadius={6} />
        <Skeleton width="100%" height={1} borderRadius={0} style={{ marginTop: 4 }} />
        <Skeleton width="35%" height={16} borderRadius={6} />
        <View style={{ gap: 10 }}>
          {[1, 2, 3].map(i => (
            <View key={i} style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
              <Skeleton width={18} height={18} borderRadius={9} />
              <Skeleton width="80%" height={14} borderRadius={6} />
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

/** Deal list card skeleton for deals/view-all (horizontal layout: image left + content right) */
export function SkeletonDealListCards({ count = 6 }: { count?: number } = {}) {
  const { colors: themeColors } = useTheme();
  return (
    <View style={{ paddingHorizontal: spacing.lg, paddingBottom: 40, gap: 14 }}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={{ flexDirection: 'row', borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: themeColors.borderSubtle, backgroundColor: themeColors.bgCard }}>
          <Skeleton width={120} height={130} borderRadius={0} />
          <View style={{ flex: 1, padding: 12, justifyContent: 'space-between' }}>
            <Skeleton width={70} height={18} borderRadius={8} />
            <Skeleton width="85%" height={14} borderRadius={6} style={{ marginTop: 6 }} />
            <Skeleton width="60%" height={12} borderRadius={6} style={{ marginTop: 4 }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
              <Skeleton width={60} height={20} borderRadius={6} />
              <Skeleton width={60} height={28} borderRadius={14} />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

/** Experience list card skeleton for local-experiences/view-all (vertical card with image + info) */
export function SkeletonExperienceListCards({ count = 4 }: { count?: number } = {}) {
  const { colors: themeColors } = useTheme();
  return (
    <View style={{ paddingHorizontal: spacing.lg, paddingBottom: 40 }}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={{ borderRadius: 20, overflow: 'hidden', marginBottom: spacing.md, backgroundColor: themeColors.bgCard }}>
          <Skeleton width="100%" height={200} borderRadius={0} />
          <View style={{ padding: spacing.md, gap: 8 }}>
            <Skeleton width="80%" height={16} borderRadius={6} />
            <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
              <Skeleton width={13} height={13} borderRadius={7} />
              <Skeleton width={80} height={12} borderRadius={6} />
              <Skeleton width={60} height={12} borderRadius={6} />
            </View>
            <Skeleton width={120} height={12} borderRadius={6} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
              <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}>
                <Skeleton width={13} height={13} borderRadius={7} />
                <Skeleton width={25} height={14} borderRadius={6} />
                <Skeleton width={50} height={12} borderRadius={6} />
              </View>
              <Skeleton width={60} height={20} borderRadius={6} />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  horizontalContainer: {
    paddingHorizontal: spacing.lg,
    gap: 14,
  },
  dealCard: {
    width: 240,
    height: 170,
    borderRadius: 20,
    padding: 16,
  },
  placeCard: {
    width: 180,
    borderRadius: 20,
    overflow: 'hidden',
    padding: spacing.sm,
  },
  mustSeeCard: {
    width: 280,
    borderRadius: 20,
    overflow: 'hidden',
    padding: spacing.sm,
  },
  fullBleedCard: {
    overflow: 'hidden',
    position: 'relative',
  },
  fullBleedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  bestDiscoverCard: {
    width: 300,
    borderRadius: 24,
    overflow: 'hidden',
    padding: spacing.sm,
  },
  budgetCard: {
    width: 360,
    flexDirection: 'row',
    borderRadius: 20,
    padding: spacing.md,
  },
  localExpCard: {
    width: 280,
    borderRadius: 20,
    overflow: 'hidden',
  },
  stackedContainer: {
    height: 340,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.md,
  },
  stackedCardFront: {
    height: 280,
    borderRadius: 28,
    overflow: 'hidden',
    position: 'absolute',
  },
  stackedCardBehind1: {
    height: 280,
    borderRadius: 28,
    overflow: 'hidden',
    position: 'absolute',
    top: -10,
    transform: [{ scale: 0.95 }, { rotate: '-3deg' }],
  },
  stackedCardBehind2: {
    height: 280,
    borderRadius: 28,
    overflow: 'hidden',
    position: 'absolute',
    top: -20,
    transform: [{ scale: 0.9 }, { rotate: '3deg' }],
  },
  stackedInfoOverlay: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
  },
  eventsContainer: {
    height: 520,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.xl,
  },
  eventCardSkeleton: {
    borderRadius: 24,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
});

const styles = StyleSheet.create({
  textContainer: {
    gap: 8,
  },
  textLine: {
    marginBottom: 8,
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  cardContent: {
    padding: 16,
  },
  cardTitle: {
    marginBottom: 8,
  },
  cardSubtitle: {
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  listItemContent: {
    flex: 1,
    marginLeft: 12,
  },
  listItemTitle: {
    marginBottom: 6,
  },
  flightCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  flightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  flightHeaderText: {
    flex: 1,
    marginLeft: 12,
  },
  flightRoute: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  flightTime: {
    alignItems: 'center',
  },
  destCard: {
    flexDirection: 'row',
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    marginBottom: 12,
  },
  destContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  destBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  hotelCard: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },
  hotelContent: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  hotelFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
});

export default Skeleton;
