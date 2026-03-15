/**
 * STEP 1: ACTIVITY TYPE
 *
 * Grid of 10 activity categories with emoji + label + sublabels.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import * as Haptics from 'expo-haptics';
import { spacing, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { ACTIVITY_CATEGORIES } from '../pulse.utils';

interface StepTypeProps {
  selected: string;
  onSelect: (typeId: string) => void;
}

export default function StepType({ selected, onSelect }: StepTypeProps) {
  const { colors: tc } = useTheme();

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
      <Text style={[styles.heading, { color: tc.textPrimary }]}>
        What do you want to do?
      </Text>
      <Text style={[styles.subheading, { color: tc.textSecondary }]}>
        Pick the category that best describes your activity
      </Text>

      <View style={styles.grid}>
        {ACTIVITY_CATEGORIES.map((cat) => {
          const isActive = selected === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.card,
                { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle },
                isActive && { borderColor: tc.primary, backgroundColor: tc.primary + '10' },
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onSelect(cat.id);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.emoji}>{cat.emoji}</Text>
              <Text style={[styles.label, { color: isActive ? tc.primary : tc.textPrimary }, isActive && { fontWeight: '700' }]}>
                {cat.label}
              </Text>
              <Text style={[styles.sublabel, { color: isActive ? tc.primary + '90' : tc.textTertiary }]}>
                {cat.sublabels.join(', ')}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    paddingBottom: 100,
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  card: {
    flexBasis: '30%',
    flexGrow: 1,
    maxWidth: '32%',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  emoji: {
    fontSize: 28,
    marginBottom: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  sublabel: {
    fontSize: 10,
    textAlign: 'center',
    marginTop: 2,
  },
});
