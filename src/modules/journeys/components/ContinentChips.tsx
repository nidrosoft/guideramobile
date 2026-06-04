import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { typography, spacing, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { CONTINENTS } from '../config/continents';
import type { JourneyContinent } from '../types';

export function ContinentChips({
  selected,
  onSelect,
}: {
  selected: JourneyContinent | 'All';
  onSelect: (c: JourneyContinent | 'All') => void;
}) {
  const { colors } = useTheme();
  // Selected continent uses a neutral dark fill (matches the Pro promo surface) so it
  // reads as distinct from the tinted sub-hub chips rendered below the journey rail.
  const SELECTED_BG = '#1C1B22';
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.content}>
      {CONTINENTS.map((c) => {
        const active = c === selected;
        return (
          <TouchableOpacity
            key={c}
            activeOpacity={0.8}
            onPress={() => {
              Haptics.selectionAsync();
              onSelect(c);
            }}
            style={[
              styles.chip,
              {
                backgroundColor: active ? SELECTED_BG : colors.bgCard,
                borderColor: active ? SELECTED_BG : colors.borderSubtle,
              },
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <Text style={[styles.text, { color: active ? '#FFFFFF' : colors.textPrimary, fontWeight: active ? typography.fontWeight.semibold : typography.fontWeight.medium }]}>{c}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  text: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium },
});
