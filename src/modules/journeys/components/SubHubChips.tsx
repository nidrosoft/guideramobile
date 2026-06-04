import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { typography, spacing, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import type { JourneySubhub } from '../types';

export function SubHubChips({
  subhubs,
  selected,
  onSelect,
}: {
  subhubs: JourneySubhub[];
  selected: string | 'all';
  onSelect: (slug: string | 'all') => void;
}) {
  const { colors } = useTheme();
  const all: Array<{ slug: string | 'all'; name: string; tint?: string }> = [
    { slug: 'all', name: 'All' },
    ...subhubs.map((s) => ({ slug: s.slug, name: s.name, tint: s.tint })),
  ];
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.content}>
      {all.map((s) => {
        const active = s.slug === selected;
        const tint = s.tint ?? colors.primary;
        return (
          <TouchableOpacity
            key={String(s.slug)}
            activeOpacity={0.8}
            onPress={() => {
              Haptics.selectionAsync();
              onSelect(s.slug);
            }}
            style={[
              styles.chip,
              {
                backgroundColor: active ? tint : colors.bgCard,
                borderColor: active ? tint : colors.borderSubtle,
              },
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <Text style={[styles.text, { color: active ? '#FFFFFF' : colors.textPrimary }]}>{s.name}</Text>
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
