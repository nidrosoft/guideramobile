/**
 * GROUP EXPLAINER SHEET
 *
 * Informational bottom sheet explaining what groups are and what you can do.
 * Follows the same pattern as PartnerProgramSheet.
 * Shown when user taps the FAB or Create Group CTA.
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
  People,
  MessageText1,
  Calendar,
  Location,
  ShieldTick,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { spacing } from '@/styles';
import { useTheme } from '@/context/ThemeContext';

interface GroupExplainerSheetProps {
  visible: boolean;
  onClose: () => void;
  onCreate: () => void;
}

interface BulletItem {
  icon: React.ComponentType<any>;
  title: string;
}

const BULLET_POINTS: BulletItem[] = [
  { icon: People, title: 'Connect with travelers heading to the same destination' },
  { icon: MessageText1, title: 'Share tips, photos, and travel stories' },
  { icon: Calendar, title: 'Plan meetups and events with group members' },
  { icon: Location, title: 'Get local advice from people who\'ve been there' },
  { icon: ShieldTick, title: 'Safe, moderated spaces for real travelers' },
];

export default function GroupExplainerSheet({
  visible,
  onClose,
  onCreate,
}: GroupExplainerSheetProps) {
  const { colors: tc } = useTheme();
  const insets = useSafeAreaInsets();

  const handleCreate = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onCreate();
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
                <People size={36} color={tc.primary} variant="Bold" />
              </View>
            </View>

            {/* Centered Title */}
            <Text style={[styles.title, { color: tc.textPrimary }]}>
              Create a Travel Group
            </Text>

            {/* Centered Description */}
            <Text style={[styles.description, { color: tc.textSecondary }]}>
              Start a community around a destination, travel style, or upcoming trip. Bring travelers together to share experiences and plan adventures.
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
              onPress={handleCreate}
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
  maybeLaterBtn: {
    paddingVertical: 12,
  },
  maybeLaterText: {
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
  },
});
