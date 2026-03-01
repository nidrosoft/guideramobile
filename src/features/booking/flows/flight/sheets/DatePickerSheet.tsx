/**
 * DATE PICKER SHEET
 * 
 * Bottom sheet with calendar for date selection
 * Shows prices per day when available
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft2, ArrowRight2, CloseCircle } from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, typography, borderRadius } from '@/styles';
import { TripType } from '../../../types/flight.types';

interface DatePickerSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (departure: Date, returnDate?: Date) => void;
  tripType: TripType;
  departureDate: Date | string | null;
  returnDate: Date | string | null;
}

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];


// Helper to ensure we have a Date object
const toDate = (date: Date | string | null | undefined): Date | null => {
  if (!date) return null;
  if (date instanceof Date) return date;
  const parsed = new Date(date);
  return isNaN(parsed.getTime()) ? null : parsed;
};

export default function DatePickerSheet({
  visible,
  onClose,
  onSelect,
  tripType,
  departureDate,
  returnDate,
}: DatePickerSheetProps) {
  const insets = useSafeAreaInsets();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDeparture, setSelectedDeparture] = useState<Date | null>(null);
  const [selectedReturn, setSelectedReturn] = useState<Date | null>(null);

  // Check if round trip
  const isRoundTrip = tripType === 'round-trip';

  // Reset state when sheet opens
  useEffect(() => {
    if (visible) {
      setSelectedDeparture(toDate(departureDate));
      setSelectedReturn(toDate(returnDate));
      setCurrentMonth(toDate(departureDate) || new Date());
    }
  }, [visible, departureDate, returnDate]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return { firstDay, daysInMonth };
  };

  const { firstDay, daysInMonth } = getDaysInMonth(currentMonth);

  const handlePrevMonth = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const handleDayPress = (day: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const selectedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    
    if (isRoundTrip) {
      // If no departure selected, or we're starting fresh (both selected), set departure
      if (!selectedDeparture || (selectedDeparture && selectedReturn)) {
        setSelectedDeparture(selectedDate);
        setSelectedReturn(null);
      } else {
        // Departure is selected, now select return
        if (selectedDate > selectedDeparture) {
          setSelectedReturn(selectedDate);
        } else if (selectedDate < selectedDeparture) {
          // If user selects earlier date, make it the new departure
          setSelectedDeparture(selectedDate);
          setSelectedReturn(null);
        } else {
          // Same date selected, reset
          setSelectedDeparture(selectedDate);
          setSelectedReturn(null);
        }
      }
    } else {
      setSelectedDeparture(selectedDate);
    }
  };

  const handleConfirm = () => {
    if (!selectedDeparture) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSelect(selectedDeparture, selectedReturn || undefined);
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentMonth.getMonth() === today.getMonth() &&
      currentMonth.getFullYear() === today.getFullYear()
    );
  };

  const isPast = (day: number) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return checkDate < today;
  };

  const isSelected = (day: number) => {
    const checkDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    if (selectedDeparture && checkDate.toDateString() === selectedDeparture.toDateString()) return true;
    if (selectedReturn && checkDate.toDateString() === selectedReturn.toDateString()) return true;
    return false;
  };

  const isInRange = (day: number) => {
    if (!selectedDeparture || !selectedReturn) return false;
    const checkDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return checkDate > selectedDeparture && checkDate < selectedReturn;
  };

  const isRangeStart = (day: number) => {
    if (!selectedDeparture) return false;
    const checkDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return checkDate.toDateString() === selectedDeparture.toDateString();
  };

  const isRangeEnd = (day: number) => {
    if (!selectedReturn) return false;
    const checkDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return checkDate.toDateString() === selectedReturn.toDateString();
  };

  const canConfirm = selectedDeparture && (!isRoundTrip || selectedReturn);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.md }]}>
          {/* Handle */}
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>
                {isRoundTrip ? 'Select Dates' : 'Select Date'}
              </Text>
              <Text style={styles.subtitle}>
                {isRoundTrip 
                  ? (!selectedDeparture 
                      ? 'Tap to select departure date' 
                      : !selectedReturn 
                        ? 'Now select your return date'
                        : 'Tap any date to start over')
                  : 'Select your travel date'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <CloseCircle size={28} color={colors.gray400} variant="Bold" />
            </TouchableOpacity>
          </View>

          {/* Month Navigation */}
          <View style={styles.monthNav}>
            <TouchableOpacity onPress={handlePrevMonth} style={styles.navButton}>
              <ArrowLeft2 size={24} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.monthText}>
              {MONTHS[currentMonth.getMonth()]}, {currentMonth.getFullYear()}
            </Text>
            <TouchableOpacity onPress={handleNextMonth} style={styles.navButton}>
              <ArrowRight2 size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Day Headers */}
          <View style={styles.daysHeader}>
            {DAYS.map((day, index) => (
              <Text key={index} style={styles.dayHeader}>{day}</Text>
            ))}
          </View>

          {/* Calendar Grid */}
          <ScrollView style={styles.calendarScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.calendarGrid}>
              {/* Empty cells for first week */}
              {Array.from({ length: firstDay }).map((_, index) => (
                <View key={`empty-${index}`} style={styles.dayCellWrapper} />
              ))}
              
              {/* Day cells */}
              {Array.from({ length: daysInMonth }).map((_, index) => {
                const day = index + 1;
                const past = isPast(day);
                const selected = isSelected(day);
                const inRange = isInRange(day);
                const rangeStart = isRangeStart(day) && selectedReturn;
                const rangeEnd = isRangeEnd(day);
                
                return (
                  <View key={day} style={styles.dayCellWrapper}>
                    {/* Range background */}
                    {(inRange || rangeStart || rangeEnd) && (
                      <View style={[
                        styles.rangeBackground,
                        rangeStart && styles.rangeBackgroundStart,
                        rangeEnd && styles.rangeBackgroundEnd,
                        inRange && styles.rangeBackgroundMiddle,
                      ]} />
                    )}
                    
                    <TouchableOpacity
                      style={[
                        styles.dayCell,
                        selected && styles.dayCellSelected,
                      ]}
                      onPress={() => !past && handleDayPress(day)}
                      disabled={past}
                      activeOpacity={0.7}
                    >
                      <Text style={[
                        styles.dayText,
                        past && styles.dayTextPast,
                        selected && styles.dayTextSelected,
                        inRange && styles.dayTextInRange,
                      ]}>
                        {day}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          </ScrollView>

          {/* Confirm Button */}
          <TouchableOpacity
            style={[styles.confirmButton, !canConfirm && styles.confirmButtonDisabled]}
            onPress={handleConfirm}
            disabled={!canConfirm}
            activeOpacity={0.8}
          >
            <Text style={styles.confirmButtonText}>Choose</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  sheet: {
    backgroundColor: colors.bgModal,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.gray300,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  daysHeader: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  dayHeader: {
    flex: 1,
    textAlign: 'center',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
  },
  calendarScroll: {
    maxHeight: 300,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.md,
  },
  dayCellWrapper: {
    width: `${100 / 7}%`,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  rangeBackground: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 0,
    right: 0,
    backgroundColor: `${colors.primary}15`,
  },
  rangeBackgroundStart: {
    left: '50%',
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
  },
  rangeBackgroundEnd: {
    right: '50%',
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
  },
  rangeBackgroundMiddle: {
    left: 0,
    right: 0,
  },
  dayCell: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  dayCellSelected: {
    backgroundColor: colors.primary,
  },
  dayText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  dayTextPast: {
    color: colors.gray300,
  },
  dayTextSelected: {
    color: colors.white,
    fontWeight: typography.fontWeight.semibold,
  },
  dayTextInRange: {
    color: colors.textPrimary,
  },
  confirmButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xl,
    height: 52,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: colors.gray300,
  },
  confirmButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
});
