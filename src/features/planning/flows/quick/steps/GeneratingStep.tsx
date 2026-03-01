/**
 * GENERATING STEP
 * 
 * Step 4: AI is creating your trip
 * Animated loading state with progress messages.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  Easing,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Magicpen, 
  Location, 
  Calendar, 
  Sun1, 
  Shield, 
  Bag2,
  TickCircle,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, typography } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { usePlanningStore } from '../../../stores/usePlanningStore';
import { AI_GENERATION_MESSAGES } from '../../../config/planning.config';
import { generateMockAIContent } from '../../../services/aiService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface GeneratingStepProps {
  onNext: () => void;
  onBack: () => void;
  onClose: () => void;
}

// Floating icon component
const FloatingIcon = ({ 
  Icon, 
  delay, 
  startX, 
  startY 
}: { 
  Icon: any; 
  delay: number; 
  startX: number; 
  startY: number;
}) => {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.5);
  
  useEffect(() => {
    const timeout = setTimeout(() => {
      opacity.value = withTiming(0.6, { duration: 500 });
      scale.value = withSpring(1);
      translateY.value = withRepeat(
        withSequence(
          withTiming(-15, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    }, delay);
    
    return () => clearTimeout(timeout);
  }, []);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));
  
  return (
    <Animated.View style={[styles.floatingIcon, { left: startX, top: startY }, animatedStyle]}>
      <Icon size={24} color={colors.primary} variant="Bold" />
    </Animated.View>
  );
};

export default function GeneratingStep({
  onNext,
  onBack,
  onClose,
}: GeneratingStepProps) {
  const insets = useSafeAreaInsets();
  const { colors: tc } = useTheme();
  const {
    quickTripData,
    startGeneration,
    updateGenerationProgress,
    setAIContent,
    generationProgress,
    generationMessage,
  } = usePlanningStore();
  
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  
  // Use ref to avoid stale closure issues with onNext
  const onNextRef = useRef(onNext);
  onNextRef.current = onNext;
  
  // Animation values
  const progressWidth = useSharedValue(0);
  const pulseScale = useSharedValue(1);
  const globeRotation = useSharedValue(0);
  const checkScale = useSharedValue(0);
  
  // Start generation on mount
  useEffect(() => {
    startGeneration();
    
    // Animate globe rotation
    globeRotation.value = withRepeat(
      withTiming(360, { duration: 8000, easing: Easing.linear }),
      -1,
      false
    );
    
    // Pulse animation
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1,
      true
    );
    
    // Simulate AI generation with progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15 + 5;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        
        // Generate mock AI content
        const aiContent = generateMockAIContent(quickTripData);
        setAIContent(aiContent);
        
        // Show completion animation
        setIsComplete(true);
        checkScale.value = withSpring(1, { damping: 10, stiffness: 200 });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        // Move to next step after delay
        setTimeout(() => {
          console.log('GeneratingStep: Calling onNext to move to ReviewStep');
          onNextRef.current();
        }, 1500);
      }
      
      progressWidth.value = withTiming(progress, { duration: 300 });
      
      // Update message
      const messageIndex = Math.min(
        Math.floor((progress / 100) * AI_GENERATION_MESSAGES.length),
        AI_GENERATION_MESSAGES.length - 1
      );
      setCurrentMessageIndex(messageIndex);
      updateGenerationProgress(progress, AI_GENERATION_MESSAGES[messageIndex]);
      
      // Haptic feedback at milestones
      if (progress >= 25 && progress < 30) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else if (progress >= 50 && progress < 55) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } else if (progress >= 75 && progress < 80) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }, 400);
    
    return () => clearInterval(interval);
  }, []);
  
  // Animated styles
  const progressBarStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));
  
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));
  
  const globeStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${globeRotation.value}deg` }],
  }));
  
  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
    opacity: checkScale.value,
  }));
  
  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: tc.background }]}>
      {/* Floating Icons - Positioned in top area only */}
      <View style={styles.floatingIconsContainer}>
        <FloatingIcon Icon={Location} delay={0} startX={40} startY={80} />
        <FloatingIcon Icon={Calendar} delay={200} startX={SCREEN_WIDTH - 90} startY={100} />
        <FloatingIcon Icon={Sun1} delay={400} startX={SCREEN_WIDTH - 50} startY={30} />
        <FloatingIcon Icon={Shield} delay={600} startX={SCREEN_WIDTH / 2 + 60} startY={60} />
        <FloatingIcon Icon={Bag2} delay={800} startX={SCREEN_WIDTH / 2 - 30} startY={20} />
      </View>
      
      {/* Main Content */}
      <View style={styles.content}>
        {/* Animated Icon - Now with gradient background */}
        <Animated.View style={[styles.iconContainer, pulseStyle]}>
          <LinearGradient
            colors={[colors.primary, colors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconGradient}
          >
            {isComplete ? (
              <Animated.View style={[styles.checkContainer, checkStyle]}>
                <TickCircle size={60} color={colors.white} variant="Bold" />
              </Animated.View>
            ) : (
              <Animated.View style={globeStyle}>
                <Magicpen size={60} color={colors.white} variant="Bold" />
              </Animated.View>
            )}
          </LinearGradient>
        </Animated.View>
        
        {/* Title */}
        <Animated.Text 
          entering={FadeInDown.duration(400).delay(200)}
          style={styles.title}
        >
          {isComplete ? 'Your Trip is Ready!' : 'Creating Your Trip'}
        </Animated.Text>
        
        {/* Destination */}
        <Animated.Text 
          entering={FadeInDown.duration(400).delay(300)}
          style={styles.destination}
        >
          {quickTripData.destination?.name}, {quickTripData.destination?.country}
        </Animated.Text>
        
        {/* Progress Message */}
        <Animated.View 
          entering={FadeIn.duration(300)}
          key={currentMessageIndex}
          style={styles.messageContainer}
        >
          <Text style={styles.message}>
            {isComplete ? 'All set! Let\'s explore your itinerary' : AI_GENERATION_MESSAGES[currentMessageIndex]}
          </Text>
        </Animated.View>
        
        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressFill, progressBarStyle]} />
          </View>
          <Text style={styles.progressText}>
            {Math.round(generationProgress)}%
          </Text>
        </View>
        
        {/* What's Being Generated */}
        <Animated.View 
          entering={FadeInUp.duration(400).delay(500)}
          style={styles.generatingList}
        >
          <GeneratingItem 
            label="Day-by-day itinerary" 
            isComplete={generationProgress >= 30} 
          />
          <GeneratingItem 
            label="Local recommendations" 
            isComplete={generationProgress >= 50} 
          />
          <GeneratingItem 
            label="Safety tips" 
            isComplete={generationProgress >= 70} 
          />
          <GeneratingItem 
            label="Packing suggestions" 
            isComplete={generationProgress >= 90} 
          />
        </Animated.View>
      </View>
    </View>
  );
}

// Generating item component
const GeneratingItem = ({ label, isComplete }: { label: string; isComplete: boolean }) => {
  const scale = useSharedValue(isComplete ? 1 : 0);
  
  useEffect(() => {
    if (isComplete) {
      scale.value = withSpring(1, { damping: 12, stiffness: 200 });
    }
  }, [isComplete]);
  
  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: scale.value,
  }));
  
  return (
    <View style={styles.generatingItem}>
      <View style={styles.generatingItemIcon}>
        {isComplete ? (
          <Animated.View style={checkStyle}>
            <TickCircle size={16} color={colors.primary} variant="Bold" />
          </Animated.View>
        ) : (
          <View style={styles.generatingItemDot} />
        )}
      </View>
      <Text style={[
        styles.generatingItemLabel,
        isComplete && styles.generatingItemLabelComplete,
      ]}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgElevated,
  },
  
  // Floating Icons Container - Top area
  floatingIconsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
    zIndex: 1,
  },
  
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: 60, // Push content down slightly
  },
  
  // Floating Icons - Now with soft primary background
  floatingIcon: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Icon Container - Now with gradient inside
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    marginBottom: spacing.xl,
  },
  iconGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Text - Now with dark colors for white background
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  destination: {
    fontSize: typography.fontSize.lg,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  messageContainer: {
    minHeight: 24,
    marginBottom: spacing.lg,
  },
  message: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  
  // Progress - Now with primary colors
  progressContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  progressTrack: {
    flex: 1,
    height: 8,
    backgroundColor: colors.gray200,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
    width: 40,
    textAlign: 'right',
  },
  
  // Generating List
  generatingList: {
    width: '100%',
    gap: spacing.sm,
  },
  generatingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  generatingItemIcon: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  generatingItemDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.gray300,
  },
  generatingItemLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  generatingItemLabelComplete: {
    color: colors.primary,
    fontWeight: typography.fontWeight.medium,
  },
});
