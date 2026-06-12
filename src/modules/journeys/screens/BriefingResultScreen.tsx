import { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Animated, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft2, Archive, TickCircle, InfoCircle, Warning2, Refresh2 } from 'iconsax-react-native';
import { typography, spacing, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { useToast } from '@/contexts/ToastContext';
import { useBriefingDraft } from '../hooks/useBriefingDraft';
import { useBriefingAssembly } from '../hooks/useBriefingAssembly';
import { useBriefingTopics } from '../hooks/useBriefingTopics';
import { useJourneyCatalog } from '../hooks/useJourneyCatalog';
import { setBriefingSaved } from '../services/briefing.service';
import { emitJourneyEvent } from '../events/journeyEvents';
import type { BriefingBlock, TopicSection } from '../types';

// Defensive client-side cleanup for any older cached content that still carries
// markdown / citation markers (new generations are already sanitized server-side).
function cleanText(v?: string): string {
  if (!v) return '';
  return v
    .replace(/\[\d+\](?:\s*\[\d+\])*/g, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\s+([.,;:!?])/g, '$1')
    .trim();
}

export function BriefingResultScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const { showSuccess } = useToast();
  const draft = useBriefingDraft();
  const { data: categories = [] } = useJourneyCatalog();
  const { data: topics = [] } = useBriefingTopics(draft.categorySlug);
  const category = categories.find((c) => c.slug === draft.categorySlug);
  // Brand/Trip-Snapshot accent (green) for consistency — not the per-journey tint.
  const accent = colors.primary;

  const assembly = useBriefingAssembly(draft.countryCode ? draft : null);
  const [saved, setSaved] = useState(false);

  const labelFor = useMemo(() => {
    const m: Record<string, string> = {};
    for (const t of topics) m[t.key] = t.label;
    return m;
  }, [topics]);

  // loading bar animation
  const barW = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(barW, { toValue: assembly.progress, duration: 350, useNativeDriver: false }).start();
  }, [assembly.progress, barW]);

  const handleBack = () => (router.canGoBack() ? router.back() : router.replace('/journeys' as any));
  const handleSave = async () => {
    if (!draft.briefingId || saved) return;
    try {
      await setBriefingSaved(draft.briefingId, true);
      setSaved(true);
      showSuccess('Saved — find it in the Saved tab');
      emitJourneyEvent('briefing_saved', { categorySlug: draft.categorySlug, countryCode: draft.countryCode });
    } catch {
      /* ignore */
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={styles.topBar}>
        <TouchableOpacity onPress={handleBack} style={[styles.iconBtn, { backgroundColor: colors.bgCard }]} accessibilityLabel="Go back">
          <ArrowLeft2 size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        {draft.briefingId ? (
          <TouchableOpacity onPress={handleSave} style={[styles.iconBtn, { backgroundColor: colors.bgCard }]} accessibilityLabel="Save briefing">
            <Archive size={20} color={saved ? accent : colors.textPrimary} variant={saved ? 'Bold' : 'Outline'} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Loading bar */}
      {!assembly.isComplete ? (
        <View style={[styles.barTrack, { backgroundColor: colors.borderSubtle }]}>
          <Animated.View style={[styles.barFill, { backgroundColor: accent, width: barW.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} />
        </View>
      ) : null}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing['2xl'] }}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.flag}>{draft.flagEmoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.country, { color: colors.textPrimary }]}>{draft.countryName ?? draft.countryCode}</Text>
              <Text style={[styles.journey, { color: accent }]}>{category?.name ?? draft.categorySlug}</Text>
            </View>
          </View>
          <View style={styles.metaChips}>
            {draft.stage ? <Meta label={draft.stage} colors={colors} /> : null}
            {draft.who ? <Meta label={draft.who.replace('_', ' ')} colors={colors} /> : null}
            <Meta label={`${assembly.doneCount}/${assembly.total} ready`} colors={colors} />
          </View>

          {/* Selected topics — horizontal chips so the user sees what they're reading about */}
          {assembly.topicKeys.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.topicChips}>
              {assembly.topicKeys.map((key) => {
                const ready = assembly.sections[key]?.status === 'ready';
                const label = labelFor[key] ?? key.replace('custom:', '').replace(/-/g, ' ');
                return (
                  <View key={key} style={[styles.topicChip, { backgroundColor: ready ? `${accent}14` : colors.bgCard, borderColor: ready ? `${accent}40` : colors.borderSubtle }]}>
                    {ready ? <TickCircle size={12} color={accent} variant="Bold" /> : null}
                    <Text style={[styles.topicChipText, { color: ready ? accent : colors.textSecondary }]} numberOfLines={1}>{label}</Text>
                  </View>
                );
              })}
            </ScrollView>
          ) : null}
        </View>

        {category?.requiresDisclaimer ? (
          <View style={[styles.disclaimer, { backgroundColor: `${accent}12`, borderColor: `${accent}33` }]}>
            <InfoCircle size={15} color={accent} variant="Bold" />
            <Text style={[styles.disclaimerText, { color: colors.textSecondary }]}>Information only — not professional advice. Verify specifics independently.</Text>
          </View>
        ) : null}

        {assembly.topicKeys.map((key) => {
          const state = assembly.sections[key];
          const title = labelFor[key] ?? key.replace('custom:', '').replace(/-/g, ' ');
          if (!state || state.status === 'loading') return <SkeletonCard key={key} title={title} accent={accent} colors={colors} />;
          if (state.status === 'error')
            return (
              <View key={key} style={[styles.section, { backgroundColor: colors.bgCard, borderColor: colors.borderSubtle }]}>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{title}</Text>
                <TouchableOpacity style={styles.retry} onPress={() => assembly.retry(key)}>
                  <Refresh2 size={15} color={accent} variant="Bold" />
                  <Text style={[styles.retryText, { color: accent }]}>Couldn't load — retry</Text>
                </TouchableOpacity>
              </View>
            );
          return <SectionCard key={key} section={state.section} accent={accent} colors={colors} />;
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

function Meta({ label, colors }: { label: string; colors: any }) {
  return (
    <View style={[styles.meta, { backgroundColor: colors.bgCard, borderColor: colors.borderSubtle }]}>
      <Text style={[styles.metaText, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

function SkeletonCard({ title, accent, colors }: { title: string; accent: string; colors: any }) {
  return (
    <View style={[styles.section, { backgroundColor: colors.bgCard, borderColor: colors.borderSubtle }]}>
      <View style={styles.sectionTitleRow}>
        <View style={[styles.dot, { backgroundColor: `${accent}55` }]} />
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{title}</Text>
        <ActivityIndicator size="small" color={accent} style={{ marginLeft: 'auto' }} />
      </View>
      <View style={[styles.skelLine, { backgroundColor: colors.borderSubtle, width: '92%' }]} />
      <View style={[styles.skelLine, { backgroundColor: colors.borderSubtle, width: '78%' }]} />
      <View style={[styles.skelLine, { backgroundColor: colors.borderSubtle, width: '85%' }]} />
    </View>
  );
}

function SectionCard({ section, accent, colors }: { section: TopicSection; accent: string; colors: any }) {
  return (
    <View style={[styles.section, { backgroundColor: colors.bgCard, borderColor: colors.borderSubtle }]}>
      <View style={styles.sectionTitleRow}>
        <View style={[styles.dot, { backgroundColor: accent }]} />
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{cleanText(section.title)}</Text>
      </View>
      {section.blocks.map((b, i) => (
        <Block key={i} block={b} accent={accent} colors={colors} />
      ))}
    </View>
  );
}

function Block({ block, accent, colors }: { block: BriefingBlock; accent: string; colors: any }) {
  if (block.type === 'intro') return <Text style={[styles.intro, { color: colors.textSecondary }]}>{cleanText(block.text)}</Text>;
  if (block.type === 'bullets')
    return (
      <View style={{ gap: spacing.sm }}>
        {block.items.map((it, i) => (
          <View key={i} style={styles.bulletRow}>
            <TickCircle size={15} color={accent} variant="Bold" style={{ marginTop: 1 }} />
            <Text style={[styles.bulletText, { color: colors.textSecondary }]}>{cleanText(it)}</Text>
          </View>
        ))}
      </View>
    );
  if (block.type === 'table')
    return (
      <View style={[styles.table, { borderColor: colors.borderSubtle }]}>
        <View style={[styles.tr, { backgroundColor: colors.bgCard }]}>
          {block.columns.map((c, i) => (
            <Text key={i} style={[styles.th, { color: colors.textSecondary }]}>{cleanText(c)}</Text>
          ))}
        </View>
        {block.rows.map((row, ri) => (
          <View key={ri} style={[styles.tr, { borderTopColor: colors.borderSubtle, borderTopWidth: 1 }]}>
            {row.map((cell, ci) => (
              <Text key={ci} style={[styles.td, { color: ci === 0 ? colors.textPrimary : colors.textSecondary }]}>{cleanText(cell)}</Text>
            ))}
          </View>
        ))}
      </View>
    );
  // callout
  const warn = block.tone === 'warning';
  return (
    <View style={[styles.callout, { backgroundColor: warn ? 'rgba(217,137,61,0.12)' : `${accent}12`, borderColor: warn ? 'rgba(217,137,61,0.33)' : `${accent}33` }]}>
      {warn ? <Warning2 size={15} color="#D9893D" variant="Bold" /> : <InfoCircle size={15} color={accent} variant="Bold" />}
      <Text style={[styles.calloutText, { color: colors.textSecondary }]}>{cleanText(block.text)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.md },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  barTrack: { height: 3, marginHorizontal: spacing.lg, marginTop: spacing.sm, borderRadius: 2, overflow: 'hidden' },
  barFill: { height: 3, borderRadius: 2 },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, gap: spacing.sm },
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  flag: { fontSize: 34 },
  country: { fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold },
  journey: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, marginTop: 2 },
  metaChips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  meta: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: borderRadius.full, borderWidth: 1 },
  metaText: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.medium, textTransform: 'capitalize' },
  topicChips: { gap: spacing.sm, paddingVertical: spacing.xs },
  topicChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.sm, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  topicChipText: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.medium },
  disclaimer: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start', marginHorizontal: spacing.lg, marginTop: spacing.md, padding: spacing.md, borderRadius: borderRadius.lg, borderWidth: 1 },
  disclaimerText: { flex: 1, fontSize: typography.fontSize.xs, lineHeight: 18 },
  section: { marginHorizontal: spacing.lg, marginTop: spacing.md, borderWidth: 1, borderRadius: borderRadius.xl, padding: spacing.md, gap: spacing.md },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dot: { width: 8, height: 8, borderRadius: 4 },
  sectionTitle: { fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.bold, flexShrink: 1 },
  skelLine: { height: 12, borderRadius: 6, opacity: 0.6 },
  intro: { fontSize: typography.fontSize.sm, lineHeight: 21 },
  bulletRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  bulletText: { flex: 1, fontSize: typography.fontSize.sm, lineHeight: 20 },
  table: { borderWidth: 1, borderRadius: borderRadius.lg, overflow: 'hidden' },
  tr: { flexDirection: 'row', paddingHorizontal: spacing.sm, paddingVertical: spacing.sm },
  th: { flex: 1, fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.bold },
  td: { flex: 1, fontSize: typography.fontSize.xs, lineHeight: 16 },
  callout: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start', padding: spacing.sm, borderRadius: borderRadius.lg, borderWidth: 1 },
  calloutText: { flex: 1, fontSize: typography.fontSize.xs, lineHeight: 18 },
  sources: { fontSize: typography.fontSize.xs, fontStyle: 'italic' },
  retry: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  retryText: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold },
});
