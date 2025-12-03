/**
 * SAFETY STATUS BAR
 * 
 * Top bar showing current safety status with animated background.
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Text, Animated, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  ShieldTick, 
  ShieldCross,
  Location,
  Notification,
} from 'iconsax-react-native';
import { colors, spacing, typography } from '@/styles';
import { SafetyStatus } from '../types/dangerAlerts.types';
import { getDangerColor, getDangerGradient } from '../data/mockDangerData';

interface SafetyStatusBarProps {
  safetyStatus: SafetyStatus;
  onPress?: () => void;
}

export default function SafetyStatusBar({ safetyStatus, onPress }: SafetyStatusBarProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  const isSafe = safetyStatus.level === 'low' && safetyStatus.activeAlerts === 0;
  const dangerColor = getDangerColor(safetyStatus.level);
  const gradient: [string, string] = isSafe 
    ? [colors.success, '#059669'] 
    : getDangerGradient(safetyStatus.level);

  // Pulse animation for danger states
  useEffect(() => {
    if (!isSafe) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.02,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [isSafe]);

  return (
    <TouchableOpacity 
      activeOpacity={0.9} 
      onPress={onPress}
      style={styles.container}
    >
      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <LinearGradient
          colors={gradient}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          {/* Icon */}
          <View style={styles.iconContainer}>
            {isSafe ? (
              <ShieldTick size={24} color={colors.white} variant="Bold" />
            ) : (
              <ShieldCross size={24} color={colors.white} variant="Bold" />
            )}
          </View>

          {/* Status Info */}
          <View style={styles.infoContainer}>
            <Text style={styles.statusLabel}>
              {isSafe ? 'SAFE ZONE' : `${safetyStatus.level.toUpperCase()} RISK`}
            </Text>
            <Text style={styles.statusMessage} numberOfLines={1}>
              {safetyStatus.message}
            </Text>
          </View>

          {/* Right side info */}
          <View style={styles.rightContainer}>
            {safetyStatus.nearestDanger && (
              <View style={styles.distanceContainer}>
                <Location size={14} color={colors.white} variant="Bold" />
                <Text style={styles.distanceText}>
                  {formatDistance(safetyStatus.nearestDanger)}
                </Text>
              </View>
            )}
            {safetyStatus.activeAlerts > 0 && (
              <View style={styles.alertBadge}>
                <Notification size={12} color={colors.white} variant="Bold" />
                <Text style={styles.alertCount}>{safetyStatus.activeAlerts}</Text>
              </View>
            )}
          </View>
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
}

function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${meters}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: spacing.md,
    right: spacing.md,
    zIndex: 100,
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  statusLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 1,
  },
  statusMessage: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
    marginTop: 2,
  },
  rightContainer: {
    alignItems: 'flex-end',
    gap: 4,
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  distanceText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
  alertBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  alertCount: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
});
