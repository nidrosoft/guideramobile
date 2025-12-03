/**
 * SAFETY RADAR
 * 
 * Animated radar component showing safety status.
 * Pulses and changes color based on danger level.
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Text, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ShieldTick, ShieldCross } from 'iconsax-react-native';
import { colors, spacing, typography } from '@/styles';
import { DangerLevel, SafetyStatus } from '../types/dangerAlerts.types';
import { getDangerColor, getDangerGradient } from '../data/mockDangerData';

interface SafetyRadarProps {
  safetyStatus: SafetyStatus;
  size?: number;
}

export default function SafetyRadar({ safetyStatus, size = 120 }: SafetyRadarProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0.3)).current;

  // Pulse animation
  useEffect(() => {
    const pulseSpeed = safetyStatus.level === 'critical' ? 500 : 
                       safetyStatus.level === 'high' ? 800 : 
                       safetyStatus.level === 'medium' ? 1200 : 2000;

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: pulseSpeed,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: pulseSpeed,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    pulse.start();
    return () => pulse.stop();
  }, [safetyStatus.level]);

  // Rotation animation for radar sweep
  useEffect(() => {
    const rotate = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: safetyStatus.level === 'low' ? 4000 : 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    rotate.start();
    return () => rotate.stop();
  }, [safetyStatus.level]);

  // Glow animation
  useEffect(() => {
    const glow = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 0.8,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.3,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    glow.start();
    return () => glow.stop();
  }, []);

  const dangerColor = getDangerColor(safetyStatus.level);
  const gradient = getDangerGradient(safetyStatus.level);
  const isSafe = safetyStatus.level === 'low' && safetyStatus.activeAlerts === 0;

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Outer glow ring */}
      <Animated.View
        style={[
          styles.glowRing,
          {
            width: size + 30,
            height: size + 30,
            borderRadius: (size + 30) / 2,
            backgroundColor: dangerColor,
            opacity: glowAnim,
            transform: [{ scale: pulseAnim }],
          },
        ]}
      />

      {/* Pulse rings */}
      <Animated.View
        style={[
          styles.pulseRing,
          {
            width: size + 15,
            height: size + 15,
            borderRadius: (size + 15) / 2,
            borderColor: dangerColor,
            transform: [{ scale: pulseAnim }],
          },
        ]}
      />

      {/* Main radar circle */}
      <LinearGradient
        colors={isSafe ? [colors.success, '#059669'] : gradient}
        style={[
          styles.radarCircle,
          { width: size, height: size, borderRadius: size / 2 },
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Radar sweep line */}
        <Animated.View
          style={[
            styles.radarSweep,
            {
              transform: [{ rotate: rotateInterpolate }],
            },
          ]}
        >
          <LinearGradient
            colors={['transparent', 'rgba(255,255,255,0.4)']}
            style={styles.sweepGradient}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
          />
        </Animated.View>

        {/* Center icon */}
        <View style={styles.centerIcon}>
          {isSafe ? (
            <ShieldTick size={size * 0.35} color={colors.white} variant="Bold" />
          ) : (
            <ShieldCross size={size * 0.35} color={colors.white} variant="Bold" />
          )}
        </View>

        {/* Radar rings */}
        <View style={[styles.radarRing, { width: size * 0.7, height: size * 0.7, borderRadius: size * 0.35 }]} />
        <View style={[styles.radarRing, { width: size * 0.45, height: size * 0.45, borderRadius: size * 0.225 }]} />
      </LinearGradient>

      {/* Status label */}
      <View style={[styles.statusLabel, { backgroundColor: isSafe ? colors.success : dangerColor }]}>
        <Text style={styles.statusText}>
          {isSafe ? 'SAFE' : safetyStatus.level.toUpperCase()}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowRing: {
    position: 'absolute',
  },
  pulseRing: {
    position: 'absolute',
    borderWidth: 2,
    opacity: 0.5,
  },
  radarCircle: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  radarSweep: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    alignItems: 'center',
  },
  sweepGradient: {
    width: '50%',
    height: 2,
    position: 'absolute',
    right: 0,
    top: '50%',
    marginTop: -1,
  },
  centerIcon: {
    zIndex: 10,
  },
  radarRing: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  statusLabel: {
    position: 'absolute',
    bottom: -12,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
    letterSpacing: 1,
  },
});
