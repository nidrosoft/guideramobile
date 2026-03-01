/**
 * SUCCESS STEP
 * 
 * Reusable success screen component for import flow.
 * Shows checkmark animation and success message.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { TickCircle } from 'iconsax-react-native';
import { colors, spacing, typography, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';

interface SuccessStepProps {
  title: string;
  message: string;
  buttonText: string;
  onButtonPress: () => void;
}

export default function SuccessStep({ title, message, buttonText, onButtonPress }: SuccessStepProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <TickCircle size={80} color={colors.success} variant="Bold" />
      </View>
      
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>

      <TouchableOpacity style={styles.button} onPress={onButtonPress}>
        <Text style={styles.buttonText}>{buttonText}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  message: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xl,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.full,
    minWidth: 200,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
});
