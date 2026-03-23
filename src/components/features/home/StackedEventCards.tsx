import { View, Text, StyleSheet, Image, TouchableOpacity, useWindowDimensions } from 'react-native';
import { useState, useCallback, useMemo, useEffect } from 'react';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  interpolate,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { typography, spacing } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { useHomepageDataSafe, filterByCategory, useSectionVisibility } from '@/features/homepage';
import { Clock, Location, People, Ticket, Calendar } from 'iconsax-react-native';
import { SkeletonStackedEvents } from '@/components/common/SkeletonLoader';

const SWIPE_VELOCITY_THRESHOLD = 500;
const MAX_ROTATION = 10;

export interface EventCardData {
  id: string | number;
  eventName: string;
  category: string;
  venue: string;
  city: string;
  date: string;
  time: string;
  ticketPrice: string;
  attendees: string;
  rating: number | null;
  image: string;
}

interface StackedEventCardsProps {
  events?: EventCardData[];
  loading?: boolean;
}

export default function StackedEventCards({ events = [], loading = false }: StackedEventCardsProps) {
  const { colors, isDark } = useTheme();
  const { width: SCREEN_WIDTH, height: screenHeight } = useWindowDimensions();
  const CARD_WIDTH = SCREEN_WIDTH - 48;
  const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const homepageData = useHomepageDataSafe();
  const activeCategory = homepageData?.activeCategory ?? 'all';

  const filteredEvents = useMemo(() => {
    if (activeCategory === 'all') return events;
    return events.filter(e => {
      // For 'events' pill, show all events
      if (activeCategory === 'events') return true;
      // Otherwise match against category keywords
      return filterByCategory([{ title: e.eventName, category: e.category, tags: [e.category] }], activeCategory).length > 0;
    });
  }, [events, activeCategory]);

  useSectionVisibility('events', filteredEvents.length);

  // Reset card index when filter changes
  useEffect(() => { setCurrentIndex(0); }, [activeCategory]);

  const handleCardTap = useCallback(() => {
    const event = filteredEvents[currentIndex];
    if (!event) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/events/${event.id}`);
  }, [router, filteredEvents, currentIndex]);

  // Swipe animated values
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const advanceCard = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCurrentIndex(prev => (prev + 1) % filteredEvents.length);
  }, [filteredEvents.length]);

  // Pan gesture for swiping
  const panGesture = Gesture.Pan()
    .activeOffsetX([-15, 15])
    .onUpdate((e) => {
      translateX.value = e.translationX;
      translateY.value = e.translationY * 0.4;
    })
    .onEnd((e) => {
      const swipedRight = translateX.value > SWIPE_THRESHOLD || e.velocityX > SWIPE_VELOCITY_THRESHOLD;
      const swipedLeft = translateX.value < -SWIPE_THRESHOLD || e.velocityX < -SWIPE_VELOCITY_THRESHOLD;

      if (swipedRight || swipedLeft) {
        const direction = swipedRight ? 1 : -1;
        translateX.value = withTiming(direction * SCREEN_WIDTH * 1.5, {
          duration: 300,
          easing: Easing.out(Easing.cubic),
        }, () => {
          runOnJS(advanceCard)();
          translateX.value = withDelay(50, withTiming(0, { duration: 0 }));
          translateY.value = withDelay(50, withTiming(0, { duration: 0 }));
        });
        translateY.value = withTiming(translateY.value * 1.5, { duration: 300 });
      } else {
        translateX.value = withSpring(0, { damping: 20, stiffness: 200, mass: 0.8 });
        translateY.value = withSpring(0, { damping: 20, stiffness: 200, mass: 0.8 });
      }
    });

  // Front card animated style
  const frontCardStyle = useAnimatedStyle(() => {
    const rotation = interpolate(
      translateX.value,
      [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
      [-MAX_ROTATION, 0, MAX_ROTATION]
    );
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotation}deg` },
      ],
    };
  });

  // Second card — tilted left, scales up as front card is swiped
  const secondCardStyle = useAnimatedStyle(() => {
    const progress = Math.min(Math.abs(translateX.value) / SWIPE_THRESHOLD, 1);
    const scale = interpolate(progress, [0, 1], [0.95, 1]);
    const ty = interpolate(progress, [0, 1], [-15, 0]);
    const rot = interpolate(progress, [0, 1], [-3, 0]);
    const opacity = interpolate(progress, [0, 1], [0.85, 1]);
    return { transform: [{ scale }, { translateY: ty }, { rotate: `${rot}deg` }], opacity };
  });

  // Third card — tilted right, scales up slightly as front card is swiped
  const thirdCardStyle = useAnimatedStyle(() => {
    const progress = Math.min(Math.abs(translateX.value) / SWIPE_THRESHOLD, 1);
    const scale = interpolate(progress, [0, 1], [0.9, 0.95]);
    const ty = interpolate(progress, [0, 1], [-30, -15]);
    const rot = interpolate(progress, [0, 1], [3, -3]);
    const opacity = interpolate(progress, [0, 1], [0.7, 0.85]);
    return { transform: [{ scale }, { translateY: ty }, { rotate: `${rot}deg` }], opacity };
  });

  const getCardStyle = (position: number) => {
    if (position === 0) return frontCardStyle;
    if (position === 1) return secondCardStyle;
    if (position === 2) return thirdCardStyle;
    return {};
  };

  // Loading state
  if (loading) {
    return <SkeletonStackedEvents />;
  }

  // Empty state
  if (filteredEvents.length === 0) {
    return null;
  }

  // Render cards in reverse order so front card is on top
  const visibleCards = filteredEvents
    .map((event, index) => {
      const position = (index - currentIndex + filteredEvents.length) % filteredEvents.length;
      if (position > 2) return null;
      return { event, index, position };
    })
    .filter(Boolean)
    .sort((a, b) => b!.position - a!.position) as { event: EventCardData; index: number; position: number }[];

  return (
    <View style={[styles.container, { height: Math.min(520, screenHeight * 0.65) }]}>
      {visibleCards.map(({ event, index, position }) => {
        const cardContent = (key: string) => (
          <Animated.View
            key={key}
            style={[
              styles.card,
              {
                width: CARD_WIDTH,
                backgroundColor: isDark ? colors.bgSecondary : colors.white,
                borderColor: colors.borderSubtle,
                zIndex: filteredEvents.length - position,
              },
              getCardStyle(position),
            ]}
          >
            {/* Header Section */}
            <View style={styles.headerSection}>
              <View style={[styles.categoryBadge, { backgroundColor: colors.primary + '15' }]}>
                <Text style={[styles.categoryText, { color: colors.primary }]}>{event.category}</Text>
              </View>
              <View style={[styles.ratingBadge, { backgroundColor: colors.bgElevated }]}>
                <Text style={[styles.ratingText, { color: colors.textPrimary }]}>⭐ {event.rating}</Text>
              </View>
            </View>

            {/* Separator */}
            <View style={[styles.separator, { backgroundColor: colors.borderSubtle }]} />

            {/* Event Info Section */}
            <View style={styles.eventInfoSection}>
              <Text style={[styles.eventName, { color: colors.textPrimary }]} numberOfLines={2} ellipsizeMode="tail">{event.eventName}</Text>
              
              <View style={styles.venueRow}>
                <Location size={16} color={colors.textSecondary} variant="Bold" />
                <Text style={[styles.venueText, { color: colors.textSecondary }]}>{event.venue}, {event.city}</Text>
              </View>
              
              <View style={styles.dateTimeRow}>
                <View style={[styles.dateContainer, { backgroundColor: colors.primary + '10' }]}>
                  <Calendar size={14} color={colors.primary} variant="Bold" />
                  <Text style={[styles.dateText, { color: colors.primary }]}>{event.date}</Text>
                </View>
                <View style={[styles.eventTimeContainer, { backgroundColor: colors.success + '15' }]}>
                  <Clock size={14} color={colors.success} variant="Bold" />
                  <Text style={[styles.eventTime, { color: colors.success }]}>{event.time}</Text>
                </View>
              </View>
              
              <View style={styles.bottomInfoRow}>
                <View style={styles.attendeesContainer}>
                  <People size={14} color={colors.textSecondary} variant="Bold" />
                  <Text style={[styles.attendeesText, { color: colors.textSecondary }]}>{event.attendees} going</Text>
                </View>
                <View style={styles.priceContainer}>
                  <Ticket size={14} color={colors.primary} variant="Bold" />
                  <Text style={[styles.priceText, { color: colors.primary }]}>{event.ticketPrice}</Text>
                </View>
              </View>
            </View>

            {/* Event Image */}
            {event.image ? (
              <View style={styles.imageContainer}>
                <Image source={{ uri: event.image }} style={styles.eventImage} />
              </View>
            ) : null}
          </Animated.View>
        );

        const uniqueKey = event.id != null ? String(event.id) : `evt-${index}`;

        if (position === 0) {
          const tapGesture = Gesture.Tap().onEnd(() => {
            runOnJS(handleCardTap)();
          });
          const composed = Gesture.Race(panGesture, tapGesture);
          return (
            <GestureDetector key={`gd-${uniqueKey}`} gesture={composed}>
              {cardContent(`card-${uniqueKey}`)}
            </GestureDetector>
          );
        }

        return cardContent(uniqueKey);
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
    marginTop: spacing.xl,
  },
  card: {
    position: 'absolute',
    // width applied inline with CARD_WIDTH from useWindowDimensions
    borderRadius: 24,
    padding: spacing.lg,
    overflow: 'hidden',
    borderWidth: 1,
  },
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  categoryBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 16,
  },
  categoryText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  ratingBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 16,
  },
  ratingText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  separator: {
    height: 1,
    marginBottom: spacing.md,
  },
  eventInfoSection: {
    marginBottom: spacing.md,
  },
  eventName: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.sm,
  },
  venueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  venueText: {
    fontSize: typography.fontSize.sm,
    flex: 1,
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },
  dateText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },
  eventTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },
  eventTime: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },
  bottomInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  attendeesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  attendeesText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  priceText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1.2,
    borderRadius: 20,
    overflow: 'hidden',
  },
  eventImage: {
    width: '100%',
    height: '100%',
  },
});
