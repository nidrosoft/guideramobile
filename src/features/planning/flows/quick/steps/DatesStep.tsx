/**
 * DATES STEP
 * 
 * Step 2: When are you traveling?
 * Duration presets, date picker, and flexibility toggle.
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown,
  FadeInUp,
  FadeIn,
} from 'react-native-reanimated';
import {
  Calendar,
  ArrowRight2,
  TickCircle,
  ArrowLeft2,
  ArrowRight,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, shadows, borderRadius } from '@/styles';
import { usePlanningStore } from '../../../stores/usePlanningStore';
import { DURATION_PRESETS } from '../../../config/planning.config';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface DatesStepProps {
  onNext: () => void;
  onBack: () => void;
  onClose: () => void;
}

// Simple calendar component
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function DatesStep({
  onNext,
  onBack,
  onClose,
}: DatesStepProps) {
  const insets = useSafeAreaInsets();
  const {
    quickTripData,
    setStartDate,
    setEndDate,
    setDurationPreset,
    setFlexible,
    isDatesValid,
  } = usePlanningStore();
  
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectingEndDate, setSelectingEndDate] = useState(false);
  
  // Generate calendar days
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    const days: (Date | null)[] = [];
    
    // Add empty slots for days before the first day of the month
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  }, [currentMonth]);
  
  const handlePrevMonth = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };
  
  const handleNextMonth = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };
  
  const handleSelectDate = useCallback((date: Date) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    if (!selectingEndDate) {
      setStartDate(date);
      setSelectingEndDate(true);
      
      // Auto-set end date based on duration preset
      const days = DURATION_PRESETS.find(p => p.id === quickTripData.durationPreset)?.days || 3;
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + days - 1);
      setEndDate(endDate);
    } else {
      if (quickTripData.startDate && date >= quickTripData.startDate) {
        setEndDate(date);
        setSelectingEndDate(false);
      }
    }
  }, [selectingEndDate, quickTripData.startDate, quickTripData.durationPreset, setStartDate, setEndDate]);
  
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
  
  const isDateSelected = (date: Date) => {
    if (!date) return false;
    const start = quickTripData.startDate;
    const end = quickTripData.endDate;
    
    if (start && date.toDateString() === new Date(start).toDateString()) return 'start';
    if (end && date.toDateString() === new Date(end).toDateString()) return 'end';
    if (start && end && date > new Date(start) && date < new Date(end)) return 'between';
    return false;
  };
  
  const isDateDisabled = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };
  
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
        
        {/* Calendar */}
        <Animated.View 
          entering={FadeInDown.duration(400).delay(200)}
          style={styles.calendarContainer}
        >
          {/* Month Navigation */}
          <View style={styles.calendarHeader}>
            <TouchableOpacity onPress={handlePrevMonth} style={styles.monthNavButton}>
              <ArrowLeft2 size={20} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.monthTitle}>
              {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </Text>
            <TouchableOpacity onPress={handleNextMonth} style={styles.monthNavButton}>
              <ArrowRight size={20} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
          
          {/* Day Headers */}
          <View style={styles.dayHeaders}>
            {DAYS.map((day) => (
              <Text key={day} style={styles.dayHeader}>{day}</Text>
            ))}
          </View>
          
          {/* Calendar Grid */}
          <View style={styles.calendarGrid}>
            {calendarDays.map((date, index) => {
              if (!date) {
                return <View key={`empty-${index}`} style={styles.dayCell} />;
              }
              
              const selection = isDateSelected(date);
              const disabled = isDateDisabled(date);
              const isStartOrEnd = selection === 'start' || selection === 'end';
              
              return (
                <TouchableOpacity
                  key={date.toISOString()}
                  style={[
                    styles.dayCell,
                    selection === 'start' && styles.dayCellStart,
                    selection === 'end' && styles.dayCellEnd,
                    selection === 'between' && styles.dayCellBetween,
                  ]}
                  onPress={() => !disabled && handleSelectDate(date)}
                  disabled={disabled}
                  activeOpacity={0.7}
                >
                  <View style={[
                    styles.dayCircle,
                    isStartOrEnd && styles.dayCircleSelected,
                    disabled && styles.dayCellDisabled,
                  ]}>
                    <Text style={[
                      styles.dayText,
                      isStartOrEnd && styles.dayTextSelected,
                      disabled && styles.dayTextDisabled,
                    ]}>
                      {date.getDate()}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
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
    backgroundColor: colors.white,
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
    backgroundColor: colors.white,
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
  
  // Calendar - Larger container gets slightly more radius
  calendarContainer: {
    backgroundColor: colors.white,
    borderRadius: 16, // Slightly larger for bigger container
    padding: spacing.md,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  monthNavButton: {
    padding: spacing.sm,
  },
  monthTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  dayHeaders: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  dayHeader: {
    flex: 1,
    textAlign: 'center',
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayCellStart: {
    backgroundColor: colors.primary + '15',
    borderTopLeftRadius: 22,
    borderBottomLeftRadius: 22,
  },
  dayCellEnd: {
    backgroundColor: colors.primary + '15',
    borderTopRightRadius: 22,
    borderBottomRightRadius: 22,
  },
  dayCellBetween: {
    backgroundColor: colors.primary + '15',
  },
  dayCellDisabled: {
    opacity: 0.3,
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayCircleSelected: {
    backgroundColor: colors.primary,
  },
  dayText: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  dayTextSelected: {
    color: colors.white,
    fontWeight: typography.fontWeight.bold,
  },
  dayTextDisabled: {
    color: colors.textSecondary,
  },
  
  // Flexibility
  flexibilityContainer: {
    marginBottom: spacing.xl,
  },
  flexibilityToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
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
