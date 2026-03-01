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
import { colors as staticColors, spacing, typography, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
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
  const { colors } = useTheme();
  const progress = ((currentStepIndex + 1) / steps.length) * 100;
  
  if (variant === 'bar') {
    return (
      <View style={[styles.barContainer, compact && styles.barCompact]}>
        <View style={[styles.barBackground, { backgroundColor: colors.borderSubtle }]}>
          <Animated.View 
            style={[
              styles.barFill,
              { width: `${progress}%`, backgroundColor: colors.primary },
            ]} 
          />
        </View>
        {showLabels && (
          <Text style={[styles.barLabel, { color: colors.textSecondary }]}>
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
                { backgroundColor: colors.borderSubtle },
                isCompleted && { backgroundColor: colors.primary },
                isCurrent && { backgroundColor: colors.primary, width: 24 },
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
                  { backgroundColor: colors.borderSubtle },
                  isCompleted && { backgroundColor: colors.primary },
                ]} 
              />
            )}
            
            {/* Step Circle */}
            <View
              style={[
                styles.stepCircle,
                { backgroundColor: colors.borderSubtle },
                isCompleted && { backgroundColor: colors.primary },
                isCurrent && { backgroundColor: colors.primary, borderWidth: 3, borderColor: colors.primary + '30' },
                isUpcoming && { backgroundColor: colors.bgElevated, borderWidth: 1, borderColor: colors.borderSubtle },
              ]}
            >
              {isCompleted ? (
                <TickCircle size={16} color="#FFFFFF" variant="Bold" />
              ) : (
                <Text
                  style={[
                    styles.stepNumber,
                    { color: '#FFFFFF' },
                    isUpcoming && { color: colors.textSecondary },
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
                  { color: colors.textSecondary },
                  isCurrent && { color: colors.primary, fontWeight: typography.fontWeight.medium },
                  isUpcoming && { color: colors.textSecondary },
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
    borderRadius: 2,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 2,
  },
  barLabel: {
    fontSize: typography.fontSize.xs,
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
    marginHorizontal: spacing.xs,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumber: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  },
  stepLabel: {
    fontSize: typography.fontSize.xs,
    marginTop: spacing.xs,
    maxWidth: 60,
    textAlign: 'center',
  },
});
