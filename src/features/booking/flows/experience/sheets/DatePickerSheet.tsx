/**
 * DATE PICKER SHEET
 * 
 * Bottom sheet for selecting a single date.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CloseCircle, ArrowLeft, ArrowRight } from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, typography, borderRadius } from '@/styles';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface DatePickerSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (date: Date) => void;
  selectedDate: Date | null;
  title: string;
  minDate?: Date;
}

export default function DatePickerSheet({
  visible,
  onClose,
  onSelect,
  selectedDate,
  title,
  minDate,
}: DatePickerSheetProps) {
  const insets = useSafeAreaInsets();
  const [currentMonth, setCurrentMonth] = useState(() => {
    if (selectedDate && selectedDate instanceof Date) {
      return selectedDate;
    }
    return new Date();
  });

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
    if (!date || !selectedDate) return false;
    const selected = selectedDate instanceof Date ? selectedDate : new Date(selectedDate);
    return date.toDateString() === selected.toDateString();
  };

  const handleDateSelect = (date: Date) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelect(date);
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
    paddingBottom: spacing.lg,
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
});
