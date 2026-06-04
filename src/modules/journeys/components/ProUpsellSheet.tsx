import { View, Text, StyleSheet, Modal, TouchableOpacity, TouchableWithoutFeedback, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
  Crown1, CloseCircle, Verify, Calculator, TickSquare, Personalcard, People, Message2,
} from 'iconsax-react-native';
import { typography, spacing, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';

const GOLD = '#B98A34';

const FEATURES: Array<{ icon: any; title: string; description: string }> = [
  { icon: Verify, title: 'Verified provider directory', description: 'Independently vetted clinics, firms & agencies — ranked by quality, never by who paid. Tap to request info.' },
  { icon: Calculator, title: 'Cost calculator', description: 'Build an all-in estimate vs your home country and save it to your journey.' },
  { icon: TickSquare, title: 'Pre-departure checklist', description: "Country-specific checklists that tick off and sync — so you never miss a step." },
  { icon: Personalcard, title: 'Visa tracker', description: 'Track requirements, status and deadlines per country, with change alerts.' },
  { icon: People, title: 'Peer matching', description: "Get matched with someone who's done this exact journey and can show you the ropes." },
  { icon: Message2, title: 'AI concierge', description: 'Ask anything — grounded in your guide — and get honest, specific answers in seconds.' },
];

export function ProUpsellSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { colors: tc } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const handleUnlock = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onClose();
    router.push('/account/membership' as any);
  };
  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={handleClose}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>

        <View style={[styles.sheet, { backgroundColor: tc.bgPrimary, paddingBottom: insets.bottom || spacing.lg }]}>
          <View style={styles.handleRow}>
            <View style={[styles.handle, { backgroundColor: tc.borderSubtle }]} />
          </View>
          <TouchableOpacity style={styles.closeBtn} onPress={handleClose} activeOpacity={0.7}>
            <CloseCircle size={28} color={tc.textTertiary} variant="Bold" />
          </TouchableOpacity>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content} bounces={false}>
            <View style={[styles.iconCircle, { backgroundColor: `${GOLD}1F` }]}>
              <Crown1 size={32} color={GOLD} variant="Bold" />
            </View>

            <Text style={[styles.title, { color: tc.textPrimary }]}>The Journey Toolkit</Text>
            <Text style={[styles.description, { color: tc.textSecondary }]}>
              Everything you need to actually pull off your journey — the trust, tools and people layer,
              all in one place.
            </Text>

            <View style={[styles.badge, { backgroundColor: `${GOLD}14`, borderColor: `${GOLD}33` }]}>
              <Crown1 size={14} color={GOLD} variant="Bold" />
              <Text style={[styles.badgeText, { color: GOLD }]}>Guidera Pro</Text>
            </View>

            <Text style={[styles.sectionLabel, { color: tc.textTertiary }]}>WHAT YOU'LL UNLOCK</Text>

            <View style={styles.featureList}>
              {FEATURES.map((f, i) => {
                const Icon = f.icon;
                return (
                  <View key={i} style={styles.featureRow}>
                    <View style={[styles.featureIcon, { backgroundColor: `${GOLD}12` }]}>
                      <Icon size={20} color={GOLD} variant="Bold" />
                    </View>
                    <View style={styles.featureContent}>
                      <Text style={[styles.featureTitle, { color: tc.textPrimary }]}>{f.title}</Text>
                      <Text style={[styles.featureDesc, { color: tc.textSecondary }]}>{f.description}</Text>
                    </View>
                  </View>
                );
              })}
            </View>

            <TouchableOpacity style={[styles.cta, { backgroundColor: GOLD }]} onPress={handleUnlock} activeOpacity={0.85}>
              <Crown1 size={20} color="#FFFFFF" variant="Bold" />
              <Text style={styles.ctaText}>Unlock with Pro</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.maybeLater} onPress={handleClose} activeOpacity={0.6}>
              <Text style={[styles.maybeLaterText, { color: tc.textTertiary }]}>Maybe later</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '88%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  handleRow: { alignItems: 'center', paddingTop: 10, paddingBottom: 4 },
  handle: { width: 40, height: 4, borderRadius: 2 },
  closeBtn: { position: 'absolute', top: 14, right: 16, zIndex: 10, padding: 4 },
  content: { paddingHorizontal: 28, paddingTop: spacing.md, alignItems: 'center' },
  iconCircle: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  title: { fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold, textAlign: 'center', marginBottom: 8 },
  description: { fontSize: typography.fontSize.base, lineHeight: 21, textAlign: 'center', marginBottom: 16 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: borderRadius.full, borderWidth: 1, marginBottom: 20 },
  badgeText: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.bold },
  sectionLabel: { alignSelf: 'flex-start', fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.bold, letterSpacing: 1.2, marginBottom: 14 },
  featureList: { alignSelf: 'stretch', gap: 16, marginBottom: 24 },
  featureRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  featureIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  featureContent: { flex: 1 },
  featureTitle: { fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.bold, marginBottom: 3 },
  featureDesc: { fontSize: typography.fontSize.sm, lineHeight: 19 },
  cta: { alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15, borderRadius: borderRadius.full, marginBottom: 8 },
  ctaText: { fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.bold, color: '#FFFFFF' },
  maybeLater: { paddingVertical: 8 },
  maybeLaterText: { fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.medium, textAlign: 'center' },
});
