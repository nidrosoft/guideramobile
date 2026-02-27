/**
 * INTERESTS PREFERENCES SCREEN
 * 
 * Edit user's travel interests (3-5 selections).
 */

import React, { useState, useEffect, useCallback } from 'react';
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
import { ArrowLeft, TickCircle } from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, typography, borderRadius } from '@/styles';
import { useAuth } from '@/context/AuthContext';
import { 
  preferencesService, 
  TravelPreferences,
  PREFERENCE_OPTIONS,
  InterestCategory,
} from '@/services/preferences.service';

const MIN_INTERESTS = 3;
const MAX_INTERESTS = 5;

export default function InterestsPreferencesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [preferences, setPreferences] = useState<TravelPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Local state for editing
  const [interests, setInterests] = useState<InterestCategory[]>([]);

  const fetchPreferences = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const { data } = await preferencesService.getPreferences(user.id);
      if (data) {
        setPreferences(data);
        setInterests(data.interests || []);
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);
  
  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleSave = async () => {
    if (!user?.id || interests.length < MIN_INTERESTS) return;
    
    setIsSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      await preferencesService.updateInterests(user.id, interests);
      router.back();
    } catch (error) {
      console.error('Error saving preferences:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleInterest = (interest: InterestCategory) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setInterests(prev => {
      if (prev.includes(interest)) {
        return prev.filter(i => i !== interest);
      }
      if (prev.length >= MAX_INTERESTS) {
        return prev;
      }
      return [...prev, interest];
    });
  };

  const hasChanges = () => {
    if (!preferences) return false;
    return JSON.stringify(interests) !== JSON.stringify(preferences.interests);
  };

  const canSave = interests.length >= MIN_INTERESTS && hasChanges();

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
        <Text style={styles.headerTitle}>Interests</Text>
        <TouchableOpacity 
          onPress={handleSave} 
          style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
          disabled={!canSave || isSaving}
        >
          <Text style={[styles.saveButtonText, !canSave && styles.saveButtonTextDisabled]}>
            {isSaving ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Counter */}
        <View style={[
          styles.counterBadge,
          interests.length >= MIN_INTERESTS && styles.counterBadgeValid,
        ]}>
          <Text style={[
            styles.counterText,
            interests.length >= MIN_INTERESTS && styles.counterTextValid,
          ]}>
            {interests.length} of {MAX_INTERESTS} selected
            {interests.length < MIN_INTERESTS && ` (min ${MIN_INTERESTS})`}
          </Text>
        </View>

        {/* Interests Grid */}
        <Text style={styles.sectionTitle}>What do you love to do when traveling?</Text>
        <Text style={styles.sectionSubtitle}>
          Select {MIN_INTERESTS}-{MAX_INTERESTS} interests to personalize your recommendations
        </Text>
        
        <View style={styles.interestsGrid}>
          {PREFERENCE_OPTIONS.interests.map(interest => (
            <TouchableOpacity
              key={interest.id}
              style={[
                styles.interestCard,
                interests.includes(interest.id as InterestCategory) && styles.interestCardSelected,
              ]}
              onPress={() => toggleInterest(interest.id as InterestCategory)}
            >
              <Text style={styles.interestEmoji}>{interest.emoji}</Text>
              <Text style={[
                styles.interestLabel,
                interests.includes(interest.id as InterestCategory) && styles.interestLabelSelected,
              ]}>
                {interest.label}
              </Text>
              {interests.includes(interest.id as InterestCategory) && (
                <View style={styles.checkBadge}>
                  <TickCircle size={14} color={colors.white} variant="Bold" />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
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
  saveButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
  },
  saveButtonDisabled: {
    backgroundColor: colors.gray200,
  },
  saveButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
  saveButtonTextDisabled: {
    color: colors.gray400,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
  },
  counterBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.gray100,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    marginBottom: spacing.lg,
  },
  counterBadgeValid: {
    backgroundColor: colors.success + '20',
  },
  counterText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
  },
  counterTextValid: {
    color: colors.success,
  },
  sectionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  interestsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  interestCard: {
    width: '31%',
    aspectRatio: 1,
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.gray200,
    position: 'relative',
    paddingVertical: spacing.sm,
  },
  interestCardSelected: {
    backgroundColor: colors.primary + '15',
    borderColor: colors.primary,
  },
  interestEmoji: {
    fontSize: 32,
  },
  interestLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  interestLabelSelected: {
    color: colors.primary,
  },
  checkBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
