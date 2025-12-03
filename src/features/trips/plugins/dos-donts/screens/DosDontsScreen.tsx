/**
 * DO'S & DON'TS PLUGIN - MAIN SCREEN
 * 
 * This screen displays context-aware cultural guidance for travelers.
 * 
 * AI INTEGRATION POINTS:
 * 1. Replace MOCK_TIPS with AI-generated tips based on trip.destination
 * 2. Filter tips by current trip phase (pre-trip, during, post)
 * 3. Show location-based tips when GPS detects nearby places
 * 4. Prioritize tips by importance and relevance score
 * 5. Update tips in real-time based on user's itinerary and location
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Location, InfoCircle, Global, TickCircle, CloseCircle, Like1, Dislike } from 'iconsax-react-native';
import { colors, spacing, typography, borderRadius } from '@/styles';
import { useTripStore } from '@/features/trips/stores/trip.store';
import { useToast } from '@/contexts/ToastContext';
import * as Haptics from 'expo-haptics';
import {
  SmartTip,
  CategoryType,
  ImportanceLevel,
  TripPhase,
  ContextType,
  CategoryInfo,
} from '../types/dos-donts.types';

// Category configuration with icons and colors
const CATEGORIES: CategoryInfo[] = [
  { id: CategoryType.CULTURAL_ETIQUETTE, name: 'Cultural', icon: '🙏', color: '#8B5CF6', description: 'Cultural norms and etiquette' },
  { id: CategoryType.DINING_FOOD, name: 'Food', icon: '🍽️', color: '#F59E0B', description: 'Dining and food customs' },
  { id: CategoryType.SAFETY, name: 'Safety', icon: '🛡️', color: '#EF4444', description: 'Safety and security tips' },
  { id: CategoryType.DRESS_CODE, name: 'Dress', icon: '👔', color: '#3B82F6', description: 'Dress code guidelines' },
  { id: CategoryType.TRANSPORTATION, name: 'Transport', icon: '🚕', color: '#10B981', description: 'Transportation tips' },
  { id: CategoryType.COMMUNICATION, name: 'Language', icon: '💬', color: '#EC4899', description: 'Communication and language' },
  { id: CategoryType.PHOTOGRAPHY, name: 'Photos', icon: '📸', color: '#F97316', description: 'Photography etiquette' },
  { id: CategoryType.RELIGIOUS_CUSTOMS, name: 'Religion', icon: '🕌', color: '#06B6D4', description: 'Religious customs' },
  { id: CategoryType.TIPPING, name: 'Tipping', icon: '💰', color: '#84CC16', description: 'Tipping guidelines' },
  { id: CategoryType.BUSINESS_ETIQUETTE, name: 'Business', icon: '💼', color: '#6366F1', description: 'Business etiquette' },
  { id: CategoryType.TABOOS, name: 'Taboos', icon: '⚠️', color: '#DC2626', description: 'Cultural taboos and sensitive topics' },
  { id: CategoryType.LGBTQ, name: 'LGBTQ+', icon: '🏳️‍🌈', color: '#A855F7', description: 'LGBTQ+ travel considerations' },
  { id: CategoryType.ALCOHOL_DRUGS, name: 'Alcohol', icon: '🍷', color: '#F59E0B', description: 'Alcohol and substance regulations' },
  { id: CategoryType.GESTURES, name: 'Gestures', icon: '👋', color: '#14B8A6', description: 'Hand gestures and body language' },
  { id: CategoryType.GREETINGS, name: 'Greetings', icon: '🤝', color: '#8B5CF6', description: 'Proper greetings and introductions' },
  { id: CategoryType.SHOPPING, name: 'Shopping', icon: '🛍️', color: '#EC4899', description: 'Shopping and bargaining tips' },
  { id: CategoryType.HEALTH, name: 'Health', icon: '💊', color: '#10B981', description: 'Health and medical considerations' },
  { id: CategoryType.EMERGENCY, name: 'Emergency', icon: '🚨', color: '#EF4444', description: 'Emergency contacts and procedures' },
];

/**
 * MOCK DATA - Replace with AI-generated tips
 * 
 * AI TODO:
 * - Generate tips based on trip.destination (e.g., "Dubai, UAE")
 * - Include legal requirements, cultural norms, safety info
 * - Set appropriate importance levels
 * - Define activation rules (trip phase, location, time)
 * - Calculate relevance scores based on user profile
 */
const MOCK_TIPS: SmartTip[] = [
  {
    id: '1',
    category: CategoryType.CULTURAL_ETIQUETTE,
    context: ContextType.DESTINATION,
    location: 'Dubai, UAE',
    isDo: false,
    title: 'Show public affection',
    description: 'Public displays of affection are considered inappropriate and can lead to legal issues. Keep physical contact minimal in public spaces.',
    importance: ImportanceLevel.CRITICAL,
    icon: '❌',
    activeWhen: {
      tripPhase: [TripPhase.PRE_TRIP, TripPhase.DURING_TRIP],
    },
    lastUpdated: new Date(),
  },
  {
    id: '2',
    category: CategoryType.DRESS_CODE,
    context: ContextType.DESTINATION,
    location: 'Dubai, UAE',
    isDo: true,
    title: 'Dress modestly in public',
    description: 'Cover shoulders and knees, especially in malls, government buildings, and traditional areas. Swimwear is only for beaches and pools.',
    importance: ImportanceLevel.CRITICAL,
    icon: '✅',
    activeWhen: {
      tripPhase: [TripPhase.PRE_TRIP, TripPhase.DURING_TRIP],
    },
    lastUpdated: new Date(),
  },
  {
    id: '3',
    category: CategoryType.RELIGIOUS_CUSTOMS,
    context: ContextType.LOCATION,
    location: 'Jumeirah Mosque',
    nearbyRadius: 500,
    isDo: true,
    title: 'Remove shoes before entering',
    description: 'Always remove your shoes before entering a mosque. Women should cover their hair with a scarf. Modest dress is required.',
    importance: ImportanceLevel.CRITICAL,
    icon: '✅',
    activeWhen: {
      tripPhase: [TripPhase.DURING_TRIP],
      nearLocation: 'mosque',
    },
    lastUpdated: new Date(),
  },
  {
    id: '4',
    category: CategoryType.DINING_FOOD,
    context: ContextType.DESTINATION,
    location: 'Dubai, UAE',
    isDo: true,
    title: 'Try local Emirati cuisine',
    description: 'Don\'t miss traditional dishes like Al Harees, Machboos, and Luqaimat. Visit local restaurants in Al Fahidi Historical District.',
    importance: ImportanceLevel.HELPFUL,
    icon: '✅',
    activeWhen: {
      tripPhase: [TripPhase.DURING_TRIP],
    },
    lastUpdated: new Date(),
  },
  {
    id: '5',
    category: CategoryType.PHOTOGRAPHY,
    context: ContextType.DESTINATION,
    location: 'Dubai, UAE',
    isDo: false,
    title: 'Photograph people without permission',
    description: 'Always ask for permission before photographing locals, especially women in traditional dress. Some government buildings prohibit photography.',
    importance: ImportanceLevel.IMPORTANT,
    icon: '❌',
    activeWhen: {
      tripPhase: [TripPhase.DURING_TRIP],
    },
    lastUpdated: new Date(),
  },
  {
    id: '6',
    category: CategoryType.SAFETY,
    context: ContextType.DESTINATION,
    location: 'Dubai, UAE',
    isDo: true,
    title: 'Keep emergency numbers handy',
    description: 'Police: 999, Ambulance: 998, Fire: 997. Dubai is very safe, but it\'s good to be prepared. Download offline maps.',
    importance: ImportanceLevel.IMPORTANT,
    icon: '✅',
    activeWhen: {
      tripPhase: [TripPhase.PRE_TRIP, TripPhase.DURING_TRIP],
    },
    lastUpdated: new Date(),
  },
  {
    id: '7',
    category: CategoryType.TIPPING,
    context: ContextType.DESTINATION,
    location: 'Dubai, UAE',
    isDo: true,
    title: 'Tip 10-15% at restaurants',
    description: 'Service charge is often included, but an additional 10-15% tip is appreciated for good service. Tip taxi drivers 10 AED for longer rides.',
    importance: ImportanceLevel.HELPFUL,
    icon: '✅',
    activeWhen: {
      tripPhase: [TripPhase.DURING_TRIP],
    },
    lastUpdated: new Date(),
  },
  {
    id: '8',
    category: CategoryType.TRANSPORTATION,
    context: ContextType.DESTINATION,
    location: 'Dubai, UAE',
    isDo: true,
    title: 'Use the Dubai Metro',
    description: 'The metro is clean, efficient, and affordable. Get a Nol Card for easy access to metro, buses, and trams. Women and children have dedicated carriages.',
    importance: ImportanceLevel.HELPFUL,
    icon: '✅',
    activeWhen: {
      tripPhase: [TripPhase.PRE_TRIP, TripPhase.DURING_TRIP],
    },
    lastUpdated: new Date(),
  },
  {
    id: '9',
    category: CategoryType.CULTURAL_ETIQUETTE,
    context: ContextType.DESTINATION,
    location: 'Dubai, UAE',
    isDo: false,
    title: 'Eat or drink in public during Ramadan',
    description: 'During Ramadan, eating, drinking, or smoking in public during daylight hours is prohibited and can result in fines.',
    importance: ImportanceLevel.CRITICAL,
    icon: '❌',
    activeWhen: {
      tripPhase: [TripPhase.PRE_TRIP, TripPhase.DURING_TRIP],
    },
    lastUpdated: new Date(),
  },
  {
    id: '10',
    category: CategoryType.COMMUNICATION,
    context: ContextType.DESTINATION,
    location: 'Dubai, UAE',
    isDo: true,
    title: 'Learn basic Arabic phrases',
    description: 'While English is widely spoken, locals appreciate efforts to speak Arabic. Learn "Shukran" (thank you), "Marhaba" (hello), and "Afwan" (you\'re welcome).',
    importance: ImportanceLevel.HELPFUL,
    icon: '✅',
    activeWhen: {
      tripPhase: [TripPhase.PRE_TRIP, TripPhase.DURING_TRIP],
    },
    lastUpdated: new Date(),
  },
];

export default function DosDontsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { showSuccess } = useToast();
  const tripId = params.tripId as string;
  const trip = useTripStore(state => state.trips.find(t => t.id === tripId));

  const [selectedCategory, setSelectedCategory] = useState<CategoryType | 'all'>('all');
  const [showDos, setShowDos] = useState(true);
  const [showDonts, setShowDonts] = useState(true);
  const [tips] = useState<SmartTip[]>(MOCK_TIPS);
  const [showInfoSheet, setShowInfoSheet] = useState(false);
  const [tipFeedback, setTipFeedback] = useState<Record<string, 'helpful' | 'not_helpful' | null>>({});

  if (!trip) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Trip not found</Text>
      </SafeAreaView>
    );
  }

  /**
   * AI TODO: Calculate current trip phase
   * - Compare current date with trip.startDate and trip.endDate
   * - Return PRE_TRIP, DURING_TRIP, or POST_TRIP
   * - Use this to filter relevant tips
   */
  const currentTripPhase = TripPhase.PRE_TRIP; // AI: Calculate based on dates

  /**
   * AI TODO: Filter tips by context and relevance
   * - Filter by current trip phase
   * - If during trip, use GPS to show location-based tips
   * - Sort by importance (CRITICAL first)
   * - Calculate relevance score based on user profile
   * - Show most relevant tips first
   */
  const filteredTips = useMemo(() => {
    let filtered = tips;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(tip => tip.category === selectedCategory);
    }

    // Filter by Do/Don't toggle
    if (!showDos) {
      filtered = filtered.filter(tip => !tip.isDo);
    }
    if (!showDonts) {
      filtered = filtered.filter(tip => tip.isDo);
    }

    // AI TODO: Filter by trip phase
    // filtered = filtered.filter(tip => tip.activeWhen.tripPhase.includes(currentTripPhase));

    // AI TODO: If during trip, prioritize location-based tips
    // const userLocation = getUserGPSLocation();
    // filtered = sortByProximity(filtered, userLocation);

    // Sort by importance
    const importanceOrder = {
      [ImportanceLevel.CRITICAL]: 0,
      [ImportanceLevel.IMPORTANT]: 1,
      [ImportanceLevel.HELPFUL]: 2,
    };

    return filtered.sort((a, b) => importanceOrder[a.importance] - importanceOrder[b.importance]);
  }, [tips, selectedCategory, showDos, showDonts]);

  const stats = useMemo(() => {
    const dos = tips.filter(t => t.isDo).length;
    const donts = tips.filter(t => !t.isDo).length;
    const critical = tips.filter(t => t.importance === ImportanceLevel.CRITICAL).length;

    return { dos, donts, critical };
  }, [tips]);

  const getImportanceColor = (importance: ImportanceLevel) => {
    switch (importance) {
      case ImportanceLevel.CRITICAL:
        return '#EF4444';
      case ImportanceLevel.IMPORTANT:
        return '#F59E0B';
      case ImportanceLevel.HELPFUL:
        return '#3B82F6';
    }
  };

  const getImportanceLabel = (importance: ImportanceLevel) => {
    switch (importance) {
      case ImportanceLevel.CRITICAL:
        return 'Critical';
      case ImportanceLevel.IMPORTANT:
        return 'Important';
      case ImportanceLevel.HELPFUL:
        return 'Helpful';
    }
  };

  const getCategoryInfo = (categoryId: CategoryType) => {
    return CATEGORIES.find(c => c.id === categoryId);
  };

  /**
   * Handle user feedback on tips
   * AI TODO: Send feedback to backend for learning
   * - Track which tips users find helpful
   * - Use feedback to improve AI tip generation
   * - Personalize future tips based on feedback patterns
   */
  const handleFeedback = (tipId: string, feedback: 'helpful' | 'not_helpful') => {
    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Update feedback state
    setTipFeedback({ ...tipFeedback, [tipId]: feedback });
    
    // Show success toast
    if (feedback === 'helpful') {
      showSuccess('Thanks for your feedback! 👍');
    } else {
      showSuccess('Thanks for your feedback! We\'ll improve our tips.');
    }
    
    // AI TODO: Send to backend
    // await sendFeedbackToBackend(tipId, feedback);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={colors.gray900} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Do's & Don'ts</Text>
          <TouchableOpacity
            style={styles.infoButton}
            onPress={() => setShowInfoSheet(true)}
          >
            <InfoCircle size={20} color={colors.primary} variant="Bold" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Hero Card - AI: Update with destination-specific info */}
          <View style={styles.heroCard}>
            <View style={styles.heroHeader}>
              <View style={styles.heroIconContainer}>
                <Global size={28} color={colors.primary} variant="Bold" />
              </View>
              <View style={styles.heroTextContainer}>
                <Text style={styles.heroTitle}>{trip.destination.city} Travel Guide</Text>
                <Text style={styles.heroSubtitle}>
                  {stats.dos} Do's • {stats.donts} Don'ts
                </Text>
              </View>
            </View>
            <View style={styles.aiPoweredBadge}>
              <Text style={styles.aiPoweredText}>✨ AI-Powered Insights</Text>
            </View>
          </View>

          {/* Context Banner - AI: Update based on trip phase and location */}
          <View style={styles.contextBanner}>
            <Location size={20} color={colors.primary} variant="Bold" />
            <Text style={styles.contextText}>
              Preparing for your trip to {trip.destination.city}
            </Text>
          </View>

          {/* Category Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoriesScroll}
            contentContainerStyle={styles.categoriesContent}
          >
            <TouchableOpacity
              style={[styles.categoryChip, selectedCategory === 'all' && styles.categoryChipActive]}
              onPress={() => setSelectedCategory('all')}
            >
              <Text style={[styles.categoryChipText, selectedCategory === 'all' && styles.categoryChipTextActive]}>
                All
              </Text>
            </TouchableOpacity>
            {CATEGORIES.map(category => (
              <TouchableOpacity
                key={category.id}
                style={[styles.categoryChip, selectedCategory === category.id && styles.categoryChipActive]}
                onPress={() => setSelectedCategory(category.id)}
              >
                <Text style={styles.categoryChipEmoji}>{category.icon}</Text>
                <Text style={[styles.categoryChipText, selectedCategory === category.id && styles.categoryChipTextActive]}>
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Do's & Don'ts Toggle */}
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[styles.toggleTab, (showDos && showDonts) && styles.toggleTabActive]}
              onPress={() => {
                setShowDos(true);
                setShowDonts(true);
              }}
            >
              <Text style={[styles.toggleTabText, (showDos && showDonts) && styles.toggleTabTextActive]}>
                All
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleTab, (showDos && !showDonts) && styles.toggleTabActive]}
              onPress={() => {
                setShowDos(true);
                setShowDonts(false);
              }}
            >
              <Text style={[styles.toggleTabText, (showDos && !showDonts) && styles.toggleTabTextActive]}>
                Do's
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleTab, (!showDos && showDonts) && styles.toggleTabActive]}
              onPress={() => {
                setShowDos(false);
                setShowDonts(true);
              }}
            >
              <Text style={[styles.toggleTabText, (!showDos && showDonts) && styles.toggleTabTextActive]}>
                Don'ts
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tips List */}
          <View style={styles.tipsSection}>
            {filteredTips.map(tip => {
              const categoryInfo = getCategoryInfo(tip.category);
              return (
                <TouchableOpacity
                  key={tip.id}
                  style={[
                    styles.tipCard,
                    tip.isDo ? styles.tipCardDo : styles.tipCardDont,
                  ]}
                  activeOpacity={0.7}
                >
                  {/* Tip Header */}
                  <View style={styles.tipHeader}>
                    <View style={[
                      styles.tipBadge,
                      { backgroundColor: tip.isDo ? `${colors.success}15` : '#EF444415' }
                    ]}>
                      <Text style={[
                        styles.tipBadgeText,
                        { color: tip.isDo ? colors.success : '#EF4444' }
                      ]}>
                        {tip.isDo ? '✅ DO' : '❌ DON\'T'}
                      </Text>
                    </View>
                    <View style={[
                      styles.importanceDot,
                      { backgroundColor: getImportanceColor(tip.importance) }
                    ]} />
                  </View>

                  {/* Tip Content */}
                  <Text style={styles.tipTitle}>{tip.title}</Text>
                  <Text style={styles.tipDescription}>{tip.description}</Text>

                  {/* Tip Footer */}
                  <View style={styles.tipFooter}>
                    <View style={styles.tipMeta}>
                      <Text style={styles.tipMetaText}>
                        {getImportanceLabel(tip.importance)}
                      </Text>
                      <Text style={styles.tipMetaDot}>•</Text>
                      <Text style={styles.tipMetaText}>{categoryInfo?.name}</Text>
                    </View>
                  </View>

                  {/* Feedback Section */}
                  <View style={styles.feedbackSection}>
                    <Text style={styles.feedbackLabel}>Was this helpful?</Text>
                    <View style={styles.feedbackButtons}>
                      <TouchableOpacity
                        style={[
                          styles.feedbackButton,
                          tipFeedback[tip.id] === 'helpful' && styles.feedbackButtonActive,
                        ]}
                        onPress={() => handleFeedback(tip.id, 'helpful')}
                      >
                        <Like1
                          size={18}
                          color={tipFeedback[tip.id] === 'helpful' ? colors.success : colors.gray400}
                          variant={tipFeedback[tip.id] === 'helpful' ? 'Bold' : 'Outline'}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.feedbackButton,
                          tipFeedback[tip.id] === 'not_helpful' && styles.feedbackButtonActive,
                        ]}
                        onPress={() => handleFeedback(tip.id, 'not_helpful')}
                      >
                        <Dislike
                          size={18}
                          color={tipFeedback[tip.id] === 'not_helpful' ? '#EF4444' : colors.gray400}
                          variant={tipFeedback[tip.id] === 'not_helpful' ? 'Bold' : 'Outline'}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Empty State */}
          {filteredTips.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No tips found</Text>
              <Text style={styles.emptyStateSubtext}>Try selecting a different category</Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    color: colors.gray900,
  },
  infoButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  heroCard: {
    backgroundColor: colors.white,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  heroIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: `${colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  heroTextContainer: {
    flex: 1,
  },
  heroTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: '700',
    color: colors.gray900,
    marginBottom: spacing.xs,
  },
  heroSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.gray600,
  },
  aiPoweredBadge: {
    backgroundColor: `${colors.primary}10`,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },
  aiPoweredText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.primary,
  },
  contextBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: `${colors.primary}08`,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: `${colors.primary}20`,
  },
  contextText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.primary,
  },
  categoriesScroll: {
    marginTop: spacing.lg,
  },
  categoriesContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    padding: spacing.xs,
    borderRadius: borderRadius.full,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  toggleTab: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    borderRadius: borderRadius.full,
  },
  toggleTabActive: {
    backgroundColor: colors.primary,
  },
  toggleTabText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.gray600,
  },
  toggleTabTextActive: {
    color: colors.white,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  categoryChipActive: {
    backgroundColor: colors.gray900,
    borderColor: colors.gray900,
  },
  categoryChipEmoji: {
    fontSize: 16,
  },
  categoryChipText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.gray700,
  },
  categoryChipTextActive: {
    color: colors.white,
  },
  tipsSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  tipCard: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
  },
  tipCardDo: {
    borderColor: `${colors.success}30`,
  },
  tipCardDont: {
    borderColor: '#EF444430',
  },
  tipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  tipBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  tipBadgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '700',
  },
  importanceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  tipTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    color: colors.gray900,
    marginBottom: spacing.sm,
  },
  tipDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.gray700,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  tipFooter: {
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
    paddingTop: spacing.md,
  },
  tipMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  tipMetaText: {
    fontSize: typography.fontSize.xs,
    color: colors.gray500,
    fontWeight: '600',
  },
  tipMetaDot: {
    fontSize: typography.fontSize.xs,
    color: colors.gray300,
  },
  feedbackSection: {
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
    paddingTop: spacing.md,
    marginTop: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  feedbackLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.gray600,
  },
  feedbackButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  feedbackButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.gray50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedbackButtonActive: {
    backgroundColor: colors.white,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyStateText: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.gray900,
    marginBottom: spacing.sm,
  },
  emptyStateSubtext: {
    fontSize: typography.fontSize.sm,
    color: colors.gray600,
    textAlign: 'center',
  },
});
