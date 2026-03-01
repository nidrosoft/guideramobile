/**
 * INTERESTS STEP
 * 
 * Step 6: What do you love?
 * Interest selection, pace, and time preferences.
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
  TickCircle,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, shadows, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { useAdvancedPlanningStore } from '../../../stores/useAdvancedPlanningStore';
import { 
  INTEREST_OPTIONS, 
  TRIP_PACE_OPTIONS,
  TIME_PREFERENCE_OPTIONS,
  MAX_INTERESTS,
  MIN_INTERESTS,
} from '../../../config/planning.config';
import { InterestCategory } from '../../../types/planning.types';

interface InterestsStepProps {
  onNext: () => void;
  onBack: () => void;
  onClose: () => void;
}

export default function InterestsStep({
  onNext,
  onBack,
  onClose,
}: InterestsStepProps) {
  const insets = useSafeAreaInsets();
  const { colors: tc } = useTheme();
  const {
    advancedTripData,
    toggleInterest,
    setPace,
    setTimePreference,
    isInterestsValid,
  } = useAdvancedPlanningStore();
  
  const handleToggleInterest = useCallback((interest: InterestCategory) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleInterest(interest);
  }, [toggleInterest]);
  
  const handlePaceSelect = useCallback((id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPace(id as any);
  }, [setPace]);
  
  const handleTimeSelect = useCallback((id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTimePreference(id as any);
  }, [setTimePreference]);
  
  const handleContinue = useCallback(() => {
    if (!isInterestsValid()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onNext();
  }, [isInterestsValid, onNext]);
  
  const isSelected = (interest: InterestCategory) => 
    advancedTripData.interests.includes(interest);
  
  const selectionCount = advancedTripData.interests.length;
  
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
          <Text style={styles.title}>What do you love?</Text>
          <Text style={styles.subtitle}>
            Pick {MIN_INTERESTS}-{MAX_INTERESTS} interests to personalize your trip
          </Text>
        </Animated.View>
        
        {/* Selection Counter */}
        <Animated.View 
          entering={FadeInDown.duration(400).delay(50)}
          style={[
            styles.counterBadge,
            selectionCount >= MIN_INTERESTS && styles.counterBadgeValid,
          ]}
        >
          <Text style={[
            styles.counterText,
            selectionCount >= MIN_INTERESTS && styles.counterTextValid,
          ]}>
            {selectionCount} of {MAX_INTERESTS} selected
            {selectionCount < MIN_INTERESTS && ` (min ${MIN_INTERESTS})`}
          </Text>
        </Animated.View>
        
        {/* Interest Grid */}
        <Animated.View 
          entering={FadeInDown.duration(400).delay(100)}
          style={styles.interestsGrid}
        >
          {INTEREST_OPTIONS.map((interest, index) => (
            <Animated.View
              key={interest.id}
              entering={FadeIn.duration(300).delay(index * 30)}
            >
              <TouchableOpacity
                style={[
                  styles.interestCard,
                  isSelected(interest.id) && styles.interestCardSelected,
                ]}
                onPress={() => handleToggleInterest(interest.id)}
                activeOpacity={0.7}
              >
                <Text style={styles.interestEmoji}>{interest.emoji}</Text>
                <Text style={[
                  styles.interestLabel,
                  isSelected(interest.id) && styles.interestLabelSelected,
                ]}>
                  {interest.label}
                </Text>
                {isSelected(interest.id) && (
                  <View style={styles.checkBadge}>
                    <TickCircle size={14} color={colors.white} variant="Bold" />
                  </View>
                )}
              </TouchableOpacity>
            </Animated.View>
          ))}
        </Animated.View>
        
        {/* Trip Pace */}
        <Animated.View 
          entering={FadeInDown.duration(400).delay(200)}
          style={styles.section}
        >
          <Text style={styles.sectionTitle}>Trip Pace</Text>
          <Text style={styles.sectionHint}>How packed should your days be?</Text>
          
          <View style={styles.paceOptions}>
            {TRIP_PACE_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.paceCard,
                  advancedTripData.pace === option.id && styles.paceCardSelected,
                ]}
                onPress={() => handlePaceSelect(option.id)}
                activeOpacity={0.7}
              >
                <Text style={styles.paceEmoji}>{option.emoji}</Text>
                <Text style={[
                  styles.paceLabel,
                  advancedTripData.pace === option.id && styles.paceLabelSelected,
                ]}>
                  {option.label}
                </Text>
                <Text style={styles.paceDescription}>{option.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
        
        {/* Time Preference */}
        <Animated.View 
          entering={FadeInDown.duration(400).delay(300)}
          style={styles.section}
        >
          <Text style={styles.sectionTitle}>Time Preference</Text>
          
          <View style={styles.timeOptions}>
            {TIME_PREFERENCE_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.timeChip,
                  advancedTripData.timePreference === option.id && styles.timeChipSelected,
                ]}
                onPress={() => handleTimeSelect(option.id)}
                activeOpacity={0.7}
              >
                <Text style={styles.timeEmoji}>{option.emoji}</Text>
                <Text style={[
                  styles.timeLabel,
                  advancedTripData.timePreference === option.id && styles.timeLabelSelected,
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      </ScrollView>
      
      {/* Continue Button */}
      <Animated.View 
        entering={FadeInUp.duration(400).delay(300)}
        style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}
      >
        <TouchableOpacity
          style={[
            styles.continueButton,
            !isInterestsValid() && styles.continueButtonDisabled,
          ]}
          onPress={handleContinue}
          disabled={!isInterestsValid()}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={isInterestsValid() 
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
    marginBottom: spacing.md,
  },
  
  // Counter Badge
  counterBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.gray100,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginBottom: spacing.lg,
  },
  counterBadgeValid: {
    backgroundColor: colors.primary + '15',
  },
  counterText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
  },
  counterTextValid: {
    color: colors.primary,
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
  
  // Interests Grid - Matches StyleStep chip pattern
  interestsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  interestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.gray200,
    gap: spacing.xs,
  },
  interestCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '15',
  },
  interestEmoji: {
    fontSize: 16,
  },
  interestLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  interestLabelSelected: {
    color: colors.primary,
  },
  checkBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Pace Options - Compact cards matching hotel/flight patterns
  paceOptions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  paceCard: {
    flex: 1,
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.gray200,
  },
  paceCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  paceEmoji: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  paceLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  paceLabelSelected: {
    color: colors.primary,
    fontWeight: typography.fontWeight.semibold,
  },
  paceDescription: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  
  // Time Options - Chip style matching StyleStep
  timeOptions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  timeChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.gray200,
    gap: spacing.xs,
  },
  timeChipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '15',
  },
  timeEmoji: {
    fontSize: 16,
  },
  timeLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  timeLabelSelected: {
    color: colors.primary,
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
  },
  continueButton: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.md,
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
