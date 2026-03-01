/**
 * SCAN SUCCESS STEP
 * 
 * Final step in scan import flow - Success confirmation.
 * Shows success message and closes the flow.
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TickCircle } from 'iconsax-react-native';
import { colors, spacing, typography } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { StepComponentProps } from '../../types/import-flow.types';

export default function ScanSuccessStep({ data }: StepComponentProps) {
  return (
    <View style={styles.container}>
      <TickCircle size={80} color={colors.success} variant="Bold" />
      <Text style={styles.title}>Trip Added Successfully!</Text>
      <Text style={styles.description}>
        Your booking has been added to your trip. We'll help you plan the perfect itinerary!
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginTop: spacing.xl,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  description: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
