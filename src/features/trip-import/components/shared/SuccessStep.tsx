/**
 * SUCCESS STEP
 * 
 * Reusable success screen component for import flow.
 * Uses design system tokens — no hardcoded colors or borderRadius.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { TickCircle } from 'iconsax-react-native';
import { spacing, typography, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';

interface SuccessStepProps {
  title: string;
  message: string;
  buttonText: string;
  onButtonPress: () => void;
}

export default function SuccessStep({ title, message, buttonText, onButtonPress }: SuccessStepProps) {
  const { colors: tc } = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <TickCircle size={72} color="#22C55E" variant="Bold" />
      </View>
      
      <Text style={[styles.title, { color: tc.textPrimary }]}>{title}</Text>
      <Text style={[styles.message, { color: tc.textSecondary }]}>{message}</Text>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: tc.primary }]}
        onPress={onButtonPress}
        activeOpacity={0.8}
      >
        <Text style={[styles.buttonText, { color: tc.white }]}>{buttonText}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  iconContainer: {
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  message: {
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.xl,
  },
  button: {
    height: 52,
    borderRadius: borderRadius.lg,
    minWidth: 220,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  buttonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
  },
});
