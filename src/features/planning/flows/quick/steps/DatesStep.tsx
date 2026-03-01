/**
 * DATES STEP
 * 
 * Step 2: When are you traveling?
 * Duration presets, date picker sheet, and flexibility toggle.
 * Uses the DatePickerSheet from the flight flow for consistency.
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
  TickCircle,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, shadows, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { usePlanningStore } from '../../../stores/usePlanningStore';
import { DURATION_PRESETS } from '../../../config/planning.config';

// Import the DatePickerSheet from flight flow
import { DatePickerSheet } from '@/features/booking/flows/flight/sheets';

interface DatesStepProps {
  onNext: () => void;
  onBack: () => void;
  onClose: () => void;
}

export default function DatesStep({
  onNext,
  onBack,
  onClose,
}: DatesStepProps) {
  const insets = useSafeAreaInsets();
  const { colors: tc } = useTheme();
  const {
    quickTripData,
    setStartDate,
    setEndDate,
    setDurationPreset,
    setFlexible,
    isDatesValid,
  } = usePlanningStore();
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Handle date selection from DatePickerSheet
  const handleDateSelect = useCallback((departure: Date, returnDate?: Date) => {
    setStartDate(departure);
    if (returnDate) {
      setEndDate(returnDate);
    }
    setShowDatePicker(false);
  }, [setStartDate, setEndDate]);
  
  const handleDurationPreset = useCallback((presetId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDurationPreset(presetId as any);
    
    // If start date is set, update end date
    if (quickTripData.startDate) {
      const days = DURATION_PRESETS.find(p => p.id === presetId)?.days || 3;
      const endDate = new Date(quickTripData.startDate);
      endDate.setDate(endDate.getDate() + days - 1);
      setEndDate(endDate);
    }
  }, [quickTripData.startDate, setDurationPreset, setEndDate]);
  
  const handleToggleFlexible = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFlexible(!quickTripData.isFlexible);
  }, [quickTripData.isFlexible, setFlexible]);
  
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
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };
  
  const getTripDuration = () => {
    if (!quickTripData.startDate || !quickTripData.endDate) return null;
    const start = new Date(quickTripData.startDate);
    const end = new Date(quickTripData.endDate);
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
            Pick your dates or choose a duration
          </Text>
        </Animated.View>
        
        {/* Duration Presets */}
        <Animated.View 
          entering={FadeInDown.duration(400).delay(100)}
          style={styles.section}
        >
          <Text style={styles.sectionTitle}>Quick Select</Text>
          <View style={styles.presetsRow}>
            {DURATION_PRESETS.map((preset) => (
              <TouchableOpacity
                key={preset.id}
                style={[
                  styles.presetCard,
                  quickTripData.durationPreset === preset.id && styles.presetCardSelected,
                ]}
                onPress={() => handleDurationPreset(preset.id)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.presetLabel,
                  quickTripData.durationPreset === preset.id && styles.presetLabelSelected,
                ]}>
                  {preset.label}
                </Text>
                <Text style={[
                  styles.presetDays,
                  quickTripData.durationPreset === preset.id && styles.presetDaysSelected,
                ]}>
                  {preset.description}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
        
        {/* Selected Dates Display */}
        <Animated.View 
          entering={FadeInDown.duration(400).delay(150)}
          style={styles.selectedDatesContainer}
        >
          <View style={styles.dateBox}>
            <Text style={styles.dateLabel}>Start</Text>
            <Text style={styles.dateValue}>{formatDate(quickTripData.startDate)}</Text>
          </View>
          <View style={styles.dateDivider}>
            <ArrowRight2 size={20} color={colors.textSecondary} />
          </View>
          <View style={styles.dateBox}>
            <Text style={styles.dateLabel}>End</Text>
            <Text style={styles.dateValue}>{formatDate(quickTripData.endDate)}</Text>
          </View>
          {getTripDuration() && (
            <View style={styles.durationBadge}>
              <Text style={styles.durationText}>{getTripDuration()}</Text>
            </View>
          )}
        </Animated.View>
        
        {/* Open Calendar Button */}
        <Animated.View 
          entering={FadeInDown.duration(400).delay(200)}
        >
          <TouchableOpacity
            style={styles.openCalendarButton}
            onPress={handleOpenDatePicker}
            activeOpacity={0.7}
          >
            <Calendar size={24} color={colors.primary} variant="Bold" />
            <Text style={styles.openCalendarText}>
              {quickTripData.startDate && quickTripData.endDate 
                ? 'Change Dates' 
                : 'Select Dates on Calendar'}
            </Text>
            <ArrowRight2 size={20} color={colors.primary} />
          </TouchableOpacity>
        </Animated.View>
        
        {/* Flexibility Toggle */}
        <Animated.View 
          entering={FadeInDown.duration(400).delay(250)}
          style={styles.flexibilityContainer}
        >
          <TouchableOpacity
            style={styles.flexibilityToggle}
            onPress={handleToggleFlexible}
            activeOpacity={0.7}
          >
            <View style={[
              styles.checkbox,
              quickTripData.isFlexible && styles.checkboxChecked,
            ]}>
              {quickTripData.isFlexible && (
                <TickCircle size={16} color={colors.white} variant="Bold" />
              )}
            </View>
            <View style={styles.flexibilityContent}>
              <Text style={styles.flexibilityTitle}>My dates are flexible</Text>
              <Text style={styles.flexibilitySubtitle}>±3 days for better deals</Text>
            </View>
          </TouchableOpacity>
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
        tripType="round-trip"
        departureDate={quickTripData.startDate}
        returnDate={quickTripData.endDate}
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
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  
  // Presets - Reduced border radius for nested components
  presetsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  presetCard: {
    flex: 1,
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    ...shadows.sm,
  },
  presetCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '08',
  },
  presetLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  presetLabelSelected: {
    color: colors.primary,
  },
  presetDays: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  presetDaysSelected: {
    color: colors.primary,
  },
  
  // Selected Dates
  selectedDatesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.lg,
    ...shadows.sm,
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
  
  // Flexibility
  flexibilityContainer: {
    marginBottom: spacing.xl,
  },
  flexibilityToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.sm,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: borderRadius.sm,
    borderWidth: 2,
    borderColor: colors.gray300,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  flexibilityContent: {
    flex: 1,
  },
  flexibilityTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  flexibilitySubtitle: {
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
