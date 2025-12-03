/**
 * STEP INDICATOR
 * 
 * Visual progress indicator showing current step in the flow.
 * Displays as dots or progress bar.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '@/styles';

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  style?: any;
}

export default function StepIndicator({ currentStep, totalSteps, style }: StepIndicatorProps) {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.text}>
        Step {currentStep} of {totalSteps}
      </Text>
      <View style={styles.dotsContainer}>
        {Array.from({ length: totalSteps }).map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              index < currentStep ? styles.dotActive : styles.dotInactive,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  text: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    color: colors.gray600,
    marginBottom: spacing.xs,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    backgroundColor: colors.primary,
  },
  dotInactive: {
    backgroundColor: colors.gray300,
  },
});
