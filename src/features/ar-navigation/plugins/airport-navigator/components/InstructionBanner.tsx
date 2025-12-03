/**
 * INSTRUCTION BANNER
 * 
 * Top banner showing current navigation instruction with subtle pulse animation.
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { ArrowRight, ArrowLeft, ArrowUp, ArrowDown } from 'iconsax-react-native';
import { colors, spacing, typography } from '@/styles';
import { NavigationStep, NavigationDirection } from '../types/navigation.types';

interface InstructionBannerProps {
  step: NavigationStep;
  remainingDistance?: number; // Distance that counts down
}

export default function InstructionBanner({ step, remainingDistance }: InstructionBannerProps) {
  // Subtle pulse animation for the icon
  const iconScale = useSharedValue(1);

  useEffect(() => {
    iconScale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, []);

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  const getDirectionIcon = (direction: NavigationDirection) => {
    // Bigger icon, filled variant (Bold)
    const iconProps = { size: 32, color: colors.white, variant: 'Bold' as const };
    
    switch (direction) {
      case 'right':
      case 'slight_right':
        return <ArrowRight {...iconProps} />;
      case 'left':
      case 'slight_left':
        return <ArrowLeft {...iconProps} />;
      case 'upstairs':
        return <ArrowUp {...iconProps} />;
      case 'downstairs':
        return <ArrowDown {...iconProps} />;
      default:
        return <ArrowUp {...iconProps} />;
    }
  };

  const getDirectionColor = (direction: NavigationDirection) => {
    // Always use primary color for consistency
    return colors.primary;
  };

  const backgroundColor = getDirectionColor(step.direction);

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <Animated.View style={[styles.iconContainer, animatedIconStyle]}>
        {getDirectionIcon(step.direction)}
      </Animated.View>
      <View style={styles.textContainer}>
        <Text style={styles.instruction}>{step.instruction}</Text>
        <Text style={styles.distance}>
          {remainingDistance !== undefined ? `${remainingDistance}m` : `${step.distance}m`}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 110, // Closer to X button (was 140)
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.primary}CC`, // 80% opacity (more transparent)
    borderRadius: 28, // More rounded (was 16, now 28)
    padding: spacing.md, // More compact (was lg)
    paddingVertical: spacing.md, // More compact (was lg + 4)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  iconContainer: {
    width: 56, // Slightly smaller for compact (was 60)
    height: 56,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm, // Tighter spacing (was md)
  },
  textContainer: {
    flex: 1,
  },
  instruction: {
    fontSize: typography.fontSize.lg, // Increased from base (16 → 18)
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
    marginBottom: 2,
  },
  distance: {
    fontSize: typography.fontSize.base, // Increased from sm (14 → 16)
    fontWeight: typography.fontWeight.medium,
    color: 'rgba(255, 255, 255, 0.9)',
  },
});
