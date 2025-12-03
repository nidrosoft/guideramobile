/**
 * BOOKING PROGRESS
 * 
 * Step progress indicator for booking flows.
 * Shows current step, completed steps, and overall progress.
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { TickCircle } from 'iconsax-react-native';
import Animated, { 
  useAnimatedStyle, 
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import { colors, spacing, typography, borderRadius } from '@/styles';
import { StepConfig } from '../../types/booking.types';

interface BookingProgressProps {
  steps: StepConfig[];
  currentStepIndex: number;
  visitedSteps?: string[];
  variant?: 'dots' | 'bar' | 'steps';
  showLabels?: boolean;
  compact?: boolean;
}

export default function BookingProgress({
  steps,
  currentStepIndex,
  visitedSteps = [],
  variant = 'bar',
  showLabels = false,
  compact = false,
}: BookingProgressProps) {
  const progress = ((currentStepIndex + 1) / steps.length) * 100;
  
  if (variant === 'bar') {
    return (
      <View style={[styles.barContainer, compact && styles.barCompact]}>
        <View style={styles.barBackground}>
          <Animated.View 
            style={[
              styles.barFill,
              { width: `${progress}%` },
            ]} 
          />
        </View>
        {showLabels && (
          <Text style={styles.barLabel}>
            Step {currentStepIndex + 1} of {steps.length}
          </Text>
        )}
      </View>
    );
  }
  
  if (variant === 'dots') {
    return (
      <View style={styles.dotsContainer}>
        {steps.map((step, index) => {
          const isCompleted = index < currentStepIndex;
          const isCurrent = index === currentStepIndex;
          
          return (
            <View
              key={step.id}
              style={[
                styles.dot,
                isCompleted && styles.dotCompleted,
                isCurrent && styles.dotCurrent,
              ]}
            />
          );
        })}
      </View>
    );
  }
  
  // Steps variant
  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.stepsContainer}
    >
      {steps.map((step, index) => {
        const isCompleted = index < currentStepIndex;
        const isCurrent = index === currentStepIndex;
        const isUpcoming = index > currentStepIndex;
        
        return (
          <View key={step.id} style={styles.stepWrapper}>
            {/* Connector Line */}
            {index > 0 && (
              <View 
                style={[
                  styles.connector,
                  isCompleted && styles.connectorCompleted,
                  isCurrent && styles.connectorCurrent,
                ]} 
              />
            )}
            
            {/* Step Circle */}
            <View
              style={[
                styles.stepCircle,
                isCompleted && styles.stepCircleCompleted,
                isCurrent && styles.stepCircleCurrent,
                isUpcoming && styles.stepCircleUpcoming,
              ]}
            >
              {isCompleted ? (
                <TickCircle size={16} color={colors.white} variant="Bold" />
              ) : (
                <Text
                  style={[
                    styles.stepNumber,
                    isCurrent && styles.stepNumberCurrent,
                    isUpcoming && styles.stepNumberUpcoming,
                  ]}
                >
                  {index + 1}
                </Text>
              )}
            </View>
            
            {/* Step Label */}
            {showLabels && (
              <Text
                style={[
                  styles.stepLabel,
                  isCurrent && styles.stepLabelCurrent,
                  isUpcoming && styles.stepLabelUpcoming,
                ]}
                numberOfLines={1}
              >
                {step.title}
              </Text>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // Bar variant
  barContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  barCompact: {
    paddingVertical: spacing.sm,
  },
  barBackground: {
    height: 4,
    backgroundColor: colors.gray200,
    borderRadius: 2,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  barLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  
  // Dots variant
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.gray300,
  },
  dotCompleted: {
    backgroundColor: colors.primary,
  },
  dotCurrent: {
    backgroundColor: colors.primary,
    width: 24,
    borderRadius: 4,
  },
  
  // Steps variant
  stepsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  stepWrapper: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  connector: {
    width: 32,
    height: 2,
    backgroundColor: colors.gray200,
    marginHorizontal: spacing.xs,
  },
  connectorCompleted: {
    backgroundColor: colors.primary,
  },
  connectorCurrent: {
    backgroundColor: colors.gray200,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.gray200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepCircleCompleted: {
    backgroundColor: colors.primary,
  },
  stepCircleCurrent: {
    backgroundColor: colors.primary,
    borderWidth: 3,
    borderColor: colors.primary + '30',
  },
  stepCircleUpcoming: {
    backgroundColor: colors.gray100,
    borderWidth: 1,
    borderColor: colors.gray300,
  },
  stepNumber: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
  stepNumberCurrent: {
    color: colors.white,
  },
  stepNumberUpcoming: {
    color: colors.gray400,
  },
  stepLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    maxWidth: 60,
    textAlign: 'center',
  },
  stepLabelCurrent: {
    color: colors.primary,
    fontWeight: typography.fontWeight.medium,
  },
  stepLabelUpcoming: {
    color: colors.gray400,
  },
});
