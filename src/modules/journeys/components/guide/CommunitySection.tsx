import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { People, ArrowRight2, Lock1, TickCircle } from 'iconsax-react-native';
import { typography, spacing, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { useGroupLink } from '../../hooks/useToolkit';
import { useIsPro } from '../../hooks/useJourneyGuide';
import { requestPeerMatch } from '../../services/journeyCommunity.service';
import { emitJourneyEvent } from '../../events/journeyEvents';
import type { JourneyGuide } from '../../types';

export function CommunitySection({ guide, accent }: { guide: JourneyGuide; accent: string }) {
  const { colors } = useTheme();
  const router = useRouter();
  const { data: pro } = useIsPro();
  const [matchState, setMatchState] = useState<'idle' | 'sending' | 'open' | 'matched'>('idle');
  const { data: link } = useGroupLink({
    categorySlug: guide.categorySlug,
    countryCode: guide.countryCode,
    subhubSlug: guide.subhubSlug,
  });

  const handleMatch = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!pro) {
      router.push('/account/membership' as any);
      return;
    }
    try {
      setMatchState('sending');
      emitJourneyEvent('peer_match_requested', { categorySlug: guide.categorySlug, countryCode: guide.countryCode });
      const r = await requestPeerMatch(guide.categorySlug, guide.countryCode);
      setMatchState(r.status === 'matched' ? 'matched' : 'open');
    } catch {
      setMatchState('idle');
    }
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    emitJourneyEvent('community_join_tap', { categorySlug: guide.categorySlug, countryCode: guide.countryCode });
    if (link?.groupId) router.push(`/community/${link.groupId}` as any);
    else router.push('/community' as any);
  };

  return (
    <View style={styles.section}>
      <View style={styles.titleRow}>
        <View style={[styles.dot, { backgroundColor: accent }]} />
        <Text style={[styles.title, { color: colors.textPrimary }]}>Community</Text>
      </View>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={handlePress}
        style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.borderSubtle }]}
        accessibilityRole="button"
      >
        <View style={[styles.icon, { backgroundColor: `${accent}1F` }]}>
          <People size={20} color={accent} variant="Bold" />
        </View>
        <View style={{ flex: 1 }}>
          {link ? (
            <>
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Join the community</Text>
              <Text style={[styles.cardSub, { color: colors.textSecondary }]}>
                {link.memberCount > 0 ? `${link.memberCount} members` : 'Be part of the conversation'}
              </Text>
            </>
          ) : (
            <>
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Be the first</Text>
              <Text style={[styles.cardSub, { color: colors.textSecondary }]}>
                Start the community for this journey in Connect.
              </Text>
            </>
          )}
        </View>
        <ArrowRight2 size={18} color={colors.textSecondary} />
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.85}
        onPress={handleMatch}
        disabled={matchState === 'sending' || matchState === 'open' || matchState === 'matched'}
        style={[styles.matchBtn, { borderColor: `${accent}55`, backgroundColor: `${accent}0F` }]}
        accessibilityRole="button"
        accessibilityLabel="Match me with a peer"
      >
        {matchState === 'matched' || matchState === 'open' ? (
          <TickCircle size={18} color={accent} variant="Bold" />
        ) : !pro ? (
          <Lock1 size={16} color="#B98A34" variant="Bold" />
        ) : (
          <People size={18} color={accent} variant="Bold" />
        )}
        <Text style={[styles.matchText, { color: matchState !== 'idle' ? accent : colors.textPrimary }]}>
          {matchState === 'matched'
            ? "You're matched — we'll connect you"
            : matchState === 'open'
            ? "You're in the queue — we'll match you soon"
            : matchState === 'sending'
            ? 'Finding a match…'
            : pro
            ? 'Match me with someone who did this'
            : 'Match me with a peer (Pro)'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { paddingHorizontal: spacing.lg, marginBottom: spacing.xl, gap: spacing.md },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dot: { width: 8, height: 8, borderRadius: 4 },
  title: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold },
  card: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderWidth: 1, borderRadius: borderRadius.lg, padding: spacing.md },
  icon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.bold },
  cardSub: { fontSize: typography.fontSize.xs, marginTop: 2 },
  matchBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, borderWidth: 1, borderRadius: borderRadius.full, paddingVertical: spacing.sm },
  matchText: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold },
});
