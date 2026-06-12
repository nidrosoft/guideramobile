import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator, TextInput, Keyboard } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { TourAnchor, useGuidance } from '@/features/guidance';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { ArrowLeft2, SearchNormal1, Lock1, ArrowRight2, TickCircle } from 'iconsax-react-native';
import { typography, spacing, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { useJourneyCatalog } from '../hooks/useJourneyCatalog';
import { useJourneyFilter } from '../hooks/useJourneyFilter';
import { useJourneyCountries } from '../hooks/useJourneySearch';
import { useIsPro } from '../hooks/useJourneyGuide';
import { JourneyPickerRail } from '../components/JourneyPickerRail';
import { ContinentChips } from '../components/ContinentChips';
import { SubHubChips } from '../components/SubHubChips';
import { CountryCard } from '../components/CountryCard';
import { ProUpsellSheet } from '../components/ProUpsellSheet';
import { BriefingSheet } from '../components/briefing/BriefingSheet';
import { useBriefingDraft } from '../hooks/useBriefingDraft';
import { getIcon } from '../config/icons';
import { MagicStar, Archive } from 'iconsax-react-native';
import { openGuide, openToolkit } from '../navigation/routes';
import { JOURNEYS_CONFIG } from '../config/journeys.config';
import { resolveQuery, resolveSearchIntent, logSearch } from '../services/journeySearch.service';
import { emitJourneyEvent } from '../events/journeyEvents';
import type { JourneyContinent } from '../types';

export function JourneysHubScreen({
  initialCategorySlug,
  initialContinent,
}: {
  initialCategorySlug?: string;
  initialContinent?: string;
}) {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const guidance = useGuidance();
  const { data: categories = [] } = useJourneyCatalog();

  useFocusEffect(
    useCallback(() => {
      guidance.maybeStartTour('journeys');
    }, [guidance])
  );
  const { data: pro } = useIsPro();
  const [showUpsell, setShowUpsell] = useState(false);
  const [showBriefing, setShowBriefing] = useState(false);
  const [briefingTab, setBriefingTab] = useState<'build' | 'recent' | 'saved'>('build');
  const { filter, results, isLoading, setCategory, setContinent, setSubhub } = useJourneyFilter();

  const openSaved = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (pro || __DEV__) {
      setBriefingTab('saved');
      setShowBriefing(true);
    } else {
      emitJourneyEvent('briefing_pro_gate_view', { categorySlug: filter.categorySlug });
      setShowUpsell(true);
    }
  };

  const openBriefingBuilder = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // seed the draft with the hub's current journey/sub-hub
    const d = useBriefingDraft.getState();
    if (d.categorySlug !== filter.categorySlug || d.subhubSlug !== (filter.subhubSlug !== 'all' ? filter.subhubSlug : undefined)) {
      d.reset(filter.categorySlug, filter.subhubSlug !== 'all' ? filter.subhubSlug : undefined);
    }
    // spec §11: payment not wired — allow through in dev, gate in prod
    if (pro || __DEV__) {
      setBriefingTab('build');
      emitJourneyEvent('briefing_sheet_open', { categorySlug: filter.categorySlug });
      setShowBriefing(true);
    } else {
      emitJourneyEvent('briefing_pro_gate_view', { categorySlug: filter.categorySlug });
      setShowUpsell(true);
    }
  };

  const handleBack = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)' as any));
  const handleToolkit = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (pro) openToolkit(router, { categorySlug: filter.categorySlug });
    else setShowUpsell(true);
  };

  useEffect(() => {
    emitJourneyEvent('hub_view', { categorySlug: initialCategorySlug });
    if (initialCategorySlug) setCategory(initialCategorySlug);
    if (initialContinent) setContinent(initialContinent as JourneyContinent | 'All');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCategorySlug, initialContinent]);

  const handleSelectJourney = (slug: string) => {
    emitJourneyEvent('journey_select', { categorySlug: slug });
    setCategory(slug);
  };
  const handleContinent = (c: JourneyContinent | 'All') => {
    emitJourneyEvent('continent_filter', { categorySlug: filter.categorySlug, payload: { continent: c } });
    setContinent(c);
  };
  const handleSubhub = (slug: string | 'all') => {
    emitJourneyEvent('subhub_filter', { categorySlug: filter.categorySlug, payload: { subhub: slug } });
    setSubhub(slug);
  };

  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const { data: countries = [] } = useJourneyCountries();

  // Route a resolved query to the right destination.
  const routeResolved = (
    raw: string,
    r: { countryCode?: string | null; categorySlug?: string | null; subhubSlug?: string | null },
    ai: boolean
  ) => {
    emitJourneyEvent('search_submit', {
      categorySlug: r.categorySlug ?? undefined,
      countryCode: r.countryCode ?? undefined,
      payload: { q: raw, ai },
    });
    if (r.countryCode && r.categorySlug) {
      logSearch({ rawQuery: raw, resolvedCountry: r.countryCode, resolvedCategory: r.categorySlug, resultType: 'guide' });
      openGuide(router, r.categorySlug, r.countryCode, r.subhubSlug ?? undefined);
    } else if (r.countryCode) {
      logSearch({ rawQuery: raw, resolvedCountry: r.countryCode, resultType: 'country_profile' });
      router.push(`/journeys/search?country=${r.countryCode}`);
    } else if (r.categorySlug) {
      logSearch({ rawQuery: raw, resolvedCategory: r.categorySlug, resultType: 'category_list' });
      setCategory(r.categorySlug);
      if (r.subhubSlug) setSubhub(r.subhubSlug);
      setQuery('');
    } else {
      logSearch({ rawQuery: raw, resultType: 'none' });
    }
  };

  const handleSearchSubmit = async () => {
    const raw = query.trim();
    if (!raw || isSearching) return;
    Keyboard.dismiss();

    // 1) Instant local resolution for obvious country/category matches.
    const local = resolveQuery(raw, countries);
    if (local.countryCode || local.categorySlug) {
      routeResolved(raw, local, false);
      return;
    }

    // 2) Otherwise let the LLM interpret any free-text (procedures, goals, places).
    try {
      setIsSearching(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const intent = await resolveSearchIntent(raw);
      if (intent.categorySlug || intent.countryCode) {
        routeResolved(raw, intent, true);
      } else {
        logSearch({ rawQuery: raw, resultType: 'none' });
      }
    } catch {
      logSearch({ rawQuery: raw, resultType: 'none' });
    } finally {
      setIsSearching(false);
    }
  };

  const selectedCategory = useMemo(
    () => categories.find((c) => c.slug === filter.categorySlug),
    [categories, filter.categorySlug]
  );
  const HeaderIcon = getIcon(selectedCategory?.icon);

  const resultLabel = `${selectedCategory?.name ?? 'Journeys'}${
    filter.continent !== 'All' ? ` in ${filter.continent}` : ''
  } · ${results.length} ${results.length === 1 ? 'place' : 'places'}`;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={handleBack}
          style={[styles.backBtn, { backgroundColor: colors.bgCard }]}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowLeft2 size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={openSaved}
          style={[styles.backBtn, { backgroundColor: colors.bgCard }]}
          accessibilityRole="button"
          accessibilityLabel="Saved briefings"
        >
          <Archive size={20} color={colors.textPrimary} variant="Outline" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: spacing['2xl'] }}
      >
        {/* Header */}
        <View style={styles.headerBlock}>
          <Text style={[styles.h1, { color: colors.textPrimary }]}>Journeys</Text>
          <Text style={[styles.sub, { color: colors.textSecondary }]}>
            Travel for a reason. Find your people, places & playbook.
          </Text>
        </View>

        {/* Search box (spec §3.4) */}
        {JOURNEYS_CONFIG.search.enabled ? (
          <>
          <View style={[styles.searchBox, { backgroundColor: colors.bgCard, borderColor: colors.borderStandard }]}>
            <SearchNormal1 size={18} color={colors.textSecondary} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={handleSearchSubmit}
              returnKeyType="search"
              editable={!isSearching}
              placeholder='Try "hair transplant" or "Portugal"'
              placeholderTextColor={colors.textSecondary}
              style={[styles.searchInput, { color: colors.textPrimary }]}
              accessibilityLabel="Search journeys"
            />
            {query.trim().length > 0 ? (
              <TouchableOpacity
                onPress={handleSearchSubmit}
                disabled={isSearching}
                style={[styles.searchSubmit, { backgroundColor: colors.primary }]}
                accessibilityRole="button"
                accessibilityLabel="Submit search"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                {isSearching ? (
                  <ActivityIndicator size="small" color={colors.primaryText} />
                ) : (
                  <ArrowRight2 size={16} color={colors.primaryText} variant="Bold" />
                )}
              </TouchableOpacity>
            ) : null}
          </View>
          {isSearching ? (
            <Text style={[styles.searchHint, { color: colors.textSecondary }]}>
              Figuring out your search…
            </Text>
          ) : null}
          {/* Custom briefing builder (Premium) — Trip-Snapshot-style sheet */}
          <TourAnchor id="journeys.briefing">
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={openBriefingBuilder}
              style={[styles.briefingCta, { borderColor: `${colors.primary}55`, backgroundColor: `${colors.primary}0F` }]}
              accessibilityRole="button"
              accessibilityLabel="Build a custom briefing"
            >
              <MagicStar size={18} color={colors.primary} variant="Bold" />
              <View style={{ flex: 1 }}>
                <Text style={[styles.briefingCtaTitle, { color: colors.textPrimary }]}>Build a custom briefing</Text>
                <Text style={[styles.briefingCtaSub, { color: colors.textSecondary }]}>Pick country, stage, who & topics — streamed in</Text>
              </View>
              {!pro ? <Lock1 size={15} color="#B98A34" variant="Bold" /> : <ArrowRight2 size={16} color={colors.textSecondary} />}
            </TouchableOpacity>
          </TourAnchor>
          </>
        ) : null}

        {/* Pro Toolkit promo */}
        {JOURNEYS_CONFIG.toolkit.enabled ? (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={handleToolkit}
            style={styles.proPromoWrap}
            accessibilityRole="button"
            accessibilityLabel="Open the Journey Toolkit"
          >
            <LinearGradient
              colors={['#EBC3A9', '#D69A86', '#B5786C']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.proPromo}
            >
              <View style={styles.proIcon}>
                <Lock1 size={18} color="#5A3A2E" variant="Bold" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.proTitle}>The Journey Toolkit</Text>
                <Text style={styles.proSub}>Cost calculator, checklists & more.</Text>
              </View>
              <View style={styles.proLock}>
                <Text style={styles.proLockText}>Pro</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        ) : null}

        {/* Region (continent) chips — on top */}
        <Text style={[styles.railLabel, { color: colors.textPrimary }]}>Region</Text>
        <ContinentChips selected={filter.continent} onSelect={handleContinent} />

        {/* Pick a journey — rail in the middle, separating the two chip rows */}
        <View style={styles.spacerSm} />
        <Text style={[styles.railLabel, { color: colors.textPrimary }]}>Pick a journey</Text>
        <TourAnchor id="journeys.categories">
          <JourneyPickerRail categories={categories} selectedSlug={filter.categorySlug} onSelect={handleSelectJourney} />
        </TourAnchor>

        {/* Sub-hub (focus) chips — below the rail */}
        {selectedCategory?.hasSubhubs && selectedCategory.subhubs?.length ? (
          <>
            <View style={styles.spacerSm} />
            <Text style={[styles.railLabel, { color: colors.textPrimary }]}>Focus</Text>
            <SubHubChips subhubs={selectedCategory.subhubs} selected={filter.subhubSlug} onSelect={handleSubhub} />
          </>
        ) : null}

        {/* Result header */}
        <View style={styles.resultHeader}>
          <View style={[styles.resultIcon, { backgroundColor: `${selectedCategory?.tint ?? colors.primary}1F` }]}>
            <HeaderIcon size={18} color={selectedCategory?.tint ?? colors.primary} variant="Bold" />
          </View>
          <Text style={[styles.resultLabel, { color: colors.textPrimary }]}>{resultLabel}</Text>
        </View>

        {/* Country list */}
        {isLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
        ) : results.length === 0 ? (
          <View style={[styles.empty, { backgroundColor: colors.bgCard, borderColor: colors.borderSubtle }]}>
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No places yet for this combo</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Try another continent — or generate a guide for any country (coming soon).
            </Text>
          </View>
        ) : (
          results.map((stub) => (
            <CountryCard
              key={`${stub.countryCode}-${stub.categorySlug}`}
              stub={stub}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                emitJourneyEvent('country_card_tap', {
                  categorySlug: stub.categorySlug,
                  countryCode: stub.countryCode,
                });
                openGuide(
                  router,
                  stub.categorySlug,
                  stub.countryCode,
                  filter.subhubSlug !== 'all' ? filter.subhubSlug : undefined
                );
              }}
            />
          ))
        )}

        {/* Free vs Pro — gradient comparison card */}
        <View style={styles.compareWrap}>
          <LinearGradient
            colors={['#221E1A', '#352A22', '#5A3E30']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.compareCard}
          >
            <Text style={styles.compareTitle}>Free vs Pro</Text>
            <Text style={styles.compareSub}>Every guide is free. Pro adds the trust, tools & people layer.</Text>

            <View style={styles.compareCols}>
              <View style={styles.compareCol}>
                <Text style={styles.colHeadFree}>FREE</Text>
                {['Full AI country guides', 'Browse & filter journeys', 'Smart search', 'One community link', 'Save guides'].map((t) => (
                  <View key={t} style={styles.compareRow}>
                    <TickCircle size={14} color="rgba(255,255,255,0.55)" variant="Bold" />
                    <Text style={styles.compareItemFree}>{t}</Text>
                  </View>
                ))}
              </View>
              <View style={[styles.compareCol, styles.compareColPro]}>
                <Text style={styles.colHeadPro}>PRO</Text>
                {['Everything in Free', 'Verified providers', 'The full toolkit', 'Peer matching', 'AI concierge chat'].map((t) => (
                  <View key={t} style={styles.compareRow}>
                    <TickCircle size={14} color="#E9C893" variant="Bold" />
                    <Text style={styles.compareItemPro}>{t}</Text>
                  </View>
                ))}
              </View>
            </View>

            {!pro ? (
              <TouchableOpacity
                style={styles.compareCta}
                activeOpacity={0.85}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowUpsell(true); }}
                accessibilityRole="button"
                accessibilityLabel="See everything in Guidera Pro"
              >
                <Text style={styles.compareCtaText}>Unlock with Pro</Text>
                <ArrowRight2 size={16} color="#3A2017" variant="Bold" />
              </TouchableOpacity>
            ) : null}
          </LinearGradient>
        </View>
      </ScrollView>

      <ProUpsellSheet visible={showUpsell} onClose={() => setShowUpsell(false)} />
      <BriefingSheet
        visible={showBriefing}
        initialTab={briefingTab}
        onClose={() => setShowBriefing(false)}
        onOpenResult={() => router.push('/journeys/briefing' as any)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerBlock: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, gap: 4 },
  h1: { fontSize: typography.fontSize['3xl'], fontWeight: typography.fontWeight.bold },
  sub: { fontSize: typography.fontSize.sm, lineHeight: 20 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    height: 46,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: typography.fontSize.sm, paddingVertical: 0 },
  searchSubmit: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  searchHint: { fontSize: typography.fontSize.xs, paddingHorizontal: spacing.lg, marginTop: spacing.xs },
  briefingCta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginHorizontal: spacing.lg, marginTop: spacing.md, paddingHorizontal: spacing.md, paddingVertical: spacing.md, borderRadius: borderRadius.xl, borderWidth: 1 },
  briefingCtaTitle: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.bold },
  briefingCtaSub: { fontSize: typography.fontSize.xs, marginTop: 1 },
  proPromoWrap: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  proPromo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  proIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.40)',
  },
  proTitle: { color: '#3A2017', fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.bold },
  proSub: { color: 'rgba(58,32,23,0.75)', fontSize: typography.fontSize.xs, marginTop: 2 },
  proLock: { backgroundColor: 'rgba(255,255,255,0.45)', paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: borderRadius.full },
  proLockText: { color: '#5A3A2E', fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.bold, letterSpacing: 0.5 },
  railLabel: { fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.bold, paddingHorizontal: spacing.lg, marginBottom: spacing.sm },
  spacerSm: { height: spacing.md },
  resultHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg, marginTop: spacing.lg, marginBottom: spacing.md },
  resultIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  resultLabel: { flex: 1, fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.bold },
  empty: { marginHorizontal: spacing.lg, borderWidth: 1, borderRadius: borderRadius.xl, padding: spacing.lg, gap: spacing.sm },
  emptyTitle: { fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.bold },
  emptyText: { fontSize: typography.fontSize.sm, lineHeight: 20 },
  compareWrap: { marginHorizontal: spacing.lg, marginTop: spacing.lg, borderRadius: borderRadius.xl, overflow: 'hidden' },
  compareCard: { padding: spacing.lg },
  compareTitle: { color: '#FFFFFF', fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold },
  compareSub: { color: 'rgba(255,255,255,0.7)', fontSize: typography.fontSize.xs, marginTop: 4, lineHeight: 17 },
  compareCols: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  compareCol: { flex: 1, gap: spacing.sm },
  compareColPro: { borderLeftWidth: 1, borderLeftColor: 'rgba(233,200,147,0.25)', paddingLeft: spacing.md },
  colHeadFree: { color: 'rgba(255,255,255,0.6)', fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.bold, letterSpacing: 1 },
  colHeadPro: { color: '#E9C893', fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.bold, letterSpacing: 1 },
  compareRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  compareItemFree: { flex: 1, color: 'rgba(255,255,255,0.8)', fontSize: typography.fontSize.xs, lineHeight: 17 },
  compareItemPro: { flex: 1, color: '#FFFFFF', fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.medium, lineHeight: 17 },
  compareCta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#E9C893', borderRadius: borderRadius.full, paddingVertical: spacing.sm, marginTop: spacing.lg },
  compareCtaText: { color: '#3A2017', fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.bold },
});
