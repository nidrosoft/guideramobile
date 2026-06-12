import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Add, TickCircle } from 'iconsax-react-native';
import { typography, spacing, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { getIcon } from '../../config/icons';
import type { JourneyTopic } from '../../types';

/**
 * Topic picker — grouped chips, selected = filled pill (mirrors Trip Snapshot's
 * chip UI), with smart ordering (most-asked first) and a custom free-text add.
 */
export function TopicPicker({
  topics,
  selected,
  usage,
  subhubSlug,
  onToggle,
  onAddCustom,
  accent,
}: {
  topics: JourneyTopic[];
  selected: string[];
  usage?: Record<string, number>;
  subhubSlug?: string;
  onToggle: (key: string) => void;
  onAddCustom: (label: string) => void;
  accent: string;
}) {
  const { colors } = useTheme();
  const [custom, setCustom] = useState('');

  const groups = useMemo(() => {
    const visible = topics.filter((t) => t.subhubScope.length === 0 || (subhubSlug && t.subhubScope.includes(subhubSlug)));
    const score = (t: JourneyTopic) => -((usage?.[t.key] ?? 0) * 1000) + t.sortWeight;
    const byGroup = new Map<string, JourneyTopic[]>();
    for (const t of visible.sort((a, b) => score(a) - score(b))) {
      const g = byGroup.get(t.topicGroup) ?? [];
      g.push(t);
      byGroup.set(t.topicGroup, g);
    }
    // pack groups (journey-specific) tend to have lower sort_weight -> keep insertion order
    return Array.from(byGroup.entries());
  }, [topics, usage, subhubSlug]);

  const customSelected = selected.filter((k) => k.startsWith('custom:'));

  return (
    <View style={{ gap: spacing.lg }}>
      <Text style={[styles.hint, { color: colors.textSecondary }]}>
        Pick what you want to know. Cached topics are instant; more topics take a little longer.
      </Text>

      {groups.map(([group, items]) => (
        <View key={group} style={{ gap: spacing.sm }}>
          <Text style={[styles.groupHead, { color: colors.textSecondary }]}>{group}</Text>
          <View style={styles.chips}>
            {items.map((t) => {
              const on = selected.includes(t.key);
              const Icon = getIcon(t.icon);
              return (
                <TouchableOpacity
                  key={t.key}
                  activeOpacity={0.8}
                  onPress={() => {
                    Haptics.selectionAsync();
                    onToggle(t.key);
                  }}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: on ? colors.primary : colors.bgCard,
                      borderColor: on ? colors.primary : colors.borderSubtle,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                >
                  <Icon size={14} color={on ? '#FFFFFF' : accent} variant="Bold" />
                  <Text style={[styles.chipText, { color: on ? '#FFFFFF' : colors.textPrimary }]}>{t.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ))}

      {/* Custom topics already added */}
      {customSelected.length > 0 ? (
        <View style={{ gap: spacing.sm }}>
          <Text style={[styles.groupHead, { color: colors.textSecondary }]}>Your topics</Text>
          <View style={styles.chips}>
            {customSelected.map((k) => (
              <TouchableOpacity key={k} activeOpacity={0.8} onPress={() => onToggle(k)} style={[styles.chip, { backgroundColor: colors.primary, borderColor: colors.primary }]}>
                <TickCircle size={14} color="#FFFFFF" variant="Bold" />
                <Text style={[styles.chipText, { color: '#FFFFFF' }]}>{k.replace('custom:', '').replace(/-/g, ' ')}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : null}

      {/* Add custom */}
      <View style={[styles.addRow, { backgroundColor: colors.bgCard, borderColor: colors.borderSubtle }]}>
        <Add size={18} color={colors.textSecondary} />
        <TextInput
          value={custom}
          onChangeText={setCustom}
          placeholder="Add what you want to know…"
          placeholderTextColor={colors.textSecondary}
          style={[styles.addInput, { color: colors.textPrimary }]}
          returnKeyType="done"
          onSubmitEditing={() => {
            if (custom.trim()) {
              onAddCustom(custom.trim());
              setCustom('');
            }
          }}
        />
        {custom.trim().length > 0 ? (
          <TouchableOpacity
            onPress={() => {
              onAddCustom(custom.trim());
              setCustom('');
            }}
            style={[styles.addBtn, { backgroundColor: accent }]}
          >
            <Text style={styles.addBtnText}>Add</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hint: { fontSize: typography.fontSize.xs, lineHeight: 17 },
  groupHead: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.bold, letterSpacing: 0.6, textTransform: 'uppercase' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  // sizing matches Trip Snapshot's topic pills for consistency
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.medium },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderWidth: 1, borderRadius: borderRadius.full, paddingHorizontal: spacing.md, height: 46 },
  addInput: { flex: 1, fontSize: typography.fontSize.sm, paddingVertical: 0 },
  addBtn: { paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: borderRadius.full },
  addBtnText: { color: '#FFFFFF', fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.bold },
});
