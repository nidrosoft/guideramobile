/**
 * ActionFeedback Component
 *
 * Animated success/error feedback for completed actions.
 * Shows checkmark, X, or custom icon with animation.
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, Animated } from 'react-native';
import { TickCircle, CloseCircle, InfoCircle, Warning2 } from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { typography, spacing } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { useReducedMotion } from '@/utils/accessibility';

type FeedbackType = 'success' | 'error' | 'warning' | 'info';

interface ActionFeedbackProps {
  visible: boolean;
  type: FeedbackType;
  title: string;
  message?: string;
  duration?: number;
  onDismiss?: () => void;
  haptic?: boolean;
}

const HAPTIC_MAP: Record<FeedbackType, Haptics.NotificationFeedbackType> = {
  success: Haptics.NotificationFeedbackType.Success,
  error: Haptics.NotificationFeedbackType.Error,
  warning: Haptics.NotificationFeedbackType.Warning,
  info: Haptics.NotificationFeedbackType.Success,
};

export function ActionFeedback({
  visible,
  type,
  title,
  message,
  duration = 2000,
  onDismiss,
  haptic = true,
}: ActionFeedbackProps) {
  const { colors } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const iconScaleAnim = useRef(new Animated.Value(0)).current;
  const reduceMotion = useReducedMotion();

  const colorMap: Record<FeedbackType, string> = {
    success: colors.success,
    error: colors.error,
    warning: colors.warning,
    info: colors.info,
  };

  const feedbackColor = colorMap[type];
  const feedbackHaptic = HAPTIC_MAP[type];

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <TickCircle size={48} color={colors.success} variant="Bold" />;
      case 'error':
        return <CloseCircle size={48} color={colors.error} variant="Bold" />;
      case 'warning':
        return <Warning2 size={48} color={colors.warning} variant="Bold" />;
      case 'info':
        return <InfoCircle size={48} color={colors.info} variant="Bold" />;
    }
  };

  useEffect(() => {
    if (visible) {
      // Haptic feedback
      if (haptic) {
        Haptics.notificationAsync(feedbackHaptic);
      }

      // Animate in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: reduceMotion ? 0 : 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.delay(100),
          Animated.spring(iconScaleAnim, {
            toValue: 1,
            friction: 5,
            tension: 100,
            useNativeDriver: true,
          }),
        ]),
      ]).start();

      // Auto dismiss
      const timer = setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: reduceMotion ? 0 : 200,
          useNativeDriver: true,
        }).start(() => {
          onDismiss?.();
        });
      }, duration);

      return () => clearTimeout(timer);
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.5);
      iconScaleAnim.setValue(0);
    }
  }, [visible, duration, onDismiss, fadeAnim, scaleAnim, iconScaleAnim, reduceMotion, haptic, feedbackHaptic]);

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none" statusBarTranslucent>
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <Animated.View
          style={[
            styles.content,
            { backgroundColor: colors.bgElevated, transform: [{ scale: scaleAnim }] },
          ]}
        >
          <Animated.View
            style={[
              styles.iconContainer,
              { backgroundColor: `${feedbackColor}15` },
              { transform: [{ scale: iconScaleAnim }] },
            ]}
          >
            {getIcon()}
          </Animated.View>

          <Text style={[styles.title, { color: colors.gray900 }]}>{title}</Text>
          {message && <Text style={[styles.message, { color: colors.gray500 }]}>{message}</Text>}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    borderRadius: 24,
    padding: spacing.xl,
    alignItems: 'center',
    minWidth: 220,
    maxWidth: 300,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  message: {
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default ActionFeedback;
