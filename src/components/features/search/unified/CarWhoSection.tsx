/**
 * CAR WHO SECTION
 * 
 * Car-specific driver age selection for the unified search overlay.
 * Provides increment/decrement age selector with young driver warning.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { User, InfoCircle, Add, Minus } from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { spacing, typography, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';

interface CarWhoSectionProps {
  driverAge: number;
  onAgeChange: (age: number) => void;
}

export default function CarWhoSection({
  driverAge,
  onAgeChange,
}: CarWhoSectionProps) {
  const { colors: themeColors } = useTheme();

  const handleDecrement = () => {
    if (driverAge > 18) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onAgeChange(driverAge - 1);
    }
  };

  const handleIncrement = () => {
    if (driverAge < 99) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onAgeChange(driverAge + 1);
    }
  };

  const canDecrement = driverAge > 18;
  const canIncrement = driverAge < 99;

  return (
    <View style={styles.container}>
      {/* Driver Age Row */}
      <View style={styles.ageRow}>
        <View style={styles.ageInfo}>
          <View style={[styles.ageIcon, { backgroundColor: `${themeColors.primary}15` }]}>
            <User size={20} color={themeColors.primary} variant="Bold" />
          </View>
          <View>
            <Text style={[styles.ageLabel, { color: themeColors.textPrimary }]}>
              Driver Age
            </Text>
            <Text style={[styles.ageSublabel, { color: themeColors.textSecondary }]}>
              Must be 18 or older
            </Text>
          </View>
        </View>

        <View style={styles.ageControls}>
          <TouchableOpacity
            style={[
              styles.ageButton,
              { borderColor: themeColors.borderSubtle, backgroundColor: themeColors.bgElevated },
              !canDecrement && { backgroundColor: themeColors.bgCard },
            ]}
            onPress={handleDecrement}
            disabled={!canDecrement}
            activeOpacity={0.7}
          >
            <Minus size={18} color={canDecrement ? themeColors.textPrimary : themeColors.textSecondary} />
          </TouchableOpacity>

          <Text style={[styles.ageValue, { color: themeColors.textPrimary }]}>
            {driverAge}
          </Text>

          <TouchableOpacity
            style={[
              styles.ageButton,
              { borderColor: themeColors.borderSubtle, backgroundColor: themeColors.bgElevated },
              !canIncrement && { backgroundColor: themeColors.bgCard },
            ]}
            onPress={handleIncrement}
            disabled={!canIncrement}
            activeOpacity={0.7}
          >
            <Add size={18} color={canIncrement ? themeColors.textPrimary : themeColors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Young Driver Warning */}
      {driverAge < 25 && (
        <View style={[styles.warningContainer, { backgroundColor: `${themeColors.warning}10` }]}>
          <InfoCircle size={16} color={themeColors.warning} variant="Bold" />
          <Text style={[styles.warningText, { color: themeColors.warning }]}>
            Young driver fee ($15/day) applies for drivers under 25
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.sm,
  },
  ageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  ageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  ageIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ageLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
  },
  ageSublabel: {
    fontSize: typography.fontSize.sm,
    marginTop: 2,
  },
  ageControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  ageButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ageValue: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    minWidth: 28,
    textAlign: 'center',
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  warningText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
  },
});
