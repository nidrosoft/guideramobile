/**
 * LIFESTYLE & IDENTITY PREFERENCES SCREEN
 * 
 * Edit activity level, morning person, crowd comfort, photography level,
 * sustainability preference, and default children ages.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Switch,
  TextInput,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft2, TickCircle, Add, Minus } from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, typography, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { 
  preferencesService, 
  TravelPreferences,
  PREFERENCE_OPTIONS,
  ActivityLevel,
  CrowdComfort,
  PhotographyLevel,
  SustainabilityPreference,
} from '@/services/preferences.service';

export default function LifestylePreferencesScreen() {
  const router = useRouter();
  const { colors: tc, isDark } = useTheme();
  const { profile } = useAuth();
  const insets = useSafeAreaInsets();
  const [preferences, setPreferences] = useState<TravelPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Local state for editing
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('moderate');
  const [morningPerson, setMorningPerson] = useState(true);
  const [crowdComfort, setCrowdComfort] = useState<CrowdComfort>('tolerates');
  const [photographyLevel, setPhotographyLevel] = useState<PhotographyLevel>('phone_only');
  const [sustainabilityPreference, setSustainabilityPreference] = useState<SustainabilityPreference>('moderate');
  const [childrenAges, setChildrenAges] = useState<number[]>([]);

  const fetchPreferences = useCallback(async () => {
    if (!profile?.id) return;
    
    try {
      const { data } = await preferencesService.getPreferences(profile.id);
      if (data) {
        setPreferences(data);
        setActivityLevel(data.activityLevel || 'moderate');
        setMorningPerson(data.morningPerson ?? true);
        setCrowdComfort(data.crowdComfort || 'tolerates');
        setPhotographyLevel(data.photographyLevel || 'phone_only');
        setSustainabilityPreference(data.sustainabilityPreference || 'moderate');
        setChildrenAges(data.childrenDefaultAges || []);
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
    } finally {
      setIsLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);
  
  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleSave = async () => {
    if (!profile?.id) return;
    
    setIsSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      await preferencesService.updateLifestylePreferences(
        profile.id,
        activityLevel,
        morningPerson,
        crowdComfort,
        photographyLevel,
        sustainabilityPreference,
        childrenAges,
      );
      router.back();
    } catch (error) {
      console.error('Error saving preferences:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const addChild = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (childrenAges.length < 6) {
      setChildrenAges(prev => [...prev, 5]);
    }
  };

  const removeChild = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setChildrenAges(prev => prev.filter((_, i) => i !== index));
  };

  const updateChildAge = (index: number, age: number) => {
    const clampedAge = Math.max(0, Math.min(17, age));
    setChildrenAges(prev => prev.map((a, i) => i === index ? clampedAge : a));
  };

  const hasChanges = () => {
    if (!preferences) return false;
    return (
      activityLevel !== preferences.activityLevel ||
      morningPerson !== preferences.morningPerson ||
      crowdComfort !== preferences.crowdComfort ||
      photographyLevel !== preferences.photographyLevel ||
      sustainabilityPreference !== preferences.sustainabilityPreference ||
      JSON.stringify(childrenAges) !== JSON.stringify(preferences.childrenDefaultAges || [])
    );
  };

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
        <Text style={[styles.headerTitle, { color: tc.textPrimary }]}>Lifestyle & Identity</Text>
        <TouchableOpacity 
          onPress={handleSave} 
          style={[styles.saveButton, { backgroundColor: hasChanges() ? tc.primary : tc.borderSubtle }]}
          disabled={!hasChanges() || isSaving}
        >
          <Text style={[styles.saveButtonText, { color: hasChanges() ? '#FFFFFF' : tc.textTertiary }]}>
            {isSaving ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Activity Level */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>Activity level</Text>
          <Text style={[styles.sectionSubtitle, { color: tc.textSecondary }]}>
            How physically active do you want your trips to be?
          </Text>
          <View style={styles.optionsContainer}>
            {PREFERENCE_OPTIONS.activityLevels.map(option => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionCard,
                  { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle },
                  activityLevel === option.id && { backgroundColor: `${tc.primary}10`, borderColor: tc.primary },
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setActivityLevel(option.id as ActivityLevel);
                }}
              >
                <Text style={styles.optionEmoji}>{option.emoji}</Text>
                <View style={styles.optionContent}>
                  <Text style={[styles.optionLabel, { color: tc.textPrimary }, activityLevel === option.id && { color: tc.primary }]}>{option.label}</Text>
                  <Text style={[styles.optionDescription, { color: tc.textSecondary }]}>{option.description}</Text>
                </View>
                {activityLevel === option.id && <TickCircle size={20} color={tc.primary} variant="Bold" />}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Morning Person */}
        <View style={styles.section}>
          <View style={[styles.toggleCard, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle }]}>
            <View style={styles.toggleContent}>
              <Text style={styles.toggleEmoji}>🌅</Text>
              <View style={styles.toggleTextContainer}>
                <Text style={[styles.toggleLabel, { color: tc.textPrimary }]}>Morning person</Text>
                <Text style={[styles.toggleDescription, { color: tc.textSecondary }]}>
                  {morningPerson ? 'Early starts, sunrise activities' : 'Sleep in, late night activities'}
                </Text>
              </View>
            </View>
            <Switch
              value={morningPerson}
              onValueChange={(value) => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setMorningPerson(value);
              }}
              trackColor={{ false: isDark ? '#39393D' : '#E9E9EA', true: tc.primary }}
              thumbColor={'#FFFFFF'}
            />
          </View>
        </View>

        {/* Crowd Comfort */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>Crowd comfort</Text>
          <Text style={[styles.sectionSubtitle, { color: tc.textSecondary }]}>
            How do you feel about tourist crowds?
          </Text>
          <View style={styles.optionsContainer}>
            {PREFERENCE_OPTIONS.crowdComforts.map(option => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionCard,
                  { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle },
                  crowdComfort === option.id && { backgroundColor: `${tc.primary}10`, borderColor: tc.primary },
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setCrowdComfort(option.id as CrowdComfort);
                }}
              >
                <Text style={styles.optionEmoji}>{option.emoji}</Text>
                <View style={styles.optionContent}>
                  <Text style={[styles.optionLabel, { color: tc.textPrimary }, crowdComfort === option.id && { color: tc.primary }]}>{option.label}</Text>
                  <Text style={[styles.optionDescription, { color: tc.textSecondary }]}>{option.description}</Text>
                </View>
                {crowdComfort === option.id && <TickCircle size={20} color={tc.primary} variant="Bold" />}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Photography Level */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>Photography interest</Text>
          <Text style={[styles.sectionSubtitle, { color: tc.textSecondary }]}>
            How important is photography to your travel?
          </Text>
          <View style={styles.optionsContainer}>
            {PREFERENCE_OPTIONS.photographyLevels.map(option => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionCard,
                  { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle },
                  photographyLevel === option.id && { backgroundColor: `${tc.primary}10`, borderColor: tc.primary },
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setPhotographyLevel(option.id as PhotographyLevel);
                }}
              >
                <Text style={styles.optionEmoji}>{option.emoji}</Text>
                <View style={styles.optionContent}>
                  <Text style={[styles.optionLabel, { color: tc.textPrimary }, photographyLevel === option.id && { color: tc.primary }]}>{option.label}</Text>
                  <Text style={[styles.optionDescription, { color: tc.textSecondary }]}>{option.description}</Text>
                </View>
                {photographyLevel === option.id && <TickCircle size={20} color={tc.primary} variant="Bold" />}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Sustainability */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>Sustainability</Text>
          <Text style={[styles.sectionSubtitle, { color: tc.textSecondary }]}>
            How important is eco-friendly travel to you?
          </Text>
          <View style={styles.optionsContainer}>
            {PREFERENCE_OPTIONS.sustainabilityPreferences.map(option => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionCard,
                  { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle },
                  sustainabilityPreference === option.id && { backgroundColor: `${tc.primary}10`, borderColor: tc.primary },
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSustainabilityPreference(option.id as SustainabilityPreference);
                }}
              >
                <Text style={styles.optionEmoji}>{option.emoji}</Text>
                <View style={styles.optionContent}>
                  <Text style={[styles.optionLabel, { color: tc.textPrimary }, sustainabilityPreference === option.id && { color: tc.primary }]}>{option.label}</Text>
                  <Text style={[styles.optionDescription, { color: tc.textSecondary }]}>{option.description}</Text>
                </View>
                {sustainabilityPreference === option.id && <TickCircle size={20} color={tc.primary} variant="Bold" />}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Children Default Ages */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>Default children ages</Text>
          <Text style={[styles.sectionSubtitle, { color: tc.textSecondary }]}>
            Pre-fill children ages when planning family trips
          </Text>
          
          {childrenAges.map((age, index) => (
            <View key={index} style={[styles.childRow, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle }]}>
              <Text style={[styles.childLabel, { color: tc.textPrimary }]}>Child {index + 1}</Text>
              <View style={styles.ageControls}>
                <TouchableOpacity
                  style={[styles.ageButton, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle }]}
                  onPress={() => updateChildAge(index, age - 1)}
                >
                  <Minus size={16} color={tc.textPrimary} />
                </TouchableOpacity>
                <Text style={[styles.ageValue, { color: tc.textPrimary }]}>{age} yrs</Text>
                <TouchableOpacity
                  style={[styles.ageButton, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle }]}
                  onPress={() => updateChildAge(index, age + 1)}
                >
                  <Add size={16} color={tc.textPrimary} />
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={styles.removeChild}
                onPress={() => removeChild(index)}
              >
                <Text style={[styles.removeChildText, { color: tc.error }]}>Remove</Text>
              </TouchableOpacity>
            </View>
          ))}
          
          {childrenAges.length < 6 && (
            <TouchableOpacity
              style={[styles.addChildButton, { borderColor: tc.primary }]}
              onPress={addChild}
            >
              <Add size={20} color={tc.primary} />
              <Text style={[styles.addChildText, { color: tc.primary }]}>Add child</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Info Card */}
        <View style={[styles.infoCard, { backgroundColor: `${tc.primary}08`, borderColor: `${tc.primary}15` }]}>
          <Text style={[styles.infoTitle, { color: tc.primary }]}>How we use this</Text>
          <Text style={[styles.infoText, { color: tc.textSecondary }]}>
            These preferences shape your itinerary timing, activity intensity, photo-op scheduling, and eco-friendly recommendations. Children ages help us suggest age-appropriate activities automatically.
          </Text>
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
  saveButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
  },
  saveButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
  },
  section: {
    marginBottom: spacing.xl,
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
    marginBottom: spacing.md,
  },
  optionsContainer: {
    gap: spacing.sm,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.borderSubtle,
  },
  optionEmoji: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  optionContent: {
    flex: 1,
  },
  optionLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  optionDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  toggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  toggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  toggleEmoji: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  toggleTextContainer: {
    flex: 1,
  },
  toggleLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  toggleDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  childRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  childLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
    minWidth: 60,
  },
  ageControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  ageButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  ageValue: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    minWidth: 48,
    textAlign: 'center',
  },
  removeChild: {
    paddingHorizontal: spacing.sm,
  },
  removeChildText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.error,
  },
  addChildButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.xl,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.primary,
  },
  addChildText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
  },
  infoCard: {
    backgroundColor: colors.primary + '08',
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primary + '15',
  },
  infoTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  infoText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});
