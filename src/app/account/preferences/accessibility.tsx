/**
 * ACCESSIBILITY PREFERENCES SCREEN
 * 
 * Edit dietary restrictions, wheelchair accessibility, and pet travel.
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
} from '@/services/preferences.service';

export default function AccessibilityPreferencesScreen() {
  const router = useRouter();
  const { colors: tc } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [preferences, setPreferences] = useState<TravelPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Local state for editing
  const [dietaryRestrictions, setDietaryRestrictions] = useState<DietaryRestriction[]>([]);
  const [wheelchairAccessible, setWheelchairAccessible] = useState(false);
  const [travelingWithPet, setTravelingWithPet] = useState(false);

  const fetchPreferences = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const { data } = await preferencesService.getPreferences(user.id);
      if (data) {
        setPreferences(data);
        setDietaryRestrictions(data.dietaryRestrictions || []);
        setWheelchairAccessible(data.wheelchairAccessible);
        setTravelingWithPet(data.travelingWithPet);
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
    if (!user?.id) return;
    
    setIsSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      await preferencesService.updateAccessibilityPreferences(
        user.id,
        dietaryRestrictions,
        wheelchairAccessible,
        travelingWithPet
      );
      router.back();
    } catch (error) {
      console.error('Error saving preferences:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleDietary = (restriction: DietaryRestriction) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDietaryRestrictions(prev => {
      if (prev.includes(restriction)) {
        return prev.filter(r => r !== restriction);
      }
      return [...prev, restriction];
    });
  };

  const hasChanges = () => {
    if (!preferences) return false;
    return (
      JSON.stringify(dietaryRestrictions.sort()) !== JSON.stringify((preferences.dietaryRestrictions || []).sort()) ||
      wheelchairAccessible !== preferences.wheelchairAccessible ||
      travelingWithPet !== preferences.travelingWithPet
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }
  
  return (
    <View style={[styles.container, { backgroundColor: tc.background }]}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ArrowLeft size={24} color={tc.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Dietary & Accessibility</Text>
        <TouchableOpacity 
          onPress={handleSave} 
          style={[styles.saveButton, !hasChanges() && styles.saveButtonDisabled]}
          disabled={!hasChanges() || isSaving}
        >
          <Text style={[styles.saveButtonText, !hasChanges() && styles.saveButtonTextDisabled]}>
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
          <Text style={styles.sectionTitle}>Dietary restrictions</Text>
          <Text style={styles.sectionSubtitle}>
            We'll use this to filter restaurant and food recommendations
          </Text>
          <View style={styles.dietaryGrid}>
            {PREFERENCE_OPTIONS.dietaryRestrictions.map(restriction => (
              <TouchableOpacity
                key={restriction}
                style={[
                  styles.dietaryChip,
                  dietaryRestrictions.includes(restriction as DietaryRestriction) && styles.dietaryChipSelected,
                ]}
                onPress={() => toggleDietary(restriction as DietaryRestriction)}
              >
                <Text style={[
                  styles.dietaryLabel,
                  dietaryRestrictions.includes(restriction as DietaryRestriction) && styles.dietaryLabelSelected,
                ]}>
                  {restriction}
                </Text>
                {dietaryRestrictions.includes(restriction as DietaryRestriction) && (
                  <TickCircle size={16} color={colors.primary} variant="Bold" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Accessibility Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Accessibility needs</Text>
          
          <View style={styles.toggleCard}>
            <View style={styles.toggleContent}>
              <Text style={styles.toggleEmoji}>♿</Text>
              <View style={styles.toggleTextContainer}>
                <Text style={styles.toggleLabel}>Wheelchair accessible</Text>
                <Text style={styles.toggleDescription}>
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
              trackColor={{ false: colors.gray200, true: colors.primary + '50' }}
              thumbColor={wheelchairAccessible ? colors.primary : colors.gray400}
            />
          </View>

          <View style={styles.toggleCard}>
            <View style={styles.toggleContent}>
              <Text style={styles.toggleEmoji}>🐕</Text>
              <View style={styles.toggleTextContainer}>
                <Text style={styles.toggleLabel}>Traveling with pet</Text>
                <Text style={styles.toggleDescription}>
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
              trackColor={{ false: colors.gray200, true: colors.primary + '50' }}
              thumbColor={travelingWithPet ? colors.primary : colors.gray400}
            />
          </View>
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Why we ask this</Text>
          <Text style={styles.infoText}>
            These preferences help us personalize your trip recommendations and ensure we suggest places that meet your needs. This information is kept private and only used to improve your experience.
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
  dietaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  dietaryChip: {
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
  dietaryChipSelected: {
    backgroundColor: colors.primary + '15',
    borderColor: colors.primary,
  },
  dietaryLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  dietaryLabelSelected: {
    color: colors.primary,
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
