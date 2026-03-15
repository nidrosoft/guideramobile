/**
 * STEP 4: WHEN
 *
 * Date chips (next 5 days) + Flexible/Specific time toggle.
 * Wraps ActivityDatePicker with step-appropriate heading.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { spacing } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import ActivityDatePicker from '../ActivityDatePicker';

interface StepWhenProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  isFlexibleTime: boolean;
  onFlexibleToggle: (flexible: boolean) => void;
  selectedTime: Date;
  onTimeChange: (time: Date) => void;
}

export default function StepWhen({
  selectedDate,
  onDateChange,
  isFlexibleTime,
  onFlexibleToggle,
  selectedTime,
  onTimeChange,
}: StepWhenProps) {
  const { colors: tc } = useTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.heading, { color: tc.textPrimary }]}>
        When is it happening?
      </Text>
      <Text style={[styles.subheading, { color: tc.textSecondary }]}>
        Pick a day and choose a flexible or specific time
      </Text>

      <ActivityDatePicker
        selectedDate={selectedDate}
        onDateChange={onDateChange}
        isFlexibleTime={isFlexibleTime}
        onFlexibleToggle={onFlexibleToggle}
        selectedTime={selectedTime}
        onTimeChange={onTimeChange}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
  },
  heading: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 6,
  },
  subheading: {
    fontSize: 14,
    marginBottom: spacing.xl,
  },
});
