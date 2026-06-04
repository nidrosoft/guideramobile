import { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ArrowRight2 } from 'iconsax-react-native';
import { typography, spacing, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { useJourneyCatalog } from '../hooks/useJourneyCatalog';
import { getIcon } from '../config/icons';
import { Badge } from '../components/badges/Badge';
import { JOURNEYS_CONFIG } from '../config/journeys.config';
import { openJourney, openJourneysHub } from '../navigation/routes';
import { emitJourneyEvent } from '../events/journeyEvents';

/**
 * Embeddable Home-page section (spec §3.1A). Self-contained: fetches its own
 * catalog and navigates via expo-router. Host passes nothing required.
 */
export function JourneysHomeSection({ onSeeAll }: { onSeeAll?: () => void }) {
  const { colors } = useTheme();
  const router = useRouter();
  const { data: categories = [], isLoading } = useJourneyCatalog();

  useEffect(() => {
    if (categories.length > 0) emitJourneyEvent('home_section_view');
  }, [categories.length]);

  if (!JOURNEYS_CONFIG.enabled || !JOURNEYS_CONFIG.homeSection.enabled) return null;
  if (!isLoading && categories.length === 0) return null;

  const cards = categories.slice(0, JOURNEYS_CONFIG.homeSection.maxCards);

  const handleSeeAll = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    emitJourneyEvent('see_all_tap');
    if (onSeeAll) onSeeAll();
    else openJourneysHub(router);
  };

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Journeys</Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>Travel for a reason</Text>
        </View>
        <TouchableOpacity onPress={handleSeeAll} activeOpacity={0.7}>
          <Text style={[styles.viewAll, { color: colors.primary }]}>View All</Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rail}>
        {cards.map((cat) => {
          const Icon = getIcon(cat.icon);
          return (
            <TouchableOpacity
              key={cat.id}
              activeOpacity={0.85}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                emitJourneyEvent('home_card_tap', { categorySlug: cat.slug });
                openJourney(router, cat.slug);
              }}
              style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.borderStandard }]}
              accessibilityRole="button"
              accessibilityLabel={`${cat.name} journey`}
            >
              <View
                style={[
                  styles.iconWrap,
                  { backgroundColor: `${cat.tint}1F`, borderColor: `${cat.tint}40` },
                ]}
              >
                <Icon size={24} color={cat.tint} variant="Bold" />
              </View>
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]} numberOfLines={2}>
                {cat.name}
              </Text>
              {cat.subtitle ? (
                <Text style={[styles.cardSub, { color: colors.textSecondary }]} numberOfLines={1}>
                  {cat.subtitle}
                </Text>
              ) : null}
              {cat.isPopular ? <View style={styles.badgeRow}><Badge variant="POPULAR" /></View> : null}
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleSeeAll}
          style={[styles.seeAllCard, { borderColor: colors.borderStandard }]}
          accessibilityRole="button"
          accessibilityLabel="View all journeys"
        >
          <View style={[styles.iconWrap, { backgroundColor: `${colors.primary}1F`, borderColor: `${colors.primary}40` }]}>
            <ArrowRight2 size={24} color={colors.primary} variant="Bold" />
          </View>
          <Text style={[styles.cardTitle, { color: colors.primary }]}>View all journeys</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const CARD_WIDTH = 166;

const styles = StyleSheet.create({
  section: { marginBottom: spacing.xl },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  titleContainer: { flex: 1 },
  title: { fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold, marginBottom: 4 },
  description: { fontSize: typography.fontSize.sm },
  viewAll: { fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold },
  rail: { paddingHorizontal: spacing.lg, gap: spacing.md },
  card: {
    width: CARD_WIDTH,
    borderWidth: 1,
    borderRadius: borderRadius['2xl'],
    padding: spacing.lg,
    gap: spacing.sm,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  cardTitle: { fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.bold },
  cardSub: { fontSize: typography.fontSize.xs },
  badgeRow: { flexDirection: 'row', marginTop: 2 },
  seeAllCard: {
    width: CARD_WIDTH,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: borderRadius['2xl'],
    padding: spacing.lg,
    gap: spacing.sm,
    justifyContent: 'center',
  },
});
