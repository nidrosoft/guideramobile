/**
 * DO'S & DON'TS PLUGIN - MAIN SCREEN
 * 
 * This screen displays context-aware cultural guidance for travelers.
 * Tips are fetched from the cultural_tips table via SafetyService.
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Modal,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Location, InfoCircle, Global, TickCircle, CloseCircle, Like1, Dislike, ShieldTick, Warning2 } from 'iconsax-react-native';
import { spacing, typography, borderRadius, colors } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
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
import { safetyService } from '@/services/safety.service';

// Category configuration with icons and colors
const CATEGORIES: CategoryInfo[] = [
  { id: CategoryType.CULTURAL_ETIQUETTE, name: 'Cultural', icon: '🙏', color: colors.purple, description: 'Cultural norms and etiquette' },
  { id: CategoryType.DINING_FOOD, name: 'Food', icon: '🍽️', color: colors.warning, description: 'Dining and food customs' },
  { id: CategoryType.SAFETY, name: 'Safety', icon: '🛡️', color: colors.error, description: 'Safety and security tips' },
  { id: CategoryType.DRESS_CODE, name: 'Dress', icon: '👔', color: colors.info, description: 'Dress code guidelines' },
  { id: CategoryType.TRANSPORTATION, name: 'Transport', icon: '🚕', color: colors.success, description: 'Transportation tips' },
  { id: CategoryType.COMMUNICATION, name: 'Language', icon: '💬', color: colors.pink, description: 'Communication and language' },
  { id: CategoryType.PHOTOGRAPHY, name: 'Photos', icon: '📸', color: colors.orange, description: 'Photography etiquette' },
  { id: CategoryType.RELIGIOUS_CUSTOMS, name: 'Religion', icon: '🕌', color: colors.cyan, description: 'Religious customs' },
  { id: CategoryType.TIPPING, name: 'Tipping', icon: '💰', color: colors.success, description: 'Tipping guidelines' },
  { id: CategoryType.BUSINESS_ETIQUETTE, name: 'Business', icon: '💼', color: colors.purple, description: 'Business etiquette' },
  { id: CategoryType.TABOOS, name: 'Taboos', icon: '⚠️', color: colors.error, description: 'Cultural taboos and sensitive topics' },
  { id: CategoryType.LGBTQ, name: 'LGBTQ+', icon: '🏳️‍🌈', color: colors.purple, description: 'LGBTQ+ travel considerations' },
  { id: CategoryType.ALCOHOL_DRUGS, name: 'Alcohol', icon: '🍷', color: colors.warning, description: 'Alcohol and substance regulations' },
  { id: CategoryType.GESTURES, name: 'Gestures', icon: '👋', color: colors.primary, description: 'Hand gestures and body language' },
  { id: CategoryType.GREETINGS, name: 'Greetings', icon: '🤝', color: colors.purple, description: 'Proper greetings and introductions' },
  { id: CategoryType.SHOPPING, name: 'Shopping', icon: '🛍️', color: colors.pink, description: 'Shopping and bargaining tips' },
  { id: CategoryType.HEALTH, name: 'Health', icon: '💊', color: colors.success, description: 'Health and medical considerations' },
  { id: CategoryType.EMERGENCY, name: 'Emergency', icon: '🚨', color: colors.error, description: 'Emergency contacts and procedures' },
  { id: CategoryType.LOCAL_LAWS, name: 'Laws', icon: '🏛️', color: colors.error, description: 'Local laws with real consequences' },
  { id: CategoryType.DIGITAL_PRIVACY, name: 'Digital', icon: '📱', color: colors.info, description: 'Phone, social media, and privacy laws' },
  { id: CategoryType.NATURE_ENVIRONMENT, name: 'Nature', icon: '🌿', color: colors.success, description: 'Wildlife and environment rules' },
  { id: CategoryType.WITH_KIDS, name: 'Kids', icon: '👶', color: colors.warning, description: 'Child-specific customs' },
  { id: CategoryType.FAITH_CUSTOMS, name: 'Faith', icon: '🤲', color: colors.purple, description: 'Religion-specific customs' },
];


export default function DosDontsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { showSuccess } = useToast();
  const { colors, isDark } = useTheme();
  const tripId = params.tripId as string;
  const trip = useTripStore(state => state.trips.find(t => t.id === tripId));

  const [selectedCategory, setSelectedCategory] = useState<CategoryType | 'all'>('all');
  const [showDos, setShowDos] = useState(true);
  const [showDonts, setShowDonts] = useState(true);
  const [tips, setTips] = useState<SmartTip[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInfoSheet, setShowInfoSheet] = useState(false);
  const [tipFeedback, setTipFeedback] = useState<Record<string, 'helpful' | 'not_helpful' | null>>({});

  useEffect(() => {
    let mounted = true;
    const fetchTips = async () => {
      try {
        setLoading(true);

        const mapTip = (ct: any, city: string): SmartTip => ({
          id: ct.id,
          category: ct.category as CategoryType,
          context: ContextType.DESTINATION,
          location: ct.city || ct.locationName || city,
          isDo: ct.isDo,
          title: ct.title,
          description: ct.description,
          importance: ct.importance as ImportanceLevel,
          icon: ct.icon || (ct.isDo ? '✅' : '❌'),
          activeWhen: (() => {
            try { return ct.activeWhen ? JSON.parse(ct.activeWhen) : null; }
            catch { return null; }
          })() ?? { tripPhase: [TripPhase.PRE_TRIP, TripPhase.DURING_TRIP] },
          lastUpdated: new Date(),
          severity: ct.severity ?? undefined,
          penalty: ct.penalty ?? undefined,
          isCritical: ct.isCritical ?? false,
          tags: ct.tags ?? [],
          tabLabel: ct.tabLabel ?? undefined,
        });

        const city = trip?.destination?.city || '';

        // Try trip-specific AI-generated tips first
        let culturalTips = await safetyService.getTripCulturalTips(tripId);

        // Fallback to country-code reference tips if no AI tips exist
        if (culturalTips.length === 0) {
          const countryCode = (trip?.destination as any)?.country_code || '';
          if (countryCode) {
            culturalTips = await safetyService.getCulturalTips(countryCode, city || undefined);
          }
        }

        if (mounted) setTips(culturalTips.map(ct => mapTip(ct, city)));
      } catch (err) {
        console.error('Failed to load cultural tips:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchTips();
    return () => { mounted = false; };
  }, [tripId, trip?.destination]);

  const currentTripPhase = TripPhase.PRE_TRIP;

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

  // Early returns MUST be after all hooks to respect Rules of Hooks
  if (!trip) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Trip not found</Text>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bgPrimary, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const getImportanceColor = (importance: ImportanceLevel) => {
    switch (importance) {
      case ImportanceLevel.CRITICAL:
        return colors.error;
      case ImportanceLevel.IMPORTANT:
        return colors.warning;
      case ImportanceLevel.HELPFUL:
        return colors.info;
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
    <View style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.bgPrimary} />
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bgPrimary }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.bgPrimary, borderBottomColor: colors.borderSubtle }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Do's & Don'ts</Text>
          <TouchableOpacity
            style={[styles.infoButton, { backgroundColor: `${colors.primary}15` }]}
            onPress={() => setShowInfoSheet(true)}
          >
            <InfoCircle size={20} color={colors.primary} variant="Bold" />
          </TouchableOpacity>
        </View>

        {/* TODO: [PREMIUM] Empty state will show upgrade CTA once paywall is implemented */}
        {tips.length === 0 ? (
          <View style={styles.emptyStateContainer}>
            <Global size={56} color={colors.textTertiary} variant="Bold" />
            <Text style={[styles.emptyStateText, { color: colors.textPrimary }]}>When in Rome... We Don't Know Yet</Text>
            <Text style={[styles.emptyStateSubtext, { color: colors.textSecondary }]}>
              {`Cultural do's & don'ts for ${trip.destination?.city || 'your destination'} haven't been generated yet! Head back to your trip card and tap "Generate Smart Plan" — we'll tell you what to do, what NOT to do, and why the locals will love you for it. This is a premium feature.`}
            </Text>
            <TouchableOpacity style={[styles.emptyCta, { backgroundColor: colors.primary }]} onPress={() => router.back()}>
              <Text style={styles.emptyCtaText}>Go to Trip Card</Text>
            </TouchableOpacity>
          </View>
        ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Hero Card - AI: Update with destination-specific info */}
          <View style={[styles.heroCard, { backgroundColor: colors.bgCard }]}>
            <View style={styles.heroHeader}>
              <View style={[styles.heroIconContainer, { backgroundColor: `${colors.primary}15` }]}>
                <Global size={28} color={colors.primary} variant="Bold" />
              </View>
              <View style={styles.heroTextContainer}>
                <Text style={[styles.heroTitle, { color: colors.textPrimary }]}>{trip.destination.city} Travel Guide</Text>
                <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
                  {stats.dos} Do's • {stats.donts} Don'ts
                </Text>
              </View>
            </View>
            <View style={[styles.aiPoweredBadge, { backgroundColor: `${colors.primary}10` }]}>
              <Text style={[styles.aiPoweredText, { color: colors.primary }]}>✨ AI-Powered Insights</Text>
            </View>
          </View>

          {/* Context Banner - AI: Update based on trip phase and location */}
          <View style={[styles.contextBanner, { backgroundColor: `${colors.primary}08`, borderColor: `${colors.primary}20` }]}>
            <Location size={20} color={colors.primary} variant="Bold" />
            <Text style={[styles.contextText, { color: colors.primary }]}>
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
              style={[styles.categoryChip, { backgroundColor: colors.bgCard, borderColor: colors.borderSubtle }, selectedCategory === 'all' && { backgroundColor: colors.textPrimary, borderColor: colors.textPrimary }]}
              onPress={() => setSelectedCategory('all')}
            >
              <Text style={[styles.categoryChipText, { color: colors.textSecondary }, selectedCategory === 'all' && { color: colors.bgPrimary }]}>
                All
              </Text>
            </TouchableOpacity>
            {CATEGORIES.map(category => (
              <TouchableOpacity
                key={category.id}
                style={[styles.categoryChip, { backgroundColor: colors.bgCard, borderColor: colors.borderSubtle }, selectedCategory === category.id && { backgroundColor: colors.textPrimary, borderColor: colors.textPrimary }]}
                onPress={() => setSelectedCategory(category.id)}
              >
                <Text style={styles.categoryChipEmoji}>{category.icon}</Text>
                <Text style={[styles.categoryChipText, { color: colors.textSecondary }, selectedCategory === category.id && { color: colors.bgPrimary }]}>
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Do's & Don'ts Toggle */}
          <View style={[styles.toggleContainer, { backgroundColor: colors.bgSecondary }]}>
            <TouchableOpacity
              style={[styles.toggleTab, (showDos && showDonts) && styles.toggleTabActive]}
              onPress={() => {
                setShowDos(true);
                setShowDonts(true);
              }}
            >
              <Text style={[styles.toggleTabText, { color: colors.textSecondary }, (showDos && showDonts) && styles.toggleTabTextActive]}>
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
              <Text style={[styles.toggleTabText, { color: colors.textSecondary }, (showDos && !showDonts) && styles.toggleTabTextActive]}>
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
              <Text style={[styles.toggleTabText, { color: colors.textSecondary }, (!showDos && showDonts) && styles.toggleTabTextActive]}>
                Don'ts
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tips List */}
          <View style={styles.tipsSection}>
            {filteredTips.length === 0 && tips.length > 0 && (
              <View style={styles.emptyState}>
                <Text style={[styles.emptyStateText, { color: colors.textPrimary }]}>No tips match your filters</Text>
                <Text style={[styles.emptyStateSubtext, { color: colors.textSecondary }]}>Try adjusting the category or Do/Don't filter above.</Text>
              </View>
            )}
            {filteredTips.map(tip => {
              const categoryInfo = getCategoryInfo(tip.category);
              return (
                <TouchableOpacity
                  key={tip.id}
                  style={[
                    styles.tipCard,
                    { backgroundColor: colors.bgCard },
                    tip.isDo ? styles.tipCardDo : styles.tipCardDont,
                  ]}
                  activeOpacity={0.7}
                >
                  {/* Tip Header */}
                  <View style={styles.tipHeader}>
                    <View style={[
                      styles.tipBadge,
                      { backgroundColor: tip.isDo ? colors.successBg : colors.errorBg }
                    ]}>
                      <Text style={[
                        styles.tipBadgeText,
                        { color: tip.isDo ? colors.success : colors.error }
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
                  <Text style={[styles.tipTitle, { color: colors.textPrimary }]}>{tip.title}</Text>
                  <Text style={[styles.tipDescription, { color: colors.textSecondary }]}>{tip.description}</Text>

                  {/* Tip Footer */}
                  <View style={[styles.tipFooter, { borderTopColor: colors.borderSubtle }]}>
                    <View style={styles.tipMeta}>
                      <Text style={[styles.tipMetaText, { color: colors.textTertiary }]}>
                        {getImportanceLabel(tip.importance)}
                      </Text>
                      <Text style={[styles.tipMetaDot, { color: colors.textTertiary }]}>•</Text>
                      <Text style={[styles.tipMetaText, { color: colors.textTertiary }]}>{categoryInfo?.name}</Text>
                    </View>
                  </View>

                  {/* Feedback Section */}
                  <View style={[styles.feedbackSection, { borderTopColor: colors.borderSubtle }]}>
                    <Text style={[styles.feedbackLabel, { color: colors.textSecondary }]}>Was this helpful?</Text>
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
                          color={tipFeedback[tip.id] === 'helpful' ? colors.success : colors.textTertiary}
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
                          color={tipFeedback[tip.id] === 'not_helpful' ? colors.error : colors.textTertiary}
                          variant={tipFeedback[tip.id] === 'not_helpful' ? 'Bold' : 'Outline'}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

        </ScrollView>
        )}
      </SafeAreaView>

      {/* Disclaimer Bottom Sheet */}
      <Modal
        visible={showInfoSheet}
        animationType="slide"
        transparent
        onRequestClose={() => setShowInfoSheet(false)}
      >
        <Pressable style={styles.disclaimerOverlay} onPress={() => setShowInfoSheet(false)}>
          <Pressable style={[styles.disclaimerSheet, { backgroundColor: colors.bgPrimary }]} onPress={() => {}}>
            {/* Handle */}
            <View style={styles.disclaimerHandleRow}>
              <View style={[styles.disclaimerHandle, { backgroundColor: colors.borderSubtle }]} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.disclaimerContent} bounces={false}>
              {/* Icon */}
              <View style={[styles.disclaimerIconCircle, { backgroundColor: `${colors.warning}15` }]}>
                <Warning2 size={36} color={colors.warning} variant="Bold" />
              </View>

              {/* Title */}
              <Text style={[styles.disclaimerTitle, { color: colors.textPrimary }]}>
                Important Disclaimer
              </Text>

              {/* Description */}
              <Text style={[styles.disclaimerDescription, { color: colors.textSecondary }]}>
                The cultural tips and guidelines shown here are generated based on general knowledge and may not cover every aspect of local customs, laws, or etiquette for your destination.
              </Text>

              {/* Bullet Points */}
              <View style={styles.disclaimerBullets}>
                <View style={styles.disclaimerBulletRow}>
                  <View style={[styles.disclaimerBulletIcon, { backgroundColor: `${colors.warning}12` }]}>
                    <InfoCircle size={20} color={colors.warning} variant="Bold" />
                  </View>
                  <Text style={[styles.disclaimerBulletText, { color: colors.textPrimary }]}>
                    This list is not exhaustive — customs vary by region, community, and context
                  </Text>
                </View>
                <View style={styles.disclaimerBulletRow}>
                  <View style={[styles.disclaimerBulletIcon, { backgroundColor: `${colors.warning}12` }]}>
                    <Global size={20} color={colors.warning} variant="Bold" />
                  </View>
                  <Text style={[styles.disclaimerBulletText, { color: colors.textPrimary }]}>
                    Always do your own research for the specific areas you plan to visit
                  </Text>
                </View>
                <View style={styles.disclaimerBulletRow}>
                  <View style={[styles.disclaimerBulletIcon, { backgroundColor: `${colors.warning}12` }]}>
                    <ShieldTick size={20} color={colors.warning} variant="Bold" />
                  </View>
                  <Text style={[styles.disclaimerBulletText, { color: colors.textPrimary }]}>
                    When in doubt, observe locals and ask respectfully — it's the best way to learn
                  </Text>
                </View>
              </View>

              {/* CTA */}
              <TouchableOpacity
                style={[styles.disclaimerButton, { backgroundColor: colors.primary }]}
                onPress={() => setShowInfoSheet(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.disclaimerButtonText}>Got It</Text>
              </TouchableOpacity>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
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
  },
  infoButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  heroCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
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
    marginBottom: spacing.xs,
  },
  heroSubtitle: {
    fontSize: typography.fontSize.sm,
  },
  aiPoweredBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },
  aiPoweredText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
  },
  contextBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  contextText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
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
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    padding: spacing.xs,
    borderRadius: borderRadius.full,
    shadowColor: '#000',
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
  },
  toggleTabTextActive: {
    color: '#FFFFFF',
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  categoryChipEmoji: {
    fontSize: 16,
  },
  categoryChipText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
  },
  tipsSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  tipCard: {
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  tipCardDo: {
    borderColor: colors.successBorder,
  },
  tipCardDont: {
    borderColor: colors.errorBorder,
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
    marginBottom: spacing.sm,
  },
  tipDescription: {
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  tipFooter: {
    borderTopWidth: 1,
    paddingTop: spacing.md,
  },
  tipMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  tipMetaText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
  },
  tipMetaDot: {
    fontSize: typography.fontSize.xs,
  },
  feedbackSection: {
    borderTopWidth: 1,
    paddingTop: spacing.md,
    marginTop: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  feedbackLabel: {
    fontSize: typography.fontSize.sm,
  },
  feedbackButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  feedbackButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedbackButtonActive: {},

  emptyStateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyStateText: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: spacing.sm,
  },
  emptyCta: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm + 2,
    borderRadius: 20,
  },
  emptyCtaText: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
  },
  // Disclaimer Bottom Sheet
  disclaimerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  disclaimerSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  disclaimerHandleRow: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 4,
  },
  disclaimerHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  disclaimerContent: {
    paddingHorizontal: 28,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    alignItems: 'center',
  },
  disclaimerIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  disclaimerTitle: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 10,
  },
  disclaimerDescription: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginBottom: 28,
  },
  disclaimerBullets: {
    alignSelf: 'stretch',
    gap: 16,
    marginBottom: 32,
  },
  disclaimerBulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  disclaimerBulletIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disclaimerBulletText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  disclaimerButton: {
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
  },
  disclaimerButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
