/**
 * TRAVEL STYLE PREFERENCES SCREEN
 * 
 * Edit companion type, trip styles, pace, and time preferences.
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
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { 
  preferencesService, 
  TravelPreferences,
  PREFERENCE_OPTIONS,
  CompanionType,
  TripStyle,
  TripPace,
  TimePreference,
} from '@/services/preferences.service';

const MAX_TRIP_STYLES = 4;

export default function TravelStylePreferencesScreen() {
  const router = useRouter();
  const { colors: tc } = useTheme();
  const { profile } = useAuth();
  const insets = useSafeAreaInsets();
  const [preferences, setPreferences] = useState<TravelPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Local state for editing
  const [companionType, setCompanionType] = useState<CompanionType | null>(null);
  const [tripStyles, setTripStyles] = useState<TripStyle[]>([]);
  const [pace, setPace] = useState<TripPace>('moderate');
  const [timePreference, setTimePreference] = useState<TimePreference>('flexible');

  const fetchPreferences = useCallback(async () => {
    if (!profile?.id) return;
    
    try {
      const { data } = await preferencesService.getPreferences(profile.id);
      if (data) {
        setPreferences(data);
        setCompanionType(data.defaultCompanionType);
        setTripStyles(data.preferredTripStyles || []);
        setPace(data.defaultTripPace);
        setTimePreference(data.timePreference);
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
      await preferencesService.updateTravelStyle(
        profile.id,
        companionType,
        tripStyles,
        pace,
        timePreference
      );
      router.back();
    } catch (error) {
      console.error('Error saving preferences:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleTripStyle = (style: TripStyle) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTripStyles(prev => {
      if (prev.includes(style)) {
        return prev.filter(s => s !== style);
      }
      if (prev.length >= MAX_TRIP_STYLES) {
        return prev;
      }
      return [...prev, style];
    });
  };

  const hasChanges = () => {
    if (!preferences) return false;
    return (
      companionType !== preferences.defaultCompanionType ||
      JSON.stringify(tripStyles) !== JSON.stringify(preferences.preferredTripStyles) ||
      pace !== preferences.defaultTripPace ||
      timePreference !== preferences.timePreference
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
          <ArrowLeft size={24} color={tc.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: tc.textPrimary }]}>Travel Style</Text>
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
        {/* Companion Type */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>Who do you usually travel with?</Text>
          <Text style={[styles.sectionSubtitle, { color: tc.textSecondary }]}>Select your typical travel companion</Text>
          <View style={styles.chipsContainer}>
            {PREFERENCE_OPTIONS.companionTypes.map(option => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.chip,
                  { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle },
                  companionType === option.id && { backgroundColor: `${tc.primary}15`, borderColor: tc.primary },
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setCompanionType(option.id as CompanionType);
                }}
              >
                <Text style={styles.chipEmoji}>{option.emoji}</Text>
                <Text style={[
                  styles.chipLabel,
                  { color: tc.textPrimary },
                  companionType === option.id && { color: tc.primary },
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Trip Styles */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>What's your travel vibe?</Text>
          <Text style={[styles.sectionSubtitle, { color: tc.textSecondary }]}>Select up to {MAX_TRIP_STYLES} styles</Text>
          <View style={styles.stylesGrid}>
            {PREFERENCE_OPTIONS.tripStyles.map(style => (
              <TouchableOpacity
                key={style.id}
                style={[
                  styles.styleCard,
                  { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle },
                  tripStyles.includes(style.id as TripStyle) && { backgroundColor: `${tc.primary}15`, borderColor: tc.primary },
                ]}
                onPress={() => toggleTripStyle(style.id as TripStyle)}
              >
                <Text style={styles.styleEmoji}>{style.emoji}</Text>
                <Text style={[
                  styles.styleLabel,
                  { color: tc.textPrimary },
                  tripStyles.includes(style.id as TripStyle) && { color: tc.primary },
                ]}>
                  {style.label}
                </Text>
                {tripStyles.includes(style.id as TripStyle) && (
                  <View style={[styles.checkBadge, { backgroundColor: tc.primary }]}>
                    <TickCircle size={14} color="#FFFFFF" variant="Bold" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Trip Pace */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>Your preferred pace</Text>
          <Text style={[styles.sectionSubtitle, { color: tc.textSecondary }]}>How many activities do you like per day?</Text>
          <View style={styles.optionsContainer}>
            {PREFERENCE_OPTIONS.tripPaces.map(option => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionCard,
                  { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle },
                  pace === option.id && { backgroundColor: `${tc.primary}10`, borderColor: tc.primary },
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setPace(option.id as TripPace);
                }}
              >
                <Text style={styles.optionEmoji}>{option.emoji}</Text>
                <View style={styles.optionContent}>
                  <Text style={[
                    styles.optionLabel,
                    { color: tc.textPrimary },
                    pace === option.id && { color: tc.primary },
                  ]}>
                    {option.label}
                  </Text>
                  <Text style={[styles.optionDescription, { color: tc.textSecondary }]}>{option.description}</Text>
                </View>
                {pace === option.id && (
                  <TickCircle size={20} color={tc.primary} variant="Bold" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Time Preference */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>When do you like to start your day?</Text>
          <Text style={[styles.sectionSubtitle, { color: tc.textSecondary }]}>Your ideal morning routine while traveling</Text>
          <View style={styles.optionsContainer}>
            {PREFERENCE_OPTIONS.timePreferences.map(option => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionCard,
                  { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle },
                  timePreference === option.id && { backgroundColor: `${tc.primary}10`, borderColor: tc.primary },
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setTimePreference(option.id as TimePreference);
                }}
              >
                <Text style={styles.optionEmoji}>{option.emoji}</Text>
                <View style={styles.optionContent}>
                  <Text style={[
                    styles.optionLabel,
                    { color: tc.textPrimary },
                    timePreference === option.id && { color: tc.primary },
                  ]}>
                    {option.label}
                  </Text>
                  <Text style={[styles.optionDescription, { color: tc.textSecondary }]}>{option.description}</Text>
                </View>
                {timePreference === option.id && (
                  <TickCircle size={20} color={tc.primary} variant="Bold" />
                )}
              </TouchableOpacity>
            ))}
          </View>
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
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
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
  chipSelected: {
    backgroundColor: colors.primary + '15',
    borderColor: colors.primary,
  },
  chipEmoji: {
    fontSize: 18,
  },
  chipLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  chipLabelSelected: {
    color: colors.primary,
  },
  stylesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  styleCard: {
    width: '31%',
    aspectRatio: 1,
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.borderSubtle,
    position: 'relative',
    paddingVertical: spacing.sm,
  },
  styleCardSelected: {
    backgroundColor: colors.primary + '15',
    borderColor: colors.primary,
  },
  styleEmoji: {
    fontSize: 28,
  },
  styleLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  styleLabelSelected: {
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
  optionsContainer: {
    gap: spacing.sm,
    marginTop: spacing.md,
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
  optionCardSelected: {
    backgroundColor: colors.primary + '10',
    borderColor: colors.primary,
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
  optionLabelSelected: {
    color: colors.primary,
  },
  optionDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
