/**
 * TIME SLOT SHEET
 * 
 * Bottom sheet for selecting date and time slot.
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CloseCircle, ArrowLeft, ArrowRight, TickCircle, Clock } from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, borderRadius } from '@/styles';
import { TimeSlot } from '../../../types/experience.types';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Generate mock time slots
const generateTimeSlots = (date: Date): TimeSlot[] => [
  { id: '1', date, startTime: '09:00', endTime: '12:00', spotsAvailable: 4, spotsTotal: 8 },
  { id: '2', date, startTime: '10:30', endTime: '13:30', spotsAvailable: 2, spotsTotal: 8 },
  { id: '3', date, startTime: '14:00', endTime: '17:00', spotsAvailable: 8, spotsTotal: 8 },
  { id: '4', date, startTime: '15:30', endTime: '18:30', spotsAvailable: 6, spotsTotal: 8 },
];

interface TimeSlotSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (date: Date, slot: TimeSlot) => void;
  selectedDate: Date | null;
  selectedTimeSlot: TimeSlot | null;
}

export default function TimeSlotSheet({
  visible,
  onClose,
  onSelect,
  selectedDate,
  selectedTimeSlot,
}: TimeSlotSheetProps) {
  const insets = useSafeAreaInsets();
  const [currentMonth, setCurrentMonth] = useState(selectedDate || new Date());
  const [tempDate, setTempDate] = useState<Date | null>(selectedDate);
  const [tempSlot, setTempSlot] = useState<TimeSlot | null>(selectedTimeSlot);

  const timeSlots = useMemo(() => {
    if (!tempDate) return [];
    return generateTimeSlots(tempDate);
  }, [tempDate]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: (Date | null)[] = [];

    const startPadding = firstDay.getDay();
    for (let i = 0; i < startPadding; i++) {
      days.push(null);
    }

    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const isDateDisabled = (date: Date | null) => {
    if (!date) return true;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const isDateSelected = (date: Date | null) => {
    if (!date || !tempDate) return false;
    return date.toDateString() === tempDate.toDateString();
  };

  const handleDateSelect = (date: Date) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTempDate(date);
    setTempSlot(null);
  };

  const handleSlotSelect = (slot: TimeSlot) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTempSlot(slot);
  };

  const handleConfirm = () => {
    if (tempDate && tempSlot) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onSelect(tempDate, tempSlot);
    }
  };

  const days = getDaysInMonth(currentMonth);
  const canConfirm = tempDate && tempSlot;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={[styles.container, { paddingBottom: insets.bottom + spacing.md }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Select Date & Time</Text>
            <TouchableOpacity onPress={onClose}>
              <CloseCircle size={28} color={colors.gray500} variant="Bold" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
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

            {/* Time Slots */}
            {tempDate && (
              <View style={styles.timeSlotsSection}>
                <Text style={styles.timeSlotsTitle}>Available Times</Text>
                <View style={styles.timeSlotsGrid}>
                  {timeSlots.map((slot) => (
                    <TouchableOpacity
                      key={slot.id}
                      style={[
                        styles.timeSlot,
                        tempSlot?.id === slot.id && styles.timeSlotSelected,
                      ]}
                      onPress={() => handleSlotSelect(slot)}
                    >
                      <View style={styles.timeSlotContent}>
                        <Clock size={16} color={tempSlot?.id === slot.id ? colors.primary : colors.textSecondary} />
                        <Text style={[
                          styles.timeSlotText,
                          tempSlot?.id === slot.id && styles.timeSlotTextSelected,
                        ]}>
                          {slot.startTime} - {slot.endTime}
                        </Text>
                      </View>
                      <Text style={[
                        styles.spotsText,
                        slot.spotsAvailable <= 2 && styles.spotsTextLow,
                      ]}>
                        {slot.spotsAvailable} spots left
                      </Text>
                      {tempSlot?.id === slot.id && (
                        <TickCircle size={18} color={colors.primary} variant="Bold" style={styles.checkIcon} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>

          {/* Confirm Button */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.confirmButton, !canConfirm && styles.confirmButtonDisabled]}
              onPress={handleConfirm}
              disabled={!canConfirm}
            >
              <LinearGradient
                colors={canConfirm ? [colors.primary, colors.primaryDark] : [colors.gray300, colors.gray400]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.confirmGradient}
              >
                <Text style={styles.confirmText}>Confirm Selection</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
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
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    height: '85%',
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
  timeSlotsSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  timeSlotsTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  timeSlotsGrid: {
    gap: spacing.sm,
  },
  timeSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.gray50,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  timeSlotSelected: {
    backgroundColor: `${colors.primary}10`,
    borderColor: colors.primary,
  },
  timeSlotContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  timeSlotText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  timeSlotTextSelected: {
    color: colors.primary,
  },
  spotsText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  spotsTextLow: {
    color: colors.warning,
  },
  checkIcon: {
    marginLeft: spacing.sm,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
  },
  confirmButton: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  confirmButtonDisabled: {
    opacity: 0.7,
  },
  confirmGradient: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  confirmText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
});
