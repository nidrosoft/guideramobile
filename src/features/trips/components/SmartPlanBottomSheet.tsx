/**
 * SMART PLAN BOTTOM SHEET
 *
 * Marketing bottom sheet explaining the AI-powered Smart Plan feature.
 * Centered icon → centered title/description → icon bullet points → CTA + Maybe Later.
 * Opened when user taps "Generate Smart Plan" on a trip card.
 *
 * Pattern reference: PartnerProgramSheet.tsx
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  MagicStar,
  CalendarEdit,
  Bag2,
  Book,
  DollarCircle,
  ShieldTick,
  InfoCircle,
  Crown1,
  CloseCircle,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { spacing } from '@/styles';
import { useTheme } from '@/context/ThemeContext';

interface SmartPlanBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onGenerate: () => void;
  destinationName?: string;
}

interface FeatureItem {
  icon: React.ComponentType<any>;
  title: string;
  description: string;
}

const FEATURES: FeatureItem[] = [
  {
    icon: CalendarEdit,
    title: 'Day-by-Day Itinerary',
    description: 'A personalized daily plan with activities, restaurants, and hidden gems tailored to your travel style.',
  },
  {
    icon: Bag2,
    title: 'Smart Packing List',
    description: 'Weather-aware packing suggestions so you never forget essentials or overpack again.',
  },
  {
    icon: Book,
    title: 'Travel Journal',
    description: 'Capture photos, voice notes, and memories day by day — your trip story, beautifully preserved.',
  },
  {
    icon: DollarCircle,
    title: 'Expense Tracker',
    description: 'Set a budget, log spending by category, and stay on track without the spreadsheet headache.',
  },
  {
    icon: ShieldTick,
    title: 'Compensation Tracker',
    description: 'Flight delayed? Baggage lost? Track and manage compensation claims effortlessly.',
  },
  {
    icon: InfoCircle,
    title: "Do's & Don'ts",
    description: 'Cultural norms, local customs, and etiquette tips so you travel respectfully and confidently.',
  },
];

export default function SmartPlanBottomSheet({
  visible,
  onClose,
  onGenerate,
  destinationName,
}: SmartPlanBottomSheetProps) {
  const { colors: tc } = useTheme();
  const insets = useSafeAreaInsets();

  const handleGenerate = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onGenerate();
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
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: tc.bgPrimary,
              paddingBottom: insets.bottom || spacing.lg,
            },
          ]}
        >
          {/* Handle */}
          <View style={styles.handleRow}>
            <View style={[styles.handle, { backgroundColor: tc.borderSubtle }]} />
          </View>

          {/* Close Button (top right) */}
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={handleClose}
            activeOpacity={0.7}
          >
            <CloseCircle size={28} color={tc.textTertiary} variant="Bold" />
          </TouchableOpacity>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
          >
            {/* Centered Icon */}
            <View style={styles.iconWrapper}>
              <View style={[styles.iconCircle, { backgroundColor: tc.primary + '15' }]}>
                <MagicStar size={36} color={tc.primary} variant="Bold" />
              </View>
            </View>

            {/* Centered Title */}
            <Text style={[styles.title, { color: tc.textPrimary }]}>
              Your Entire Trip {'\n'}Intelligently Planned
            </Text>

            {/* Centered Description */}
            <Text style={[styles.description, { color: tc.textSecondary }]}>
              One tap and our AI builds a complete trip management system
              {destinationName ? ` for your ${destinationName} adventure` : ' for your trip'}.
              From a day-by-day itinerary to safety alerts — everything you need,
              personalized to how you travel.
            </Text>

            {/* Premium Badge */}
            {/* AI TODO: Connect premium/subscription check here. For now, show the badge as informational only. */}
            <View style={[styles.premiumBadge, { backgroundColor: tc.warning + '12', borderColor: tc.warning + '25' }]}>
              <Crown1 size={16} color={tc.warning} variant="Bold" />
              <Text style={[styles.premiumText, { color: tc.warning }]}>Premium Feature</Text>
            </View>

            {/* Section Label */}
            <Text style={[styles.sectionLabel, { color: tc.textTertiary }]}>
              WHAT YOU'LL GET
            </Text>

            {/* Feature List */}
            <View style={styles.featureList}>
              {FEATURES.map((item, index) => {
                const Icon = item.icon;
                return (
                  <View key={index} style={styles.featureRow}>
                    <View style={[styles.featureIcon, { backgroundColor: tc.primary + '10' }]}>
                      <Icon size={22} color={tc.primary} variant="Bold" />
                    </View>
                    <View style={styles.featureContent}>
                      <Text style={[styles.featureTitle, { color: tc.textPrimary }]}>
                        {item.title}
                      </Text>
                      <Text style={[styles.featureDesc, { color: tc.textSecondary }]}>
                        {item.description}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Primary CTA */}
            {/* AI TODO: Wire this to the actual AI generation flow + premium subscription gate */}
            <TouchableOpacity
              style={[styles.ctaButton, { backgroundColor: tc.primary }]}
              onPress={handleGenerate}
              activeOpacity={0.8}
            >
              <MagicStar size={20} color="#FFFFFF" variant="Bold" />
              <Text style={styles.ctaText}>Let's Do It</Text>
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
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '92%',
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
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 16,
    zIndex: 10,
    padding: 4,
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
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Title & Description
  title: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 30,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 20,
  },

  // Premium Badge
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 24,
  },
  premiumText: {
    fontSize: 13,
    fontWeight: '700',
  },

  // Section Label
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 16,
  },

  // Feature List
  featureList: {
    alignSelf: 'stretch',
    gap: 18,
    marginBottom: 32,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  featureIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 3,
  },
  featureDesc: {
    fontSize: 13,
    lineHeight: 19,
  },

  // CTA Button
  ctaButton: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
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
