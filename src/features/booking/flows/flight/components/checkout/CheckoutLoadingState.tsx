/**
 * CHECKOUT LOADING STATE
 * 
 * Loading screen shown while confirming flight price.
 */

import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Airplane } from 'iconsax-react-native';
import { colors, spacing, typography } from '@/styles';

interface CheckoutLoadingStateProps {
  message?: string;
}

export default function CheckoutLoadingState({
  message = 'Confirming flight price...',
}: CheckoutLoadingStateProps) {
  return (
    <View style={styles.container}>
      <Animated.View entering={FadeIn.duration(300)} style={styles.content}>
        <View style={styles.iconContainer}>
          <Airplane size={48} color={colors.primary} variant="Bold" />
        </View>
        
        <ActivityIndicator size="large" color={colors.primary} style={styles.spinner} />
        
        <Animated.Text entering={FadeInDown.duration(300).delay(200)} style={styles.message}>
          {message}
        </Animated.Text>
        
        <Animated.Text entering={FadeInDown.duration(300).delay(400)} style={styles.subMessage}>
          This may take a few seconds
        </Animated.Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.xl,
  },
  content: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  spinner: {
    marginBottom: spacing.lg,
  },
  message: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subMessage: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
