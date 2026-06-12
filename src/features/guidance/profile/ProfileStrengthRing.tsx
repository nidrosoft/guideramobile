/**
 * Animated circular progress ring for Profile Strength. Reused on the Account
 * screen header and the hub.
 */
import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '@/context/ThemeContext';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface Props {
  value: number; // 0-100
  size?: number;
  strokeWidth?: number;
  label?: string;
  reduceMotion?: boolean;
  /** override the unfilled track color (e.g. on a colored background) */
  trackColor?: string;
  /** override the filled progress color */
  progressColor?: string;
  /** override the % + label text color */
  textColor?: string;
}

export function ProfileStrengthRing({
  value,
  size = 64,
  strokeWidth = 6,
  label,
  reduceMotion,
  trackColor,
  progressColor,
  textColor,
}: Props) {
  const { colors } = useTheme();
  const track = trackColor ?? colors.gray200;
  const progressStroke = progressColor ?? colors.primary;
  const valueColor = textColor ?? colors.textPrimary;
  const labelColor = textColor ?? colors.textTertiary;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = useSharedValue(0);

  useEffect(() => {
    const target = Math.max(0, Math.min(100, value)) / 100;
    progress.value = reduceMotion
      ? target
      : withTiming(target, { duration: 700, easing: Easing.out(Easing.cubic) });
  }, [value, reduceMotion]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={track}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={progressStroke}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.center}>
        <Text style={[styles.value, { color: valueColor, fontSize: size * 0.28 }]}>
          {Math.round(value)}%
        </Text>
        {label ? <Text style={[styles.label, { color: labelColor }]}>{label}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  value: { fontFamily: 'HostGrotesk-Bold' },
  label: { fontSize: 9, fontFamily: 'Rubik-Medium', marginTop: 1 },
});

export default ProfileStrengthRing;
