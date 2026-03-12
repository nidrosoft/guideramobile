/**
 * DRIVER AGE FIELD COMPONENT
 *
 * Age selector with young driver warning.
 * Theme-aware for dark/light mode.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { User, InfoCircle } from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { spacing, typography, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';

interface DriverAgeFieldProps {
  age: number;
  onAgeChange: (age: number) => void;
}

export default function DriverAgeField({ age, onAgeChange }: DriverAgeFieldProps) {
  const { colors: tc } = useTheme();

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
      <Text style={[styles.label, { color: tc.textSecondary }]}>Driver Age</Text>
      <View style={[styles.ageSelector, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle }]}>
        <TouchableOpacity
          style={[
            styles.ageButton,
            { backgroundColor: tc.primary },
            age <= 18 && { backgroundColor: tc.textTertiary },
          ]}
          onPress={handleDecrement}
          disabled={age <= 18}
        >
          <Text style={[styles.ageButtonText, age <= 18 && { color: tc.textSecondary }]}>−</Text>
        </TouchableOpacity>

        <View style={styles.ageDisplay}>
          <View style={[styles.ageIconContainer, { backgroundColor: `${tc.primary}15` }]}>
            <User size={20} color={tc.primary} variant="Bold" />
          </View>
          <Text style={[styles.ageValue, { color: tc.textPrimary }]}>{age}</Text>
          <Text style={[styles.ageLabel, { color: tc.textSecondary }]}>years old</Text>
        </View>

        <TouchableOpacity
          style={[
            styles.ageButton,
            { backgroundColor: tc.primary },
            age >= 99 && { backgroundColor: tc.textTertiary },
          ]}
          onPress={handleIncrement}
          disabled={age >= 99}
        >
          <Text style={[styles.ageButtonText, age >= 99 && { color: tc.textSecondary }]}>+</Text>
        </TouchableOpacity>
      </View>

      {age < 25 && (
        <View style={[styles.warningContainer, { backgroundColor: `${tc.warning}10` }]}>
          <InfoCircle size={16} color={tc.warning} variant="Bold" />
          <Text style={[styles.warningText, { color: tc.warning }]}>
            Young driver fee ($15/day) applies for drivers under 25
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.md },
  label: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium, marginBottom: spacing.sm },
  ageSelector: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderRadius: borderRadius.lg, padding: spacing.md, borderWidth: 1,
  },
  ageButton: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center',
  },
  ageButtonText: { fontSize: 24, fontWeight: typography.fontWeight.bold, color: '#FFFFFF', lineHeight: 28 },
  ageDisplay: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  ageIconContainer: {
    width: 36, height: 36, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center', marginBottom: spacing.xs,
  },
  ageValue: { fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold },
  ageLabel: { fontSize: typography.fontSize.sm },
  warningContainer: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: borderRadius.md, padding: spacing.sm,
    marginTop: spacing.sm, gap: spacing.xs,
  },
  warningText: { flex: 1, fontSize: typography.fontSize.sm },
});
