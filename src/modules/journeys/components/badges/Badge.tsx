import { View, Text, StyleSheet } from 'react-native';
import { Star1 } from 'iconsax-react-native';
import { typography, spacing, borderRadius } from '@/styles';

export type BadgeVariant = 'CURATED' | 'AI' | 'NEW' | 'PRO' | 'POPULAR';

const TOKENS: Record<BadgeVariant, { bg: string; fg: string; label: string }> = {
  CURATED: { bg: 'rgba(46,155,126,0.14)', fg: '#2E9B7E', label: 'Curated' },
  AI: { bg: 'rgba(110,91,201,0.14)', fg: '#6E5BC9', label: 'AI' },
  NEW: { bg: 'rgba(46,155,126,0.14)', fg: '#2E9B7E', label: 'New' },
  PRO: { bg: 'rgba(185,138,52,0.16)', fg: '#B98A34', label: 'Pro' },
  POPULAR: { bg: 'rgba(46,155,126,0.14)', fg: '#2E9B7E', label: 'Popular' },
};

export function Badge({ variant }: { variant: BadgeVariant }) {
  const t = TOKENS[variant];
  return (
    <View style={[styles.badge, { backgroundColor: t.bg }]}>
      {variant === 'AI' ? <Star1 size={11} color={t.fg} variant="Bold" /> : null}
      <Text style={[styles.text, { color: t.fg }]}>{t.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 0.3,
  },
});
