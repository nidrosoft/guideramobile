/**
 * TRANSPORTATION STEP
 * 
 * Step 8: How are you getting there and around?
 * Transport mode, flight preferences, and local transport.
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown,
  FadeInUp,
  FadeIn,
} from 'react-native-reanimated';
import {
  ArrowRight2,
  Airplane,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, shadows, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { useAdvancedPlanningStore } from '../../../stores/useAdvancedPlanningStore';
import { 
  TRANSPORT_MODE_OPTIONS,
  FLIGHT_CLASS_OPTIONS,
  FLIGHT_STOPS_OPTIONS,
  FLIGHT_TIME_OPTIONS,
  LOCAL_TRANSPORT_OPTIONS,
} from '../../../config/planning.config';
import { TransportMode } from '../../../types/planning.types';

interface TransportationStepProps {
  onNext: () => void;
  onBack: () => void;
  onClose: () => void;
  onSkip?: () => void;
  isOptional?: boolean;
}

export default function TransportationStep({
  onNext,
  onBack,
  onClose,
  onSkip,
  isOptional,
}: TransportationStepProps) {
  const insets = useSafeAreaInsets();
  const { colors: tc } = useTheme();
  const {
    advancedTripData,
    setTransportMode,
    setFlightClass,
    setFlightStops,
    setFlightTimePreference,
    setLocalTransport,
    setSkipTransportation,
    isTransportationValid,
  } = useAdvancedPlanningStore();
  
  const handleModeSelect = useCallback((mode: TransportMode) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTransportMode(mode);
    if (advancedTripData.skipTransportation) {
      setSkipTransportation(false);
    }
  }, [setTransportMode, advancedTripData.skipTransportation, setSkipTransportation]);
  
  const handleFlightClassSelect = useCallback((id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFlightClass(id as any);
  }, [setFlightClass]);
  
  const handleStopsSelect = useCallback((id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFlightStops(id as any);
  }, [setFlightStops]);
  
  const handleTimeSelect = useCallback((id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFlightTimePreference(id as any);
  }, [setFlightTimePreference]);
  
  const handleLocalSelect = useCallback((id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLocalTransport(id as any);
  }, [setLocalTransport]);
  
  const handleSkip = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSkipTransportation(true);
    onNext();
  }, [setSkipTransportation, onNext]);
  
  const handleContinue = useCallback(() => {
    if (!isTransportationValid()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onNext();
  }, [isTransportationValid, onNext]);
  
  const showFlightOptions = advancedTripData.transportation.gettingThere === 'flight';
  
  return (
    <View style={[styles.container, { backgroundColor: tc.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(400)}>
          <Text style={styles.title}>How are you traveling?</Text>
          <Text style={styles.subtitle}>
            Set your transportation preferences
          </Text>
        </Animated.View>
        
        {/* Getting There */}
        <Animated.View 
          entering={FadeInDown.duration(400).delay(100)}
          style={styles.section}
        >
          <Text style={styles.sectionTitle}>Getting There</Text>
          <View style={styles.modeOptions}>
            {TRANSPORT_MODE_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.modeCard,
                  advancedTripData.transportation.gettingThere === option.id && styles.modeCardSelected,
                ]}
                onPress={() => handleModeSelect(option.id as TransportMode)}
                activeOpacity={0.7}
              >
                <Text style={styles.modeEmoji}>{option.emoji}</Text>
                <Text style={[
                  styles.modeLabel,
                  advancedTripData.transportation.gettingThere === option.id && styles.modeLabelSelected,
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
        
        {/* Flight Preferences */}
        {showFlightOptions && (
          <Animated.View 
            entering={FadeIn.duration(300)}
            style={styles.flightSection}
          >
            <View style={styles.flightHeader}>
              <Airplane size={20} color={colors.primary} variant="Bold" />
              <Text style={styles.flightTitle}>Flight Preferences</Text>
            </View>
            
            {/* Class */}
            <View style={styles.flightOption}>
              <Text style={styles.flightLabel}>Class</Text>
              <View style={styles.segmentedControl}>
                {FLIGHT_CLASS_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.segment,
                      advancedTripData.transportation.flightPreferences?.class === option.id && styles.segmentSelected,
                    ]}
                    onPress={() => handleFlightClassSelect(option.id)}
                  >
                    <Text style={[
                      styles.segmentText,
                      advancedTripData.transportation.flightPreferences?.class === option.id && styles.segmentTextSelected,
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            {/* Stops */}
            <View style={styles.flightOption}>
              <Text style={styles.flightLabel}>Stops</Text>
              <View style={styles.segmentedControl}>
                {FLIGHT_STOPS_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.segment,
                      advancedTripData.transportation.flightPreferences?.stops === option.id && styles.segmentSelected,
                    ]}
                    onPress={() => handleStopsSelect(option.id)}
                  >
                    <Text style={[
                      styles.segmentText,
                      advancedTripData.transportation.flightPreferences?.stops === option.id && styles.segmentTextSelected,
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            {/* Time */}
            <View style={styles.flightOption}>
              <Text style={styles.flightLabel}>Departure Time</Text>
              <View style={styles.timeOptions}>
                {FLIGHT_TIME_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.timeChip,
                      advancedTripData.transportation.flightPreferences?.timePreference === option.id && styles.timeChipSelected,
                    ]}
                    onPress={() => handleTimeSelect(option.id)}
                  >
                    <Text style={[
                      styles.timeText,
                      advancedTripData.transportation.flightPreferences?.timePreference === option.id && styles.timeTextSelected,
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </Animated.View>
        )}
        
        {/* Getting Around */}
        <Animated.View 
          entering={FadeInDown.duration(400).delay(200)}
          style={styles.section}
        >
          <Text style={styles.sectionTitle}>Getting Around</Text>
          <Text style={styles.sectionHint}>How you'll move at your destination</Text>
          
          <View style={styles.localOptions}>
            {LOCAL_TRANSPORT_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.localCard,
                  advancedTripData.transportation.gettingAround === option.id && styles.localCardSelected,
                ]}
                onPress={() => handleLocalSelect(option.id)}
                activeOpacity={0.7}
              >
                <Text style={styles.localEmoji}>{option.emoji}</Text>
                <View style={styles.localContent}>
                  <Text style={[
                    styles.localLabel,
                    advancedTripData.transportation.gettingAround === option.id && styles.localLabelSelected,
                  ]}>
                    {option.label}
                  </Text>
                  <Text style={styles.localDescription}>{option.description}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      </ScrollView>
      
      {/* Footer */}
      <Animated.View 
        entering={FadeInUp.duration(400).delay(300)}
        style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}
      >
        {isOptional && (
          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
            activeOpacity={0.7}
          >
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={[
            styles.continueButton,
            !isTransportationValid() && styles.continueButtonDisabled,
            isOptional && styles.continueButtonWithSkip,
          ]}
          onPress={handleContinue}
          disabled={!isTransportationValid()}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={isTransportationValid() 
              ? [colors.primary, colors.gradientEnd]
              : [colors.gray300, colors.gray400]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.continueGradient}
          >
            <Text style={styles.continueText}>Continue</Text>
            <ArrowRight2 size={20} color={colors.white} />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  
  // Section
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  sectionHint: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  
  // Mode Options - Compact cards
  modeOptions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  modeCard: {
    flex: 1,
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.gray200,
  },
  modeCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  modeEmoji: {
    fontSize: 28,
    marginBottom: spacing.xs,
  },
  modeLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  modeLabelSelected: {
    color: colors.primary,
    fontWeight: typography.fontWeight.semibold,
  },
  
  // Flight Section
  flightSection: {
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.gray100,
  },
  flightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  flightTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  flightOption: {
    marginBottom: spacing.md,
  },
  flightLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  
  // Segmented Control - Matches Flight SearchStep
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: colors.gray100,
    borderRadius: borderRadius.lg,
    padding: 3,
  },
  segment: {
    flex: 1,
    paddingVertical: spacing.xs,
    alignItems: 'center',
    borderRadius: borderRadius.md,
  },
  segmentSelected: {
    backgroundColor: colors.bgElevated,
  },
  segmentText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
  },
  segmentTextSelected: {
    color: colors.primary,
  },
  
  // Time Options - Chip style
  timeOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  timeChip: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
    borderColor: colors.gray200,
  },
  timeChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  timeText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  timeTextSelected: {
    color: colors.white,
    fontWeight: typography.fontWeight.medium,
  },
  
  // Local Options - Card style
  localOptions: {
    gap: spacing.sm,
  },
  localCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.gray200,
  },
  localCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  localEmoji: {
    fontSize: 20,
    marginRight: spacing.md,
  },
  localContent: {
    flex: 1,
  },
  localLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  localLabelSelected: {
    color: colors.primary,
  },
  localDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  
  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  skipButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.xl,
    borderWidth: 2,
    borderColor: colors.gray300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
  },
  continueButton: {
    flex: 1,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.md,
  },
  continueButtonWithSkip: {
    flex: 2,
  },
  continueButtonDisabled: {
    opacity: 0.7,
  },
  continueGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  continueText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
});
