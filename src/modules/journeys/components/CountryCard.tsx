import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Star1, ArrowRight2 } from 'iconsax-react-native';
import { typography, spacing, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { Badge } from './badges/Badge';
import type { GuideStub } from '../types';

export function CountryCard({ stub, onPress }: { stub: GuideStub; onPress: () => void }) {
  const { colors } = useTheme();
  const badge = stub.isCurated ? 'CURATED' : stub.status === 'none' ? null : 'AI';

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.borderSubtle }]}
      accessibilityRole="button"
      accessibilityLabel={`${stub.countryName} guide`}
    >
      <View style={styles.body}>
        {/* Title line: flag · name · badge ······ rating/cost */}
        <View style={styles.topRow}>
          <Text style={styles.flag}>{stub.flagEmoji}</Text>
          <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={1}>
            {stub.countryName}
          </Text>
          {badge ? <Badge variant={badge} /> : null}
          <View style={styles.spacer} />
          {stub.rating ? (
            <View style={styles.meta}>
              <Star1 size={12} color={colors.primary} variant="Bold" />
              <Text style={[styles.metaText, { color: colors.textSecondary }]}>{stub.rating}</Text>
            </View>
          ) : null}
          {stub.costBand ? (
            <Text style={[styles.metaText, { color: colors.textSecondary, marginLeft: spacing.sm }]}>
              {stub.costBand}
            </Text>
          ) : null}
        </View>

        {/* Subline */}
        <Text style={[styles.tag, { color: colors.textSecondary }]} numberOfLines={1}>
          {stub.headlineTag || stub.continent}
        </Text>

        {/* Hook */}
        {stub.hook ? (
          <Text style={[styles.hook, { color: colors.textSecondary }]} numberOfLines={2}>
            {stub.hook}
          </Text>
        ) : stub.status === 'none' ? (
          <Text style={[styles.hook, { color: colors.textSecondary }]} numberOfLines={1}>
            Tap to open the guide.
          </Text>
        ) : null}
      </View>
      <ArrowRight2 size={18} color={colors.textSecondary} style={styles.chevron} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  body: { flex: 1, gap: 3 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flag: { fontSize: 18 },
  name: { flexShrink: 1, fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.bold },
  spacer: { flex: 1 },
  tag: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.medium },
  hook: { fontSize: typography.fontSize.xs, lineHeight: 17 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.semibold },
  chevron: { marginLeft: 2 },
});
