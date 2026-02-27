/**
 * UNIFIED DATE SHEET
 * 
 * Bottom sheet for single date selection.
 * Used by MultiCitySection for selecting flight dates.
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CloseCircle } from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { spacing, typography } from '@/styles';
import { useTheme } from '@/context/ThemeContext';

interface UnifiedDateSheetProps {
  visible: boolean;
  title: string;
  onClose: () => void;
  onSelect: (date: Date) => void;
  selectedDate?: Date | null;
  minDate?: Date;
}

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function UnifiedDateSheet({
  visible,
  title,
  onClose,
  onSelect,
  selectedDate,
  minDate,
}: UnifiedDateSheetProps) {
  const insets = useSafeAreaInsets();
  const { colors: themeColors } = useTheme();
  const [tempSelected, setTempSelected] = useState<Date | null>(selectedDate || null);

  // Reset temp selection when sheet opens
  useEffect(() => {
    if (visible) {
      setTempSelected(selectedDate || null);
    }
  }, [visible, selectedDate]);

  // Generate calendar months (current + next 12 months)
  const calendarMonths = useMemo(() => {
    const months = [];
    const today = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() + i, 1);
      months.push({
        year: date.getFullYear(),
        month: date.getMonth(),
        name: MONTHS[date.getMonth()],
      });
    }
    return months;
  }, []);

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const isDateDisabled = useCallback((date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) return true;
    if (minDate) {
      const min = new Date(minDate);
      min.setHours(0, 0, 0, 0);
      if (date < min) return true;
    }
    return false;
  }, [minDate]);

  const isDateSelected = useCallback((date: Date) => {
    if (!tempSelected) return false;
    return date.toDateString() === tempSelected.toDateString();
  }, [tempSelected]);

  const handleDatePress = useCallback((date: Date) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTempSelected(date);
  }, []);

  const handleConfirm = useCallback(() => {
    if (tempSelected) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onSelect(tempSelected);
    }
  }, [tempSelected, onSelect]);

  const handleClose = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  }, [onClose]);

  const renderCalendarMonth = (year: number, month: number, monthName: string) => {
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const days = [];

    // Empty cells for days before the first day
    for (let i = 0; i < firstDay; i++) {
      days.push(<View key={`empty-${i}`} style={styles.dayCell} />);
    }

    // Day cells
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const disabled = isDateDisabled(date);
      const selected = isDateSelected(date);

      days.push(
        <TouchableOpacity
          key={day}
          style={styles.dayCell}
          onPress={() => handleDatePress(date)}
          disabled={disabled}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.dayInner,
              selected && { backgroundColor: themeColors.textPrimary },
            ]}
          >
            <Text
              style={[
                styles.dayText,
                { color: themeColors.textPrimary },
                disabled && { color: themeColors.gray300 },
                selected && { color: themeColors.white },
              ]}
            >
              {day}
            </Text>
          </View>
        </TouchableOpacity>
      );
    }

    return (
      <View key={`${year}-${month}`} style={styles.monthContainer}>
        <Text style={[styles.monthTitle, { color: themeColors.textPrimary }]}>
          {monthName} {year}
        </Text>
        <View style={styles.daysHeader}>
          {DAYS.map((dayLabel, index) => (
            <View key={index} style={styles.dayCell}>
              <Text style={[styles.dayHeaderText, { color: themeColors.textSecondary }]}>
                {dayLabel}
              </Text>
            </View>
          ))}
        </View>
        <View style={styles.daysGrid}>{days}</View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity 
          style={styles.backdrop} 
          activeOpacity={1} 
          onPress={handleClose}
        />
        
        <View
          style={[
            styles.sheet,
            { 
              backgroundColor: themeColors.white,
              paddingBottom: insets.bottom + spacing.md,
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: themeColors.textPrimary }]}>
              {title}
            </Text>
            <TouchableOpacity onPress={handleClose} activeOpacity={0.7}>
              <CloseCircle size={24} color={themeColors.textSecondary} variant="Bold" />
            </TouchableOpacity>
          </View>

          {/* Calendar */}
          <ScrollView 
            style={styles.calendarScroll}
            contentContainerStyle={styles.calendarContent}
            showsVerticalScrollIndicator={false}
          >
            {calendarMonths.map((m) => renderCalendarMonth(m.year, m.month, m.name))}
          </ScrollView>

          {/* Confirm Button */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.confirmButton,
                { backgroundColor: tempSelected ? themeColors.primary : themeColors.gray300 },
              ]}
              onPress={handleConfirm}
              disabled={!tempSelected}
              activeOpacity={0.8}
            >
              <Text style={styles.confirmText}>
                {tempSelected 
                  ? `Select ${tempSelected.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                  : 'Select a date'
                }
              </Text>
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
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '70%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  calendarScroll: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  calendarContent: {
    paddingBottom: spacing.md,
  },
  monthContainer: {
    marginBottom: spacing.lg,
  },
  monthTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.sm,
  },
  daysHeader: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayHeaderText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },
  dayText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  confirmButton: {
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmText: {
    color: 'white',
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
});
