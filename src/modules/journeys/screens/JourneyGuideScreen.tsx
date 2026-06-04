import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft2, InfoCircle, Message2, Calculator } from 'iconsax-react-native';
import { typography, spacing, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { JOURNEYS_CONFIG } from '../config/journeys.config';
import { useJourneyCatalog } from '../hooks/useJourneyCatalog';
import { useJourneyGuide, useIsPro } from '../hooks/useJourneyGuide';
import { GuideHeader, QuickFacts, GuideBody } from '../components/guide/GuideRenderer';
import { GuideFeedback } from '../components/guide/GuideFeedback';
import { ProUpsellSheet } from '../components/ProUpsellSheet';
import { openToolkit, openChat } from '../navigation/routes';
import { emitJourneyEvent } from '../events/journeyEvents';

export function JourneyGuideScreen({
  categorySlug,
  countryCode,
  subhubSlug,
}: {
  categorySlug: string;
  countryCode: string;
  subhubSlug?: string;
}) {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const { data: categories = [] } = useJourneyCatalog();
  const { data: guide, isLoading, isError, refetch } = useJourneyGuide({ categorySlug, countryCode, subhubSlug });
  const { data: pro } = useIsPro();
  const [showUpsell, setShowUpsell] = useState(false);
  const category = categories.find((c) => c.slug === categorySlug);
  const accent = category?.tint ?? colors.primary;

  const handleBack = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)' as any));
  const handleToolkit = () => {
    if (pro) openToolkit(router, { categorySlug, countryCode });
    else setShowUpsell(true);
  };

  useEffect(() => {
    if (guide) emitJourneyEvent('guide_view', { categorySlug, countryCode, payload: { status: guide.status } });
  }, [guide, categorySlug, countryCode]);

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
      </View>

      {isLoading ? (
        <View style={styles.notReady}>
          <ActivityIndicator color={accent} size="large" />
          <Text style={[styles.notReadyTitle, { color: colors.textPrimary }]}>
            Creating your {category?.name ?? 'journey'} guide
          </Text>
          <Text style={[styles.notReadyText, { color: colors.textSecondary }]}>
            Researching costs, process, risks and aftercare for {countryCode}. This can take up to a
            minute the first time — it's cached after that.
          </Text>
        </View>
      ) : isError || !guide ? (
        <View style={styles.notReady}>
          <Text style={[styles.notReadyTitle, { color: colors.textPrimary }]}>Couldn't build this guide</Text>
          <Text style={[styles.notReadyText, { color: colors.textSecondary }]}>
            Something went wrong generating the {category?.name ?? 'journey'} guide for {countryCode}.
          </Text>
          <TouchableOpacity
            onPress={() => refetch()}
            style={[styles.retryBtn, { backgroundColor: accent }]}
            accessibilityRole="button"
            accessibilityLabel="Try again"
          >
            <Text style={styles.retryText}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing['2xl'] }}>
          <GuideHeader guide={guide} accent={accent} />
          <QuickFacts content={guide.content} />
          {guide.requiresDisclaimer ? (
            <View style={[styles.disclaimer, { backgroundColor: `${accent}12`, borderColor: `${accent}33` }]}>
              <InfoCircle size={16} color={accent} variant="Bold" />
              <Text style={[styles.disclaimerText, { color: colors.textSecondary }]}>
                Information only — not medical, legal, or financial advice. Verify specifics with a
                licensed professional before acting.
              </Text>
            </View>
          ) : null}
          {/* Toolkit + concierge quick actions */}
          <View style={styles.actions}>
            {JOURNEYS_CONFIG.toolkit.enabled ? (
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: colors.bgCard, borderColor: colors.borderSubtle }]}
                onPress={handleToolkit}
                accessibilityRole="button"
                accessibilityLabel="Open the toolkit"
              >
                <Calculator size={18} color={accent} variant="Bold" />
                <Text style={[styles.actionText, { color: colors.textPrimary }]}>Toolkit</Text>
              </TouchableOpacity>
            ) : null}
            {JOURNEYS_CONFIG.chat.enabled ? (
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: colors.bgCard, borderColor: colors.borderSubtle }]}
                onPress={() => openChat(router, categorySlug, countryCode)}
                accessibilityRole="button"
                accessibilityLabel="Ask the concierge"
              >
                <Message2 size={18} color={accent} variant="Bold" />
                <Text style={[styles.actionText, { color: colors.textPrimary }]}>Ask concierge</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          <GuideBody guide={guide} accent={accent} />

          <GuideFeedback guideId={guide.id} accent={accent} />

          {guide.content.generatedNote ? (
            <Text style={[styles.genNote, { color: colors.textSecondary }]}>{guide.content.generatedNote}</Text>
          ) : null}
        </ScrollView>
      )}

      <ProUpsellSheet visible={showUpsell} onClose={() => setShowUpsell(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  topBar: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.sm },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  notReady: { padding: spacing.xl, gap: spacing.md, alignItems: 'center', marginTop: spacing['2xl'] },
  notReadyTitle: { fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, textAlign: 'center' },
  notReadyText: { fontSize: typography.fontSize.sm, lineHeight: 21, textAlign: 'center' },
  retryBtn: { borderRadius: borderRadius.full, paddingVertical: spacing.sm, paddingHorizontal: spacing.xl, marginTop: spacing.sm },
  retryText: { color: '#FFFFFF', fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.bold },
  disclaimer: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  disclaimerText: { flex: 1, fontSize: typography.fontSize.xs, lineHeight: 18 },
  actions: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg, marginBottom: spacing.lg },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, borderWidth: 1, borderRadius: borderRadius.full, paddingVertical: spacing.sm },
  actionText: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold },
  genNote: { fontSize: typography.fontSize.xs, fontStyle: 'italic', paddingHorizontal: spacing.lg, marginTop: spacing.sm },
});
