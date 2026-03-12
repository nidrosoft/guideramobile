/**
 * TRANSPORTATION PREFERENCES SCREEN
 * 
 * Edit travel mode, flight preferences, and local transport.
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
  TravelMode,
  FlightClass,
  FlightStops,
  FlightTimePreference,
  LocalTransport,
} from '@/services/preferences.service';

export default function TransportationPreferencesScreen() {
  const router = useRouter();
  const { colors: tc } = useTheme();
  const { profile } = useAuth();
  const insets = useSafeAreaInsets();
  const [preferences, setPreferences] = useState<TravelPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Local state for editing
  const [travelMode, setTravelMode] = useState<TravelMode>('flight');
  const [flightClass, setFlightClass] = useState<FlightClass>('economy');
  const [flightStops, setFlightStops] = useState<FlightStops>('direct');
  const [flightTime, setFlightTime] = useState<FlightTimePreference>('any');
  const [localTransport, setLocalTransport] = useState<LocalTransport>('mix');

  const fetchPreferences = useCallback(async () => {
    if (!profile?.id) return;
    
    try {
      const { data } = await preferencesService.getPreferences(profile.id);
      if (data) {
        setPreferences(data);
        setTravelMode(data.preferredTravelMode);
        setFlightClass(data.flightClass);
        setFlightStops(data.flightStops);
        setFlightTime(data.flightTimePreference);
        setLocalTransport(data.localTransport);
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
      await preferencesService.updateTransportationPreferences(
        profile.id,
        travelMode,
        flightClass,
        flightStops,
        flightTime,
        localTransport
      );
      router.back();
    } catch (error) {
      console.error('Error saving preferences:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges = () => {
    if (!preferences) return false;
    return (
      travelMode !== preferences.preferredTravelMode ||
      flightClass !== preferences.flightClass ||
      flightStops !== preferences.flightStops ||
      flightTime !== preferences.flightTimePreference ||
      localTransport !== preferences.localTransport
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
        <Text style={[styles.headerTitle, { color: tc.textPrimary }]}>Transportation</Text>
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
        {/* Travel Mode */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>How do you prefer to travel?</Text>
          <Text style={[styles.sectionSubtitle, { color: tc.textSecondary }]}>Select your main mode of transportation</Text>
          <View style={styles.modeGrid}>
            {PREFERENCE_OPTIONS.travelModes.map(mode => (
              <TouchableOpacity
                key={mode.id}
                style={[
                  styles.modeCard,
                  { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle },
                  travelMode === mode.id && { backgroundColor: `${tc.primary}15`, borderColor: tc.primary },
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setTravelMode(mode.id as TravelMode);
                }}
              >
                <Text style={styles.modeEmoji}>{mode.emoji}</Text>
                <Text style={[
                  styles.modeLabel,
                  { color: tc.textPrimary },
                  travelMode === mode.id && { color: tc.primary },
                ]}>
                  {mode.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Flight Preferences - only show if flight is selected */}
        {travelMode === 'flight' && (
          <>
            {/* Flight Class */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>Preferred cabin class</Text>
              <Text style={[styles.sectionSubtitle, { color: tc.textSecondary }]}>Your comfort level on flights</Text>
              <View style={styles.chipsContainer}>
                {PREFERENCE_OPTIONS.flightClasses.map(option => (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.chip,
                      { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle },
                      flightClass === option.id && { backgroundColor: `${tc.primary}15`, borderColor: tc.primary },
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setFlightClass(option.id as FlightClass);
                    }}
                  >
                    <Text style={[
                      styles.chipLabel,
                      { color: tc.textPrimary },
                      flightClass === option.id && { color: tc.primary },
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Flight Stops */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>Stops preference</Text>
              <Text style={[styles.sectionSubtitle, { color: tc.textSecondary }]}>Direct flights or layovers?</Text>
              <View style={styles.chipsContainer}>
                {PREFERENCE_OPTIONS.flightStops.map(option => (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.chip,
                      { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle },
                      flightStops === option.id && { backgroundColor: `${tc.primary}15`, borderColor: tc.primary },
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setFlightStops(option.id as FlightStops);
                    }}
                  >
                    <Text style={[
                      styles.chipLabel,
                      { color: tc.textPrimary },
                      flightStops === option.id && { color: tc.primary },
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Flight Time */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>Preferred departure time</Text>
              <Text style={[styles.sectionSubtitle, { color: tc.textSecondary }]}>When do you like to fly?</Text>
              <View style={styles.timeGrid}>
                {PREFERENCE_OPTIONS.flightTimePreferences.map(option => (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.timeCard,
                      { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle },
                      flightTime === option.id && { backgroundColor: `${tc.primary}15`, borderColor: tc.primary },
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setFlightTime(option.id as FlightTimePreference);
                    }}
                  >
                    <Text style={styles.timeEmoji}>{option.emoji}</Text>
                    <Text style={[
                      styles.timeLabel,
                      { color: tc.textPrimary },
                      flightTime === option.id && { color: tc.primary },
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </>
        )}

        {/* Local Transport */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>Getting around at destination</Text>
          <Text style={[styles.sectionSubtitle, { color: tc.textSecondary }]}>How do you prefer to explore locally?</Text>
          <View style={styles.optionsContainer}>
            {PREFERENCE_OPTIONS.localTransports.map(option => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionCard,
                  { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle },
                  localTransport === option.id && { backgroundColor: `${tc.primary}10`, borderColor: tc.primary },
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setLocalTransport(option.id as LocalTransport);
                }}
              >
                <Text style={styles.optionEmoji}>{option.emoji}</Text>
                <View style={styles.optionContent}>
                  <Text style={[
                    styles.optionLabel,
                    { color: tc.textPrimary },
                    localTransport === option.id && { color: tc.primary },
                  ]}>
                    {option.label}
                  </Text>
                </View>
                {localTransport === option.id && (
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
  modeGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  modeCard: {
    flex: 1,
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.borderSubtle,
  },
  modeCardSelected: {
    backgroundColor: colors.primary + '15',
    borderColor: colors.primary,
  },
  modeEmoji: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  modeLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  modeLabelSelected: {
    color: colors.primary,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
    borderColor: colors.borderSubtle,
  },
  chipSelected: {
    backgroundColor: colors.primary + '15',
    borderColor: colors.primary,
  },
  chipLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  chipLabelSelected: {
    color: colors.primary,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  timeCard: {
    width: '48%',
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.borderSubtle,
  },
  timeCardSelected: {
    backgroundColor: colors.primary + '15',
    borderColor: colors.primary,
  },
  timeEmoji: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  timeLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  timeLabelSelected: {
    color: colors.primary,
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
});
