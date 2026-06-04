import { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { ArrowLeft2, TickSquare, TickCircle, Card, Shield, Call } from 'iconsax-react-native';
import { typography, spacing, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useIsPro } from '../hooks/useJourneyGuide';
import { useChecklist } from '../hooks/useToolkit';
import { useJourneyCatalog } from '../hooks/useJourneyCatalog';
import { ProGate } from '../components/ProGate';
import {
  setChecklistItem, saveCostEstimate, getVisaWatch, upsertVisaWatch, type CostLineItem,
} from '../services/journeyToolkit.service';
import { emitJourneyEvent } from '../events/journeyEvents';

const DEFAULT_LINES: CostLineItem[] = [
  { label: 'Flights', amount: 0 },
  { label: 'Accommodation', amount: 0 },
  { label: 'Main cost (treatment/visa/etc.)', amount: 0 },
  { label: 'Local transport & food', amount: 0 },
  { label: 'Insurance', amount: 0 },
];

export function ToolkitScreen({ categorySlug, countryCode }: { categorySlug?: string; countryCode?: string }) {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const { profile } = useAuth();
  const userId = (profile as any)?.id as string | undefined;
  const { data: pro } = useIsPro();
  const { data: categories = [] } = useJourneyCatalog();
  const category = categories.find((c) => c.slug === categorySlug);
  const accent = category?.tint ?? colors.primary;

  useEffect(() => {
    emitJourneyEvent('toolkit_view', { categorySlug, countryCode });
  }, [categorySlug, countryCode]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => (router.canGoBack() ? router.back() : router.replace('/journeys' as any))} style={[styles.backBtn, { backgroundColor: colors.bgCard }]} accessibilityLabel="Go back">
          <ArrowLeft2 size={20} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing['2xl'] }}>
        <View style={styles.header}>
          <Text style={[styles.h1, { color: colors.textPrimary }]}>The Journey Toolkit</Text>
          <Text style={[styles.sub, { color: colors.textSecondary }]}>
            Plan the practical side — costs and your pre-departure checklist.
          </Text>
        </View>

        {!pro ? (
          <View style={{ paddingHorizontal: spacing.lg }}>
            <ProGate
              feature="toolkitFull"
              title="Unlock the full toolkit"
              preview={
                <View style={{ gap: spacing.sm }}>
                  <Text style={[styles.previewText, { color: colors.textSecondary }]}>• Cost calculator (all-in vs home)</Text>
                  <Text style={[styles.previewText, { color: colors.textSecondary }]}>• Pre-departure checklist that saves</Text>
                  <Text style={[styles.previewText, { color: colors.textSecondary }]}>• Visa tracker & timeline (soon)</Text>
                </View>
              }
            >
              <View />
            </ProGate>
          </View>
        ) : (
          <>
            <CostCalculator accent={accent} userId={userId} />
            <ChecklistTool
              accent={accent}
              userId={userId}
              categorySlug={categorySlug}
              countryCode={countryCode}
            />
            <VisaTracker accent={accent} userId={userId} categorySlug={categorySlug} countryCode={countryCode} />
            <Resources accent={accent} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function CostCalculator({ accent, userId }: { accent: string; userId?: string }) {
  const { colors } = useTheme();
  const [lines, setLines] = useState<CostLineItem[]>(DEFAULT_LINES);
  const [saved, setSaved] = useState(false);
  const total = useMemo(() => lines.reduce((s, l) => s + (Number(l.amount) || 0), 0), [lines]);

  const update = (i: number, raw: string) => {
    const amount = parseFloat(raw.replace(/[^0-9.]/g, '')) || 0;
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, amount } : l)));
    setSaved(false);
  };

  const save = async () => {
    if (!userId) return;
    try {
      await saveCostEstimate({ userId, lineItems: lines, total });
      emitJourneyEvent('cost_estimate_saved', { payload: { total } });
      setSaved(true);
    } catch {
      /* surfaced via no state change */
    }
  };

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Cost calculator</Text>
      <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.borderSubtle }]}>
        {lines.map((l, i) => (
          <View key={l.label} style={styles.lineRow}>
            <Text style={[styles.lineLabel, { color: colors.textSecondary }]}>{l.label}</Text>
            <View style={[styles.amountBox, { borderColor: colors.borderSubtle }]}>
              <Text style={[styles.currency, { color: colors.textSecondary }]}>$</Text>
              <TextInput
                keyboardType="numeric"
                defaultValue={l.amount ? String(l.amount) : ''}
                onChangeText={(t) => update(i, t)}
                placeholder="0"
                placeholderTextColor={colors.textSecondary}
                style={[styles.amountInput, { color: colors.textPrimary }]}
              />
            </View>
          </View>
        ))}
        <View style={[styles.totalRow, { borderTopColor: colors.borderSubtle }]}>
          <Text style={[styles.totalLabel, { color: colors.textPrimary }]}>All-in total</Text>
          <Text style={[styles.totalValue, { color: accent }]}>${total.toLocaleString()}</Text>
        </View>
      </View>
      <TouchableOpacity
        onPress={save}
        disabled={saved || total === 0}
        style={[styles.saveBtn, { backgroundColor: saved ? colors.primary : accent, opacity: total === 0 ? 0.5 : 1 }]}
        accessibilityRole="button"
      >
        {saved ? <TickCircle size={18} color="#FFFFFF" variant="Bold" /> : null}
        <Text style={styles.saveText}>{saved ? 'Saved' : 'Save estimate'}</Text>
      </TouchableOpacity>
    </View>
  );
}

function ChecklistTool({
  accent,
  userId,
  categorySlug,
  countryCode,
}: {
  accent: string;
  userId?: string;
  categorySlug?: string;
  countryCode?: string;
}) {
  const { colors } = useTheme();
  const enabled = !!categorySlug && !!countryCode;
  const { data: checklist } = useChecklist(
    { categorySlug: categorySlug ?? '', countryCode: countryCode ?? '', userId },
    enabled
  );
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (checklist?.checked) setChecked(checklist.checked);
  }, [checklist]);

  const toggle = async (key: string) => {
    if (!userId || !categorySlug || !countryCode) return;
    const value = !checked[key];
    setChecked((prev) => ({ ...prev, [key]: value }));
    Haptics.selectionAsync();
    emitJourneyEvent('checklist_item_toggled', { categorySlug, countryCode, payload: { key, value } });
    try {
      await setChecklistItem({ userId, categorySlug, countryCode, key, value, current: checked });
    } catch {
      setChecked((prev) => ({ ...prev, [key]: !value })); // revert on failure
    }
  };

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Pre-departure checklist</Text>
      {!enabled ? (
        <Text style={[styles.hint, { color: colors.textSecondary }]}>
          Open a journey guide and tap the toolkit to load its country-specific checklist.
        </Text>
      ) : !checklist || checklist.items.length === 0 ? (
        <Text style={[styles.hint, { color: colors.textSecondary }]}>
          No checklist template for this journey yet.
        </Text>
      ) : (
        <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.borderSubtle }]}>
          {checklist.items.map((it) => {
            const on = !!checked[it.key];
            return (
              <TouchableOpacity key={it.key} style={styles.checkRow} activeOpacity={0.7} onPress={() => toggle(it.key)}>
                {on ? (
                  <TickSquare size={22} color={accent} variant="Bold" />
                ) : (
                  <View style={[styles.checkbox, { borderColor: colors.borderSubtle }]} />
                )}
                <View style={{ flex: 1 }}>
                  <Text style={[styles.checkLabel, { color: colors.textPrimary, textDecorationLine: on ? 'line-through' : 'none', opacity: on ? 0.6 : 1 }]}>
                    {it.label}
                  </Text>
                  {it.info ? <Text style={[styles.checkInfo, { color: colors.textSecondary }]}>{it.info}</Text> : null}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}

function VisaTracker({
  accent,
  userId,
  categorySlug,
  countryCode,
}: {
  accent: string;
  userId?: string;
  categorySlug?: string;
  countryCode?: string;
}) {
  const { colors } = useTheme();
  const enabled = !!userId && !!countryCode;
  const [nationality, setNationality] = useState('');
  const [note, setNote] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!enabled) return;
      try {
        const w = await getVisaWatch(userId as string, countryCode as string, categorySlug);
        if (active && w) {
          setNationality(w.nationality ?? '');
          setNote((w.status as any)?.note ?? '');
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      active = false;
    };
  }, [enabled, userId, countryCode, categorySlug]);

  const save = async () => {
    if (!enabled) return;
    try {
      await upsertVisaWatch({
        userId: userId as string,
        countryCode: countryCode as string,
        categorySlug,
        nationality: nationality.trim().toUpperCase().slice(0, 2) || undefined,
        note: note.trim() || undefined,
      });
      emitJourneyEvent('visa_watch_created', { categorySlug, countryCode });
      setSaved(true);
    } catch {
      /* ignore */
    }
  };

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Visa tracker</Text>
      {!enabled ? (
        <Text style={[styles.hint, { color: colors.textSecondary }]}>Open the toolkit from a guide to track a visa for that country.</Text>
      ) : (
        <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.borderSubtle }]}>
          <Text style={[styles.lineLabel, { color: colors.textSecondary }]}>Your nationality (ISO-2, e.g. US)</Text>
          <TextInput
            value={nationality}
            onChangeText={(t) => { setNationality(t); setSaved(false); }}
            autoCapitalize="characters"
            maxLength={2}
            placeholder="US"
            placeholderTextColor={colors.textSecondary}
            style={[styles.visaInput, { color: colors.textPrimary, borderColor: colors.borderSubtle }]}
          />
          <Text style={[styles.lineLabel, { color: colors.textSecondary, marginTop: spacing.sm }]}>Notes (visa type, status, deadlines)</Text>
          <TextInput
            value={note}
            onChangeText={(t) => { setNote(t); setSaved(false); }}
            placeholder="e.g. D7 — gathering proof of income; consulate appt 12 Aug"
            placeholderTextColor={colors.textSecondary}
            multiline
            style={[styles.visaInput, { color: colors.textPrimary, borderColor: colors.borderSubtle, minHeight: 64, textAlignVertical: 'top' }]}
          />
          <TouchableOpacity onPress={save} style={[styles.saveBtn, { backgroundColor: saved ? colors.primary : accent }]}>
            {saved ? <TickCircle size={18} color="#FFFFFF" variant="Bold" /> : null}
            <Text style={styles.saveText}>{saved ? 'Saved' : 'Save visa watch'}</Text>
          </TouchableOpacity>
          <Text style={[styles.hint, { color: colors.textSecondary }]}>Change alerts arrive in a future update.</Text>
        </View>
      )}
    </View>
  );
}

function Resources({ accent }: { accent: string }) {
  const { colors } = useTheme();
  const rows = [
    { Icon: Card, title: 'Banking & FX', sub: 'Multi-currency accounts and low-fee transfers for living abroad.' },
    { Icon: Shield, title: 'Travel & health insurance', sub: 'Cover that includes complications and elective procedures abroad.' },
    { Icon: Call, title: 'Emergency kit', sub: 'Local emergency numbers and your embassy contact — set up per country.' },
  ];
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Resources</Text>
      <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.borderSubtle }]}>
        {rows.map((r, i) => (
          <View key={r.title} style={[styles.resourceRow, i > 0 ? { borderTopWidth: 1, borderTopColor: colors.borderSubtle, paddingTop: spacing.md } : null]}>
            <View style={[styles.resIcon, { backgroundColor: `${accent}1F` }]}>
              <r.Icon size={18} color={accent} variant="Bold" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.resTitle, { color: colors.textPrimary }]}>{r.title}</Text>
              <Text style={[styles.resSub, { color: colors.textSecondary }]}>{r.sub}</Text>
            </View>
          </View>
        ))}
        <Text style={[styles.hint, { color: colors.textSecondary, marginTop: spacing.sm }]}>
          Curated partner recommendations are being added — these are placeholders for now.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  topBar: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.sm },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  header: { paddingHorizontal: spacing.lg, gap: 4, marginBottom: spacing.lg },
  h1: { fontSize: typography.fontSize['3xl'], fontWeight: typography.fontWeight.bold },
  sub: { fontSize: typography.fontSize.sm, lineHeight: 20 },
  previewText: { fontSize: typography.fontSize.sm },
  section: { paddingHorizontal: spacing.lg, marginBottom: spacing.xl, gap: spacing.md },
  sectionTitle: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold },
  card: { borderWidth: 1, borderRadius: borderRadius.xl, padding: spacing.md, gap: spacing.sm },
  lineRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  lineLabel: { flex: 1, fontSize: typography.fontSize.sm },
  amountBox: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: borderRadius.md, paddingHorizontal: spacing.sm, minWidth: 110 },
  currency: { fontSize: typography.fontSize.sm },
  amountInput: { flex: 1, fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold, paddingVertical: spacing.sm, textAlign: 'right' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, paddingTop: spacing.md, marginTop: spacing.xs },
  totalLabel: { fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.bold },
  totalValue: { fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold },
  saveBtn: { flexDirection: 'row', gap: spacing.sm, borderRadius: borderRadius.full, paddingVertical: spacing.md, alignItems: 'center', justifyContent: 'center' },
  saveText: { color: '#FFFFFF', fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.bold },
  hint: { fontSize: typography.fontSize.sm, lineHeight: 20 },
  checkRow: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start', paddingVertical: spacing.xs },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2 },
  checkLabel: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium },
  checkInfo: { fontSize: typography.fontSize.xs, marginTop: 2, lineHeight: 16 },
  visaInput: { borderWidth: 1, borderRadius: borderRadius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, fontSize: typography.fontSize.base },
  resourceRow: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  resIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  resTitle: { fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold },
  resSub: { fontSize: typography.fontSize.xs, lineHeight: 17, marginTop: 2 },
});
