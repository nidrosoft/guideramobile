/**
 * ADDITIONAL OPTIONS
 * 
 * Checkboxes for adding hotel and car rental
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Building, Car, TickSquare } from 'iconsax-react-native';
import { View as RNView } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, typography, borderRadius } from '@/styles';

interface AdditionalOptionsProps {
  addHotel: boolean;
  addCar: boolean;
  onToggleHotel: () => void;
  onToggleCar: () => void;
}

export default function AdditionalOptions({
  addHotel,
  addCar,
  onToggleHotel,
  onToggleCar,
}: AdditionalOptionsProps) {
  const handleToggle = (callback: () => void) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    callback();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Additional</Text>
      
      <TouchableOpacity
        style={styles.option}
        onPress={() => handleToggle(onToggleHotel)}
        activeOpacity={0.7}
      >
        <View style={styles.checkbox}>
          {addHotel ? (
            <TickSquare size={24} color={colors.primary} variant="Bold" />
          ) : (
            <View style={styles.emptyCheckbox} />
          )}
        </View>
        <Text style={styles.optionText}>Add Hotel</Text>
        <Building size={20} color="#F97316" variant="Bold" />
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.option}
        onPress={() => handleToggle(onToggleCar)}
        activeOpacity={0.7}
      >
        <View style={styles.checkbox}>
          {addCar ? (
            <TickSquare size={24} color={colors.primary} variant="Bold" />
          ) : (
            <View style={styles.emptyCheckbox} />
          )}
        </View>
        <Text style={styles.optionText}>Add Car Rent</Text>
        <Car size={20} color="#3B82F6" variant="Bold" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.md,
  },
  title: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  checkbox: {
    marginRight: spacing.md,
  },
  optionText: {
    flex: 1,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  emptyCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.gray300,
  },
});
