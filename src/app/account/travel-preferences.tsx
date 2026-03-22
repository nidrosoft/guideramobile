/**
 * TRAVEL PROFILE SCREEN
 * 
 * User's default travel profile for trip planning and packing personalization.
 * Organized into sections: Style, Budget, Interests, Accommodation, Transportation, Food/Health/Access, Lifestyle
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  ArrowLeft2, 
  ArrowRight2,
  People,
  Wallet2,
  Heart,
  Building,
  Car,
  Health,
  Activity,
  TickCircle,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, typography, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from 'react-i18next';
import {
  preferencesService,
  TravelPreferences,
  PREFERENCE_OPTIONS,
} from '@/services/preferences.service';

interface PreferenceSectionProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  value: string;
  onPress: () => void;
  isComplete?: boolean;
  tc: any;
}

function PreferenceSection({ icon, title, subtitle, value, onPress, isComplete, tc }: PreferenceSectionProps) {
  return (
    <TouchableOpacity style={[styles.sectionCard, { backgroundColor: tc.bgCard, borderColor: tc.borderSubtle }]} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.sectionIcon, { backgroundColor: tc.bgElevated }]}>
        {icon}
      </View>
      <View style={styles.sectionContent}>
        <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>{title}</Text>
        <Text style={[styles.sectionSubtitle, { color: tc.textTertiary }]} numberOfLines={1}>{subtitle}</Text>
        <Text style={[styles.sectionValue, { color: tc.primary }]} numberOfLines={1}>{value}</Text>
      </View>
      <View style={styles.sectionRight}>
        {isComplete && (
          <TickCircle size={18} color={tc.success} variant="Bold" style={{ marginRight: spacing.xs }} />
        )}
        <ArrowRight2 size={20} color={tc.textTertiary} />
      </View>
    </TouchableOpacity>
  );
}

export default function TravelPreferencesScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const insets = useSafeAreaInsets();
  const { colors: tc } = useTheme();
  const { t } = useTranslation();
  const [preferences, setPreferences] = useState<TravelPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPreferences = useCallback(async () => {
    if (!profile?.id) return;
    
    try {
      const { data, error } = await preferencesService.getPreferences(profile.id);
      if (data) {
        setPreferences(data);
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPreferences();
  }, [fetchPreferences]);
  
  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const navigateToSection = (section: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/account/preferences/${section}` as any);
  };

  // Get display values for each section
  const getTravelStyleValue = () => {
    if (!preferences) return 'Not set';
    const companion = PREFERENCE_OPTIONS.companionTypes.find(c => c.id === preferences.defaultCompanionType);
    const styles = preferences.preferredTripStyles.slice(0, 2).map(s => 
      PREFERENCE_OPTIONS.tripStyles.find(ts => ts.id === s)?.emoji
    ).filter(Boolean).join(' ');
    if (!companion && !styles) return 'Not set';
    return `${companion?.label || ''}${styles ? ` ${styles}` : ''}`.trim();
  };

  const getBudgetValue = () => {
    if (!preferences) return 'Not set';
    const currency = PREFERENCE_OPTIONS.currencies.find(c => c.code === preferences.defaultCurrency);
    const style = PREFERENCE_OPTIONS.spendingStyles.find(s => s.id === preferences.spendingStyle);
    return `${currency?.symbol || '$'}${preferences.defaultBudgetAmount.toLocaleString()} • ${style?.label || 'Mid-Range'}`;
  };

  const getInterestsValue = () => {
    if (!preferences || preferences.interests.length === 0) return 'Not set';
    const labels = preferences.interests.slice(0, 3).map(i =>
      PREFERENCE_OPTIONS.interests.find(int => int.id === i)?.emoji
    ).filter(Boolean).join(' ');
    return `${labels} ${preferences.interests.length > 3 ? `+${preferences.interests.length - 3}` : ''}`;
  };

  const getAccommodationValue = () => {
    if (!preferences) return 'Not set';
    const type = PREFERENCE_OPTIONS.accommodationTypes.find(a => a.id === preferences.accommodationType);
    return `${type?.emoji || '🏨'} ${type?.label || 'Hotel'} • ${preferences.minStarRating}+ stars`;
  };

  const getTransportationValue = () => {
    if (!preferences) return 'Not set';
    const mode = PREFERENCE_OPTIONS.travelModes.find(t => t.id === preferences.preferredTravelMode);
    const flightClass = PREFERENCE_OPTIONS.flightClasses.find(c => c.id === preferences.flightClass);
    return `${mode?.emoji || '✈️'} ${mode?.label || 'Flight'}${preferences.preferredTravelMode === 'flight' ? ` • ${flightClass?.label || 'Economy'}` : ''}`;
  };

  const getAccessibilityValue = () => {
    if (!preferences) return 'Not set';
    const items: string[] = [];
    if (preferences.dietaryRestrictions.length > 0) {
      items.push(`${preferences.dietaryRestrictions.length} dietary`);
    }
    if (preferences.cuisinePreferences && preferences.cuisinePreferences.length > 0) {
      items.push(`${preferences.cuisinePreferences.length} cuisines`);
    }
    if (preferences.medicalConditions && preferences.medicalConditions.length > 0 && !preferences.medicalConditions.includes('none' as any)) {
      items.push(`${preferences.medicalConditions.length} medical`);
    }
    if (preferences.wheelchairAccessible) items.push('Wheelchair');
    if (preferences.travelingWithPet) items.push('Pet');
    return items.length > 0 ? items.join(' • ') : 'None specified';
  };

  const getLifestyleValue = () => {
    if (!preferences) return 'Not set';
    const items: string[] = [];
    const actOpt = PREFERENCE_OPTIONS.activityLevels.find(a => a.id === preferences.activityLevel);
    if (actOpt) items.push(`${actOpt.emoji} ${actOpt.label}`);
    items.push(preferences.morningPerson ? '🌅 Early' : '🌙 Night');
    const susOpt = PREFERENCE_OPTIONS.sustainabilityPreferences.find(s => s.id === preferences.sustainabilityPreference);
    if (susOpt && preferences.sustainabilityPreference !== 'none') items.push(`${susOpt.emoji}`);
    if (preferences.childrenDefaultAges && preferences.childrenDefaultAges.length > 0) {
      items.push(`👶 ${preferences.childrenDefaultAges.length} kids`);
    }
    return items.length > 0 ? items.join(' • ') : 'Not set';
  };

  // Check if sections are complete
  const isTravelStyleComplete = preferences?.defaultCompanionType !== null && (preferences?.preferredTripStyles?.length ?? 0) > 0;
  const isInterestsComplete = preferences?.interests && preferences.interests.length >= 3;
  const isAccommodationComplete = preferences?.accommodationType !== null;
  const isTransportationComplete = preferences?.preferredTravelMode !== null;

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer, { backgroundColor: tc.bgPrimary }]}>
        <StatusBar style="auto" />
        <ActivityIndicator size="large" color={tc.primary} />
      </View>
    );
  }
  
  return (
    <View style={[styles.container, { backgroundColor: tc.bgPrimary }]}>
      <StatusBar style="auto" />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm, backgroundColor: tc.bgElevated, borderBottomColor: tc.borderSubtle }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ArrowLeft2 size={24} color={tc.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: tc.textPrimary }]}>{t('account.travelPreferences.title')}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor={tc.primary}
          />
        }
      >
        {/* Description */}
        <View style={[styles.descriptionCard, { backgroundColor: `${tc.primary}10` }]}>
          <Text style={[styles.descriptionTitle, { color: tc.primary }]}>{t('account.travelPreferences.yourProfile')}</Text>
          <Text style={[styles.descriptionText, { color: tc.textSecondary }]}>
            {t('account.travelPreferences.description')}
          </Text>
        </View>

        {/* Preference Sections */}
        <View style={styles.sectionsContainer}>
          <PreferenceSection
            tc={tc}
            icon={<People size={22} color={tc.primary} variant="Bold" />}
            title={t('account.travelPreferences.travelStyle')}
            subtitle={t('account.travelPreferences.travelStyleSub')}
            value={getTravelStyleValue()}
            onPress={() => navigateToSection('travel-style')}
            isComplete={isTravelStyleComplete}
          />

          <PreferenceSection
            tc={tc}
            icon={<Wallet2 size={22} color={tc.warning} variant="Bold" />}
            title={t('account.travelPreferences.budget')}
            subtitle={t('account.travelPreferences.budgetSub')}
            value={getBudgetValue()}
            onPress={() => navigateToSection('budget')}
            isComplete={true}
          />

          <PreferenceSection
            tc={tc}
            icon={<Heart size={22} color={tc.error} variant="Bold" />}
            title={t('account.travelPreferences.interests')}
            subtitle={t('account.travelPreferences.interestsSub')}
            value={getInterestsValue()}
            onPress={() => navigateToSection('interests')}
            isComplete={isInterestsComplete}
          />

          <PreferenceSection
            tc={tc}
            icon={<Building size={22} color={tc.info} variant="Bold" />}
            title={t('account.travelPreferences.accommodation')}
            subtitle={t('account.travelPreferences.accommodationSub')}
            value={getAccommodationValue()}
            onPress={() => navigateToSection('accommodation')}
            isComplete={isAccommodationComplete}
          />

          <PreferenceSection
            tc={tc}
            icon={<Car size={22} color={tc.success} variant="Bold" />}
            title={t('account.travelPreferences.transportation')}
            subtitle={t('account.travelPreferences.transportationSub')}
            value={getTransportationValue()}
            onPress={() => navigateToSection('transportation')}
            isComplete={isTransportationComplete}
          />

          <PreferenceSection
            tc={tc}
            icon={<Health size={22} color={tc.purple} variant="Bold" />}
            title={t('account.travelPreferences.foodHealth')}
            subtitle={t('account.travelPreferences.foodHealthSub')}
            value={getAccessibilityValue()}
            onPress={() => navigateToSection('accessibility')}
            isComplete={true}
          />

          <PreferenceSection
            tc={tc}
            icon={<Activity size={22} color={tc.warning} variant="Bold" />}
            title={t('account.travelPreferences.lifestyle')}
            subtitle={t('account.travelPreferences.lifestyleSub')}
            value={getLifestyleValue()}
            onPress={() => navigateToSection('lifestyle')}
            isComplete={preferences?.activityLevel !== undefined}
          />
        </View>

        {/* Completion Status */}
        {preferences && !preferences.preferencesCompleted && (
          <View style={[styles.completionCard, { backgroundColor: `${tc.warning}15`, borderColor: `${tc.warning}30` }]}>
            <Text style={[styles.completionTitle, { color: tc.warning }]}>{t('account.travelPreferences.completeProfile')}</Text>
            <Text style={[styles.completionText, { color: tc.textSecondary }]}>
              {t('account.travelPreferences.completeProfileDesc')}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    backgroundColor: colors.bgElevated,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
  },
  descriptionCard: {
    backgroundColor: colors.primary + '10',
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  descriptionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  descriptionText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  sectionsContainer: {
    gap: spacing.md,
  },
  sectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.gray50,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  sectionContent: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  sectionSubtitle: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  sectionValue: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: typography.fontWeight.medium,
  },
  sectionRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  completionCard: {
    backgroundColor: colors.warning + '15',
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginTop: spacing.xl,
    borderWidth: 1,
    borderColor: colors.warning + '30',
  },
  completionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.warning,
    marginBottom: spacing.xs,
  },
  completionText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});
