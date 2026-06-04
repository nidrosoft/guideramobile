import { ReactNode, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Lock1 } from 'iconsax-react-native';
import { typography, spacing, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { useIsPro } from '../hooks/useJourneyGuide';
import { Badge } from './badges/Badge';
import { ProUpsellSheet } from './ProUpsellSheet';

/**
 * Wraps Pro-only content. Free users see a teaser; tapping "Unlock with Pro"
 * opens the Pro upsell bottom sheet (spec §12.2).
 */
export function ProGate({
  feature,
  title,
  children,
  preview,
  onUnlock,
}: {
  feature: 'providers' | 'toolkitFull' | 'peerMatching';
  title?: string;
  children: ReactNode;
  preview?: ReactNode;
  onUnlock?: () => void;
}) {
  const { colors } = useTheme();
  const { data: pro } = useIsPro();
  const [showSheet, setShowSheet] = useState(false);
  if (pro) return <>{children}</>;

  return (
    <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.borderSubtle }]}>
      <View style={styles.header}>
        <Lock1 size={18} color="#B98A34" variant="Bold" />
        <Text style={[styles.title, { color: colors.textPrimary }]}>{title ?? 'Guidera Pro'}</Text>
        <Badge variant="PRO" />
      </View>
      {preview ? <View style={styles.preview}>{preview}</View> : null}
      <TouchableOpacity
        style={[styles.cta, { backgroundColor: '#B98A34' }]}
        activeOpacity={0.85}
        onPress={() => (onUnlock ? onUnlock() : setShowSheet(true))}
        accessibilityRole="button"
        accessibilityLabel={`Unlock ${feature} with Guidera Pro`}
      >
        <Text style={styles.ctaText}>Unlock with Pro</Text>
      </TouchableOpacity>
      <ProUpsellSheet visible={showSheet} onClose={() => setShowSheet(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    gap: spacing.sm,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { flex: 1, fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.bold },
  preview: { opacity: 0.5 },
  cta: {
    borderRadius: borderRadius.full,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  ctaText: { color: '#FFFFFF', fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.bold },
});
