/**
 * FOOD, HEALTH & ACCESSIBILITY PREFERENCES SCREEN
 * 
 * Edit dietary restrictions, food adventurousness, cuisine preferences,
 * spice tolerance, medical conditions, accessibility needs, wheelchair, and pet travel.
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
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, TickCircle } from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, typography, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { 
  preferencesService, 
  TravelPreferences,
  PREFERENCE_OPTIONS,
  DietaryRestriction,
  FoodAdventurousness,
  CuisinePreference,
  SpiceTolerance,
  MedicalCondition,
  AccessibilityNeed,
} from '@/services/preferences.service';

const MAX_CUISINES = 8;

export default function AccessibilityPreferencesScreen() {
  const router = useRouter();
  const { colors: tc } = useTheme();
  const { profile, updateProfile } = useAuth();
  const insets = useSafeAreaInsets();
  const [preferences, setPreferences] = useState<TravelPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Local state for editing
  const [dietaryRestrictions, setDietaryRestrictions] = useState<DietaryRestriction[]>([]);
  const [wheelchairAccessible, setWheelchairAccessible] = useState(false);
  const [travelingWithPet, setTravelingWithPet] = useState(false);
  const [foodAdventurousness, setFoodAdventurousness] = useState<FoodAdventurousness>('somewhat_adventurous');
  const [cuisinePreferences, setCuisinePreferences] = useState<CuisinePreference[]>([]);
  const [spiceTolerance, setSpiceTolerance] = useState<SpiceTolerance>('medium');
  const [medicalConditions, setMedicalConditions] = useState<MedicalCondition[]>([]);
  const [accessibilityNeeds, setAccessibilityNeeds] = useState<AccessibilityNeed[]>([]);
  
  // Packing profile fields (stored on profiles table)
  const [skinTone, setSkinTone] = useState<string>('');
  const [hairType, setHairType] = useState<string>('');
  const [wearsContacts, setWearsContacts] = useState(false);
  const [wearsGlasses, setWearsGlasses] = useState(false);
  const [wearsHearingAid, setWearsHearingAid] = useState(false);

  const fetchPreferences = useCallback(async () => {
    if (!profile?.id) return;
    
    try {
      const { data } = await preferencesService.getPreferences(profile.id);
      if (data) {
        setPreferences(data);
        setDietaryRestrictions(data.dietaryRestrictions || []);
        setWheelchairAccessible(data.wheelchairAccessible);
        setTravelingWithPet(data.travelingWithPet);
        setFoodAdventurousness(data.foodAdventurousness || 'somewhat_adventurous');
        setCuisinePreferences(data.cuisinePreferences || []);
        setSpiceTolerance(data.spiceTolerance || 'medium');
        setMedicalConditions(data.medicalConditions || []);
        setAccessibilityNeeds(data.accessibilityNeeds || []);
      }
      // Load packing profile fields from profile
      if (profile) {
        setSkinTone(profile.skin_tone || '');
        setHairType(profile.hair_type || '');
        setWearsContacts(profile.wears_contacts || false);
        setWearsGlasses(profile.wears_glasses || false);
        setWearsHearingAid(profile.wears_hearing_aid || false);
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
      await Promise.all([
        preferencesService.updateAccessibilityPreferences(
          profile.id,
          dietaryRestrictions,
          wheelchairAccessible,
          travelingWithPet,
          foodAdventurousness,
          cuisinePreferences,
          spiceTolerance,
          medicalConditions,
          accessibilityNeeds,
        ),
        updateProfile({
          skin_tone: skinTone || undefined,
          hair_type: hairType || undefined,
          wears_contacts: wearsContacts,
          wears_glasses: wearsGlasses,
          wears_hearing_aid: wearsHearingAid,
        }),
      ]);
      router.back();
    } catch (error) {
      console.error('Error saving preferences:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleDietary = (restriction: DietaryRestriction) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDietaryRestrictions(prev => prev.includes(restriction) ? prev.filter(r => r !== restriction) : [...prev, restriction]);
  };

  const toggleCuisine = (cuisine: CuisinePreference) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCuisinePreferences(prev => {
      if (prev.includes(cuisine)) return prev.filter(c => c !== cuisine);
      if (prev.length >= MAX_CUISINES) return prev;
      return [...prev, cuisine];
    });
  };

  const toggleMedical = (condition: MedicalCondition) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (condition === 'none') { setMedicalConditions(['none']); return; }
    setMedicalConditions(prev => {
      const filtered = prev.filter(c => c !== 'none');
      if (filtered.includes(condition)) return filtered.filter(c => c !== condition);
      return [...filtered, condition];
    });
  };

  const toggleAccessibility = (need: AccessibilityNeed) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (need === 'none') { setAccessibilityNeeds(['none']); return; }
    setAccessibilityNeeds(prev => {
      const filtered = prev.filter(n => n !== 'none');
      if (filtered.includes(need)) return filtered.filter(n => n !== need);
      return [...filtered, need];
    });
  };

  const hasChanges = () => {
    if (!preferences) return false;
    const prefsChanged = (
      JSON.stringify([...dietaryRestrictions].sort()) !== JSON.stringify([...(preferences.dietaryRestrictions || [])].sort()) ||
      wheelchairAccessible !== preferences.wheelchairAccessible ||
      travelingWithPet !== preferences.travelingWithPet ||
      foodAdventurousness !== preferences.foodAdventurousness ||
      JSON.stringify([...cuisinePreferences].sort()) !== JSON.stringify([...(preferences.cuisinePreferences || [])].sort()) ||
      spiceTolerance !== preferences.spiceTolerance ||
      JSON.stringify([...medicalConditions].sort()) !== JSON.stringify([...(preferences.medicalConditions || [])].sort()) ||
      JSON.stringify([...accessibilityNeeds].sort()) !== JSON.stringify([...(preferences.accessibilityNeeds || [])].sort())
    );
    const profileChanged = (
      skinTone !== (profile?.skin_tone || '') ||
      hairType !== (profile?.hair_type || '') ||
      wearsContacts !== (profile?.wears_contacts || false) ||
      wearsGlasses !== (profile?.wears_glasses || false) ||
      wearsHearingAid !== (profile?.wears_hearing_aid || false)
    );
    return prefsChanged || profileChanged;
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer, { backgroundColor: tc.bgPrimary }]}>
        <StatusBar style={'auto'} />
        <ActivityIndicator size="large" color={tc.primary} />
      </View>
    );
  }
  
  return (
    <View style={[styles.container, { backgroundColor: tc.bgPrimary }]}>
      <StatusBar style={'auto'} />
      
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
          <ArrowLeft size={24} color={tc.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: tc.textPrimary }]}>Food, Health & Access</Text>
        <TouchableOpacity 
          onPress={handleSave} 
          style={[
            styles.saveButton,
            { backgroundColor: tc.primary },
            !hasChanges() && [styles.saveButtonDisabled, { backgroundColor: tc.borderSubtle }],
          ]}
          disabled={!hasChanges() || isSaving}
        >
          <Text
            style={[
              styles.saveButtonText,
              { color: tc.background },
              !hasChanges() && [styles.saveButtonTextDisabled, { color: tc.textTertiary }],
            ]}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Dietary Restrictions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>Dietary restrictions</Text>
          <Text style={[styles.sectionSubtitle, { color: tc.textSecondary }]}>
            We'll filter restaurant and food recommendations
          </Text>
          <View style={styles.chipGrid}>
            {PREFERENCE_OPTIONS.dietaryRestrictions.map(restriction => (
              <TouchableOpacity
                key={restriction}
                style={[
                  styles.chip,
                  { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle },
                  dietaryRestrictions.includes(restriction as DietaryRestriction) && { backgroundColor: `${tc.primary}15`, borderColor: tc.primary },
                ]}
                onPress={() => toggleDietary(restriction as DietaryRestriction)}
              >
                <Text style={[
                  styles.chipLabel,
                  { color: tc.textPrimary },
                  dietaryRestrictions.includes(restriction as DietaryRestriction) && { color: tc.primary },
                ]}>
                  {restriction}
                </Text>
                {dietaryRestrictions.includes(restriction as DietaryRestriction) && (
                  <TickCircle size={16} color={tc.primary} variant="Bold" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Food Adventurousness */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>Food adventurousness</Text>
          <Text style={[styles.sectionSubtitle, { color: tc.textSecondary }]}>
            How daring are you with local cuisine?
          </Text>
          <View style={styles.optionsContainer}>
            {PREFERENCE_OPTIONS.foodAdventurousness.map(option => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionCard,
                  { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle },
                  foodAdventurousness === option.id && { backgroundColor: `${tc.primary}10`, borderColor: tc.primary },
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setFoodAdventurousness(option.id as FoodAdventurousness);
                }}
              >
                <Text style={styles.optionEmoji}>{option.emoji}</Text>
                <View style={styles.optionContent}>
                  <Text style={[styles.optionLabel, { color: tc.textPrimary }, foodAdventurousness === option.id && { color: tc.primary }]}>{option.label}</Text>
                  <Text style={[styles.optionDescription, { color: tc.textSecondary }]}>{option.description}</Text>
                </View>
                {foodAdventurousness === option.id && <TickCircle size={20} color={tc.primary} variant="Bold" />}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Spice Tolerance */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>Spice tolerance</Text>
          <View style={styles.chipGrid}>
            {PREFERENCE_OPTIONS.spiceTolerances.map(option => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.chip,
                  { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle },
                  spiceTolerance === option.id && { backgroundColor: `${tc.primary}15`, borderColor: tc.primary },
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSpiceTolerance(option.id as SpiceTolerance);
                }}
              >
                <Text style={styles.chipEmoji}>{option.emoji}</Text>
                <Text style={[styles.chipLabel, { color: tc.textPrimary }, spiceTolerance === option.id && { color: tc.primary }]}>{option.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Cuisine Preferences */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>Favorite cuisines</Text>
          <Text style={[styles.sectionSubtitle, { color: tc.textSecondary }]}>
            Select up to {MAX_CUISINES} cuisines you love ({cuisinePreferences.length}/{MAX_CUISINES})
          </Text>
          <View style={styles.chipGrid}>
            {PREFERENCE_OPTIONS.cuisinePreferences.map(cuisine => (
              <TouchableOpacity
                key={cuisine.id}
                style={[
                  styles.chip,
                  { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle },
                  cuisinePreferences.includes(cuisine.id as CuisinePreference) && { backgroundColor: `${tc.primary}15`, borderColor: tc.primary },
                ]}
                onPress={() => toggleCuisine(cuisine.id as CuisinePreference)}
              >
                <Text style={styles.chipEmoji}>{cuisine.emoji}</Text>
                <Text style={[styles.chipLabel, { color: tc.textPrimary }, cuisinePreferences.includes(cuisine.id as CuisinePreference) && { color: tc.primary }]}>{cuisine.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Medical Conditions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>Medical conditions</Text>
          <Text style={[styles.sectionSubtitle, { color: tc.textSecondary }]}>
            We'll adapt activities and pacing for your safety
          </Text>
          <View style={styles.chipGrid}>
            {PREFERENCE_OPTIONS.medicalConditions.map(condition => (
              <TouchableOpacity
                key={condition.id}
                style={[
                  styles.chip,
                  { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle },
                  medicalConditions.includes(condition.id as MedicalCondition) && { backgroundColor: `${tc.primary}15`, borderColor: tc.primary },
                ]}
                onPress={() => toggleMedical(condition.id as MedicalCondition)}
              >
                <Text style={styles.chipEmoji}>{condition.emoji}</Text>
                <Text style={[styles.chipLabel, { color: tc.textPrimary }, medicalConditions.includes(condition.id as MedicalCondition) && { color: tc.primary }]}>{condition.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Accessibility Needs */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>Accessibility needs</Text>
          <Text style={[styles.sectionSubtitle, { color: tc.textSecondary }]}>
            We'll prioritize accessible options in your plans
          </Text>
          <View style={styles.chipGrid}>
            {PREFERENCE_OPTIONS.accessibilityNeeds.map(need => (
              <TouchableOpacity
                key={need.id}
                style={[
                  styles.chip,
                  { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle },
                  accessibilityNeeds.includes(need.id as AccessibilityNeed) && { backgroundColor: `${tc.primary}15`, borderColor: tc.primary },
                ]}
                onPress={() => toggleAccessibility(need.id as AccessibilityNeed)}
              >
                <Text style={styles.chipEmoji}>{need.emoji}</Text>
                <Text style={[styles.chipLabel, { color: tc.textPrimary }, accessibilityNeeds.includes(need.id as AccessibilityNeed) && { color: tc.primary }]}>{need.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Packing Profile — Skin Tone */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>Skin tone</Text>
          <Text style={[styles.sectionSubtitle, { color: tc.textSecondary }]}>
            Helps us recommend the right SPF and sun protection
          </Text>
          <View style={styles.chipGrid}>
            {PREFERENCE_OPTIONS.skinTones.map(option => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.chip,
                  { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle },
                  skinTone === option.id && { backgroundColor: `${tc.primary}15`, borderColor: tc.primary },
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSkinTone(prev => prev === option.id ? '' : option.id);
                }}
              >
                <Text style={styles.chipEmoji}>{option.emoji}</Text>
                <Text style={[styles.chipLabel, { color: tc.textPrimary }, skinTone === option.id && { color: tc.primary }]}>{option.label}</Text>
                {skinTone === option.id && (
                  <TickCircle size={16} color={tc.primary} variant="Bold" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Packing Profile — Hair Type */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>Hair type</Text>
          <Text style={[styles.sectionSubtitle, { color: tc.textSecondary }]}>
            We'll suggest the right hair care products for your trip
          </Text>
          <View style={styles.chipGrid}>
            {PREFERENCE_OPTIONS.hairTypes.map(option => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.chip,
                  { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle },
                  hairType === option.id && { backgroundColor: `${tc.primary}15`, borderColor: tc.primary },
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setHairType(prev => prev === option.id ? '' : option.id);
                }}
              >
                <Text style={styles.chipEmoji}>{option.emoji}</Text>
                <Text style={[styles.chipLabel, { color: tc.textPrimary }, hairType === option.id && { color: tc.primary }]}>{option.label}</Text>
                {hairType === option.id && (
                  <TickCircle size={16} color={tc.primary} variant="Bold" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Packing Profile — Vision & Hearing */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>Vision & hearing</Text>
          <Text style={[styles.sectionSubtitle, { color: tc.textSecondary }]}>
            We'll add essential items like lens solution, spare glasses, or hearing aid batteries
          </Text>
          
          <View style={[styles.toggleCard, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle }]}>
            <View style={styles.toggleContent}>
              <Text style={styles.toggleEmoji}>👁️</Text>
              <View style={styles.toggleTextContainer}>
                <Text style={[styles.toggleLabel, { color: tc.textPrimary }]}>I wear contact lenses</Text>
                <Text style={[styles.toggleDescription, { color: tc.textSecondary }]}>
                  Lens solution, spare contacts, backup glasses
                </Text>
              </View>
            </View>
            <Switch
              value={wearsContacts}
              onValueChange={(value) => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setWearsContacts(value);
              }}
              trackColor={{ false: tc.borderSubtle, true: `${tc.primary}50` }}
              thumbColor={wearsContacts ? tc.primary : tc.textSecondary}
            />
          </View>

          <View style={[styles.toggleCard, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle }]}>
            <View style={styles.toggleContent}>
              <Text style={styles.toggleEmoji}>👓</Text>
              <View style={styles.toggleTextContainer}>
                <Text style={[styles.toggleLabel, { color: tc.textPrimary }]}>I wear glasses</Text>
                <Text style={[styles.toggleDescription, { color: tc.textSecondary }]}>
                  Prescription glasses, hard case, cleaning cloth
                </Text>
              </View>
            </View>
            <Switch
              value={wearsGlasses}
              onValueChange={(value) => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setWearsGlasses(value);
              }}
              trackColor={{ false: tc.borderSubtle, true: `${tc.primary}50` }}
              thumbColor={wearsGlasses ? tc.primary : tc.textSecondary}
            />
          </View>

          <View style={[styles.toggleCard, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle }]}>
            <View style={styles.toggleContent}>
              <Text style={styles.toggleEmoji}>🦻</Text>
              <View style={styles.toggleTextContainer}>
                <Text style={[styles.toggleLabel, { color: tc.textPrimary }]}>I wear a hearing aid</Text>
                <Text style={[styles.toggleDescription, { color: tc.textSecondary }]}>
                  Extra batteries, cleaning kit, drying case
                </Text>
              </View>
            </View>
            <Switch
              value={wearsHearingAid}
              onValueChange={(value) => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setWearsHearingAid(value);
              }}
              trackColor={{ false: tc.borderSubtle, true: `${tc.primary}50` }}
              thumbColor={wearsHearingAid ? tc.primary : tc.textSecondary}
            />
          </View>
        </View>

        {/* Toggle Options */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>Additional needs</Text>
          
          <View style={[styles.toggleCard, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle }]}>
            <View style={styles.toggleContent}>
              <Text style={styles.toggleEmoji}>♿</Text>
              <View style={styles.toggleTextContainer}>
                <Text style={[styles.toggleLabel, { color: tc.textPrimary }]}>Wheelchair accessible</Text>
                <Text style={[styles.toggleDescription, { color: tc.textSecondary }]}>
                  Filter for accessible accommodations and activities
                </Text>
              </View>
            </View>
            <Switch
              value={wheelchairAccessible}
              onValueChange={(value) => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setWheelchairAccessible(value);
              }}
              trackColor={{ false: tc.borderSubtle, true: `${tc.primary}50` }}
              thumbColor={wheelchairAccessible ? tc.primary : tc.textSecondary}
            />
          </View>

          <View style={[styles.toggleCard, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle }]}>
            <View style={styles.toggleContent}>
              <Text style={styles.toggleEmoji}>🐕</Text>
              <View style={styles.toggleTextContainer}>
                <Text style={[styles.toggleLabel, { color: tc.textPrimary }]}>Traveling with pet</Text>
                <Text style={[styles.toggleDescription, { color: tc.textSecondary }]}>
                  Show pet-friendly accommodations and activities
                </Text>
              </View>
            </View>
            <Switch
              value={travelingWithPet}
              onValueChange={(value) => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setTravelingWithPet(value);
              }}
              trackColor={{ false: tc.borderSubtle, true: `${tc.primary}50` }}
              thumbColor={travelingWithPet ? tc.primary : tc.textSecondary}
            />
          </View>
        </View>

        {/* Info Card */}
        <View style={[styles.infoCard, { backgroundColor: `${tc.info}10`, borderColor: `${tc.info}20` }]}>
          <Text style={[styles.infoTitle, { color: tc.info }]}>Why we ask this</Text>
          <Text style={[styles.infoText, { color: tc.textSecondary }]}>
            These preferences help us personalize your trip recommendations and packing lists — from restaurant choices and sun protection to toiletry suggestions and safety considerations. This information is kept private and only used to improve your experience.
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
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
    borderColor: colors.borderSubtle,
    gap: spacing.xs,
  },
  chipEmoji: {
    fontSize: 18,
  },
  chipLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
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
  infoCard: {
    backgroundColor: colors.info + '10',
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.info + '20',
  },
  infoTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.info,
    marginBottom: spacing.xs,
  },
  infoText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});
