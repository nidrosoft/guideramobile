/**
 * ADVANCED DATES STEP
 * 
 * Step 3: When and how long?
 * Date selection with flexibility options using DatePickerSheet from flight flow.
 */

import React, { useState, useCallback } from 'react';
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
} from 'react-native-reanimated';
import {
  Calendar,
  ArrowRight2,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, shadows, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { useAdvancedPlanningStore } from '../../../stores/useAdvancedPlanningStore';
import { DATE_FLEXIBILITY_OPTIONS } from '../../../config/planning.config';

// Import DatePickerSheet from flight flow for consistency
import { DatePickerSheet } from '@/features/booking/flows/flight/sheets';

interface AdvancedDatesStepProps {
  onNext: () => void;
  onBack: () => void;
  onClose: () => void;
}

export default function AdvancedDatesStep({
  onNext,
  onBack,
  onClose,
}: AdvancedDatesStepProps) {
  const insets = useSafeAreaInsets();
  const { colors: tc } = useTheme();
  const {
    advancedTripData,
    setDepartureDate,
    setReturnDate,
    setFlexibility,
    isDatesValid,
  } = useAdvancedPlanningStore();
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  const isOneWay = advancedTripData.tripType === 'oneway';
  
  // Handle date selection from DatePickerSheet
  const handleDateSelect = useCallback((departure: Date, returnDate?: Date) => {
    setDepartureDate(departure);
    if (returnDate && !isOneWay) {
      setReturnDate(returnDate);
    }
    setShowDatePicker(false);
  }, [setDepartureDate, setReturnDate, isOneWay]);
  
  const handleFlexibilityChange = useCallback((id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFlexibility(id as any);
  }, [setFlexibility]);
  
  const handleContinue = useCallback(() => {
    if (!isDatesValid()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onNext();
  }, [isDatesValid, onNext]);
  
  const handleOpenDatePicker = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowDatePicker(true);
  }, []);
  
  const formatDate = (date: Date | null) => {
    if (!date) return 'Select';
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };
  
  const getTripDuration = () => {
    if (!advancedTripData.departureDate || !advancedTripData.returnDate) return null;
    const start = new Date(advancedTripData.departureDate);
    const end = new Date(advancedTripData.returnDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return `${days} day${days > 1 ? 's' : ''}`;
  };
  
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
          <Text style={styles.title}>When are you traveling?</Text>
          <Text style={styles.subtitle}>
            {isOneWay ? 'Select your departure date' : 'Pick your travel dates'}
          </Text>
        </Animated.View>
        
        {/* Selected Dates Display */}
        <Animated.View 
          entering={FadeInDown.duration(400).delay(100)}
          style={styles.selectedDatesContainer}
        >
          <View style={styles.dateBox}>
            <Text style={styles.dateLabel}>Departure</Text>
            <Text style={styles.dateValue}>{formatDate(advancedTripData.departureDate)}</Text>
          </View>
          {!isOneWay && (
            <>
              <View style={styles.dateDivider}>
                <ArrowRight2 size={20} color={colors.textSecondary} />
              </View>
              <View style={styles.dateBox}>
                <Text style={styles.dateLabel}>Return</Text>
                <Text style={styles.dateValue}>{formatDate(advancedTripData.returnDate)}</Text>
              </View>
              {getTripDuration() && (
                <View style={styles.durationBadge}>
                  <Text style={styles.durationText}>{getTripDuration()}</Text>
                </View>
              )}
            </>
          )}
        </Animated.View>
        
        {/* Open Calendar Button */}
        <Animated.View 
          entering={FadeInDown.duration(400).delay(150)}
        >
          <TouchableOpacity
            style={styles.openCalendarButton}
            onPress={handleOpenDatePicker}
            activeOpacity={0.7}
          >
            <Calendar size={24} color={colors.primary} variant="Bold" />
            <Text style={styles.openCalendarText}>
              {advancedTripData.departureDate 
                ? 'Change Dates' 
                : 'Select Dates on Calendar'}
            </Text>
            <ArrowRight2 size={20} color={colors.primary} />
          </TouchableOpacity>
        </Animated.View>
        
        {/* Flexibility Options */}
        <Animated.View 
          entering={FadeInDown.duration(400).delay(200)}
          style={styles.section}
        >
          <Text style={styles.sectionTitle}>Date Flexibility</Text>
          <View style={styles.flexibilityOptions}>
            {DATE_FLEXIBILITY_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.flexibilityOption,
                  advancedTripData.flexibility === option.id && styles.flexibilityOptionSelected,
                ]}
                onPress={() => handleFlexibilityChange(option.id)}
                activeOpacity={0.7}
              >
                <View style={styles.radioOuter}>
                  {advancedTripData.flexibility === option.id && (
                    <View style={styles.radioInner} />
                  )}
                </View>
                <View style={styles.flexibilityContent}>
                  <Text style={[
                    styles.flexibilityLabel,
                    advancedTripData.flexibility === option.id && styles.flexibilityLabelSelected,
                  ]}>
                    {option.label}
                  </Text>
                  <Text style={styles.flexibilityDescription}>{option.description}</Text>
                </View>
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
            !isDatesValid() && styles.continueButtonDisabled,
          ]}
          onPress={handleContinue}
          disabled={!isDatesValid()}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={isDatesValid() 
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
      
      {/* Date Picker Sheet - Reused from flight flow */}
      <DatePickerSheet
        visible={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        onSelect={handleDateSelect}
        tripType={isOneWay ? 'one-way' : 'round-trip'}
        departureDate={advancedTripData.departureDate}
        returnDate={advancedTripData.returnDate}
      />
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
    marginBottom: spacing.sm,
  },
  
  // Selected Dates - Matches Quick Trip DatesStep
  selectedDatesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.gray100,
  },
  dateBox: {
    flex: 1,
    alignItems: 'center',
  },
  dateLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  dateValue: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  dateDivider: {
    paddingHorizontal: spacing.md,
  },
  durationBadge: {
    backgroundColor: colors.primary + '15',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  durationText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
  },
  
  // Open Calendar Button - Opens DatePickerSheet
  openCalendarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 2,
    borderColor: colors.primary + '30',
    borderStyle: 'dashed',
    gap: spacing.md,
    ...shadows.sm,
  },
  openCalendarText: {
    flex: 1,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.primary,
  },
  
  // Flexibility - Radio style
  flexibilityOptions: {
    gap: spacing.sm,
  },
  flexibilityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.gray200,
  },
  flexibilityOptionSelected: {
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
  flexibilityContent: {
    flex: 1,
  },
  flexibilityLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  flexibilityLabelSelected: {
    color: colors.primary,
  },
  flexibilityDescription: {
    fontSize: typography.fontSize.xs,
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
