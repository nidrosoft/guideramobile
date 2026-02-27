/**
 * TRAVEL PREFERENCES SCREEN
 * 
 * User's default travel preferences for trip planning.
 * Organized into sections: Style, Budget, Interests, Accommodation, Transportation, Accessibility
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
  ArrowLeft, 
  ArrowRight2,
  People,
  Wallet2,
  Heart,
  Building,
  Car,
  Health,
  TickCircle,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, typography, borderRadius } from '@/styles';
import { useAuth } from '@/context/AuthContext';
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
}

function PreferenceSection({ icon, title, subtitle, value, onPress, isComplete }: PreferenceSectionProps) {
  return (
    <TouchableOpacity style={styles.sectionCard} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.sectionIcon}>
        {icon}
      </View>
      <View style={styles.sectionContent}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.sectionSubtitle} numberOfLines={1}>{subtitle}</Text>
        <Text style={styles.sectionValue} numberOfLines={1}>{value}</Text>
      </View>
      <View style={styles.sectionRight}>
        {isComplete && (
          <TickCircle size={18} color={colors.success} variant="Bold" style={{ marginRight: spacing.xs }} />
        )}
        <ArrowRight2 size={20} color={colors.gray400} />
      </View>
    </TouchableOpacity>
  );
}

export default function TravelPreferencesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [preferences, setPreferences] = useState<TravelPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPreferences = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await preferencesService.getPreferences(user.id);
      if (data) {
        setPreferences(data);
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

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
    if (preferences.wheelchairAccessible) items.push('Wheelchair');
    if (preferences.travelingWithPet) items.push('Pet');
    return items.length > 0 ? items.join(' • ') : 'None specified';
  };

  // Check if sections are complete
  const isTravelStyleComplete = preferences?.defaultCompanionType !== null && (preferences?.preferredTripStyles?.length ?? 0) > 0;
  const isInterestsComplete = preferences?.interests && preferences.interests.length >= 3;
  const isAccommodationComplete = preferences?.accommodationType !== null;
  const isTransportationComplete = preferences?.preferredTravelMode !== null;

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Travel Preferences</Text>
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
            tintColor={colors.primary}
          />
        }
      >
        {/* Description */}
        <View style={styles.descriptionCard}>
          <Text style={styles.descriptionTitle}>Your Default Settings</Text>
          <Text style={styles.descriptionText}>
            These preferences will be used to pre-fill your trip planning. You can always customize them for each trip.
          </Text>
        </View>

        {/* Preference Sections */}
        <View style={styles.sectionsContainer}>
          <PreferenceSection
            icon={<People size={22} color={colors.primary} variant="Bold" />}
            title="Travel Style"
            subtitle="Companion, trip styles & pace"
            value={getTravelStyleValue()}
            onPress={() => navigateToSection('travel-style')}
            isComplete={isTravelStyleComplete}
          />

          <PreferenceSection
            icon={<Wallet2 size={22} color={colors.warning} variant="Bold" />}
            title="Budget & Spending"
            subtitle="Default budget & spending style"
            value={getBudgetValue()}
            onPress={() => navigateToSection('budget')}
            isComplete={true}
          />

          <PreferenceSection
            icon={<Heart size={22} color={colors.error} variant="Bold" />}
            title="Interests"
            subtitle="What you love to do"
            value={getInterestsValue()}
            onPress={() => navigateToSection('interests')}
            isComplete={isInterestsComplete}
          />

          <PreferenceSection
            icon={<Building size={22} color={colors.info} variant="Bold" />}
            title="Accommodation"
            subtitle="Where you like to stay"
            value={getAccommodationValue()}
            onPress={() => navigateToSection('accommodation')}
            isComplete={isAccommodationComplete}
          />

          <PreferenceSection
            icon={<Car size={22} color={colors.success} variant="Bold" />}
            title="Transportation"
            subtitle="How you like to travel"
            value={getTransportationValue()}
            onPress={() => navigateToSection('transportation')}
            isComplete={isTransportationComplete}
          />

          <PreferenceSection
            icon={<Health size={22} color="#9333EA" variant="Bold" />}
            title="Dietary & Accessibility"
            subtitle="Special requirements"
            value={getAccessibilityValue()}
            onPress={() => navigateToSection('accessibility')}
            isComplete={true}
          />
        </View>

        {/* Completion Status */}
        {preferences && !preferences.preferencesCompleted && (
          <View style={styles.completionCard}>
            <Text style={styles.completionTitle}>Complete Your Profile</Text>
            <Text style={styles.completionText}>
              Fill in your preferences to get personalized trip recommendations and faster planning.
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
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
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
    backgroundColor: colors.white,
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
