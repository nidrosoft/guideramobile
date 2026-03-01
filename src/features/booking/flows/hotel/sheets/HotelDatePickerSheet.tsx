/**
 * HOTEL DATE PICKER SHEET
 * 
 * Bottom sheet for selecting check-in and check-out dates
 * Adapted from flight DatePickerSheet for hotel booking
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, ArrowRight, CloseCircle } from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, typography, borderRadius } from '@/styles';

interface HotelDatePickerSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (checkIn: Date, checkOut: Date) => void;
  checkInDate: Date | null;
  checkOutDate: Date | null;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function HotelDatePickerSheet({
  visible,
  onClose,
  onSelect,
  checkInDate,
  checkOutDate,
}: HotelDatePickerSheetProps) {
  const insets = useSafeAreaInsets();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedCheckIn, setSelectedCheckIn] = useState<Date | null>(checkInDate);
  const [selectedCheckOut, setSelectedCheckOut] = useState<Date | null>(checkOutDate);
  const [selectingCheckOut, setSelectingCheckOut] = useState(false);

  // Generate calendar days for current month
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const days: (Date | null)[] = [];
    
    // Add empty slots for days before first day of month
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  }, [currentMonth]);

  const handlePrevMonth = () => {
    const prev = new Date(currentMonth);
    prev.setMonth(prev.getMonth() - 1);
    if (prev >= new Date(today.getFullYear(), today.getMonth(), 1)) {
      setCurrentMonth(prev);
    }
  };

  const handleNextMonth = () => {
    const next = new Date(currentMonth);
    next.setMonth(next.getMonth() + 1);
    setCurrentMonth(next);
  };

  const handleDayPress = (date: Date) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (!selectingCheckOut) {
      // Selecting check-in date
      setSelectedCheckIn(date);
      setSelectedCheckOut(null);
      setSelectingCheckOut(true);
    } else {
      // Selecting check-out date
      if (selectedCheckIn && date > selectedCheckIn) {
        setSelectedCheckOut(date);
        setSelectingCheckOut(false);
      } else {
        // If selected date is before check-in, reset
        setSelectedCheckIn(date);
        setSelectedCheckOut(null);
      }
    }
  };

  const handleConfirm = () => {
    if (selectedCheckIn && selectedCheckOut) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onSelect(selectedCheckIn, selectedCheckOut);
      onClose();
    }
  };

  const isDateDisabled = (date: Date) => date < today;
  
  const isDateSelected = (date: Date) => {
    if (selectedCheckIn && date.getTime() === selectedCheckIn.getTime()) return true;
    if (selectedCheckOut && date.getTime() === selectedCheckOut.getTime()) return true;
    return false;
  };

  const isDateInRange = (date: Date) => {
    if (!selectedCheckIn || !selectedCheckOut) return false;
    return date > selectedCheckIn && date < selectedCheckOut;
  };

  const isCheckIn = (date: Date) => 
    selectedCheckIn && date.getTime() === selectedCheckIn.getTime();
  
  const isCheckOut = (date: Date) => 
    selectedCheckOut && date.getTime() === selectedCheckOut.getTime();

  const formatDate = (date: Date | string | null) => {
    if (!date) return 'Select date';
    // Handle both Date objects and string dates (from persistence)
    const dateObj = date instanceof Date ? date : new Date(date);
    if (isNaN(dateObj.getTime())) return 'Select date';
    return dateObj.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getNights = () => {
    if (!selectedCheckIn || !selectedCheckOut) return 0;
    const diff = selectedCheckOut.getTime() - selectedCheckIn.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Select Dates</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <CloseCircle size={28} color={colors.textSecondary} variant="Bold" />
          </TouchableOpacity>
        </View>

        {/* Date Summary */}
        <View style={styles.dateSummary}>
          <TouchableOpacity 
            style={[styles.dateBox, !selectingCheckOut && styles.dateBoxActive]}
            onPress={() => setSelectingCheckOut(false)}
          >
            <Text style={styles.dateLabel}>Check-in</Text>
            <Text style={[styles.dateValue, selectedCheckIn && styles.dateValueSelected]}>
              {formatDate(selectedCheckIn)}
            </Text>
          </TouchableOpacity>
          
          <View style={styles.dateDivider}>
            <ArrowRight size={20} color={colors.gray400} />
          </View>
          
          <TouchableOpacity 
            style={[styles.dateBox, selectingCheckOut && styles.dateBoxActive]}
            onPress={() => selectedCheckIn && setSelectingCheckOut(true)}
          >
            <Text style={styles.dateLabel}>Check-out</Text>
            <Text style={[styles.dateValue, selectedCheckOut && styles.dateValueSelected]}>
              {formatDate(selectedCheckOut)}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Nights Count */}
        {selectedCheckIn && selectedCheckOut && (
          <View style={styles.nightsContainer}>
            <Text style={styles.nightsText}>
              {getNights()} night{getNights() > 1 ? 's' : ''}
            </Text>
          </View>
        )}

        {/* Month Navigation */}
        <View style={styles.monthNav}>
          <TouchableOpacity onPress={handlePrevMonth} style={styles.navButton}>
            <ArrowLeft size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.monthTitle}>
            {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </Text>
          <TouchableOpacity onPress={handleNextMonth} style={styles.navButton}>
            <ArrowRight size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Day Headers */}
        <View style={styles.dayHeaders}>
          {DAYS.map(day => (
            <Text key={day} style={styles.dayHeader}>{day}</Text>
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
              const checkIn = isCheckIn(date);
              const checkOut = isCheckOut(date);
              
              return (
                <TouchableOpacity
                  key={date.toISOString()}
                  style={[
                    styles.dayCell,
                    inRange && styles.dayCellInRange,
                    selected && styles.dayCellSelected,
                    checkIn && styles.dayCellCheckIn,
                    checkOut && styles.dayCellCheckOut,
                  ]}
                  onPress={() => !disabled && handleDayPress(date)}
                  disabled={disabled}
                >
                  <Text style={[
                    styles.dayText,
                    disabled && styles.dayTextDisabled,
                    selected && styles.dayTextSelected,
                    inRange && styles.dayTextInRange,
                  ]}>
                    {date.getDate()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
          <TouchableOpacity
            style={[
              styles.confirmButton,
              !(selectedCheckIn && selectedCheckOut) && styles.confirmButtonDisabled,
            ]}
            onPress={handleConfirm}
            disabled={!(selectedCheckIn && selectedCheckOut)}
            activeOpacity={0.8}
          >
            <Text style={styles.confirmButtonText}>
              {selectedCheckIn && selectedCheckOut 
                ? `Confirm · ${getNights()} night${getNights() > 1 ? 's' : ''}`
                : selectingCheckOut ? 'Select check-out date' : 'Select check-in date'
              }
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
    backgroundColor: colors.background,
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
  closeButton: {
    padding: spacing.xs,
  },
  dateSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  dateBox: {
    flex: 1,
    backgroundColor: colors.bgModal,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.gray100,
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
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray400,
  },
  dateValueSelected: {
    color: colors.textPrimary,
  },
  dateDivider: {
    paddingHorizontal: spacing.xs,
  },
  nightsContainer: {
    alignItems: 'center',
    paddingBottom: spacing.md,
  },
  nightsText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
    backgroundColor: `${colors.primary}15`,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  navButton: {
    padding: spacing.sm,
  },
  monthTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  dayHeaders: {
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
    flex: 1,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg,
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayCellSelected: {
    backgroundColor: colors.primary,
    borderRadius: 20,
  },
  dayCellCheckIn: {
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
  },
  dayCellCheckOut: {
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
  },
  dayCellInRange: {
    backgroundColor: `${colors.primary}20`,
  },
  dayText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  dayTextDisabled: {
    color: colors.gray300,
  },
  dayTextSelected: {
    color: colors.white,
    fontWeight: typography.fontWeight.bold,
  },
  dayTextInRange: {
    color: colors.primary,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
    backgroundColor: colors.bgModal,
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
