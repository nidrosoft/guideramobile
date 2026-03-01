/**
 * ACCOMMODATION STEP
 * 
 * Step 7: Where do you want to stay?
 * Accommodation type, star rating, location, and amenities.
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
  Star1,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, shadows, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { useAdvancedPlanningStore } from '../../../stores/useAdvancedPlanningStore';
import { 
  ACCOMMODATION_TYPE_OPTIONS,
  STAR_RATING_OPTIONS,
  LOCATION_PRIORITY_OPTIONS,
  AMENITY_OPTIONS,
} from '../../../config/planning.config';
import { AccommodationType } from '../../../types/planning.types';

interface AccommodationStepProps {
  onNext: () => void;
  onBack: () => void;
  onClose: () => void;
  onSkip?: () => void;
  isOptional?: boolean;
}

export default function AccommodationStep({
  onNext,
  onBack,
  onClose,
  onSkip,
  isOptional,
}: AccommodationStepProps) {
  const insets = useSafeAreaInsets();
  const { colors: tc } = useTheme();
  const {
    advancedTripData,
    setAccommodationType,
    toggleStarRating,
    setLocationPriority,
    toggleAmenity,
    setSkipAccommodation,
    isAccommodationValid,
  } = useAdvancedPlanningStore();
  
  const handleTypeSelect = useCallback((type: AccommodationType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setAccommodationType(type);
    if (advancedTripData.skipAccommodation) {
      setSkipAccommodation(false);
    }
  }, [setAccommodationType, advancedTripData.skipAccommodation, setSkipAccommodation]);
  
  const handleStarToggle = useCallback((rating: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleStarRating(rating);
  }, [toggleStarRating]);
  
  const handleLocationSelect = useCallback((id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLocationPriority(id as any);
  }, [setLocationPriority]);
  
  const handleAmenityToggle = useCallback((id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleAmenity(id);
  }, [toggleAmenity]);
  
  const handleSkip = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSkipAccommodation(true);
    onNext();
  }, [setSkipAccommodation, onNext]);
  
  const handleContinue = useCallback(() => {
    if (!isAccommodationValid()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onNext();
  }, [isAccommodationValid, onNext]);
  
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
          <Text style={styles.title}>Where to stay?</Text>
          <Text style={styles.subtitle}>
            Set your accommodation preferences
          </Text>
        </Animated.View>
        
        {/* Accommodation Type */}
        <Animated.View 
          entering={FadeInDown.duration(400).delay(100)}
          style={styles.section}
        >
          <Text style={styles.sectionTitle}>Type of Stay</Text>
          <View style={styles.typeGrid}>
            {ACCOMMODATION_TYPE_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.typeCard,
                  advancedTripData.accommodation.type === option.id && styles.typeCardSelected,
                ]}
                onPress={() => handleTypeSelect(option.id as AccommodationType)}
                activeOpacity={0.7}
              >
                <Text style={styles.typeEmoji}>{option.emoji}</Text>
                <Text style={[
                  styles.typeLabel,
                  advancedTripData.accommodation.type === option.id && styles.typeLabelSelected,
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
        
        {/* Star Rating */}
        <Animated.View 
          entering={FadeInDown.duration(400).delay(150)}
          style={styles.section}
        >
          <Text style={styles.sectionTitle}>Star Rating</Text>
          <Text style={styles.sectionHint}>Select all that work for you</Text>
          <View style={styles.starOptions}>
            {STAR_RATING_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.starChip,
                  advancedTripData.accommodation.starRating.includes(option.value) && styles.starChipSelected,
                ]}
                onPress={() => handleStarToggle(option.value)}
                activeOpacity={0.7}
              >
                <View style={styles.starRow}>
                  {Array.from({ length: option.value }).map((_, i) => (
                    <Star1 
                      key={i} 
                      size={14} 
                      color={advancedTripData.accommodation.starRating.includes(option.value) 
                        ? colors.primary 
                        : colors.warning
                      } 
                      variant="Bold" 
                    />
                  ))}
                </View>
                <Text style={[
                  styles.starLabel,
                  advancedTripData.accommodation.starRating.includes(option.value) && styles.starLabelSelected,
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
        
        {/* Location Priority */}
        <Animated.View 
          entering={FadeInDown.duration(400).delay(200)}
          style={styles.section}
        >
          <Text style={styles.sectionTitle}>Location Priority</Text>
          <View style={styles.locationOptions}>
            {LOCATION_PRIORITY_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.locationOption,
                  advancedTripData.accommodation.locationPriority === option.id && styles.locationOptionSelected,
                ]}
                onPress={() => handleLocationSelect(option.id)}
                activeOpacity={0.7}
              >
                <View style={styles.radioOuter}>
                  {advancedTripData.accommodation.locationPriority === option.id && (
                    <View style={styles.radioInner} />
                  )}
                </View>
                <View style={styles.locationContent}>
                  <Text style={[
                    styles.locationLabel,
                    advancedTripData.accommodation.locationPriority === option.id && styles.locationLabelSelected,
                  ]}>
                    {option.label}
                  </Text>
                  <Text style={styles.locationDescription}>{option.description}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
        
        {/* Amenities */}
        <Animated.View 
          entering={FadeInDown.duration(400).delay(250)}
          style={styles.section}
        >
          <Text style={styles.sectionTitle}>Must-Have Amenities</Text>
          <View style={styles.amenitiesGrid}>
            {AMENITY_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.amenityChip,
                  advancedTripData.accommodation.amenities.includes(option.id) && styles.amenityChipSelected,
                ]}
                onPress={() => handleAmenityToggle(option.id)}
                activeOpacity={0.7}
              >
                <Text style={styles.amenityIcon}>{option.icon}</Text>
                <Text style={[
                  styles.amenityLabel,
                  advancedTripData.accommodation.amenities.includes(option.id) && styles.amenityLabelSelected,
                ]}>
                  {option.label}
                </Text>
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
            <Text style={styles.skipText}>Skip for now</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={[
            styles.continueButton,
            !isAccommodationValid() && styles.continueButtonDisabled,
            isOptional && styles.continueButtonWithSkip,
          ]}
          onPress={handleContinue}
          disabled={!isAccommodationValid()}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={isAccommodationValid() 
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
  
  // Type Grid - Compact cards
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  typeCard: {
    width: '31%',
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.gray200,
  },
  typeCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  typeEmoji: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  typeLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  typeLabelSelected: {
    color: colors.primary,
    fontWeight: typography.fontWeight.semibold,
  },
  
  // Star Options - Compact chips
  starOptions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  starChip: {
    flex: 1,
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.xl,
    padding: spacing.sm,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.gray200,
  },
  starChipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  starRow: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  starLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  starLabelSelected: {
    color: colors.primary,
  },
  
  // Location Options - Radio style
  locationOptions: {
    gap: spacing.sm,
  },
  locationOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.gray200,
  },
  locationOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.gray300,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  locationContent: {
    flex: 1,
  },
  locationLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  locationLabelSelected: {
    color: colors.primary,
  },
  locationDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  
  // Amenities Grid
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  amenityChip: {
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
  amenityChipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  amenityIcon: {
    fontSize: 16,
  },
  amenityLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
  },
  amenityLabelSelected: {
    color: colors.primary,
    fontWeight: typography.fontWeight.medium,
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
