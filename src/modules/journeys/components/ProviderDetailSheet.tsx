import { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Linking, ActivityIndicator } from 'react-native';
import { CloseCircle, TickCircle, Verify, InfoCircle } from 'iconsax-react-native';
import { typography, spacing, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { captureLead } from '../services/journeyProviders.service';
import { emitJourneyEvent } from '../events/journeyEvents';
import type { JourneyProvider } from '../types';

export function ProviderDetailSheet({
  provider,
  guideId,
  accent,
  onClose,
}: {
  provider: JourneyProvider | null;
  guideId?: string;
  accent: string;
  onClose: () => void;
}) {
  const { colors } = useTheme();
  const { profile } = useAuth();
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const handleRequestInfo = async () => {
    if (!provider) return;
    const userId = (profile as any)?.id;
    if (!userId) {
      setState('error');
      return;
    }
    try {
      setState('sending');
      await captureLead({ providerId: provider.id, userId, guideId });
      emitJourneyEvent('provider_lead_captured', { payload: { providerId: provider.id } });
      setState('sent');
      const url = provider.contact?.booking_url || provider.website;
      if (url) Linking.openURL(url).catch(() => {});
    } catch {
      setState('error');
    }
  };

  return (
    <Modal visible={!!provider} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { backgroundColor: colors.background }]}>
          <View style={styles.handleRow}>
            <View style={[styles.handle, { backgroundColor: colors.borderSubtle }]} />
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} accessibilityLabel="Close">
              <CloseCircle size={26} color={colors.textSecondary} variant="Bold" />
            </TouchableOpacity>
          </View>

          {provider ? (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.xl }}>
              <View style={styles.titleRow}>
                <Text style={[styles.name, { color: colors.textPrimary }]}>{provider.name}</Text>
                {provider.isVerified ? <Verify size={20} color={accent} variant="Bold" /> : null}
              </View>
              {provider.providerType ? (
                <Text style={[styles.type, { color: colors.textSecondary }]}>{provider.providerType.replace('_', ' ')}</Text>
              ) : null}

              {provider.accreditations?.length ? (
                <View style={styles.chips}>
                  {provider.accreditations.map((a) => (
                    <View key={a} style={[styles.chip, { backgroundColor: `${accent}14`, borderColor: `${accent}33` }]}>
                      <Text style={[styles.chipText, { color: accent }]}>{a}</Text>
                    </View>
                  ))}
                </View>
              ) : null}

              {provider.summary ? (
                <Text style={[styles.summary, { color: colors.textSecondary }]}>{provider.summary}</Text>
              ) : null}

              {provider.verificationNotes ? (
                <View style={[styles.noteRow, { borderColor: colors.borderSubtle }]}>
                  <InfoCircle size={15} color={colors.textSecondary} variant="Bold" />
                  <Text style={[styles.note, { color: colors.textSecondary }]}>{provider.verificationNotes}</Text>
                </View>
              ) : null}

              <Text style={[styles.disclaimer, { color: colors.textSecondary }]}>
                A listing is not an endorsement. Information only — verify credentials and treatment
                details with the provider and a licensed professional.
              </Text>

              <TouchableOpacity
                onPress={handleRequestInfo}
                disabled={state === 'sending' || state === 'sent'}
                style={[styles.cta, { backgroundColor: state === 'sent' ? colors.primary : accent, opacity: state === 'sending' ? 0.7 : 1 }]}
                accessibilityRole="button"
                accessibilityLabel="Request info from provider"
              >
                {state === 'sending' ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : state === 'sent' ? (
                  <>
                    <TickCircle size={18} color="#FFFFFF" variant="Bold" />
                    <Text style={styles.ctaText}>Request sent</Text>
                  </>
                ) : (
                  <Text style={styles.ctaText}>Request info</Text>
                )}
              </TouchableOpacity>
              {state === 'error' ? (
                <Text style={[styles.errText, { color: colors.error }]}>Couldn't send. Please sign in and try again.</Text>
              ) : null}
            </ScrollView>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, maxHeight: '85%' },
  handleRow: { alignItems: 'center', paddingVertical: spacing.sm, position: 'relative' },
  handle: { width: 40, height: 4, borderRadius: 2 },
  closeBtn: { position: 'absolute', right: 0, top: spacing.xs },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
  name: { flex: 1, fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold },
  type: { fontSize: typography.fontSize.sm, textTransform: 'capitalize', marginTop: 2 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
  chip: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: borderRadius.full, borderWidth: 1 },
  chipText: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.bold },
  summary: { fontSize: typography.fontSize.base, lineHeight: 22, marginTop: spacing.md },
  noteRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start', borderTopWidth: 1, borderBottomWidth: 1, paddingVertical: spacing.md, marginTop: spacing.md },
  note: { flex: 1, fontSize: typography.fontSize.xs, lineHeight: 18 },
  disclaimer: { fontSize: typography.fontSize.xs, lineHeight: 18, marginTop: spacing.md, fontStyle: 'italic' },
  cta: { flexDirection: 'row', gap: spacing.sm, borderRadius: borderRadius.full, paddingVertical: spacing.md, alignItems: 'center', justifyContent: 'center', marginTop: spacing.lg },
  ctaText: { color: '#FFFFFF', fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.bold },
  errText: { fontSize: typography.fontSize.xs, textAlign: 'center', marginTop: spacing.sm },
});
