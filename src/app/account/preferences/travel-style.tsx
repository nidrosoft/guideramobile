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
  const { user } = useAuth();
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
    if (!user?.id) return;
    
    try {
      const { data } = await preferencesService.getPreferences(user.id);
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
      await preferencesService.updateTravelStyle(
        user.id,
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
        <Text style={styles.headerTitle}>Travel Style</Text>
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
        {/* Companion Type */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Who do you usually travel with?</Text>
          <Text style={styles.sectionSubtitle}>Select your typical travel companion</Text>
          <View style={styles.chipsContainer}>
            {PREFERENCE_OPTIONS.companionTypes.map(option => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.chip,
                  companionType === option.id && styles.chipSelected,
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setCompanionType(option.id as CompanionType);
                }}
              >
                <Text style={styles.chipEmoji}>{option.emoji}</Text>
                <Text style={[
                  styles.chipLabel,
                  companionType === option.id && styles.chipLabelSelected,
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Trip Styles */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What's your travel vibe?</Text>
          <Text style={styles.sectionSubtitle}>Select up to {MAX_TRIP_STYLES} styles</Text>
          <View style={styles.stylesGrid}>
            {PREFERENCE_OPTIONS.tripStyles.map(style => (
              <TouchableOpacity
                key={style.id}
                style={[
                  styles.styleCard,
                  tripStyles.includes(style.id as TripStyle) && styles.styleCardSelected,
                ]}
                onPress={() => toggleTripStyle(style.id as TripStyle)}
              >
                <Text style={styles.styleEmoji}>{style.emoji}</Text>
                <Text style={[
                  styles.styleLabel,
                  tripStyles.includes(style.id as TripStyle) && styles.styleLabelSelected,
                ]}>
                  {style.label}
                </Text>
                {tripStyles.includes(style.id as TripStyle) && (
                  <View style={styles.checkBadge}>
                    <TickCircle size={14} color={colors.white} variant="Bold" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Trip Pace */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your preferred pace</Text>
          <Text style={styles.sectionSubtitle}>How many activities do you like per day?</Text>
          <View style={styles.optionsContainer}>
            {PREFERENCE_OPTIONS.tripPaces.map(option => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionCard,
                  pace === option.id && styles.optionCardSelected,
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
                    pace === option.id && styles.optionLabelSelected,
                  ]}>
                    {option.label}
                  </Text>
                  <Text style={styles.optionDescription}>{option.description}</Text>
                </View>
                {pace === option.id && (
                  <TickCircle size={20} color={colors.primary} variant="Bold" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Time Preference */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>When do you like to start your day?</Text>
          <Text style={styles.sectionSubtitle}>Your ideal morning routine while traveling</Text>
          <View style={styles.optionsContainer}>
            {PREFERENCE_OPTIONS.timePreferences.map(option => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionCard,
                  timePreference === option.id && styles.optionCardSelected,
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
                    timePreference === option.id && styles.optionLabelSelected,
                  ]}>
                    {option.label}
                  </Text>
                  <Text style={styles.optionDescription}>{option.description}</Text>
                </View>
                {timePreference === option.id && (
                  <TickCircle size={20} color={colors.primary} variant="Bold" />
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
    backgroundColor: colors.white,
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
    borderColor: colors.gray200,
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
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.gray200,
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
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.gray200,
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
