import { ScrollView, TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { typography, spacing, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { getIcon } from '../config/icons';
import type { JourneyCategory } from '../types';

export function JourneyPickerRail({
  categories,
  selectedSlug,
  onSelect,
}: {
  categories: JourneyCategory[];
  selectedSlug: string;
  onSelect: (slug: string) => void;
}) {
  const { colors } = useTheme();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}
    >
      {categories.map((cat) => {
        const selected = cat.slug === selectedSlug;
        const Icon = getIcon(cat.icon);
        return (
          <TouchableOpacity
            key={cat.id}
            activeOpacity={0.85}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onSelect(cat.slug);
            }}
            style={[
              styles.card,
              {
                backgroundColor: selected ? cat.tint : colors.bgCard,
                borderColor: selected ? cat.tint : colors.borderStandard,
              },
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={`${cat.name} journey`}
          >
            <View
              style={[
                styles.iconWrap,
                {
                  backgroundColor: selected ? 'rgba(255,255,255,0.22)' : `${cat.tint}1F`,
                  borderColor: selected ? 'rgba(255,255,255,0.35)' : `${cat.tint}40`,
                },
              ]}
            >
              <Icon size={22} color={selected ? '#FFFFFF' : cat.tint} variant="Bold" />
            </View>
            <Text
              numberOfLines={2}
              style={[styles.label, { color: selected ? '#FFFFFF' : colors.textPrimary }]}
            >
              {cat.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.lg, gap: spacing.md, paddingVertical: 2 },
  card: {
    width: 108,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.sm,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  label: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold },
});
