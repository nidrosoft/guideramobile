/**
 * EXPERIENCE SEARCH LOADING SCREEN
 * 
 * Animated loading screen while searching for experiences.
 * Integrates with Provider Manager for real search results.
 */

import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ImageBackground, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  FadeIn,
  FadeInDown,
} from 'react-native-reanimated';
import { Map1, Ticket, Coffee, Activity, Star1 } from 'iconsax-react-native';
import { colors, spacing, typography, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { useExperienceStore } from '../../../stores/useExperienceStore';
import { localExperiencesService, LocalExperience } from '@/services/localExperiences.service';

interface ExperienceSearchLoadingScreenProps {
  onComplete: () => void;
}

const LOADING_MESSAGES = [
  'Finding amazing experiences...',
  'Checking availability...',
  'Discovering hidden gems...',
  'Curating the best activities...',
  'Almost there...',
];

export default function ExperienceSearchLoadingScreen({
  onComplete,
}: ExperienceSearchLoadingScreenProps) {
  const insets = useSafeAreaInsets();
  const { colors: tc } = useTheme();
  const { searchParams, setResults } = useExperienceStore();
  const [messageIndex, setMessageIndex] = useState(0);
  const searchInitiated = useRef(false);

  // Animation values
  const icon1Scale = useSharedValue(1);
  const icon2Scale = useSharedValue(1);
  const icon3Scale = useSharedValue(1);
  const icon4Scale = useSharedValue(1);
  const progressWidth = useSharedValue(0);

  // Perform search using the same Viator API as local experiences
  useEffect(() => {
    if (searchInitiated.current) return;
    searchInitiated.current = true;

    const performSearch = async () => {
      try {
        const city = searchParams.destination?.name || searchParams.destination?.code || 'New York';

        const { experiences } = await localExperiencesService.searchExperiences({
          city,
          limit: 20,
          sortBy: 'default',
        });

        if (experiences.length > 0) {
          // Map LocalExperience → Experience store format, preserving ALL rich fields
          const mappedResults = experiences.map((exp: LocalExperience) => {
            // Duration in minutes
            let durationMinutes = 120;
            if (exp.duration?.value) {
              const unit = exp.duration.unit || 'hours';
              durationMinutes = unit === 'hours' ? exp.duration.value * 60
                : unit === 'days' ? exp.duration.value * 1440
                : exp.duration.value;
            }

            // Images: use heroImage first, then mapped image urls
            const imageUrls = (exp.images || []).map(img =>
              typeof img === 'string' ? img : img.url || ''
            ).filter(Boolean);
            if (exp.heroImage && !imageUrls.includes(exp.heroImage)) {
              imageUrls.unshift(exp.heroImage);
            }

            return {
              id: exp.productCode || exp.id,
              title: exp.title,
              description: exp.description || '',
              shortDescription: exp.shortDescription || '',
              category: exp.category || 'tours',
              subcategory: '',
              images: imageUrls,
              location: {
                name: exp.location?.city || '',
                city: exp.location?.city || '',
                country: exp.location?.country || '',
                address: exp.location?.address || '',
                coordinates: exp.location?.coordinates,
              },
              duration: durationMinutes,
              rating: exp.rating?.score ?? 4.5,
              reviewCount: exp.rating?.reviewCount ?? 0,
              price: {
                amount: exp.price?.amount || 0,
                currency: exp.price?.currency || 'USD',
                formatted: exp.price?.formatted || `$${exp.price?.amount || 0}`,
              },
              includes: exp.included || [],
              excludes: exp.notIncluded || [],
              highlights: exp.highlights || [],
              languages: exp.languages || ['English'],
              maxParticipants: exp.maxGroupSize || 0,
              cancellationPolicy: exp.freeCancellation ? 'free_24h' : 'non_refundable',
              instantConfirmation: exp.instantConfirmation || false,
              bookingUrl: exp.bookingUrl || '',
              freeCancellation: exp.freeCancellation || false,
              mobileTicket: true,
              available: true,
              bestSeller: false,
              featured: false,
              tags: exp.tags || [],
            };
          }) as any[];

          setResults(mappedResults);
        }

        onComplete();
      } catch (error) {
        console.error('Experience search error:', error);
        Alert.alert('Search Failed', 'Unable to search for experiences right now. Please try again later.');
        onComplete();
      }
    };

    performSearch();
  }, []);

  useEffect(() => {
    // Icon pulse animations
    icon1Scale.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 400 }),
        withTiming(1, { duration: 400 })
      ),
      -1,
      false
    );

    icon2Scale.value = withDelay(
      200,
      withRepeat(
        withSequence(
          withTiming(1.2, { duration: 400 }),
          withTiming(1, { duration: 400 })
        ),
        -1,
        false
      )
    );

    icon3Scale.value = withDelay(
      400,
      withRepeat(
        withSequence(
          withTiming(1.2, { duration: 400 }),
          withTiming(1, { duration: 400 })
        ),
        -1,
        false
      )
    );

    icon4Scale.value = withDelay(
      600,
      withRepeat(
        withSequence(
          withTiming(1.2, { duration: 400 }),
          withTiming(1, { duration: 400 })
        ),
        -1,
        false
      )
    );

    // Progress bar animation
    progressWidth.value = withTiming(100, { duration: 2500 });

    // Message rotation
    const messageInterval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 600);

    // Fallback timeout if search takes too long
    const fallbackTimer = setTimeout(() => {
      onComplete();
    }, 15000);

    return () => {
      clearTimeout(fallbackTimer);
      clearInterval(messageInterval);
    };
  }, []);

  const icon1Style = useAnimatedStyle(() => ({
    transform: [{ scale: icon1Scale.value }],
  }));

  const icon2Style = useAnimatedStyle(() => ({
    transform: [{ scale: icon2Scale.value }],
  }));

  const icon3Style = useAnimatedStyle(() => ({
    transform: [{ scale: icon3Scale.value }],
  }));

  const icon4Style = useAnimatedStyle(() => ({
    transform: [{ scale: icon4Scale.value }],
  }));

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('../../../../../../assets/images/experiencebg.jpg')}
        style={[styles.background, { paddingTop: insets.top }]}
        resizeMode="cover"
      >
        <View style={styles.overlay} />

        <View style={styles.content}>
          {/* Icons */}
          <Animated.View entering={FadeIn.duration(400)} style={styles.iconsContainer}>
            <Animated.View style={[styles.iconCircle, styles.iconCircle1, icon1Style]}>
              <Map1 size={28} color="#FFFFFF" variant="Bold" />
            </Animated.View>
            <Animated.View style={[styles.iconCircle, styles.iconCircle2, icon2Style]}>
              <Ticket size={28} color="#FFFFFF" variant="Bold" />
            </Animated.View>
            <Animated.View style={[styles.iconCircle, styles.iconCircle3, icon3Style]}>
              <Coffee size={28} color="#FFFFFF" variant="Bold" />
            </Animated.View>
            <Animated.View style={[styles.iconCircle, styles.iconCircle4, icon4Style]}>
              <Activity size={28} color="#FFFFFF" variant="Bold" />
            </Animated.View>
            <View style={[styles.centerIcon, { backgroundColor: `${tc.primary}40` }]}>
              <Star1 size={32} color="#FFFFFF" variant="Bold" />
            </View>
          </Animated.View>

          {/* Search Summary */}
          <Animated.View entering={FadeInDown.duration(400).delay(200)} style={styles.summaryContainer}>
            <Text style={styles.searchingText}>Searching experiences in</Text>
            <Text style={styles.destinationText}>
              {searchParams.destination?.name || 'your destination'}
            </Text>
            {searchParams.date && (
              <Text style={styles.dateText}>
                {new Date(searchParams.date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
            )}
          </Animated.View>

          {/* Loading Message */}
          <Animated.View entering={FadeInDown.duration(400).delay(400)} style={styles.messageContainer}>
            <Text style={styles.loadingMessage}>{LOADING_MESSAGES[messageIndex]}</Text>
          </Animated.View>

          {/* Progress Bar */}
          <Animated.View entering={FadeInDown.duration(400).delay(600)} style={styles.progressContainer}>
            <View style={styles.progressTrack}>
              <Animated.View style={[styles.progressBar, { backgroundColor: tc.primary }, progressStyle]} />
            </View>
          </Animated.View>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  background: { flex: 1 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.55)' },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  iconsContainer: {
    width: 200,
    height: 200,
    position: 'relative',
    marginBottom: spacing.xl,
  },
  iconCircle: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircle1: {
    top: 0,
    left: '50%',
    marginLeft: -28,
  },
  iconCircle2: {
    top: '50%',
    right: 0,
    marginTop: -28,
  },
  iconCircle3: {
    bottom: 0,
    left: '50%',
    marginLeft: -28,
  },
  iconCircle4: {
    top: '50%',
    left: 0,
    marginTop: -28,
  },
  centerIcon: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -32,
    marginLeft: -32,
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  searchingText: {
    fontSize: typography.fontSize.base,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: spacing.xs,
  },
  destinationText: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: '#FFFFFF',
    marginBottom: spacing.xs,
  },
  dateText: {
    fontSize: typography.fontSize.base,
    color: 'rgba(255,255,255,0.9)',
  },
  messageContainer: {
    height: 30,
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  loadingMessage: {
    fontSize: typography.fontSize.base,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  progressContainer: {
    width: '100%',
    paddingHorizontal: spacing.xl,
  },
  progressTrack: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
});
