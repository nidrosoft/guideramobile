import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Verify, ArrowRight2 } from 'iconsax-react-native';
import { typography, spacing, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { useIsPro } from '../../hooks/useJourneyGuide';
import { useProviders } from '../../hooks/useProviders';
import { ProGate } from '../ProGate';
import { ProviderDetailSheet } from '../ProviderDetailSheet';
import { emitJourneyEvent } from '../../events/journeyEvents';
import type { JourneyGuide, JourneyProvider } from '../../types';

export function ProvidersSection({ guide, accent }: { guide: JourneyGuide; accent: string }) {
  const { colors } = useTheme();
  const { data: pro } = useIsPro();
  const [selected, setSelected] = useState<JourneyProvider | null>(null);
  const { data: providers = [], isLoading } = useProviders(
    { categorySlug: guide.categorySlug, countryCode: guide.countryCode, subhubSlug: guide.subhubSlug },
    !!pro
  );

  return (
    <View style={styles.section}>
      <View style={styles.titleRow}>
        <View style={[styles.dot, { backgroundColor: accent }]} />
        <Text style={[styles.title, { color: colors.textPrimary }]}>Verified providers</Text>
      </View>

      {!pro ? (
        <ProGate
          feature="providers"
          title="Verified providers"
          preview={
            <View style={{ gap: spacing.sm }}>
              <View style={[styles.skeleton, { backgroundColor: colors.bgCard, borderColor: colors.borderSubtle }]} />
              <View style={[styles.skeleton, { backgroundColor: colors.bgCard, borderColor: colors.borderSubtle }]} />
            </View>
          }
        >
          <View />
        </ProGate>
      ) : isLoading ? (
        <ActivityIndicator color={accent} />
      ) : providers.length === 0 ? (
        <Text style={[styles.empty, { color: colors.textSecondary }]}>
          No verified providers listed here yet — we add them as they pass verification.
        </Text>
      ) : (
        providers.map((p) => (
          <TouchableOpacity
            key={p.id}
            activeOpacity={0.85}
            onPress={() => {
              emitJourneyEvent('provider_view', { categorySlug: guide.categorySlug, countryCode: guide.countryCode, payload: { providerId: p.id } });
              setSelected(p);
            }}
            style={[styles.row, { backgroundColor: colors.bgCard, borderColor: colors.borderSubtle }]}
          >
            <View style={{ flex: 1 }}>
              <View style={styles.nameRow}>
                <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={1}>{p.name}</Text>
                {p.isVerified ? <Verify size={16} color={accent} variant="Bold" /> : null}
              </View>
              {p.summary ? <Text style={[styles.summary, { color: colors.textSecondary }]} numberOfLines={2}>{p.summary}</Text> : null}
              {p.accreditations?.length ? (
                <View style={styles.chips}>
                  {p.accreditations.map((a) => (
                    <View key={a} style={[styles.chip, { backgroundColor: `${accent}14` }]}>
                      <Text style={[styles.chipText, { color: accent }]}>{a}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
            <ArrowRight2 size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        ))
      )}

      <ProviderDetailSheet provider={selected} guideId={guide.id} accent={accent} onClose={() => setSelected(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  section: { paddingHorizontal: spacing.lg, marginBottom: spacing.xl, gap: spacing.md },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dot: { width: 8, height: 8, borderRadius: 4 },
  title: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold },
  skeleton: { height: 56, borderWidth: 1, borderRadius: borderRadius.lg },
  empty: { fontSize: typography.fontSize.sm, lineHeight: 20 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderWidth: 1, borderRadius: borderRadius.lg, padding: spacing.md },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  name: { flexShrink: 1, fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.bold },
  summary: { fontSize: typography.fontSize.xs, lineHeight: 17, marginTop: 2 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.sm },
  chip: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.full },
  chipText: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.bold },
});
