/**
 * DRIVER AGE FIELD COMPONENT
 * 
 * Age selector with young driver warning.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { User, InfoCircle } from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, typography, borderRadius } from '@/styles';

interface DriverAgeFieldProps {
  age: number;
  onAgeChange: (age: number) => void;
}

export default function DriverAgeField({ age, onAgeChange }: DriverAgeFieldProps) {
  const handleDecrement = () => {
    if (age > 18) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onAgeChange(age - 1);
    }
  };

  const handleIncrement = () => {
    if (age < 99) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onAgeChange(age + 1);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Driver Age</Text>
      <View style={styles.ageSelector}>
        <TouchableOpacity
          style={[styles.ageButton, age <= 18 && styles.ageButtonDisabled]}
          onPress={handleDecrement}
          disabled={age <= 18}
        >
          <Text style={[styles.ageButtonText, age <= 18 && styles.ageButtonTextDisabled]}>
            −
          </Text>
        </TouchableOpacity>
        
        <View style={styles.ageDisplay}>
          <View style={styles.ageIconContainer}>
            <User size={20} color={colors.primary} variant="Bold" />
          </View>
          <Text style={styles.ageValue}>{age}</Text>
          <Text style={styles.ageLabel}>years old</Text>
        </View>
        
        <TouchableOpacity
          style={[styles.ageButton, age >= 99 && styles.ageButtonDisabled]}
          onPress={handleIncrement}
          disabled={age >= 99}
        >
          <Text style={[styles.ageButtonText, age >= 99 && styles.ageButtonTextDisabled]}>
            +
          </Text>
        </TouchableOpacity>
      </View>
      
      {age < 25 && (
        <View style={styles.warningContainer}>
          <InfoCircle size={16} color={colors.warning} variant="Bold" />
          <Text style={styles.warningText}>
            Young driver fee ($15/day) applies for drivers under 25
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  ageSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  ageButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ageButtonDisabled: {
    backgroundColor: colors.gray200,
  },
  ageButtonText: {
    fontSize: 24,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
    lineHeight: 28,
  },
  ageButtonTextDisabled: {
    color: colors.gray400,
  },
  ageDisplay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ageIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  ageValue: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  ageLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.warning}10`,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  warningText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.warning,
  },
});
