import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions } from 'react-native';
import { useState, useMemo, useCallback, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
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
import { Bookmark, ArrowRight, Star1, Ticket, TrendUp, Crown } from 'iconsax-react-native';
import { useHomepageDataSafe, useInteractionTracking, filterByCategory, useSectionVisibility } from '@/features/homepage';
import { useTheme } from '@/context/ThemeContext';
import SaveButton from '@/components/common/SaveButton';
import { SkeletonStackedDestination } from '@/components/common/SkeletonLoader';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 64;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;
const SWIPE_VELOCITY_THRESHOLD = 500;
const MAX_ROTATION = 12; // degrees

// Mock data fallback
const mockDestinations = [
  {
    id: '1',
    city: 'Brazil',
    country: 'Rio de Janeiro',
    name: 'Christ the Redeemer',
    rating: 4.8,
    visitors: '2M/year',
    entryFee: '$25',
    bestTime: 'Apr-Oct',
    image: 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=600',
    isUNESCO: true,
    trending: '+15%',
  },
  {
    id: '2',
    city: 'France',
    country: 'Paris',
    name: 'Eiffel Tower',
    rating: 4.9,
    visitors: '7M/year',
    entryFee: '€26',
    bestTime: 'Apr-Jun',
    image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600',
    isUNESCO: false,
    trending: '+22%',
  },
  {
    id: '3',
    city: 'Egypt',
    country: 'Giza',
    name: 'Great Pyramid',
    rating: 4.7,
    visitors: '14M/year',
    entryFee: '$20',
    bestTime: 'Oct-Apr',
    image: 'https://images.unsplash.com/photo-1539768942893-daf53e736b68?w=600',
    isUNESCO: true,
    trending: '+18%',
  },
  {
    id: '4',
    city: 'India',
    country: 'Agra',
    name: 'Taj Mahal',
    rating: 4.9,
    visitors: '8M/year',
    entryFee: '₹1050',
    bestTime: 'Nov-Feb',
    image: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=600',
    isUNESCO: true,
    trending: '+25%',
  },
  {
    id: '5',
    city: 'USA',
    country: 'New York',
    name: 'Statue of Liberty',
    rating: 4.6,
    visitors: '4.5M/year',
    entryFee: '$24',
    bestTime: 'May-Sep',
    image: 'https://images.unsplash.com/photo-1485738422979-f5c462d49f04?w=600',
    isUNESCO: true,
    trending: '+12%',
  },
];

export default function StackedDestinationCards() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const homepageData = useHomepageDataSafe();
  const { trackDetailView } = useInteractionTracking();

  // Swipe animated values
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const destinations = useMemo(() => {
    const popularSection = homepageData?.sections?.find(s => s.slug === 'popular-destinations');
    if (popularSection?.items?.length) {
      return popularSection.items.slice(0, 5).map((item, index) => ({
        id: item.id || String(index),
        city: item.location?.city || 'Unknown',
        country: item.location?.country || 'Unknown',
        name: item.title,
        rating: item.rating || 4.5,
        visitors: item.matchScore ? `${(item.matchScore / 100).toFixed(1)}M/year` : '',
        entryFee: item.price?.formatted || '',
        bestTime: item.tags?.includes('spring') ? 'Mar-May' : item.tags?.includes('summer') ? 'Jun-Aug' : 'Year-round',
        image: item.imageUrl || item.thumbnailUrl,
        isUNESCO: item.badges?.some(b => b.text?.includes('Editor')) || (item.rating != null && item.rating >= 4.8),
        trending: item.badges?.some(b => b.type === 'trending') ? `+${Math.round((item.matchScore || 500) / 50)}%` : '',
      }));
    }
    return mockDestinations;
  }, [homepageData?.sections]);

  const activeCategory = homepageData?.activeCategory ?? 'all';
  const filteredDestinations = useMemo(
    () => filterByCategory(destinations, activeCategory),
    [destinations, activeCategory]
  );

  useSectionVisibility('destinations', filteredDestinations.length);

  // Reset card index when filter changes
  useEffect(() => { setCurrentIndex(0); }, [activeCategory]);

  const advanceCard = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCurrentIndex(prev => (prev + 1) % filteredDestinations.length);
  }, [filteredDestinations.length]);

  const handleCardPress = useCallback((destination: typeof destinations[0], index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    trackDetailView(destination.id, 'destination', 'popular-destinations', index);
    router.push({ pathname: '/destinations/[id]' as any, params: { id: destination.id } });
  }, [router, trackDetailView]);

  // Pan gesture for swiping
  const panGesture = Gesture.Pan()
    .activeOffsetX([-15, 15])
    .onUpdate((e) => {
      translateX.value = e.translationX;
      translateY.value = e.translationY * 0.4; // Dampen vertical movement
    })
    .onEnd((e) => {
      const swipedRight = translateX.value > SWIPE_THRESHOLD || e.velocityX > SWIPE_VELOCITY_THRESHOLD;
      const swipedLeft = translateX.value < -SWIPE_THRESHOLD || e.velocityX < -SWIPE_VELOCITY_THRESHOLD;

      if (swipedRight || swipedLeft) {
        // Fly off screen
        const direction = swipedRight ? 1 : -1;
        translateX.value = withTiming(direction * SCREEN_WIDTH * 1.5, {
          duration: 300,
          easing: Easing.out(Easing.cubic),
        }, () => {
          // Advance card first, then reset values after a frame
          runOnJS(advanceCard)();
          translateX.value = withDelay(50, withTiming(0, { duration: 0 }));
          translateY.value = withDelay(50, withTiming(0, { duration: 0 }));
        });
        translateY.value = withTiming(translateY.value * 1.5, { duration: 300 });
      } else {
        // Spring back
        translateX.value = withSpring(0, { damping: 20, stiffness: 200, mass: 0.8 });
        translateY.value = withSpring(0, { damping: 20, stiffness: 200, mass: 0.8 });
      }
    });

  // Front card animated style (the one being swiped)
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

  // Second card (scales up as front card is swiped)
  const secondCardStyle = useAnimatedStyle(() => {
    const progress = Math.min(Math.abs(translateX.value) / SWIPE_THRESHOLD, 1);
    const scale = interpolate(progress, [0, 1], [0.95, 1]);
    const translateYVal = interpolate(progress, [0, 1], [-20, 0]);
    const opacity = interpolate(progress, [0, 1], [0.7, 1]);
    return {
      transform: [{ scale }, { translateY: translateYVal }],
      opacity,
    };
  });

  // Third card (scales up slightly as front card is swiped)
  const thirdCardStyle = useAnimatedStyle(() => {
    const progress = Math.min(Math.abs(translateX.value) / SWIPE_THRESHOLD, 1);
    const scale = interpolate(progress, [0, 1], [0.9, 0.95]);
    const translateYVal = interpolate(progress, [0, 1], [-40, -20]);
    const opacity = interpolate(progress, [0, 1], [0.5, 0.7]);
    return {
      transform: [{ scale }, { translateY: translateYVal }],
      opacity,
    };
  });

  const getCardStyle = (position: number) => {
    if (position === 0) return frontCardStyle;
    if (position === 1) return secondCardStyle;
    if (position === 2) return thirdCardStyle;
    return {};
  };

  // Show skeleton while homepage data is loading (after all hooks)
  if (homepageData?.isLoading) {
    return <SkeletonStackedDestination />;
  }

  // Hide section if filter removes all items
  if (filteredDestinations.length === 0) return null;

  // Render cards in reverse order so front card is on top
  const visibleCards = filteredDestinations
    .map((dest, index) => {
      const position = (index - currentIndex + filteredDestinations.length) % filteredDestinations.length;
      if (position > 2) return null;
      return { dest, index, position };
    })
    .filter(Boolean)
    .sort((a, b) => b!.position - a!.position) as { dest: typeof filteredDestinations[0]; index: number; position: number }[];

  return (
    <View style={styles.container}>
      {visibleCards.map(({ dest: destination, index, position }) => {
        const cardContent = (
          <Animated.View
            key={destination.id}
            style={[
              styles.card,
              { borderColor: colors.borderSubtle, zIndex: filteredDestinations.length - position },
              getCardStyle(position),
            ]}
          >
            {/* Background Image */}
            <Image source={{ uri: destination.image }} style={styles.cardImage} />

            {/* Top Badges */}
            <View style={styles.topContainer}>
              {destination.isUNESCO ? (
                <View style={styles.unescoBadge}>
                  <Crown size={14} color="#FFD700" variant="Bold" />
                  <Text style={styles.unescoBadgeText}>UNESCO</Text>
                </View>
              ) : null}
              <View style={styles.trendingBadge}>
                <TrendUp size={14} color="#4CAF50" variant="Bold" />
                <Text style={styles.trendingText}>{destination.trending}</Text>
              </View>
              <SaveButton destinationId={destination.id} />
            </View>

            {/* Bottom Info with Blur */}
            <BlurView intensity={30} tint="light" style={styles.bottomContainer}>
              <View style={styles.infoContainer}>
                <View style={styles.textContainer}>
                  <Text style={styles.location}>{destination.city}, {destination.country}</Text>
                  <Text style={styles.name}>{destination.name}</Text>
                  <View style={styles.keyInfoRow}>
                    <View style={styles.infoItem}>
                      <Star1 size={14} color="#FFD700" variant="Bold" />
                      <Text style={styles.infoText}>{destination.rating}</Text>
                    </View>
                    <View style={styles.infoItem}>
                      <Ticket size={14} color="#FFFFFF" variant="Bold" />
                      <Text style={styles.infoText}>{destination.entryFee}</Text>
                    </View>
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Best:</Text>
                      <Text style={styles.infoText}>{destination.bestTime}</Text>
                    </View>
                  </View>
                  <Text style={styles.visitors}>{destination.visitors} visitors</Text>
                </View>
                <TouchableOpacity
                  style={styles.arrowButton}
                  onPress={() => handleCardPress(destination, index)}
                >
                  <ArrowRight size={20} color="#1a1a1a" variant="Outline" />
                </TouchableOpacity>
              </View>
            </BlurView>
          </Animated.View>
        );

        // Only the front card gets the gesture detector
        if (position === 0) {
          return (
            <GestureDetector key={destination.id} gesture={panGesture}>
              {cardContent}
            </GestureDetector>
          );
        }

        return cardContent;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 450,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
    marginTop: spacing.lg,
  },
  card: {
    position: 'absolute',
    width: CARD_WIDTH,
    height: 420,
    borderRadius: 32,
    overflow: 'hidden',
    borderWidth: 1,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  topContainer: {
    position: 'absolute',
    top: spacing.lg,
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  unescoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
  },
  unescoBadgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: '#FFD700',
  },
  trendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
  },
  trendingText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: '#4CAF50',
  },
  bookmarkButton: {
    marginLeft: 'auto',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: spacing.md,
    left: spacing.md,
    right: spacing.md,
    borderRadius: 24,
    overflow: 'hidden',
  },
  infoContainer: {
    flexDirection: 'row',
    padding: spacing.lg,
    gap: spacing.md,
  },
  textContainer: {
    flex: 1,
  },
  location: {
    fontSize: typography.fontSize.sm,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  name: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: '#FFFFFF',
    marginBottom: spacing.sm,
  },
  keyInfoRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xs,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoLabel: {
    fontSize: typography.fontSize.xs,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: typography.fontWeight.medium,
  },
  infoText: {
    fontSize: typography.fontSize.sm,
    color: '#FFFFFF',
    fontWeight: typography.fontWeight.semibold,
  },
  visitors: {
    fontSize: typography.fontSize.xs,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: typography.fontWeight.medium,
  },
  arrowButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
