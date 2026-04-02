/**
 * AnimatedGradientBackground
 * 
 * React Native adaptation of the web framer-motion animated gradient component.
 * Smoothly transitions between multiple gradient color sets using Animated API
 * and expo-linear-gradient. Takes full screen by default.
 */

import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

type GradientSet = [string, string];

interface AnimatedGradientBackgroundProps {
  children?: React.ReactNode;
  style?: ViewStyle;
  gradients?: GradientSet[];
  animationDuration?: number;
}

const DEFAULT_GRADIENTS: GradientSet[] = [
  ['#3FC39E', '#2D9A7A'],   // Primary green (Guidera brand)
  ['#2d1b69', '#11998e'],   // Deep purple → teal
  ['#8e2de2', '#4a00e0'],   // Violet → deep blue
  ['#0f3460', '#e94560'],   // Navy → coral red
  ['#134e5e', '#71b280'],   // Dark teal → sage green
  ['#1a1a2e', '#e94560'],   // Midnight → rose
  ['#0d324d', '#7f5a83'],   // Ocean blue → mauve
  ['#1b4332', '#3FC39E'],   // Forest → primary green (loops back)
];

function interpolateColor(from: string, to: string, t: number): string {
  const f = parseInt(from.slice(1), 16);
  const tC = parseInt(to.slice(1), 16);
  const fR = (f >> 16) & 0xff, fG = (f >> 8) & 0xff, fB = f & 0xff;
  const tR = (tC >> 16) & 0xff, tG = (tC >> 8) & 0xff, tB = tC & 0xff;
  const r = Math.round(fR + (tR - fR) * t);
  const g = Math.round(fG + (tG - fG) * t);
  const b = Math.round(fB + (tB - fB) * t);
  return `rgb(${r},${g},${b})`;
}

export function AnimatedGradientBackground({
  children,
  style,
  gradients = DEFAULT_GRADIENTS,
  animationDuration = 12,
}: AnimatedGradientBackgroundProps) {
  const indexRef = useRef(0);
  const animVal = useRef(new Animated.Value(0)).current;
  const [colors, setColors] = React.useState<[string, string]>(gradients[0]);

  useEffect(() => {
    let cancelled = false;
    const durationPerStep = (animationDuration / (gradients.length - 1)) * 1000;

    const listenerId = animVal.addListener(({ value }) => {
      const totalSteps = gradients.length - 1;
      const segment = Math.min(Math.floor(value * totalSteps), totalSteps - 1);
      const segT = (value * totalSteps) - segment;
      const from = gradients[segment];
      const to = gradients[Math.min(segment + 1, totalSteps)];
      setColors([
        interpolateColor(from[0], to[0], segT),
        interpolateColor(from[1], to[1], segT),
      ]);
    });

    function runCycle() {
      if (cancelled) return;
      animVal.setValue(0);
      Animated.timing(animVal, {
        toValue: 1,
        duration: durationPerStep * (gradients.length - 1),
        useNativeDriver: false,
      }).start(({ finished }) => {
        if (finished && !cancelled) {
          runCycle();
        }
      });
    }

    runCycle();

    return () => {
      cancelled = true;
      animVal.removeListener(listenerId);
      animVal.stopAnimation();
    };
  }, [animVal, gradients, animationDuration]);

  return (
    <LinearGradient
      colors={colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.container, style]}
    >
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
});
