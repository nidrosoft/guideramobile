/**
 * HOTEL SEARCH LOADING SCREEN
 * 
 * Animated loading screen shown while searching for hotels.
 * Similar to FlightSearchLoadingScreen.
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  FadeIn,
  FadeInUp,
} from 'react-native-reanimated';
import { Building, TickCircle } from 'iconsax-react-native';
import { colors, spacing, typography } from '@/styles';
import { useHotelStore } from '../../../stores/useHotelStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface HotelSearchLoadingScreenProps {
  onComplete: () => void;
}

const LOADING_MESSAGES = [
  'Searching for hotels...',
  'Checking availability...',
  'Comparing prices...',
  'Finding the best deals...',
  'Almost there...',
];

const LOADING_STEPS = [
  { text: 'Searching properties', delay: 0 },
  { text: 'Checking room availability', delay: 800 },
  { text: 'Comparing prices', delay: 1600 },
  { text: 'Finding best deals', delay: 2400 },
];

export default function HotelSearchLoadingScreen({
  onComplete,
}: HotelSearchLoadingScreenProps) {
  const { searchParams } = useHotelStore();
  const [currentMessage, setCurrentMessage] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  
  // Animation values
  const buildingScale = useSharedValue(1);
  const buildingRotate = useSharedValue(0);
  const progressWidth = useSharedValue(0);
  
  useEffect(() => {
    // Building bounce animation
    buildingScale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 600, easing: Easing.bezier(0.25, 0.1, 0.25, 1) }),
        withTiming(1, { duration: 600, easing: Easing.bezier(0.25, 0.1, 0.25, 1) })
      ),
      -1,
      true
    );
    
    // Subtle rotation
    buildingRotate.value = withRepeat(
      withSequence(
        withTiming(5, { duration: 1000 }),
        withTiming(-5, { duration: 1000 })
      ),
      -1,
      true
    );
    
    // Progress bar animation
    progressWidth.value = withTiming(100, { duration: 3000 });
    
    // Cycle through messages
    const messageInterval = setInterval(() => {
      setCurrentMessage(prev => (prev + 1) % LOADING_MESSAGES.length);
    }, 1500);
    
    // Complete steps progressively
    LOADING_STEPS.forEach((step, index) => {
      setTimeout(() => {
        setCompletedSteps(prev => [...prev, index]);
      }, step.delay + 500);
    });
    
    // Complete after animation
    const timer = setTimeout(() => {
      onComplete();
    }, 3500);
    
    return () => {
      clearInterval(messageInterval);
      clearTimeout(timer);
    };
  }, []);
  
  const buildingStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: buildingScale.value },
      { rotate: `${buildingRotate.value}deg` },
    ],
  }));
  
  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  return (
    <View style={styles.container}>
      {/* Animated Building Icon */}
      <Animated.View 
        entering={FadeIn.duration(400)}
        style={styles.iconContainer}
      >
        <Animated.View style={buildingStyle}>
          <View style={styles.iconCircle}>
            <Building size={60} color={colors.primary} variant="Bold" />
          </View>
        </Animated.View>
      </Animated.View>
      
      {/* Title */}
      <Animated.Text 
        entering={FadeInUp.duration(400).delay(200)}
        style={styles.title}
      >
        Finding Hotels
      </Animated.Text>
      
      {/* Destination */}
      <Animated.Text 
        entering={FadeInUp.duration(400).delay(300)}
        style={styles.subtitle}
      >
        in {searchParams.destination?.name || 'your destination'}
      </Animated.Text>
      
      {/* Progress Bar */}
      <Animated.View 
        entering={FadeInUp.duration(400).delay(400)}
        style={styles.progressContainer}
      >
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, progressStyle]} />
        </View>
      </Animated.View>
      
      {/* Loading Steps */}
      <Animated.View 
        entering={FadeInUp.duration(400).delay(500)}
        style={styles.stepsContainer}
      >
        {LOADING_STEPS.map((step, index) => {
          const isCompleted = completedSteps.includes(index);
          return (
            <View key={index} style={styles.stepRow}>
              <View style={[styles.stepDot, isCompleted && styles.stepDotCompleted]}>
                {isCompleted && <TickCircle size={16} color={colors.white} variant="Bold" />}
              </View>
              <Text style={[styles.stepText, isCompleted && styles.stepTextCompleted]}>
                {step.text}
              </Text>
            </View>
          );
        })}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  iconContainer: {
    marginBottom: spacing.xl,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.lg,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  progressContainer: {
    width: '100%',
    marginBottom: spacing.xl,
  },
  progressTrack: {
    height: 6,
    backgroundColor: colors.gray100,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  stepsContainer: {
    width: '100%',
    gap: spacing.md,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.gray200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepDotCompleted: {
    backgroundColor: colors.success,
  },
  stepText: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
  },
  stepTextCompleted: {
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.medium,
  },
});
