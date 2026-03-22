/**
 * SMART PLAN BOTTOM SHEET
 *
 * Marketing bottom sheet explaining the AI-powered Smart Plan feature.
 * Shows 4 core features + "Learn More" that opens a detailed modal with ALL features.
 * Opened when user taps "Generate Smart Plan" on a trip card.
 */

import React, { useState } from 'react';
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
  SecuritySafe,
  InfoCircle,
  Crown1,
  CloseCircle,
  LanguageSquare,
  DocumentText,
  Book,
  DollarCircle,
  ShieldTick,
  ArrowRight2,
  Notepad2,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { spacing, typography } from '@/styles';
import { useTheme } from '@/context/ThemeContext';

interface SmartPlanBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onGenerate: () => void;
  destinationName?: string;
}

interface FeatureItem {
  icon: React.ComponentType<any>;
  iconColor?: string;
  title: string;
  description: string;
}

const CORE_FEATURES: FeatureItem[] = [
  {
    icon: CalendarEdit,
    title: 'Day-by-Day Itinerary',
    description: 'Personalized daily plan with activities, restaurants, and hidden gems.',
  },
  {
    icon: InfoCircle,
    title: "Do's & Don'ts",
    description: 'Cultural norms, local customs, and etiquette tips for your destination.',
  },
  {
    icon: Bag2,
    title: 'Smart Packing List',
    description: 'Weather-aware packing suggestions so you never forget essentials.',
  },
  {
    icon: SecuritySafe,
    title: 'Safety Intelligence',
    description: 'Emergency contacts, neighborhood safety, and travel advisories.',
  },
];

const ALL_FEATURES: FeatureItem[] = [
  {
    icon: CalendarEdit,
    title: 'Day-by-Day Itinerary',
    description: 'A fully personalized daily plan with activities, restaurants, hidden gems, and insider tips — all tailored to your travel style, budget, dietary needs, and group composition. Each day is optimized for energy flow and logistics.',
  },
  {
    icon: InfoCircle,
    title: "Do's & Don'ts",
    description: 'Deep cultural intelligence for your destination. Know what to wear, how to tip, what gestures to avoid, local taboos, religious customs, and etiquette rules so you travel respectfully and confidently.',
  },
  {
    icon: Bag2,
    title: 'Smart Packing List',
    description: 'AI analyzes your destination weather, planned activities, trip duration, and personal profile to generate the perfect packing list. Includes profession-specific gear, toiletries for your skin/hair type, and activity-specific equipment.',
  },
  {
    icon: SecuritySafe,
    title: 'Safety Intelligence',
    description: 'Comprehensive safety profile with neighborhood safety map, emergency numbers, embassy info, health advisories, digital safety tips, scam awareness, and gender-specific safety guidance — all scored and prioritized.',
  },
  {
    icon: LanguageSquare,
    title: 'Language Survival Kit',
    description: '120+ essential phrases in the local language with phonetic pronunciation, native script, and cultural context. Organized by category: emergency, food, transport, shopping, and more. Never feel lost in translation.',
  },
  {
    icon: DocumentText,
    title: 'Document Checklist',
    description: 'AI-powered document intelligence: passport validity checks, visa requirements, insurance gap analysis, digital backup protocol, and border entry notes. Know exactly what paperwork you need before departure.',
  },
  {
    icon: Book,
    title: 'Travel Journal',
    description: 'Capture photos, voice notes, and memories day by day throughout your trip. Your entire travel story, beautifully preserved and organized by day.',
  },
  {
    icon: DollarCircle,
    title: 'Expense Tracker',
    description: 'Set a trip budget, scan receipts with AI, log spending by category, and get a post-trip financial summary with insights on where your money went.',
  },
  {
    icon: ShieldTick,
    title: 'Compensation Tracker',
    description: 'Flight delayed? Baggage lost? AI analyzes your EU261/US DOT rights, drafts claim letters, and guides you through the filing process to get the compensation you deserve.',
  },
  {
    icon: Notepad2,
    title: 'And More Coming...',
    description: 'We\'re constantly adding new AI-powered modules — health insurance recommendations, real-time flight tracking, local event discovery, and trip sharing. Your travel companion keeps getting smarter.',
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
  const [page, setPage] = useState<'main' | 'details'>('main');

  const handleGenerate = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPage('main');
    onGenerate();
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPage('main');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={handleClose}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>

        {page === 'main' ? (
          /* ═══ PAGE 1: MAIN (no scroll) ═══ */
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

            {/* Close Button */}
            <TouchableOpacity style={styles.closeBtn} onPress={handleClose} activeOpacity={0.7}>
              <CloseCircle size={28} color={tc.textTertiary} variant="Bold" />
            </TouchableOpacity>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.mainContent}
              bounces={false}
            >
              {/* Icon */}
              <View style={[styles.iconCircle, { backgroundColor: tc.primary + '15' }]}>
                <MagicStar size={32} color={tc.primary} variant="Bold" />
              </View>

              {/* Title */}
              <Text style={[styles.title, { color: tc.textPrimary }]}>
                Your Entire Trip{'\n'}Intelligently Planned
              </Text>

              {/* Description */}
              <Text style={[styles.description, { color: tc.textSecondary }]}>
                One tap and our AI builds a complete trip management system
                {destinationName ? ` for your ${destinationName} adventure` : ' for your trip'}.
              </Text>

              {/* Premium Badge */}
              <View style={[styles.premiumBadge, { backgroundColor: tc.warning + '12', borderColor: tc.warning + '25' }]}>
                <Crown1 size={14} color={tc.warning} variant="Bold" />
                <Text style={[styles.premiumText, { color: tc.warning }]}>Premium Feature</Text>
              </View>

              {/* Section Label */}
              <Text style={[styles.sectionLabel, { color: tc.textTertiary }]}>WHAT YOU'LL GET</Text>

              {/* 4 Core Features */}
              <View style={styles.featureList}>
                {CORE_FEATURES.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <View key={index} style={styles.featureRow}>
                      <View style={[styles.featureIcon, { backgroundColor: tc.primary + '10' }]}>
                        <Icon size={20} color={tc.primary} variant="Bold" />
                      </View>
                      <View style={styles.featureContent}>
                        <Text style={[styles.featureTitle, { color: tc.textPrimary }]}>{item.title}</Text>
                        <Text style={[styles.featureDesc, { color: tc.textSecondary }]}>{item.description}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>

              {/* Learn More */}
              <TouchableOpacity
                style={[styles.learnMoreBtn, { borderColor: tc.borderSubtle }]}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setPage('details'); }}
                activeOpacity={0.7}
              >
                <Text style={[styles.learnMoreText, { color: tc.primary }]}>+6 more features — Learn More</Text>
                <ArrowRight2 size={16} color={tc.primary} />
              </TouchableOpacity>

              {/* Primary CTA */}
              <TouchableOpacity
                style={[styles.ctaButton, { backgroundColor: tc.primary }]}
                onPress={handleGenerate}
                activeOpacity={0.8}
              >
                <MagicStar size={20} color="#FFFFFF" variant="Bold" />
                <Text style={styles.ctaText}>Let's Do It</Text>
              </TouchableOpacity>

              {/* Maybe Later */}
              <TouchableOpacity style={styles.maybeLaterBtn} onPress={handleClose} activeOpacity={0.6}>
                <Text style={[styles.maybeLaterText, { color: tc.textTertiary }]}>Maybe Later</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        ) : (
          /* ═══ PAGE 2: DETAILS (scrollable) ═══ */
          <View
            style={[
              styles.detailSheet,
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

            {/* Close */}
            <TouchableOpacity style={styles.closeBtn} onPress={handleClose} activeOpacity={0.7}>
              <CloseCircle size={28} color={tc.textTertiary} variant="Bold" />
            </TouchableOpacity>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.detailScrollContent}
              bounces={false}
            >
              {/* Header */}
              <View style={styles.detailHeader}>
                <View style={[styles.detailIconCircle, { backgroundColor: tc.primary + '15' }]}>
                  <MagicStar size={28} color={tc.primary} variant="Bold" />
                </View>
                <Text style={[styles.detailTitle, { color: tc.textPrimary }]}>
                  Everything Your{'\n'}Smart Plan Includes
                </Text>
                <Text style={[styles.detailSubtitle, { color: tc.textSecondary }]}>
                  Each module is AI-generated using your profile, destination, travel dates, and preferences to create a truly personalized experience.
                </Text>
              </View>

              {/* All Features */}
              <View style={styles.detailFeatureList}>
                {ALL_FEATURES.map((item, index) => {
                  const Icon = item.icon;
                  const isLast = index === ALL_FEATURES.length - 1;
                  return (
                    <View
                      key={index}
                      style={[
                        styles.detailFeatureCard,
                        {
                          backgroundColor: tc.bgCard,
                          borderColor: isLast ? `${tc.primary}25` : tc.borderSubtle,
                          borderStyle: isLast ? 'dashed' : 'solid',
                        },
                      ]}
                    >
                      <View style={[styles.detailFeatureIconWrap, { backgroundColor: isLast ? `${tc.primary}12` : `${tc.primary}08` }]}>
                        <Icon size={24} color={tc.primary} variant="Bold" />
                      </View>
                      <Text style={[styles.detailFeatureTitle, { color: tc.textPrimary }]}>{item.title}</Text>
                      <Text style={[styles.detailFeatureDesc, { color: tc.textSecondary }]}>{item.description}</Text>
                    </View>
                  );
                })}
              </View>

              {/* CTA */}
              <TouchableOpacity
                style={[styles.ctaButton, { backgroundColor: tc.primary }]}
                onPress={handleGenerate}
                activeOpacity={0.8}
              >
                <MagicStar size={20} color="#FFFFFF" variant="Bold" />
                <Text style={styles.ctaText}>Generate My Smart Plan</Text>
              </TouchableOpacity>

              {/* Back */}
              <TouchableOpacity
                style={styles.maybeLaterBtn}
                onPress={() => setPage('main')}
                activeOpacity={0.6}
              >
                <Text style={[styles.maybeLaterText, { color: tc.textTertiary }]}>Back</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}
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
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  detailSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '95%',
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
  mainContent: {
    paddingHorizontal: 28,
    paddingTop: spacing.md,
    alignItems: 'center',
  },

  // Icon
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },

  // Title & Description
  title: {
    fontSize: typography.fontSize.heading1,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 28,
  },
  description: {
    fontSize: typography.fontSize.body,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 16,
  },

  // Premium Badge
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
  },
  premiumText: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.bold,
  },

  // Section Label
  sectionLabel: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 1.2,
    marginBottom: 12,
  },

  // Feature List (4 core)
  featureList: {
    alignSelf: 'stretch',
    gap: 12,
    marginBottom: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  featureIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: typography.fontSize.heading3,
    fontWeight: typography.fontWeight.bold,
    marginBottom: 3,
  },
  featureDesc: {
    fontSize: typography.fontSize.body,
    lineHeight: 19,
  },

  // Learn More Button
  learnMoreBtn: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 14,
  },
  learnMoreText: {
    fontSize: typography.fontSize.bodyLg,
    fontWeight: typography.fontWeight.semibold,
  },

  // CTA Button
  ctaButton: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    marginBottom: 8,
  },
  ctaText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: '#FFFFFF',
  },

  // Maybe Later
  maybeLaterBtn: {
    paddingVertical: 8,
  },
  maybeLaterText: {
    fontSize: typography.fontSize.heading3,
    fontWeight: typography.fontWeight.medium,
    textAlign: 'center',
  },

  // ═══ DETAIL MODAL STYLES ═══
  detailScrollContent: {
    paddingHorizontal: 24,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  detailHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  detailIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  detailTitle: {
    fontSize: typography.fontSize.heading1,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 28,
  },
  detailSubtitle: {
    fontSize: typography.fontSize.body,
    lineHeight: 20,
    textAlign: 'center',
  },
  detailFeatureList: {
    gap: 14,
    marginBottom: 28,
  },
  detailFeatureCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  detailFeatureIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  detailFeatureTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    marginBottom: 6,
  },
  detailFeatureDesc: {
    fontSize: typography.fontSize.body,
    lineHeight: 20,
  },
});
