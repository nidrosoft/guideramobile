import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ArrowRight2, Routing } from 'iconsax-react-native';
import { typography, spacing, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { JOURNEYS_CONFIG } from '../config/journeys.config';
import { openJourneysHub } from '../navigation/routes';
import { emitJourneyEvent } from '../events/journeyEvents';

/**
 * Community-tab doorway into Journeys (spec §3.1B). Same destination hub as the
 * Home section — just a different entry point. Self-contained.
 */
export function JourneysCommunityEntry() {
  const { colors } = useTheme();
  const router = useRouter();
  if (!JOURNEYS_CONFIG.enabled || !JOURNEYS_CONFIG.communityEntry.enabled) return null;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        emitJourneyEvent('community_entry_tap');
        openJourneysHub(router);
      }}
      style={[styles.row, { backgroundColor: colors.bgCard, borderColor: colors.borderSubtle }]}
      accessibilityRole="button"
      accessibilityLabel="Open Journeys"
    >
      <View style={[styles.icon, { backgroundColor: `${colors.primary}1F` }]}>
        <Routing size={20} color={colors.primary} variant="Bold" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Journeys</Text>
        <Text style={[styles.sub, { color: colors.textSecondary }]} numberOfLines={1}>
          Travel for a reason — find your people, places & playbook
        </Text>
      </View>
      <ArrowRight2 size={18} color={colors.textSecondary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  icon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.bold },
  sub: { fontSize: typography.fontSize.xs, marginTop: 2 },
});
