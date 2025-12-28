/**
 * EXPERIENCE SEARCH LOADING SCREEN
 * 
 * Animated loading screen while searching for experiences.
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
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
import { colors, spacing, typography } from '@/styles';
import { useExperienceStore } from '../../../stores/useExperienceStore';

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
  const { searchParams } = useExperienceStore();
  const [messageIndex, setMessageIndex] = useState(0);

  // Animation values
  const icon1Scale = useSharedValue(1);
  const icon2Scale = useSharedValue(1);
  const icon3Scale = useSharedValue(1);
  const icon4Scale = useSharedValue(1);
  const progressWidth = useSharedValue(0);

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

    // Complete after delay
    const timer = setTimeout(() => {
      onComplete();
    }, 2500);

    return () => {
      clearTimeout(timer);
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
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Icons */}
      <Animated.View entering={FadeIn.duration(400)} style={styles.iconsContainer}>
        <Animated.View style={[styles.iconCircle, styles.iconCircle1, icon1Style]}>
          <Map1 size={28} color={colors.primary} variant="Bold" />
        </Animated.View>
        <Animated.View style={[styles.iconCircle, styles.iconCircle2, icon2Style]}>
          <Ticket size={28} color={colors.success} variant="Bold" />
        </Animated.View>
        <Animated.View style={[styles.iconCircle, styles.iconCircle3, icon3Style]}>
          <Coffee size={28} color={colors.warning} variant="Bold" />
        </Animated.View>
        <Animated.View style={[styles.iconCircle, styles.iconCircle4, icon4Style]}>
          <Activity size={28} color={colors.error} variant="Bold" />
        </Animated.View>
        <View style={styles.centerIcon}>
          <Star1 size={32} color={colors.primary} variant="Bold" />
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
          <Animated.View style={[styles.progressBar, progressStyle]} />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
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
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  searchingText: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  destinationText: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  dateText: {
    fontSize: typography.fontSize.base,
    color: colors.primary,
  },
  messageContainer: {
    height: 30,
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  loadingMessage: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  progressContainer: {
    width: '100%',
    paddingHorizontal: spacing.xl,
  },
  progressTrack: {
    height: 4,
    backgroundColor: colors.gray200,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
});
