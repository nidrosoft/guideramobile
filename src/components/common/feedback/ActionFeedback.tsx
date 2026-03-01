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
import { colors, typography, spacing } from '@/styles';
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

const FEEDBACK_CONFIG: Record<FeedbackType, {
  icon: React.ReactNode;
  color: string;
  haptic: Haptics.NotificationFeedbackType;
}> = {
  success: {
    icon: <TickCircle size={48} color={colors.success} variant="Bold" />,
    color: colors.success,
    haptic: Haptics.NotificationFeedbackType.Success,
  },
  error: {
    icon: <CloseCircle size={48} color={colors.error} variant="Bold" />,
    color: colors.error,
    haptic: Haptics.NotificationFeedbackType.Error,
  },
  warning: {
    icon: <Warning2 size={48} color={colors.warning} variant="Bold" />,
    color: colors.warning,
    haptic: Haptics.NotificationFeedbackType.Warning,
  },
  info: {
    icon: <InfoCircle size={48} color={colors.info} variant="Bold" />,
    color: colors.info,
    haptic: Haptics.NotificationFeedbackType.Success,
  },
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
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const iconScaleAnim = useRef(new Animated.Value(0)).current;
  const reduceMotion = useReducedMotion();

  const config = FEEDBACK_CONFIG[type];

  useEffect(() => {
    if (visible) {
      // Haptic feedback
      if (haptic) {
        Haptics.notificationAsync(config.haptic);
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
  }, [visible, duration, onDismiss, fadeAnim, scaleAnim, iconScaleAnim, reduceMotion, haptic, config.haptic]);

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none" statusBarTranslucent>
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <Animated.View
          style={[
            styles.content,
            { transform: [{ scale: scaleAnim }] },
          ]}
        >
          <Animated.View
            style={[
              styles.iconContainer,
              { backgroundColor: `${config.color}15` },
              { transform: [{ scale: iconScaleAnim }] },
            ]}
          >
            {config.icon}
          </Animated.View>
          
          <Text style={styles.title}>{title}</Text>
          {message && <Text style={styles.message}>{message}</Text>}
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
    backgroundColor: colors.bgElevated,
    borderRadius: 24,
    padding: spacing.xl,
    alignItems: 'center',
    minWidth: 220,
    maxWidth: 300,
    shadowColor: colors.black,
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
    color: colors.gray900,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  message: {
    fontSize: typography.fontSize.sm,
    color: colors.gray500,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default ActionFeedback;
