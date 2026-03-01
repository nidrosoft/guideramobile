/**
 * DATE RANGE PICKER
 * 
 * Modal component for selecting date ranges (check-in/check-out, departure/return).
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, ArrowRight2, Calendar } from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { spacing, typography, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';

interface DateRangePickerProps {
  visible: boolean;
  onClose: () => void;
  startDate: Date | null;
  endDate: Date | null;
  onStartDateChange: (date: Date) => void;
  onEndDateChange: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
  startLabel?: string;
  endLabel?: string;
  singleDate?: boolean;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function DateRangePicker({
  visible,
  onClose,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  minDate = new Date(),
  maxDate,
  startLabel = 'Start Date',
  endLabel = 'End Date',
  singleDate = false,
}: DateRangePickerProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [currentMonth, setCurrentMonth] = useState(startDate || new Date());
  const [selectingStart, setSelectingStart] = useState(true);
  
  // Generate calendar days for current month
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    const days: (Date | null)[] = [];
    
    // Add empty slots for days before the first day
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  }, [currentMonth]);
  
  const goToPreviousMonth = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };
  
  const goToNextMonth = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };
  
  const isDateDisabled = (date: Date): boolean => {
    if (!date) return true;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (date < today) return true;
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    
    return false;
  };
  
  const isDateSelected = (date: Date): boolean => {
    if (!date) return false;
    
    if (startDate && isSameDay(date, startDate)) return true;
    if (endDate && isSameDay(date, endDate)) return true;
    
    return false;
  };
  
  const isDateInRange = (date: Date): boolean => {
    if (!date || !startDate || !endDate) return false;
    return date > startDate && date < endDate;
  };
  
  const isSameDay = (date1: Date, date2: Date): boolean => {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  };
  
  const handleDateSelect = (date: Date) => {
    if (isDateDisabled(date)) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    if (singleDate) {
      onStartDateChange(date);
      onClose();
      return;
    }
    
    if (selectingStart) {
      onStartDateChange(date);
      if (endDate && date >= endDate) {
        onEndDateChange(null as any);
      }
      setSelectingStart(false);
    } else {
      if (date <= startDate!) {
        // If selected date is before start, swap
        onStartDateChange(date);
        setSelectingStart(false);
      } else {
        onEndDateChange(date);
        setSelectingStart(true);
      }
    }
  };
  
  const handleConfirm = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onClose();
  };
  
  const formatDate = (date: Date | null): string => {
    if (!date) return 'Select date';
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };
  
  const canGoToPrevious = useMemo(() => {
    const prevMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    const today = new Date();
    return prevMonth >= new Date(today.getFullYear(), today.getMonth(), 1);
  }, [currentMonth]);
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.borderSubtle }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <ArrowLeft size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Select Dates</Text>
          <View style={styles.closeButton} />
        </View>
        
        {/* Selected Dates Display */}
        {!singleDate && (
          <View style={[styles.selectedDates, { backgroundColor: colors.bgCard }]}>
            <TouchableOpacity
              style={[
                styles.dateBox,
                { backgroundColor: colors.bgElevated },
                selectingStart && { borderColor: colors.primary },
              ]}
              onPress={() => setSelectingStart(true)}
            >
              <Text style={[styles.dateLabel, { color: colors.textSecondary }]}>{startLabel}</Text>
              <Text style={[
                styles.dateValue,
                { color: colors.textPrimary },
                !startDate && { color: colors.textSecondary },
              ]}>
                {formatDate(startDate)}
              </Text>
            </TouchableOpacity>
            
            <View style={styles.dateSeparator}>
              <ArrowRight2 size={20} color={colors.textSecondary} />
            </View>
            
            <TouchableOpacity
              style={[
                styles.dateBox,
                { backgroundColor: colors.bgElevated },
                !selectingStart && { borderColor: colors.primary },
              ]}
              onPress={() => setSelectingStart(false)}
            >
              <Text style={[styles.dateLabel, { color: colors.textSecondary }]}>{endLabel}</Text>
              <Text style={[
                styles.dateValue,
                { color: colors.textPrimary },
                !endDate && { color: colors.textSecondary },
              ]}>
                {formatDate(endDate)}
              </Text>
            </TouchableOpacity>
          </View>
        )}
        
        {/* Month Navigation */}
        <View style={styles.monthNav}>
          <TouchableOpacity
            onPress={goToPreviousMonth}
            disabled={!canGoToPrevious}
            style={[styles.navButton, { backgroundColor: colors.bgElevated }, !canGoToPrevious && { opacity: 0.4 }]}
          >
            <ArrowLeft size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          
          <Text style={[styles.monthTitle, { color: colors.textPrimary }]}>
            {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </Text>
          
          <TouchableOpacity onPress={goToNextMonth} style={[styles.navButton, { backgroundColor: colors.bgElevated }]}>
            <ArrowRight2 size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
        
        {/* Day Headers */}
        <View style={styles.dayHeaders}>
          {DAYS.map((day) => (
            <Text key={day} style={[styles.dayHeader, { color: colors.textSecondary }]}>
              {day}
            </Text>
          ))}
        </View>
        
        {/* Calendar Grid */}
        <ScrollView style={styles.calendarScroll}>
          <View style={styles.calendarGrid}>
            {calendarDays.map((date, index) => {
              if (!date) {
                return <View key={`empty-${index}`} style={styles.dayCell} />;
              }
              
              const disabled = isDateDisabled(date);
              const selected = isDateSelected(date);
              const inRange = isDateInRange(date);
              const isStart = startDate && isSameDay(date, startDate);
              const isEnd = endDate && isSameDay(date, endDate);
              
              return (
                <TouchableOpacity
                  key={date.toISOString()}
                  style={[
                    styles.dayCell,
                    inRange && styles.dayCellInRange,
                    isStart && styles.dayCellStart,
                    isEnd && styles.dayCellEnd,
                  ]}
                  onPress={() => handleDateSelect(date)}
                  disabled={disabled}
                >
                  <View
                    style={[
                      styles.dayContent,
                      selected && { backgroundColor: colors.primary },
                      disabled && styles.dayContentDisabled,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        { color: colors.textPrimary },
                        selected && { color: '#FFFFFF', fontWeight: typography.fontWeight.semibold },
                        disabled && { color: colors.textSecondary },
                      ]}
                    >
                      {date.getDate()}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
        
        {/* Confirm Button */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md, borderTopColor: colors.borderSubtle }]}>
          <TouchableOpacity
            style={[
              styles.confirmButton,
              { backgroundColor: colors.primary },
              (!startDate || (!singleDate && !endDate)) && { backgroundColor: colors.textSecondary },
            ]}
            onPress={handleConfirm}
            disabled={!startDate || (!singleDate && !endDate)}
          >
            <Text style={styles.confirmButtonText}>
              {singleDate ? 'Select Date' : 'Confirm Dates'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
  },
  selectedDates: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  dateBox: {
    flex: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  dateLabel: {
    fontSize: typography.fontSize.xs,
    marginBottom: 4,
  },
  dateValue: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
  },
  dateSeparator: {
    paddingHorizontal: spacing.sm,
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
  },
  dayHeaders: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  dayHeader: {
    flex: 1,
    textAlign: 'center',
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },
  calendarScroll: {
    flex: 1,
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
  },
  dayCellInRange: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
  },
  dayCellStart: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    borderTopLeftRadius: 50,
    borderBottomLeftRadius: 50,
  },
  dayCellEnd: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    borderTopRightRadius: 50,
    borderBottomRightRadius: 50,
  },
  dayContent: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayContentSelected: {
  },
  dayContentDisabled: {
    opacity: 0.3,
  },
  dayText: {
    fontSize: typography.fontSize.base,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
  },
  confirmButton: {
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: '#FFFFFF',
  },
});
