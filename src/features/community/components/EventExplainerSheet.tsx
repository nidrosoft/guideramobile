/**
 * EVENT EXPLAINER SHEET
 *
 * Informational bottom sheet explaining what events are and what you can create.
 * Follows the same pattern as PartnerProgramSheet.
 * Shown when user taps the FAB on the Events tab.
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
  Calendar,
  Video,
  Location,
  Camera,
  Coffee,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { spacing } from '@/styles';
import { useTheme } from '@/context/ThemeContext';

interface EventExplainerSheetProps {
  visible: boolean;
  onClose: () => void;
  onCreate: () => void;
}

interface BulletItem {
  icon: React.ComponentType<any>;
  title: string;
}

const BULLET_POINTS: BulletItem[] = [
  { icon: Coffee, title: 'Meetups — coffee, food crawls, walking tours' },
  { icon: Camera, title: 'Activities — photography walks, hiking, nightlife' },
  { icon: Video, title: 'Virtual — online workshops, Q&A sessions' },
  { icon: Location, title: 'In-person — at a venue, landmark, or coworking space' },
  { icon: Calendar, title: 'Set date, time, capacity & RSVP options' },
];

export default function EventExplainerSheet({
  visible,
  onClose,
  onCreate,
}: EventExplainerSheetProps) {
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
              <View style={[styles.iconCircle, { backgroundColor: '#F59E0B' + '15' }]}>
                <Calendar size={36} color="#F59E0B" variant="Bold" />
              </View>
            </View>

            {/* Centered Title */}
            <Text style={[styles.title, { color: tc.textPrimary }]}>
              Host a Travel Event
            </Text>

            {/* Centered Description */}
            <Text style={[styles.description, { color: tc.textSecondary }]}>
              Bring travelers together! Create an in-person meetup, an outdoor activity, or a virtual hangout. Set the vibe, invite the community, and make it happen.
            </Text>

            {/* Bullet Points with Icons */}
            <View style={styles.bulletList}>
              {BULLET_POINTS.map((item, index) => {
                const Icon = item.icon;
                return (
                  <View key={index} style={styles.bulletRow}>
                    <View style={[styles.bulletIcon, { backgroundColor: '#F59E0B' + '12' }]}>
                      <Icon size={20} color="#F59E0B" variant="Bold" />
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
