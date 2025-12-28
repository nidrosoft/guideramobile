/**
 * TRIP TYPE TABS
 * 
 * Segmented control for One Way | Round Trip | Multicity
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, typography, borderRadius } from '@/styles';
import { TripType } from '../../../types/flight.types';

interface TripTypeTabsProps {
  selected: TripType;
  onSelect: (type: TripType) => void;
}

const TRIP_TYPES: { type: TripType; label: string }[] = [
  { type: 'one-way', label: 'One Way' },
  { type: 'round-trip', label: 'Round Trip' },
  { type: 'multi-city', label: 'Multicity' },
];

export default function TripTypeTabs({ selected, onSelect }: TripTypeTabsProps) {
  const handleSelect = (type: TripType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelect(type);
  };

  return (
    <View style={styles.container}>
      {TRIP_TYPES.map((item) => {
        const isSelected = selected === item.type;
        return (
          <TouchableOpacity
            key={item.type}
            style={[styles.tab, isSelected && styles.tabSelected]}
            onPress={() => handleSelect(item.type)}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, isSelected && styles.tabTextSelected]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#E6E9EB',
    borderRadius: borderRadius.full,
    padding: 5,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    alignItems: 'center',
  },
  tabSelected: {
    backgroundColor: colors.white,
  },
  tabText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
  },
  tabTextSelected: {
    color: colors.primary,
    fontWeight: typography.fontWeight.semibold,
  },
});
