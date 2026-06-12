/**
 * PROFILE STRENGTH HUB
 *
 * The guidance "Profile Strength" hub: shows the user's profile strength ring,
 * quick wins (highest-impact unset fields), pending facts to review, and an
 * entry point to the full travel profile.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft2,
  ArrowRight2,
  Add,
  TickCircle,
  CloseCircle,
  InfoCircle,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, typography, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from 'react-i18next';
import type { TravelPreferences } from '@/services/preferences.service';
import {
  ProfileStrengthRing,
  profileStrength,
  strengthTier,
  useGuidanceStore,
  FIELD_META,
} from '@/features/guidance';
import { loadPreferences, applyFact } from '@/features/guidance/profile/profileCapture';
import type { ProfileField } from '@/features/guidance';

export default function ProfileStrengthScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const insets = useSafeAreaInsets();
  const { colors: tc } = useTheme();
  const { t } = useTranslation();

  const pendingFacts = useGuidanceStore((s) => s.state.pendingFacts);
  const removePendingFact = useGuidanceStore((s) => s.removePendingFact);

  const [prefs, setPrefs] = useState<TravelPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPrefs = useCallback(async () => {
    if (!profile?.id) return;
    try {
      const data = await loadPreferences(profile.id);
      setPrefs(data);
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setIsLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    fetchPrefs();
  }, [fetchPrefs]);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const goToFullProfile = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/account/travel-preferences');
  };

  const strength = useMemo(() => profileStrength(prefs, profile), [prefs, profile]);
  const tier = strengthTier(strength);
  const tierLabel =
    tier === 'travel_ready'
      ? t('guidance.hub.tierTravelReady')
      : tier === 'looking_good'
        ? t('guidance.hub.tierLookingGood')
        : t('guidance.hub.tierGettingStarted');

  // Top 3 highest-impact fields that aren't set yet.
  const quickWins = useMemo(() => {
    return Object.values(FIELD_META)
      .filter((meta) => meta.isSet(prefs) === false)
      .sort((a, b) => b.impact - a.impact)
      .slice(0, 3);
  }, [prefs]);

  const handleConfirmFact = async (field: ProfileField, value: any) => {
    if (!profile?.id) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await applyFact(profile.id, field, value);
    } catch (error) {
      console.error('Error applying fact:', error);
    }
    removePendingFact(field);
    fetchPrefs();
  };

  const handleDismissFact = (field: ProfileField) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    removePendingFact(field);
  };

  const personalizationOff = profile?.privacy_settings?.personalization === false;

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
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + spacing.sm,
            backgroundColor: tc.bgElevated,
            borderBottomColor: tc.borderSubtle,
          },
        ]}
      >
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ArrowLeft2 size={24} color={tc.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: tc.textPrimary }]}>
          {t('guidance.hub.title')}
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Privacy banner */}
        {personalizationOff && (
          <View
            style={[
              styles.bannerCard,
              { backgroundColor: `${tc.warning}15`, borderColor: `${tc.warning}30` },
            ]}
          >
            <InfoCircle size={20} color={tc.warning} variant="Bold" />
            <Text style={[styles.bannerText, { color: tc.textSecondary }]}>
              {t('guidance.hub.privacyOff')}
            </Text>
          </View>
        )}

        {/* Hero */}
        <View style={styles.hero}>
          <ProfileStrengthRing
            value={strength}
            size={110}
            strokeWidth={9}
            label={t('guidance.hub.ringLabel')}
          />
          <Text style={[styles.tierLabel, { color: tc.textPrimary }]}>{tierLabel}</Text>
        </View>

        {/* Quick wins */}
        {quickWins.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>
              {t('guidance.hub.quickWins')}
            </Text>
            <Text style={[styles.sectionSubtitle, { color: tc.textTertiary }]}>
              {t('guidance.hub.quickWinsSubtitle')}
            </Text>
            <View style={styles.cardsContainer}>
              {quickWins.map((meta) => (
                <TouchableOpacity
                  key={meta.field}
                  style={[
                    styles.quickWinCard,
                    { backgroundColor: tc.bgCard, borderColor: tc.borderSubtle },
                  ]}
                  onPress={goToFullProfile}
                  activeOpacity={0.7}
                >
                  <View style={[styles.quickWinIcon, { backgroundColor: `${tc.primary}15` }]}>
                    <Add size={22} color={tc.primary} />
                  </View>
                  <Text style={[styles.quickWinText, { color: tc.textPrimary }]} numberOfLines={2}>
                    {t(`guidance.prompts.${meta.copyKey}.benefit`)}
                  </Text>
                  <ArrowRight2 size={20} color={tc.textTertiary} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Suggestions to review */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>
            {t('guidance.hub.suggestions')}
          </Text>
          {pendingFacts.length === 0 ? (
            <View
              style={[
                styles.emptyCard,
                { backgroundColor: tc.bgCard, borderColor: tc.borderSubtle },
              ]}
            >
              <Text style={[styles.emptyText, { color: tc.textTertiary }]}>
                {t('guidance.hub.suggestionsEmpty')}
              </Text>
            </View>
          ) : (
            <View style={styles.cardsContainer}>
              {pendingFacts.map((fact) => {
                const meta = FIELD_META[fact.field];
                return (
                  <View
                    key={fact.field}
                    style={[
                      styles.suggestionCard,
                      { backgroundColor: tc.bgCard, borderColor: tc.borderSubtle },
                    ]}
                  >
                    <Text style={[styles.suggestionText, { color: tc.textPrimary }]}>
                      {meta ? t(`guidance.prompts.${meta.copyKey}.benefit`) : String(fact.value)}
                    </Text>
                    <View style={styles.suggestionActions}>
                      <TouchableOpacity
                        style={[
                          styles.actionButton,
                          styles.confirmButton,
                          { backgroundColor: tc.primary },
                        ]}
                        onPress={() => handleConfirmFact(fact.field, fact.value)}
                        activeOpacity={0.8}
                      >
                        <TickCircle size={16} color={colors.white} variant="Bold" />
                        <Text style={[styles.confirmButtonText, { color: colors.white }]}>
                          {t('guidance.hub.confirm')}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.actionButton,
                          styles.dismissButton,
                          { borderColor: tc.borderSubtle },
                        ]}
                        onPress={() => handleDismissFact(fact.field)}
                        activeOpacity={0.8}
                      >
                        <CloseCircle size={16} color={tc.textTertiary} variant="Bold" />
                        <Text style={[styles.dismissButtonText, { color: tc.textSecondary }]}>
                          {t('guidance.hub.deny')}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Why this matters */}
        <View style={[styles.whyCard, { backgroundColor: `${tc.primary}10` }]}>
          <Text style={[styles.whyTitle, { color: tc.primary }]}>{t('guidance.hub.why')}</Text>
          <Text style={[styles.whyBody, { color: tc.textSecondary }]}>
            {t('guidance.hub.whyBody')}
          </Text>
        </View>

        {/* Edit full profile */}
        <TouchableOpacity
          style={[styles.editButton, { backgroundColor: tc.primary }]}
          onPress={goToFullProfile}
          activeOpacity={0.8}
        >
          <Text style={[styles.editButtonText, { color: colors.white }]}>
            {t('guidance.hub.editFull')}
          </Text>
        </TouchableOpacity>
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
    fontFamily: 'HostGrotesk-Bold',
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
    paddingBottom: spacing['3xl'],
  },
  bannerCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    borderWidth: 1,
    marginBottom: spacing.lg,
  },
  bannerText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    fontFamily: 'Rubik-Regular',
    lineHeight: 20,
  },
  hero: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  tierLabel: {
    fontSize: typography.fontSize.lg,
    fontFamily: 'HostGrotesk-Bold',
    marginTop: spacing.md,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: 'HostGrotesk-Bold',
    marginBottom: 2,
  },
  sectionSubtitle: {
    fontSize: typography.fontSize.sm,
    fontFamily: 'Rubik-Regular',
    marginBottom: spacing.md,
  },
  cardsContainer: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  quickWinCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    borderWidth: 1,
  },
  quickWinIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  quickWinText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    fontFamily: 'Rubik-Medium',
    lineHeight: 20,
    marginRight: spacing.sm,
  },
  emptyCard: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  emptyText: {
    fontSize: typography.fontSize.sm,
    fontFamily: 'Rubik-Regular',
  },
  suggestionCard: {
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    borderWidth: 1,
  },
  suggestionText: {
    fontSize: typography.fontSize.sm,
    fontFamily: 'Rubik-Medium',
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  suggestionActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    gap: spacing.xs,
  },
  confirmButton: {
    backgroundColor: colors.primary,
  },
  confirmButtonText: {
    fontSize: typography.fontSize.sm,
    fontFamily: 'Rubik-SemiBold',
  },
  dismissButton: {
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  dismissButtonText: {
    fontSize: typography.fontSize.sm,
    fontFamily: 'Rubik-SemiBold',
  },
  whyCard: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  whyTitle: {
    fontSize: typography.fontSize.base,
    fontFamily: 'HostGrotesk-Bold',
    marginBottom: spacing.xs,
  },
  whyBody: {
    fontSize: typography.fontSize.sm,
    fontFamily: 'Rubik-Regular',
    lineHeight: 20,
  },
  editButton: {
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    backgroundColor: colors.primary,
  },
  editButtonText: {
    fontSize: typography.fontSize.base,
    fontFamily: 'Rubik-SemiBold',
  },
});
