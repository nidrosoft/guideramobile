/**
 * DATE TIME PICKER SHEET
 * 
 * Combined date and time picker for car rental.
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
import { CloseCircle, ArrowLeft, ArrowRight, TickCircle } from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, typography, borderRadius } from '@/styles';

const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
  '20:00', '20:30', '21:00', '21:30', '22:00',
];

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface DateTimePickerSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (date: Date, time: string) => void;
  selectedDate: Date | null;
  selectedTime: string;
  minDate?: Date | null;
  title: string;
}

export default function DateTimePickerSheet({
  visible,
  onClose,
  onSelect,
  selectedDate,
  selectedTime,
  minDate,
  title,
}: DateTimePickerSheetProps) {
  const insets = useSafeAreaInsets();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [tempDate, setTempDate] = useState<Date | null>(selectedDate);
  const [tempTime, setTempTime] = useState(selectedTime);
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    if (visible) {
      setTempDate(selectedDate);
      setTempTime(selectedTime);
      setShowTimePicker(false);
    }
  }, [visible, selectedDate, selectedTime]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: (Date | null)[] = [];

    // Add padding for days before first of month
    const startPadding = firstDay.getDay();
    for (let i = 0; i < startPadding; i++) {
      days.push(null);
    }

    // Add days of month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const isDateDisabled = (date: Date | null) => {
    if (!date) return true;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) return true;
    if (minDate) {
      const min = new Date(minDate);
      min.setHours(0, 0, 0, 0);
      if (date < min) return true;
    }
    return false;
  };

  const isDateSelected = (date: Date | null) => {
    if (!date || !tempDate) return false;
    return date.toDateString() === tempDate.toDateString();
  };

  const formatTime = (time: string): string => {
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const handleDateSelect = (date: Date) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTempDate(date);
    setShowTimePicker(true);
  };

  const handleTimeSelect = (time: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTempTime(time);
  };

  const handleConfirm = () => {
    if (tempDate) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onSelect(tempDate, tempTime);
    }
  };

  const days = getDaysInMonth(currentMonth);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={[styles.container, { paddingBottom: insets.bottom + spacing.md }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <CloseCircle size={28} color={colors.gray500} variant="Bold" />
            </TouchableOpacity>
          </View>

          {!showTimePicker ? (
            <>
              {/* Month Navigation */}
              <View style={styles.monthNav}>
                <TouchableOpacity
                  onPress={() => {
                    const prev = new Date(currentMonth);
                    prev.setMonth(prev.getMonth() - 1);
                    setCurrentMonth(prev);
                  }}
                >
                  <ArrowLeft size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.monthText}>
                  {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    const next = new Date(currentMonth);
                    next.setMonth(next.getMonth() + 1);
                    setCurrentMonth(next);
                  }}
                >
                  <ArrowRight size={24} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>

              {/* Weekday Headers */}
              <View style={styles.weekdayRow}>
                {WEEKDAYS.map((day) => (
                  <Text key={day} style={styles.weekdayText}>{day}</Text>
                ))}
              </View>

              {/* Calendar Grid */}
              <View style={styles.calendarGrid}>
                {days.map((date, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.dayCell,
                      isDateSelected(date) && styles.dayCellSelected,
                      isDateDisabled(date) && styles.dayCellDisabled,
                    ]}
                    onPress={() => date && !isDateDisabled(date) && handleDateSelect(date)}
                    disabled={!date || isDateDisabled(date)}
                  >
                    {date && (
                      <Text style={[
                        styles.dayText,
                        isDateSelected(date) && styles.dayTextSelected,
                        isDateDisabled(date) && styles.dayTextDisabled,
                      ]}>
                        {date.getDate()}
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </>
          ) : (
            <>
              {/* Selected Date Display */}
              <View style={styles.selectedDateContainer}>
                <Text style={styles.selectedDateLabel}>Selected Date</Text>
                <Text style={styles.selectedDateText}>
                  {tempDate?.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </Text>
                <TouchableOpacity 
                  style={styles.changeDateButton}
                  onPress={() => setShowTimePicker(false)}
                >
                  <Text style={styles.changeDateText}>Change Date</Text>
                </TouchableOpacity>
              </View>

              {/* Time Picker */}
              <Text style={styles.timeTitle}>Select Time</Text>
              <ScrollView 
                style={styles.timeScroll}
                contentContainerStyle={styles.timeGrid}
                showsVerticalScrollIndicator={false}
              >
                {TIME_SLOTS.map((time) => (
                  <TouchableOpacity
                    key={time}
                    style={[
                      styles.timeSlot,
                      tempTime === time && styles.timeSlotSelected,
                    ]}
                    onPress={() => handleTimeSelect(time)}
                  >
                    <Text style={[
                      styles.timeSlotText,
                      tempTime === time && styles.timeSlotTextSelected,
                    ]}>
                      {formatTime(time)}
                    </Text>
                    {tempTime === time && (
                      <TickCircle size={16} color={colors.primary} variant="Bold" />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Confirm Button */}
              <TouchableOpacity
                style={[styles.confirmButton, !tempDate && styles.confirmButtonDisabled]}
                onPress={handleConfirm}
                disabled={!tempDate}
              >
                <Text style={styles.confirmButtonText}>Confirm</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: colors.bgModal,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  monthText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  weekdayRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  weekdayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.md,
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  dayCellSelected: {
    backgroundColor: colors.primary,
    borderRadius: 100,
    width: 40,
    height: 40,
  },
  dayCellDisabled: {
    opacity: 0.3,
  },
  dayText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  dayTextSelected: {
    color: colors.white,
  },
  dayTextDisabled: {
    color: colors.gray400,
  },
  selectedDateContainer: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  selectedDateLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  selectedDateText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  changeDateButton: {
    marginTop: spacing.sm,
  },
  changeDateText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: typography.fontWeight.medium,
  },
  timeTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  timeScroll: {
    maxHeight: 200,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  timeSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.gray50,
    borderWidth: 1,
    borderColor: colors.gray200,
    gap: spacing.xs,
    minWidth: 100,
  },
  timeSlotSelected: {
    backgroundColor: `${colors.primary}10`,
    borderColor: colors.primary,
  },
  timeSlotText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  timeSlotTextSelected: {
    color: colors.primary,
  },
  confirmButton: {
    backgroundColor: colors.primary,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
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
