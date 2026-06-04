import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Like1, Dislike, Flag, TickCircle } from 'iconsax-react-native';
import { typography, spacing, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { submitGuideFeedback } from '../../services/journeyContent.service';
import { emitJourneyEvent } from '../../events/journeyEvents';

const FLAGS: Array<{ key: string; label: string }> = [
  { key: 'inaccurate', label: 'Inaccurate' },
  { key: 'outdated', label: 'Outdated' },
  { key: 'unsafe', label: 'Unsafe' },
  { key: 'other', label: 'Other' },
];

export function GuideFeedback({ guideId, accent }: { guideId: string; accent: string }) {
  const { colors } = useTheme();
  const { profile } = useAuth();
  const userId = (profile as any)?.id as string | undefined;
  const [done, setDone] = useState(false);
  const [flagging, setFlagging] = useState(false);

  const submit = async (input: { isHelpful?: boolean; flagReason?: string }) => {
    Haptics.selectionAsync();
    try {
      await submitGuideFeedback(guideId, { userId, ...input });
      emitJourneyEvent('guide_feedback_submitted', { payload: input });
      setDone(true);
    } catch {
      setDone(true); // fail quietly; never block the reader
    }
  };

  if (done) {
    return (
      <View style={[styles.wrap, styles.doneRow]}>
        <TickCircle size={18} color={accent} variant="Bold" />
        <Text style={[styles.doneText, { color: colors.textSecondary }]}>Thanks — your feedback helps us improve guides.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.wrap, { borderColor: colors.borderSubtle, backgroundColor: colors.bgCard }]}>
      {!flagging ? (
        <View style={styles.row}>
          <Text style={[styles.q, { color: colors.textPrimary }]}>Was this helpful?</Text>
          <View style={styles.actions}>
            <TouchableOpacity onPress={() => submit({ isHelpful: true })} style={[styles.iconBtn, { borderColor: colors.borderSubtle }]} accessibilityLabel="Helpful">
              <Like1 size={18} color={accent} variant="Bold" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => submit({ isHelpful: false })} style={[styles.iconBtn, { borderColor: colors.borderSubtle }]} accessibilityLabel="Not helpful">
              <Dislike size={18} color={colors.textSecondary} variant="Bold" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setFlagging(true)} style={[styles.iconBtn, { borderColor: colors.borderSubtle }]} accessibilityLabel="Report an issue">
              <Flag size={18} color={colors.textSecondary} variant="Bold" />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={{ gap: spacing.sm }}>
          <Text style={[styles.q, { color: colors.textPrimary }]}>What's wrong with this guide?</Text>
          <View style={styles.flagWrap}>
            {FLAGS.map((f) => (
              <TouchableOpacity
                key={f.key}
                onPress={() => submit({ flagReason: f.key })}
                style={[styles.flagChip, { borderColor: colors.borderSubtle }]}
              >
                <Text style={[styles.flagText, { color: colors.textPrimary }]}>{f.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginHorizontal: spacing.lg, marginBottom: spacing.lg, borderWidth: 1, borderRadius: borderRadius.xl, padding: spacing.md },
  doneRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderWidth: 0 },
  doneText: { fontSize: typography.fontSize.sm },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  q: { fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold },
  actions: { flexDirection: 'row', gap: spacing.sm },
  iconBtn: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  flagWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  flagChip: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 2, borderRadius: borderRadius.full, borderWidth: 1 },
  flagText: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium },
});
