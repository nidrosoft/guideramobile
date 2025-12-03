/**
 * ZONE ALERT POPUP
 * 
 * Beautiful floating alert that appears when user enters/exits a zone.
 * Matches the design from the mockups with smooth animations.
 */

import React, { useEffect, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { 
  ShieldTick, 
  ShieldCross,
  CloseCircle,
  Warning2,
  Danger,
} from 'iconsax-react-native';
import { colors, spacing, typography } from '@/styles';
import { DangerLevel } from '../types/dangerAlerts.types';

const { width } = Dimensions.get('window');

export type AlertType = 'entering_danger' | 'exiting_danger' | 'safe_zone' | 'warning';

interface ZoneAlertPopupProps {
  visible: boolean;
  type: AlertType;
  title: string;
  subtitle: string;
  radius?: string;
  description?: string;
  dangerLevel?: DangerLevel;
  onDismiss: () => void;
  autoDismissMs?: number;
}

export default function ZoneAlertPopup({
  visible,
  type,
  title,
  subtitle,
  radius,
  description,
  dangerLevel = 'medium',
  onDismiss,
  autoDismissMs = 6000,
}: ZoneAlertPopupProps) {
  const slideAnim = useRef(new Animated.Value(-200)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const progressAnim = useRef(new Animated.Value(1)).current;

  // Determine colors based on type
  const isSafe = type === 'safe_zone' || type === 'exiting_danger';
  const isDanger = type === 'entering_danger';
  
  const getGradientColors = (): [string, string] => {
    if (isSafe) return ['#10B981', '#059669'];
    if (isDanger) {
      switch (dangerLevel) {
        case 'critical': return ['#DC2626', '#991B1B'];
        case 'high': return ['#EF4444', '#DC2626'];
        case 'medium': return ['#F97316', '#EA580C'];
        default: return ['#F59E0B', '#D97706'];
      }
    }
    return ['#F59E0B', '#D97706'];
  };

  const getIcon = () => {
    if (isSafe) {
      return <ShieldTick size={24} color={colors.white} variant="Bold" />;
    }
    if (dangerLevel === 'critical' || dangerLevel === 'high') {
      return <Danger size={24} color={colors.white} variant="Bold" />;
    }
    return <Warning2 size={24} color={colors.white} variant="Bold" />;
  };

  // Animation on visibility change
  useEffect(() => {
    if (visible) {
      // Haptic feedback
      if (isSafe) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }

      // Slide in animation
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 50,
          friction: 8,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 50,
          friction: 8,
        }),
      ]).start();

      // Progress bar animation
      progressAnim.setValue(1);
      Animated.timing(progressAnim, {
        toValue: 0,
        duration: autoDismissMs,
        useNativeDriver: false,
      }).start();

      // Auto dismiss
      const timer = setTimeout(() => {
        handleDismiss();
      }, autoDismissMs);

      return () => clearTimeout(timer);
    } else {
      // Slide out animation
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -200,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleDismiss = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -200,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  if (!visible) return null;

  const gradientColors = getGradientColors();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [
            { translateY: slideAnim },
            { scale: scaleAnim },
          ],
          opacity: opacityAnim,
        },
      ]}
    >
      <LinearGradient
        colors={gradientColors}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        {/* Icon */}
        <View style={styles.iconContainer}>
          {getIcon()}
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.subtitleRow}>
            <View style={[styles.dot, { backgroundColor: isSafe ? '#34D399' : '#FCD34D' }]} />
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>
        </View>

        {/* Close button */}
        <TouchableOpacity 
          style={styles.closeButton} 
          onPress={handleDismiss}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <CloseCircle size={24} color="rgba(255,255,255,0.8)" variant="Bold" />
        </TouchableOpacity>

        {/* Progress bar */}
        <Animated.View 
          style={[
            styles.progressBar,
            {
              width: progressAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]} 
        />
      </LinearGradient>

      {/* Extended info card (optional) */}
      {(radius || description) && (
        <View style={styles.infoCard}>
          {radius && (
            <View style={[styles.radiusBadge, { backgroundColor: isSafe ? '#D1FAE5' : '#FEF3C7' }]}>
              <Text style={[styles.radiusText, { color: isSafe ? '#059669' : '#D97706' }]}>
                {radius}
              </Text>
            </View>
          )}
          {description && (
            <Text style={styles.description}>{description}</Text>
          )}
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: spacing.md,
    right: spacing.md,
    zIndex: 1000,
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
    overflow: 'hidden',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  title: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
    letterSpacing: 0.5,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    color: 'rgba(255,255,255,0.9)',
  },
  closeButton: {
    padding: 4,
  },
  progressBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderBottomLeftRadius: 16,
  },
  infoCard: {
    backgroundColor: colors.white,
    marginTop: -8,
    marginHorizontal: spacing.sm,
    paddingTop: spacing.md + 8,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    alignItems: 'center',
  },
  radiusBadge: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    borderRadius: 20,
    marginBottom: spacing.xs,
  },
  radiusText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  description: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
