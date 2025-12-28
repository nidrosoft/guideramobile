/**
 * TRAVELERS STEP
 * 
 * Step 4: Who's traveling with you?
 * Adults, children, infants, and special requirements.
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
  People,
  Pet,
  Driving,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, shadows, borderRadius } from '@/styles';
import { useAdvancedPlanningStore } from '../../../stores/useAdvancedPlanningStore';
import { DIETARY_OPTIONS } from '../../../config/planning.config';

interface TravelersStepProps {
  onNext: () => void;
  onBack: () => void;
  onClose: () => void;
}

export default function TravelersStep({
  onNext,
  onBack,
  onClose,
}: TravelersStepProps) {
  const insets = useSafeAreaInsets();
  const {
    advancedTripData,
    setAdults,
    addChild,
    removeChild,
    updateChildAge,
    setInfants,
    setWheelchairAccessible,
    setTravelingWithPet,
    toggleDietaryRestriction,
    isTravelersValid,
    getTotalTravelers,
  } = useAdvancedPlanningStore();
  
  const handleAdultsChange = (delta: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newValue = Math.max(1, Math.min(10, advancedTripData.travelers.adults + delta));
    setAdults(newValue);
  };
  
  const handleAddChild = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (advancedTripData.travelers.children.length < 6) {
      addChild(10); // Default age 10
    }
  };
  
  const handleRemoveChild = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    removeChild(index);
  };
  
  const handleChildAgeChange = (index: number, delta: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const currentAge = advancedTripData.travelers.children[index];
    const newAge = Math.max(2, Math.min(17, currentAge + delta));
    updateChildAge(index, newAge);
  };
  
  const handleInfantsChange = (delta: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newValue = Math.max(0, Math.min(4, advancedTripData.travelers.infants + delta));
    setInfants(newValue);
  };
  
  const handleToggleAccessibility = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setWheelchairAccessible(!advancedTripData.specialRequirements.wheelchairAccessible);
  };
  
  const handleTogglePet = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTravelingWithPet(!advancedTripData.specialRequirements.travelingWithPet);
  };
  
  const handleToggleDietary = (restriction: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleDietaryRestriction(restriction);
  };
  
  const handleContinue = useCallback(() => {
    if (!isTravelersValid()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onNext();
  }, [isTravelersValid, onNext]);
  
  return (
    <View style={styles.container}>
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
          <Text style={styles.title}>Who's traveling?</Text>
          <Text style={styles.subtitle}>
            Tell us about your travel companions
          </Text>
        </Animated.View>
        
        {/* Travelers Summary */}
        <Animated.View 
          entering={FadeInDown.duration(400).delay(50)}
          style={styles.summaryCard}
        >
          <People size={24} color={colors.primary} variant="Bold" />
          <Text style={styles.summaryText}>
            {getTotalTravelers()} traveler{getTotalTravelers() > 1 ? 's' : ''}
          </Text>
        </Animated.View>
        
        {/* Adults */}
        <Animated.View 
          entering={FadeInDown.duration(400).delay(100)}
          style={styles.section}
        >
          <View style={styles.counterRow}>
            <View style={styles.counterInfo}>
              <Text style={styles.counterLabel}>Adults</Text>
              <Text style={styles.counterHint}>18+ years</Text>
            </View>
            <View style={styles.counterControls}>
              <TouchableOpacity
                style={[styles.counterButton, advancedTripData.travelers.adults <= 1 && styles.counterButtonDisabled]}
                onPress={() => handleAdultsChange(-1)}
                disabled={advancedTripData.travelers.adults <= 1}
              >
                <Text style={styles.counterButtonText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.counterValue}>{advancedTripData.travelers.adults}</Text>
              <TouchableOpacity
                style={[styles.counterButton, advancedTripData.travelers.adults >= 10 && styles.counterButtonDisabled]}
                onPress={() => handleAdultsChange(1)}
                disabled={advancedTripData.travelers.adults >= 10}
              >
                <Text style={styles.counterButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
        
        {/* Children */}
        <Animated.View 
          entering={FadeInDown.duration(400).delay(150)}
          style={styles.section}
        >
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Children</Text>
              <Text style={styles.sectionHint}>2-17 years</Text>
            </View>
            {advancedTripData.travelers.children.length < 6 && (
              <TouchableOpacity
                style={styles.addButton}
                onPress={handleAddChild}
              >
                <Text style={styles.addButtonText}>+ Add Child</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {advancedTripData.travelers.children.map((age, index) => (
            <Animated.View
              key={index}
              entering={FadeIn.duration(300)}
              style={styles.childRow}
            >
              <Text style={styles.childLabel}>Child {index + 1}</Text>
              <View style={styles.childControls}>
                <TouchableOpacity
                  style={styles.counterButton}
                  onPress={() => handleChildAgeChange(index, -1)}
                >
                  <Text style={styles.counterButtonText}>−</Text>
                </TouchableOpacity>
                <View style={styles.ageDisplay}>
                  <Text style={styles.ageValue}>{age}</Text>
                  <Text style={styles.ageLabel}>yrs</Text>
                </View>
                <TouchableOpacity
                  style={styles.counterButton}
                  onPress={() => handleChildAgeChange(index, 1)}
                >
                  <Text style={styles.counterButtonText}>+</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemoveChild(index)}
                >
                  <Text style={styles.removeButtonText}>×</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          ))}
        </Animated.View>
        
        {/* Infants */}
        <Animated.View 
          entering={FadeInDown.duration(400).delay(200)}
          style={styles.section}
        >
          <View style={styles.counterRow}>
            <View style={styles.counterInfo}>
              <Text style={styles.counterLabel}>Infants</Text>
              <Text style={styles.counterHint}>Under 2 years</Text>
            </View>
            <View style={styles.counterControls}>
              <TouchableOpacity
                style={[styles.counterButton, advancedTripData.travelers.infants <= 0 && styles.counterButtonDisabled]}
                onPress={() => handleInfantsChange(-1)}
                disabled={advancedTripData.travelers.infants <= 0}
              >
                <Text style={styles.counterButtonText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.counterValue}>{advancedTripData.travelers.infants}</Text>
              <TouchableOpacity
                style={[styles.counterButton, advancedTripData.travelers.infants >= 4 && styles.counterButtonDisabled]}
                onPress={() => handleInfantsChange(1)}
                disabled={advancedTripData.travelers.infants >= 4}
              >
                <Text style={styles.counterButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
        
        {/* Special Requirements */}
        <Animated.View 
          entering={FadeInDown.duration(400).delay(250)}
          style={styles.section}
        >
          <Text style={styles.sectionTitle}>Special Requirements</Text>
          
          <TouchableOpacity
            style={[
              styles.toggleOption,
              advancedTripData.specialRequirements.wheelchairAccessible && styles.toggleOptionSelected,
            ]}
            onPress={handleToggleAccessibility}
            activeOpacity={0.7}
          >
            <View style={styles.toggleIcon}>
              <Driving size={20} color={advancedTripData.specialRequirements.wheelchairAccessible ? colors.primary : colors.textSecondary} />
            </View>
            <Text style={styles.toggleLabel}>Wheelchair accessible</Text>
            <View style={[
              styles.checkbox,
              advancedTripData.specialRequirements.wheelchairAccessible && styles.checkboxChecked,
            ]}>
              {advancedTripData.specialRequirements.wheelchairAccessible && (
                <TickCircle size={16} color={colors.white} variant="Bold" />
              )}
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.toggleOption,
              advancedTripData.specialRequirements.travelingWithPet && styles.toggleOptionSelected,
            ]}
            onPress={handleTogglePet}
            activeOpacity={0.7}
          >
            <View style={styles.toggleIcon}>
              <Pet size={20} color={advancedTripData.specialRequirements.travelingWithPet ? colors.primary : colors.textSecondary} />
            </View>
            <Text style={styles.toggleLabel}>Traveling with pet</Text>
            <View style={[
              styles.checkbox,
              advancedTripData.specialRequirements.travelingWithPet && styles.checkboxChecked,
            ]}>
              {advancedTripData.specialRequirements.travelingWithPet && (
                <TickCircle size={16} color={colors.white} variant="Bold" />
              )}
            </View>
          </TouchableOpacity>
        </Animated.View>
        
        {/* Dietary Restrictions */}
        <Animated.View 
          entering={FadeInDown.duration(400).delay(300)}
          style={styles.section}
        >
          <Text style={styles.sectionTitle}>Dietary Restrictions</Text>
          <Text style={styles.sectionHint}>Select all that apply</Text>
          
          <View style={styles.chipsContainer}>
            {DIETARY_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.chip,
                  advancedTripData.specialRequirements.dietaryRestrictions.includes(option) && styles.chipSelected,
                ]}
                onPress={() => handleToggleDietary(option)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.chipText,
                  advancedTripData.specialRequirements.dietaryRestrictions.includes(option) && styles.chipTextSelected,
                ]}>
                  {option}
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
            !isTravelersValid() && styles.continueButtonDisabled,
          ]}
          onPress={handleContinue}
          disabled={!isTravelersValid()}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={isTravelersValid() 
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
    marginBottom: spacing.lg,
  },
  
  // Summary
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary + '10',
    borderRadius: borderRadius.full,
    padding: spacing.sm,
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  summaryText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
  },
  
  // Section
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  sectionHint: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  
  // Counter Row - Matches hotel guest picker
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray100,
  },
  counterInfo: {
    flex: 1,
  },
  counterLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  counterHint: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  counterControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  counterButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterButtonDisabled: {
    opacity: 0.4,
  },
  counterButtonText: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  counterValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    minWidth: 30,
    textAlign: 'center',
  },
  
  // Add Button
  addButton: {
    backgroundColor: colors.primary + '15',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  addButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
  },
  
  // Child Row
  childRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.gray100,
  },
  childLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  childControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  ageDisplay: {
    alignItems: 'center',
    minWidth: 40,
  },
  ageValue: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  ageLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  removeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.error + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  removeButtonText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.error,
  },
  
  // Toggle Options - Consistent with other steps
  toggleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.gray200,
  },
  toggleOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  toggleIcon: {
    marginRight: spacing.md,
  },
  toggleLabel: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.gray300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  
  // Chips
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  chip: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.gray200,
  },
  chipSelected: {
    backgroundColor: colors.primary + '15',
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
  },
  chipTextSelected: {
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
