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
import { colors, spacing, typography, borderRadius } from '@/styles';

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
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <ArrowLeft size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Select Dates</Text>
          <View style={styles.closeButton} />
        </View>
        
        {/* Selected Dates Display */}
        {!singleDate && (
          <View style={styles.selectedDates}>
            <TouchableOpacity
              style={[
                styles.dateBox,
                selectingStart && styles.dateBoxActive,
              ]}
              onPress={() => setSelectingStart(true)}
            >
              <Text style={styles.dateLabel}>{startLabel}</Text>
              <Text style={[
                styles.dateValue,
                !startDate && styles.dateValuePlaceholder,
              ]}>
                {formatDate(startDate)}
              </Text>
            </TouchableOpacity>
            
            <View style={styles.dateSeparator}>
              <ArrowRight2 size={20} color={colors.gray400} />
            </View>
            
            <TouchableOpacity
              style={[
                styles.dateBox,
                !selectingStart && styles.dateBoxActive,
              ]}
              onPress={() => setSelectingStart(false)}
            >
              <Text style={styles.dateLabel}>{endLabel}</Text>
              <Text style={[
                styles.dateValue,
                !endDate && styles.dateValuePlaceholder,
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
            style={[styles.navButton, !canGoToPrevious && styles.navButtonDisabled]}
          >
            <ArrowLeft size={20} color={canGoToPrevious ? colors.textPrimary : colors.gray300} />
          </TouchableOpacity>
          
          <Text style={styles.monthTitle}>
            {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </Text>
          
          <TouchableOpacity onPress={goToNextMonth} style={styles.navButton}>
            <ArrowRight2 size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
        
        {/* Day Headers */}
        <View style={styles.dayHeaders}>
          {DAYS.map((day) => (
            <Text key={day} style={styles.dayHeader}>
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
                      selected && styles.dayContentSelected,
                      disabled && styles.dayContentDisabled,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        selected && styles.dayTextSelected,
                        disabled && styles.dayTextDisabled,
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
        <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
          <TouchableOpacity
            style={[
              styles.confirmButton,
              (!startDate || (!singleDate && !endDate)) && styles.confirmButtonDisabled,
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
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
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
    color: colors.textPrimary,
  },
  selectedDates: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.gray50,
  },
  dateBox: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md, // Reduced for nested component
    padding: spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  dateBoxActive: {
    borderColor: colors.primary,
  },
  dateLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  dateValue: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  dateValuePlaceholder: {
    color: colors.gray400,
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
    backgroundColor: colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonDisabled: {
    backgroundColor: colors.gray50,
  },
  monthTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
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
    color: colors.textSecondary,
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
    backgroundColor: colors.primary + '15',
  },
  dayCellStart: {
    backgroundColor: colors.primary + '15',
    borderTopLeftRadius: 50,
    borderBottomLeftRadius: 50,
  },
  dayCellEnd: {
    backgroundColor: colors.primary + '15',
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
    backgroundColor: colors.primary,
  },
  dayContentDisabled: {
    opacity: 0.3,
  },
  dayText: {
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
  dayTextSelected: {
    color: colors.white,
    fontWeight: typography.fontWeight.semibold,
  },
  dayTextDisabled: {
    color: colors.gray400,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
  },
  confirmButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
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
