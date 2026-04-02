/**
 * WHAT SECTION
 * 
 * Topic selector for Trip Snapshot. Organized by category with pill-shaped
 * toggles. User can select up to 10 topics they want to know about.
 * Dynamic title shows the selected destination if available.
 */

import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  People, Car, ShieldTick, Wallet2, DocumentText, Reserve,
  Calendar, LanguageSquare, Warning2, Map, Clock, Sun1,
  Health, Mobile, Judge, Lovely,
} from 'iconsax-react-native';
import { spacing, typography, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';

// ─── Topic Module Definition ─────────────────────────────

export interface TopicModule {
  id: string;
  label: string;
  icon: (props: { size: number; color: string }) => React.ReactElement;
}

export interface TopicCategory {
  id: string;
  title: string;
  modules: TopicModule[];
}

export const TOPIC_CATEGORIES: TopicCategory[] = [
  {
    id: 'culture',
    title: 'Culture & Social',
    modules: [
      { id: 'customs', label: 'Customs & Etiquette', icon: ({ size, color }) => <People size={size} color={color} variant="Bold" /> },
      { id: 'social_norms', label: 'Nightlife & Social', icon: ({ size, color }) => <Lovely size={size} color={color} variant="Bold" /> },
      { id: 'dos_donts', label: "Do's & Don'ts", icon: ({ size, color }) => <DocumentText size={size} color={color} variant="Bold" /> },
      { id: 'sacred_sites', label: 'Religion & Sacred Sites', icon: ({ size, color }) => <Judge size={size} color={color} variant="Bold" /> },
    ],
  },
  {
    id: 'getting_around',
    title: 'Getting Around',
    modules: [
      { id: 'arrival', label: 'Airport Arrival', icon: ({ size, color }) => <Car size={size} color={color} variant="Bold" /> },
      { id: 'transit', label: 'Public Transit', icon: ({ size, color }) => <Car size={size} color={color} variant="Bold" /> },
      { id: 'neighborhoods', label: 'Neighborhoods', icon: ({ size, color }) => <Map size={size} color={color} variant="Bold" /> },
      { id: 'hours', label: 'Hours & Rhythm', icon: ({ size, color }) => <Clock size={size} color={color} variant="Bold" /> },
    ],
  },
  {
    id: 'safety_risk',
    title: 'Safety & Risk',
    modules: [
      { id: 'safety', label: 'Safety & Emergency', icon: ({ size, color }) => <ShieldTick size={size} color={color} variant="Bold" /> },
      { id: 'scams_crime', label: 'Scams & Crime', icon: ({ size, color }) => <Warning2 size={size} color={color} variant="Bold" /> },
      { id: 'solo_female', label: 'Solo Female Safety', icon: ({ size, color }) => <People size={size} color={color} variant="Bold" /> },
      { id: 'health', label: 'Health & Medication', icon: ({ size, color }) => <Health size={size} color={color} variant="Bold" /> },
    ],
  },
  {
    id: 'money',
    title: 'Money & Payments',
    modules: [
      { id: 'payments', label: 'Payments & Banking', icon: ({ size, color }) => <Wallet2 size={size} color={color} variant="Bold" /> },
      { id: 'price_feel', label: 'Prices & Budget', icon: ({ size, color }) => <Wallet2 size={size} color={color} variant="Bold" /> },
      { id: 'saving_tips', label: 'Money-Saving Tips', icon: ({ size, color }) => <Wallet2 size={size} color={color} variant="Bold" /> },
    ],
  },
  {
    id: 'legal',
    title: 'Health & Legal',
    modules: [
      { id: 'visa_entry', label: 'Visa & Entry', icon: ({ size, color }) => <DocumentText size={size} color={color} variant="Bold" /> },
      { id: 'laws', label: 'Laws & Regulations', icon: ({ size, color }) => <Judge size={size} color={color} variant="Bold" /> },
    ],
  },
  {
    id: 'food',
    title: 'Food & Drink',
    modules: [
      { id: 'food', label: 'Food & Dining', icon: ({ size, color }) => <Reserve size={size} color={color} variant="Bold" /> },
      { id: 'food_culture', label: 'Food Etiquette', icon: ({ size, color }) => <Reserve size={size} color={color} variant="Bold" /> },
    ],
  },
  {
    id: 'planning',
    title: 'Planning & Experiences',
    modules: [
      { id: 'weather', label: 'Weather & Packing', icon: ({ size, color }) => <Sun1 size={size} color={color} variant="Bold" /> },
      { id: 'crowds', label: 'Crowds & Reservations', icon: ({ size, color }) => <Calendar size={size} color={color} variant="Bold" /> },
      { id: 'history', label: 'History & Festivals', icon: ({ size, color }) => <Calendar size={size} color={color} variant="Bold" /> },
    ],
  },
  {
    id: 'tech',
    title: 'Language & Tech',
    modules: [
      { id: 'language', label: 'Language Cheat Sheet', icon: ({ size, color }) => <LanguageSquare size={size} color={color} variant="Bold" /> },
      { id: 'apps', label: 'Essential Apps & SIM', icon: ({ size, color }) => <Mobile size={size} color={color} variant="Bold" /> },
    ],
  },
];

export const DEFAULT_TOPICS = ['safety', 'visa_entry', 'food', 'arrival', 'price_feel', 'customs'];
export const MAX_TOPICS = 10;

// ─── Component ───────────────────────────────────────────

interface WhatSectionProps {
  selectedTopics: string[];
  onUpdateTopics: (topics: string[]) => void;
  destination?: string;
}

export default function WhatSection({
  selectedTopics,
  onUpdateTopics,
  destination,
}: WhatSectionProps) {
  const { colors: tc } = useTheme();

  const selectionCount = selectedTopics.length;

  const handleToggle = (topicId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (selectedTopics.includes(topicId)) {
      onUpdateTopics(selectedTopics.filter(t => t !== topicId));
    } else if (selectionCount < MAX_TOPICS) {
      onUpdateTopics([...selectedTopics, topicId]);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  };

  const title = destination
    ? `What would you like to know about ${destination}?`
    : 'What would you like to know?';

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: tc.textPrimary }]}>{title}</Text>
      <Text style={[styles.subtitle, { color: tc.textSecondary }]}>
        Select up to {MAX_TOPICS} topics ({selectionCount}/{MAX_TOPICS})
      </Text>

      {TOPIC_CATEGORIES.map((category) => (
        <View key={category.id} style={styles.categoryBlock}>
          <Text style={[styles.categoryTitle, { color: tc.textSecondary }]}>
            {category.title}
          </Text>
          <View style={styles.pillsRow}>
            {category.modules.map((mod) => {
              const isSelected = selectedTopics.includes(mod.id);
              const isDisabled = !isSelected && selectionCount >= MAX_TOPICS;
              return (
                <TouchableOpacity
                  key={mod.id}
                  style={[
                    styles.pill,
                    { borderColor: tc.borderSubtle, backgroundColor: tc.bgElevated },
                    isSelected && { backgroundColor: `${tc.primary}15`, borderColor: tc.primary },
                    isDisabled && { opacity: 0.4 },
                  ]}
                  onPress={() => handleToggle(mod.id)}
                  activeOpacity={0.7}
                  disabled={isDisabled}
                >
                  {mod.icon({ size: 14, color: isSelected ? tc.primary : tc.textSecondary })}
                  <Text
                    style={[
                      styles.pillText,
                      { color: isSelected ? tc.primary : tc.textPrimary },
                      isSelected && { fontWeight: typography.fontWeight.semibold },
                    ]}
                    numberOfLines={1}
                  >
                    {mod.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ))}
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: spacing.xs,
  },
  title: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: typography.fontSize.xs,
    marginBottom: spacing.lg,
  },
  categoryBlock: {
    marginBottom: spacing.lg,
  },
  categoryTitle: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  pillText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },
});
