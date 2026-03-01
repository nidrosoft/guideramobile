/**
 * LoadingOverlay Component
 * 
 * Full-screen loading overlay for async actions like:
 * - Booking submissions
 * - Payment processing
 * - Data syncing
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, Animated, ActivityIndicator } from 'react-native';
import { colors, typography, spacing } from '@/styles';
import { useReducedMotion } from '@/utils/accessibility';

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
  subMessage?: string;
  transparent?: boolean;
}

export function LoadingOverlay({
  visible,
  message = 'Please wait...',
  subMessage,
  transparent = false,
}: LoadingOverlayProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (visible) {
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
      ]).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: reduceMotion ? 0 : 150,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, fadeAnim, scaleAnim, reduceMotion]);

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none" statusBarTranslucent>
      <Animated.View
        style={[
          styles.overlay,
          transparent && styles.overlayTransparent,
          { opacity: fadeAnim },
        ]}
      >
        <Animated.View
          style={[
            styles.content,
            { transform: [{ scale: scaleAnim }] },
          ]}
        >
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
          <Text style={styles.message}>{message}</Text>
          {subMessage && (
            <Text style={styles.subMessage}>{subMessage}</Text>
          )}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayTransparent: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  content: {
    backgroundColor: colors.bgElevated,
    borderRadius: 20,
    padding: spacing.xl,
    alignItems: 'center',
    minWidth: 200,
    maxWidth: 280,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  loaderContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: `${colors.primary}10`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  message: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray900,
    textAlign: 'center',
  },
  subMessage: {
    fontSize: typography.fontSize.sm,
    color: colors.gray500,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
});

export default LoadingOverlay;
