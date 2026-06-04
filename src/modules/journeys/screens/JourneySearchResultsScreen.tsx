import { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { ArrowLeft2, ArrowRight2 } from 'iconsax-react-native';
import { typography, spacing, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { useJourneyCatalog } from '../hooks/useJourneyCatalog';
import { useCountryProfile } from '../hooks/useJourneySearch';
import { getIcon } from '../config/icons';
import { openGuide } from '../navigation/routes';
import { emitJourneyEvent } from '../events/journeyEvents';

export function JourneySearchResultsScreen({ countryCode }: { countryCode: string }) {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const { data: categories = [] } = useJourneyCatalog();
  const { data: profile, isLoading, isError } = useCountryProfile(countryCode);

  useEffect(() => {
    if (profile) emitJourneyEvent('search_result_view', { countryCode, payload: { matched: profile.matched.length } });
  }, [profile, countryCode]);

  const catBySlug = (slug: string) => categories.find((c) => c.slug === slug);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => (router.canGoBack() ? router.back() : router.replace('/journeys' as any))} style={[styles.backBtn, { backgroundColor: colors.bgCard }]} accessibilityRole="button" accessibilityLabel="Go back">
          <ArrowLeft2 size={20} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Finding what {countryCode} is genuinely known for…
          </Text>
        </View>
      ) : isError || !profile ? (
        <View style={styles.center}>
          <Text style={[styles.h1, { color: colors.textPrimary }]}>Couldn't load this</Text>
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Please try another search.</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing['2xl'] }}>
          <View style={styles.header}>
            <Text style={[styles.h1, { color: colors.textPrimary }]}>{profile.countryName ?? countryCode}</Text>
            <Text style={[styles.overview, { color: colors.textSecondary }]}>{profile.overview}</Text>
            {profile.knownFor.length ? (
              <View style={styles.chips}>
                {profile.knownFor.map((k) => (
                  <View key={k} style={[styles.chip, { backgroundColor: colors.bgCard, borderColor: colors.borderSubtle }]}>
                    <Text style={[styles.chipText, { color: colors.textSecondary }]}>{k}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>

          <Text style={[styles.sectionLabel, { color: colors.textPrimary }]}>
            {profile.matched.length ? 'Best-matched journeys' : 'No purpose-travel matches yet'}
          </Text>

          {profile.matched.length === 0 ? (
            <Text style={[styles.overview, { color: colors.textSecondary, paddingHorizontal: spacing.lg }]}>
              {profile.countryName ?? countryCode} isn't a hub for purpose-driven travel yet — but the full
              journey catalog is a tap away.
            </Text>
          ) : (
            profile.matched.map((m) => {
              const cat = catBySlug(m.categorySlug);
              const Icon = getIcon(cat?.icon);
              const tint = cat?.tint ?? colors.primary;
              const isPrimary = profile.primaryJourney === m.categorySlug;
              return (
                <TouchableOpacity
                  key={m.categorySlug}
                  activeOpacity={0.85}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    emitJourneyEvent('search_matched_journey_tap', { categorySlug: m.categorySlug, countryCode });
                    openGuide(router, m.categorySlug, countryCode);
                  }}
                  style={[
                    styles.matchCard,
                    { backgroundColor: colors.bgCard, borderColor: isPrimary ? tint : colors.borderSubtle, borderWidth: isPrimary ? 2 : 1 },
                  ]}
                >
                  <View style={[styles.matchIcon, { backgroundColor: `${tint}1F` }]}>
                    <Icon size={22} color={tint} variant="Bold" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.matchName, { color: colors.textPrimary }]}>
                      {cat?.name ?? m.categorySlug}
                      {isPrimary ? '  ·  Best fit' : ''}
                    </Text>
                    <Text style={[styles.matchHeadline, { color: tint }]}>{m.headline}</Text>
                    <Text style={[styles.matchWhy, { color: colors.textSecondary }]}>{m.why}</Text>
                  </View>
                  <ArrowRight2 size={18} color={colors.textSecondary} />
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  topBar: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.sm },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xl },
  loadingText: { fontSize: typography.fontSize.sm, textAlign: 'center' },
  header: { paddingHorizontal: spacing.lg, gap: spacing.sm, marginBottom: spacing.lg },
  h1: { fontSize: typography.fontSize['3xl'], fontWeight: typography.fontWeight.bold },
  overview: { fontSize: typography.fontSize.base, lineHeight: 22 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xs },
  chip: { paddingHorizontal: spacing.md, paddingVertical: 4, borderRadius: borderRadius.full, borderWidth: 1 },
  chipText: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.medium },
  sectionLabel: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  matchCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginHorizontal: spacing.lg, marginBottom: spacing.sm, padding: spacing.md, borderRadius: borderRadius.xl },
  matchIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  matchName: { fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.bold },
  matchHeadline: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, marginTop: 2 },
  matchWhy: { fontSize: typography.fontSize.xs, lineHeight: 17, marginTop: 2 },
});
