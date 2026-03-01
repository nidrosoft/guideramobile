/**
 * PARTNER PROGRAM SHEET
 *
 * Informational bottom sheet explaining the Guidera Partner Program.
 * Centered icon → centered title/description → icon bullet points → CTA + Maybe Later.
 * Opened when user taps the PartnerInviteCard on the Guides tab.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Briefcase,
  MoneyRecive,
  ShieldTick,
  Star1,
  People,
  DollarCircle,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { spacing } from '@/styles';
import { useTheme } from '@/context/ThemeContext';

interface PartnerProgramSheetProps {
  visible: boolean;
  onClose: () => void;
  onApply: () => void;
}

interface BulletItem {
  icon: React.ComponentType<any>;
  title: string;
}

const BULLET_POINTS: BulletItem[] = [
  { icon: DollarCircle, title: 'Completely free — no fees ever' },
  { icon: MoneyRecive, title: 'Keep 100% of your earnings' },
  { icon: ShieldTick, title: 'Get verified with trusted ID check' },
  { icon: Star1, title: 'Build your reputation & reviews' },
  { icon: People, title: 'Reach travelers who need your help' },
];

export default function PartnerProgramSheet({
  visible,
  onClose,
  onApply,
}: PartnerProgramSheetProps) {
  const { colors: tc } = useTheme();
  const insets = useSafeAreaInsets();

  const handleApply = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onApply();
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[
            styles.sheet,
            {
              backgroundColor: tc.background,
              paddingBottom: insets.bottom || spacing.lg,
            },
          ]}
          onPress={() => {}}
        >
          {/* Handle */}
          <View style={styles.handleRow}>
            <View style={[styles.handle, { backgroundColor: tc.borderSubtle }]} />
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            bounces={false}
          >
            {/* Centered Icon */}
            <View style={styles.iconWrapper}>
              <View style={[styles.iconCircle, { backgroundColor: tc.primary + '15' }]}>
                <Briefcase size={36} color={tc.primary} variant="Bold" />
              </View>
            </View>

            {/* Centered Title */}
            <Text style={[styles.title, { color: tc.textPrimary }]}>
              Become a Guidera Partner
            </Text>

            {/* Centered Description */}
            <Text style={[styles.description, { color: tc.textSecondary }]}>
              List your property, offer rides, guide tours, or provide any local service directly to travelers. It's completely free — you keep 100% of your earnings with no platform fees.
            </Text>

            {/* Bullet Points with Icons */}
            <View style={styles.bulletList}>
              {BULLET_POINTS.map((item, index) => {
                const Icon = item.icon;
                return (
                  <View key={index} style={styles.bulletRow}>
                    <View style={[styles.bulletIcon, { backgroundColor: tc.primary + '12' }]}>
                      <Icon size={20} color={tc.primary} variant="Bold" />
                    </View>
                    <Text style={[styles.bulletText, { color: tc.textPrimary }]}>
                      {item.title}
                    </Text>
                  </View>
                );
              })}
            </View>

            {/* Primary CTA */}
            <TouchableOpacity
              style={[styles.ctaButton, { backgroundColor: tc.primary }]}
              onPress={handleApply}
              activeOpacity={0.8}
            >
              <Text style={styles.ctaText}>Let's Do It!</Text>
            </TouchableOpacity>

            {/* Maybe Later */}
            <TouchableOpacity
              style={styles.maybeLaterBtn}
              onPress={handleClose}
              activeOpacity={0.6}
            >
              <Text style={[styles.maybeLaterText, { color: tc.textTertiary }]}>
                Maybe Later
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  handleRow: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 4,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  scrollContent: {
    paddingHorizontal: 28,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    alignItems: 'center',
  },

  // Centered Icon
  iconWrapper: {
    marginBottom: 20,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Title & Description
  title: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginBottom: 28,
  },

  // Bullet Points
  bulletList: {
    alignSelf: 'stretch',
    gap: 16,
    marginBottom: 32,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  bulletIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bulletText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },

  // CTA Button
  ctaButton: {
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    marginBottom: 12,
  },
  ctaText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Maybe Later
  maybeLaterBtn: {
    paddingVertical: 12,
  },
  maybeLaterText: {
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
  },
});
