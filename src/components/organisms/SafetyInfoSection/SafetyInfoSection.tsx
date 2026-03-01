/**
 * SAFETY INFORMATION SECTION ORGANISM
 * 
 * Displays safety information cards with categories and details
 * Stacked cards in white container with simplified content
 */

import { View, Text, StyleSheet, Dimensions } from 'react-native';
import React from 'react';
import { Warning2, Clock, Location as LocationIcon, InfoCircle } from 'iconsax-react-native';
import { colors, typography, spacing } from '@/styles';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  interpolate,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - spacing.lg * 2 - spacing.md * 2; // Account for container padding
const CARD_HEIGHT = CARD_WIDTH * 0.7; // Reduce height - 70% of width
const CARD_SPACING = spacing.md;

interface SafetyInfo {
  id: string;
  category: string;
  title: string;
  detail: string;
  severity: 'high' | 'medium' | 'low';
  iconType?: 'warning' | 'clock' | 'location' | 'info';
}

interface SafetyInfoSectionProps {
  safetyInfo: SafetyInfo[];
}

const severityColors = {
  high: {
    bg: 'rgba(239, 68, 68, 0.08)', // Very soft red
    iconColor: '#EF4444', // Red
  },
  medium: {
    bg: 'rgba(251, 191, 36, 0.08)', // Very soft yellow
    iconColor: '#F59E0B', // Orange
  },
  low: {
    bg: 'rgba(34, 197, 94, 0.08)', // Very soft green
    iconColor: '#22C55E', // Green
  },
};

const getIcon = (iconType: string = 'warning', color: string, size: number = 24) => {
  switch (iconType) {
    case 'clock':
      return <Clock size={size} color={color} variant="Bold" />;
    case 'location':
      return <LocationIcon size={size} color={color} variant="Bold" />;
    case 'info':
      return <InfoCircle size={size} color={color} variant="Bold" />;
    default:
      return <Warning2 size={size} color={color} variant="Bold" />;
  }
};

export default function SafetyInfoSection({ safetyInfo }: SafetyInfoSectionProps) {
  const scrollX = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  return (
    <View style={styles.container}>
      {/* Section Header - Outside container */}
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Safety Information</Text>
        <Text style={styles.sectionSubtitle}>Stay informed about safety tips and precautions</Text>
      </View>
      
      {/* White Container Card */}
      <View style={styles.whiteContainer}>
        {/* Stacked Scrollable Cards */}
        <Animated.ScrollView 
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          snapToInterval={CARD_WIDTH + CARD_SPACING}
          decelerationRate="fast"
          contentContainerStyle={styles.cardsContent}
        >
          {safetyInfo.map((info, index) => {
            const colorScheme = severityColors[info.severity];
            
            return (
              <View key={info.id} style={styles.cardWrapper}>
                <View style={[styles.card, { backgroundColor: colorScheme.bg }]}>
                  <View>
                    {/* Icon and Title */}
                    <View style={styles.cardHeader}>
                      <View style={styles.iconContainer}>
                        {getIcon(info.iconType, colorScheme.iconColor, 28)}
                      </View>
                      <Text style={styles.cardTitle}>{info.title}</Text>
                    </View>

                    {/* Detail Text */}
                    <Text style={styles.detailText}>{info.detail}</Text>
                  </View>
                </View>
              </View>
            );
          })}
        </Animated.ScrollView>

        {/* Pagination Dots */}
        <View style={styles.pagination}>
          {safetyInfo.map((_, index) => {
            const dotStyle = useAnimatedStyle(() => {
              const inputRange = [
                (index - 1) * (CARD_WIDTH + CARD_SPACING),
                index * (CARD_WIDTH + CARD_SPACING),
                (index + 1) * (CARD_WIDTH + CARD_SPACING),
              ];

              const opacity = interpolate(
                scrollX.value,
                inputRange,
                [0.3, 1, 0.3],
              );

              return { opacity };
            });

            return (
              <Animated.View
                key={index}
                style={[styles.dot, dotStyle]}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  header: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
  },
  whiteContainer: {
    backgroundColor: colors.bgElevated,
    borderRadius: 24,
    padding: spacing.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  cardsContent: {
    paddingRight: spacing.md,
  },
  cardWrapper: {
    width: CARD_WIDTH,
    marginRight: CARD_SPACING,
  },
  card: {
    borderRadius: 16,
    padding: spacing.md,
    height: CARD_HEIGHT,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    flex: 1,
  },
  detailText: {
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
});
