/**
 * PULSE FILTER CHIPS
 *
 * Horizontal scrollable filter chips for activity types.
 * Used on the Pulse map screen below the header.
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/context/ThemeContext';
import { ACTIVITY_FILTER_CHIPS } from './pulse.utils';

interface PulseFilterChipsProps {
  activeFilter: string;
  onFilterChange: (filterId: string) => void;
}

export default function PulseFilterChips({ activeFilter, onFilterChange }: PulseFilterChipsProps) {
  const { colors: tc } = useTheme();

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
      {ACTIVITY_FILTER_CHIPS.map(chip => {
        const isActive = activeFilter === chip.id;
        return (
          <TouchableOpacity
            key={chip.id}
            style={[
              styles.chip,
              {
                backgroundColor: isActive ? tc.primary : tc.bgElevated,
                borderColor: isActive ? tc.primary : tc.borderSubtle,
              },
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onFilterChange(chip.id);
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.emoji}>{chip.emoji}</Text>
            <Text style={[styles.label, { color: isActive ? '#FFFFFF' : tc.textSecondary }]}>
              {chip.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 12,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emoji: {
    fontSize: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
});
