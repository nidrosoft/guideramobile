import { useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity, TouchableWithoutFeedback, ScrollView, TextInput, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { CloseCircle, SearchNormal1, ArrowRight2, Routing, Star1 } from 'iconsax-react-native';
import { typography, spacing, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useJourneyCatalog } from '../../hooks/useJourneyCatalog';
import { useJourneyCountries } from '../../hooks/useJourneySearch';
import { useBriefingTopics, useTopicUsage, useRecentBriefings, useSavedBriefings } from '../../hooks/useBriefingTopics';
import { useBriefingDraft, computeDefaultTopics } from '../../hooks/useBriefingDraft';
import { getIcon } from '../../config/icons';
import { TopicPicker } from './TopicPicker';
import { createBriefing, touchBriefing, recommendCountries } from '../../services/briefing.service';
import { emitJourneyEvent } from '../../events/journeyEvents';
import { captureJourneyBriefing } from '@/features/guidance';
import type { BriefingStage, BriefingWho, CountryRecommendation } from '../../types';

// Map the briefing's "who" to the guidance companionType enum (solo|couple|family|friends|group).
const WHO_TO_COMPANION: Partial<Record<BriefingWho, string>> = {
  solo: 'solo',
  couple: 'couple',
  family: 'family',
  elderly_parent: 'family',
};

const STAGES: Array<{ key: BriefingStage; label: string }> = [
  { key: 'exploring', label: 'Just exploring' },
  { key: 'soon', label: 'Within ~3 months' },
  { key: 'decided', label: 'Decided' },
];
const WHOS: Array<{ key: BriefingWho; label: string }> = [
  { key: 'solo', label: 'Just me' },
  { key: 'couple', label: 'Couple' },
  { key: 'family', label: 'Family with kids' },
  { key: 'elderly_parent', label: 'Elderly parent' },
];

export function BriefingSheet({
  visible,
  onClose,
  onOpenResult,
  initialTab = 'build',
}: {
  visible: boolean;
  onClose: () => void;
  onOpenResult: () => void;
  initialTab?: 'build' | 'recent' | 'saved';
}) {
  const { colors: tc } = useTheme();
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const userId = (profile as any)?.id as string | undefined;

  const draft = useBriefingDraft();
  const { categorySlug, countryCode, stage, who, topicKeys } = draft;
  const { data: categories = [] } = useJourneyCatalog();
  const { data: countries = [] } = useJourneyCountries();
  const { data: topics = [] } = useBriefingTopics(categorySlug);
  const { data: usage } = useTopicUsage(categorySlug);
  const { data: recent = [] } = useRecentBriefings(userId);
  const [tab, setTab] = useState<'build' | 'recent' | 'saved'>(initialTab);
  const { data: saved = [] } = useSavedBriefings(userId, tab === 'saved');
  const [whereQuery, setWhereQuery] = useState('');
  const [showJourneys, setShowJourneys] = useState(false);
  const [recs, setRecs] = useState<CountryRecommendation[] | null>(null);
  const [loadingRecs, setLoadingRecs] = useState(false);

  const category = categories.find((c) => c.slug === categorySlug);
  // Use the brand/Trip-Snapshot accent (green) for consistency — not the per-journey tint.
  const accent = tc.primary;

  useEffect(() => {
    if (visible) {
      setTab(initialTab);
      emitJourneyEvent('briefing_sheet_open', { categorySlug });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // apply smart defaults when the sheet opens / journey changes, only when no
  // topics are selected yet (don't clobber user edits or a resumed selection)
  useEffect(() => {
    if (visible && topics.length && topicKeys.length === 0) {
      draft.setTopics(computeDefaultTopics(topics, categorySlug, who));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, topics.length, categorySlug]);

  const filteredCountries = useMemo(() => {
    const q = whereQuery.trim().toLowerCase();
    if (!q) return [];
    return countries.filter((c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase() === q).slice(0, 8);
  }, [whereQuery, countries]);

  const canGenerate = !!categorySlug && !!countryCode && topicKeys.length > 0;

  const handleRecommend = async () => {
    setLoadingRecs(true);
    emitJourneyEvent('briefing_recommend_countries', { categorySlug });
    try {
      setRecs(await recommendCountries(categorySlug));
    } catch {
      setRecs([]);
    } finally {
      setLoadingRecs(false);
    }
  };

  const handleGenerate = async () => {
    if (!canGenerate) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    emitJourneyEvent('briefing_generate', { categorySlug, countryCode, payload: { topics: topicKeys.length, stage, who } });
    captureJourneyBriefing({
      companionType: who ? WHO_TO_COMPANION[who] : undefined,
      interests: topicKeys.length ? topicKeys : undefined,
    });
    let id: string | null = null;
    if (userId) id = await createBriefing({ ...draft }, userId);
    draft.setBriefingId(id ?? undefined);
    onClose();
    onOpenResult();
  };

  const openRecent = (b: typeof recent[number]) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    emitJourneyEvent('briefing_recent_open', { categorySlug: b.categorySlug, countryCode: b.countryCode });
    draft.hydrate({
      categorySlug: b.categorySlug,
      subhubSlug: b.subhubSlug,
      countryCode: b.countryCode,
      countryName: b.countryName,
      flagEmoji: b.flagEmoji,
      stage: b.stage,
      who: b.who,
      topicKeys: b.topicKeys,
      briefingId: b.id,
    });
    touchBriefing(b.id);
    onClose();
    onOpenResult();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>

        <View style={[styles.sheet, { backgroundColor: tc.bgPrimary, paddingBottom: insets.bottom || spacing.lg }]}>
          <View style={styles.handleRow}><View style={[styles.handle, { backgroundColor: tc.borderSubtle }]} /></View>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}><CloseCircle size={26} color={tc.textTertiary} variant="Bold" /></TouchableOpacity>

          {/* Tabs */}
          <View style={styles.tabs}>
            {(['build', 'recent', 'saved'] as const).map((t) => (
              <TouchableOpacity key={t} onPress={() => setTab(t)} style={styles.tabBtn}>
                <Text style={[styles.tabText, { color: tab === t ? tc.textPrimary : tc.textTertiary }]}>{t === 'build' ? 'Build' : t === 'recent' ? 'Recent' : 'Saved'}</Text>
                {tab === t ? <View style={[styles.tabUnderline, { backgroundColor: accent }]} /> : null}
              </TouchableOpacity>
            ))}
          </View>

          {tab === 'build' ? (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
              {/* Reason */}
              <Card label="Reason" tc={tc}>
                <TouchableOpacity style={styles.rowBetween} onPress={() => setShowJourneys((s) => !s)} activeOpacity={0.7}>
                  <View style={styles.rowLeft}>
                    {category ? (() => { const Icon = getIcon(category.icon); return <Icon size={20} color={accent} variant="Bold" />; })() : null}
                    <Text style={[styles.value, { color: tc.textPrimary }]}>{category?.name ?? 'Choose a journey'}</Text>
                  </View>
                  <Text style={[styles.change, { color: accent }]}>{showJourneys ? 'Done' : 'Change'}</Text>
                </TouchableOpacity>
                {showJourneys ? (
                  <View style={styles.journeyWrap}>
                    {categories.map((c) => (
                      <TouchableOpacity
                        key={c.id}
                        onPress={() => { draft.setCategory(c.slug); setShowJourneys(false); emitJourneyEvent('briefing_reason_change', { categorySlug: c.slug }); }}
                        style={[styles.journeyChip, { backgroundColor: c.slug === categorySlug ? c.tint : tc.bgCard, borderColor: c.slug === categorySlug ? c.tint : tc.borderSubtle }]}
                      >
                        <Text style={[styles.journeyChipText, { color: c.slug === categorySlug ? '#FFF' : tc.textPrimary }]}>{c.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : null}
              </Card>

              {/* Where */}
              <Card label="Where" tc={tc}>
                {countryCode ? (
                  <TouchableOpacity style={styles.rowBetween} onPress={() => { draft.setCountry('', undefined, undefined); setWhereQuery(''); setRecs(null); }} activeOpacity={0.7}>
                    <View style={styles.rowLeft}>
                      <Text style={{ fontSize: 18 }}>{draft.flagEmoji}</Text>
                      <Text style={[styles.value, { color: tc.textPrimary }]}>{draft.countryName ?? countryCode}</Text>
                    </View>
                    <Text style={[styles.change, { color: accent }]}>Change</Text>
                  </TouchableOpacity>
                ) : (
                  <>
                    <View style={[styles.searchRow, { backgroundColor: tc.bgCard, borderColor: tc.borderSubtle }]}>
                      <SearchNormal1 size={16} color={tc.textSecondary} />
                      <TextInput value={whereQuery} onChangeText={setWhereQuery} placeholder="Search a country" placeholderTextColor={tc.textSecondary} style={[styles.searchInput, { color: tc.textPrimary }]} />
                    </View>
                    {filteredCountries.map((c) => (
                      <TouchableOpacity key={c.code} style={styles.suggestRow} onPress={() => { draft.setCountry(c.code, c.name, c.flagEmoji); setWhereQuery(''); emitJourneyEvent('briefing_where_select', { categorySlug, countryCode: c.code }); }}>
                        <Text style={{ fontSize: 16 }}>{c.flagEmoji}</Text>
                        <Text style={[styles.suggestText, { color: tc.textPrimary }]}>{c.name}</Text>
                      </TouchableOpacity>
                    ))}
                    {/* Not sure */}
                    {!whereQuery ? (
                      <TouchableOpacity style={[styles.notSure, { borderColor: `${accent}55` }]} onPress={handleRecommend}>
                        <Routing size={16} color={accent} variant="Bold" />
                        <Text style={[styles.notSureText, { color: accent }]}>Not sure — recommend countries</Text>
                      </TouchableOpacity>
                    ) : null}
                    {loadingRecs ? <ActivityIndicator color={accent} style={{ marginTop: spacing.sm }} /> : null}
                    {recs?.map((r) => (
                      <TouchableOpacity key={r.countryCode} style={styles.suggestRow} onPress={() => { draft.setCountry(r.countryCode, r.countryName, r.flagEmoji); setRecs(null); }}>
                        <Text style={{ fontSize: 16 }}>{r.flagEmoji}</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.suggestText, { color: tc.textPrimary }]}>{r.countryName ?? r.countryCode} · {r.headline}</Text>
                          <Text style={[styles.recWhy, { color: tc.textSecondary }]} numberOfLines={2}>{r.why}</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </>
                )}
              </Card>

              {/* Stage */}
              <Card label="Stage" tc={tc}>
                <Segmented options={STAGES} selected={stage} onSelect={(k) => { draft.setStage(k as BriefingStage); emitJourneyEvent('briefing_stage_select', { categorySlug, payload: { stage: k } }); }} accent={accent} tc={tc} />
              </Card>

              {/* Who */}
              <Card label="Who" tc={tc}>
                <Segmented options={WHOS} selected={who} onSelect={(k) => { draft.setWho(k as BriefingWho); const adds = computeDefaultTopics(topics, categorySlug, k as BriefingWho); draft.setTopics(Array.from(new Set([...topicKeys, ...adds]))); emitJourneyEvent('briefing_who_select', { categorySlug, payload: { who: k } }); }} accent={accent} tc={tc} />
              </Card>

              {/* What */}
              <Card label="What you want to know" tc={tc}>
                <TopicPicker
                  topics={topics}
                  selected={topicKeys}
                  usage={usage}
                  subhubSlug={draft.subhubSlug}
                  onToggle={(k) => { draft.toggleTopic(k); emitJourneyEvent('briefing_topic_toggle', { categorySlug, payload: { topicKey: k } }); }}
                  onAddCustom={(label) => { draft.addCustomTopic(label); emitJourneyEvent('briefing_custom_topic_added', { categorySlug, payload: { label } }); }}
                  accent={accent}
                />
              </Card>

              <View style={{ height: 90 }} />
            </ScrollView>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
              {(tab === 'saved' ? saved : recent).length === 0 ? (
                <Text style={[styles.empty, { color: tc.textSecondary }]}>
                  {tab === 'saved' ? 'Nothing saved yet. Tap the bookmark on a briefing to save it here.' : "No briefings yet. Build one and it'll show up here."}
                </Text>
              ) : (
                (tab === 'saved' ? saved : recent).map((b) => (
                  <TouchableOpacity key={b.id} style={[styles.recentRow, { backgroundColor: tc.bgCard, borderColor: tc.borderSubtle }]} onPress={() => openRecent(b)}>
                    <Text style={{ fontSize: 22 }}>{b.flagEmoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.recentTitle, { color: tc.textPrimary }]}>{b.title ?? `${b.categoryName} · ${b.countryName}`}</Text>
                      <Text style={[styles.recentSub, { color: tc.textSecondary }]}>{b.topicKeys.length} topics{b.isSaved ? ' · Saved' : ''}</Text>
                    </View>
                    {b.isSaved ? <Star1 size={16} color={accent} variant="Bold" /> : null}
                    <ArrowRight2 size={16} color={tc.textSecondary} />
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          )}

          {/* Footer (build only) */}
          {tab === 'build' ? (
            <View style={[styles.footer, { backgroundColor: tc.bgPrimary, borderTopColor: tc.borderSubtle, paddingBottom: insets.bottom || spacing.md }]}>
              <TouchableOpacity onPress={() => draft.reset(categorySlug, draft.subhubSlug)}>
                <Text style={[styles.clearAll, { color: tc.textSecondary }]}>Clear all</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleGenerate}
                disabled={!canGenerate}
                style={[styles.generateBtn, { backgroundColor: canGenerate ? accent : tc.borderSubtle }]}
              >
                <Text style={styles.generateText}>Generate briefing{topicKeys.length ? ` · ${topicKeys.length}` : ''}</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

function Card({ label, tc, children }: { label: string; tc: any; children: React.ReactNode }) {
  return (
    <View style={[styles.card, { backgroundColor: tc.bgCard, borderColor: tc.borderSubtle }]}>
      <Text style={[styles.cardLabel, { color: tc.textTertiary }]}>{label.toUpperCase()}</Text>
      {children}
    </View>
  );
}

function Segmented({ options, selected, onSelect, accent, tc }: { options: Array<{ key: string; label: string }>; selected?: string; onSelect: (k: string) => void; accent: string; tc: any }) {
  return (
    <View style={styles.segmented}>
      {options.map((o) => {
        const on = selected === o.key;
        return (
          <TouchableOpacity key={o.key} onPress={() => onSelect(o.key)} style={[styles.segment, { backgroundColor: on ? accent : 'transparent', borderColor: on ? accent : tc.borderSubtle }]}>
            <Text style={[styles.segmentText, { color: on ? '#FFF' : tc.textPrimary }]}>{o.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '92%', shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.15, shadowRadius: 16, elevation: 10 },
  handleRow: { alignItems: 'center', paddingTop: 10, paddingBottom: 4 },
  handle: { width: 40, height: 4, borderRadius: 2 },
  closeBtn: { position: 'absolute', top: 12, right: 16, zIndex: 10, padding: 4 },
  tabs: { flexDirection: 'row', gap: spacing.lg, paddingHorizontal: spacing.lg, marginTop: spacing.xs },
  tabBtn: { paddingVertical: spacing.sm, alignItems: 'center' },
  tabText: { fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.bold },
  tabUnderline: { height: 3, borderRadius: 2, width: '100%', marginTop: 4 },
  body: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, gap: spacing.md },
  card: { borderWidth: 1, borderRadius: borderRadius.xl, padding: spacing.md, gap: spacing.sm },
  cardLabel: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.bold, letterSpacing: 0.8 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  value: { fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold, flexShrink: 1 },
  change: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold },
  journeyWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  journeyChip: { paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  journeyChipText: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.medium },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderWidth: 1, borderRadius: borderRadius.full, paddingHorizontal: spacing.md, height: 44 },
  searchInput: { flex: 1, fontSize: typography.fontSize.sm, paddingVertical: 0 },
  suggestRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
  suggestText: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium },
  recWhy: { fontSize: typography.fontSize.xs, marginTop: 2, lineHeight: 16 },
  notSure: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, borderWidth: 1, borderRadius: borderRadius.full, paddingVertical: spacing.sm, marginTop: spacing.sm },
  notSureText: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold },
  segmented: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  segment: { paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  segmentText: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.medium },
  empty: { fontSize: typography.fontSize.sm, textAlign: 'center', paddingVertical: spacing.xl },
  recentRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderWidth: 1, borderRadius: borderRadius.xl, padding: spacing.md },
  recentTitle: { fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.bold },
  recentSub: { fontSize: typography.fontSize.xs, marginTop: 2 },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingTop: spacing.md, borderTopWidth: 1 },
  clearAll: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, textDecorationLine: 'underline' },
  generateBtn: { borderRadius: borderRadius.full, paddingVertical: spacing.md, paddingHorizontal: spacing.xl },
  generateText: { color: '#FFFFFF', fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.bold },
});
