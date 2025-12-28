/**
 * DATE RANGE PICKER SHEET
 * 
 * Bottom sheet for selecting departure and return dates for package booking.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CloseCircle, Calendar, ArrowRight2 } from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, borderRadius } from '@/styles';

interface DateRangePickerSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (departure: Date, returnDate: Date) => void;
  departureDate: Date | null;
  returnDate: Date | null;
}

export default function DateRangePickerSheet({
  visible,
  onClose,
  onSelect,
  departureDate,
  returnDate,
}: DateRangePickerSheetProps) {
  const insets = useSafeAreaInsets();
  
  const [selectedDeparture, setSelectedDeparture] = useState<Date | null>(
    departureDate instanceof Date ? departureDate : departureDate ? new Date(departureDate) : null
  );
  const [selectedReturn, setSelectedReturn] = useState<Date | null>(
    returnDate instanceof Date ? returnDate : returnDate ? new Date(returnDate) : null
  );
  const [selectingReturn, setSelectingReturn] = useState(false);

  // Generate calendar days for next 6 months
  const generateCalendarMonths = useCallback(() => {
    const months = [];
    const today = new Date();
    
    for (let m = 0; m < 6; m++) {
      const monthDate = new Date(today.getFullYear(), today.getMonth() + m, 1);
      const daysInMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();
      const firstDayOfWeek = monthDate.getDay();
      
      const days: (Date | null)[] = [];
      
      // Add empty slots for days before the first day of month
      for (let i = 0; i < firstDayOfWeek; i++) {
        days.push(null);
      }
      
      // Add days of the month
      for (let d = 1; d <= daysInMonth; d++) {
        days.push(new Date(monthDate.getFullYear(), monthDate.getMonth(), d));
      }
      
      months.push({
        date: monthDate,
        days,
      });
    }
    
    return months;
  }, []);

  const months = generateCalendarMonths();

  const handleDayPress = (date: Date) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (!selectingReturn) {
      // Selecting departure date
      setSelectedDeparture(date);
      setSelectedReturn(null);
      setSelectingReturn(true);
    } else {
      // Selecting return date
      if (selectedDeparture && date > selectedDeparture) {
        setSelectedReturn(date);
      } else {
        // If selected date is before departure, reset
        setSelectedDeparture(date);
        setSelectedReturn(null);
      }
    }
  };

  const handleConfirm = () => {
    if (selectedDeparture && selectedReturn) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onSelect(selectedDeparture, selectedReturn);
      onClose();
    }
  };

  const isDateInRange = (date: Date): boolean => {
    if (!selectedDeparture || !selectedReturn) return false;
    return date > selectedDeparture && date < selectedReturn;
  };

  const isDateSelected = (date: Date): 'departure' | 'return' | null => {
    if (selectedDeparture && date.toDateString() === selectedDeparture.toDateString()) {
      return 'departure';
    }
    if (selectedReturn && date.toDateString() === selectedReturn.toDateString()) {
      return 'return';
    }
    return null;
  };

  const isDateDisabled = (date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const formatDate = (date: Date | null): string => {
    if (!date) return 'Select';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getNights = (): number => {
    if (!selectedDeparture || !selectedReturn) return 0;
    return Math.ceil((selectedReturn.getTime() - selectedDeparture.getTime()) / (1000 * 60 * 60 * 24));
  };

  const canConfirm = selectedDeparture && selectedReturn;

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

        {/* Date Selection Summary */}
        <View style={styles.selectionSummary}>
          <TouchableOpacity 
            style={[styles.dateBox, !selectingReturn && styles.dateBoxActive]}
            onPress={() => setSelectingReturn(false)}
          >
            <Text style={styles.dateBoxLabel}>Departure</Text>
            <Text style={[styles.dateBoxValue, selectedDeparture && styles.dateBoxValueSelected]}>
              {formatDate(selectedDeparture)}
            </Text>
          </TouchableOpacity>
          
          <ArrowRight2 size={20} color={colors.gray400} />
          
          <TouchableOpacity 
            style={[styles.dateBox, selectingReturn && styles.dateBoxActive]}
            onPress={() => selectedDeparture && setSelectingReturn(true)}
          >
            <Text style={styles.dateBoxLabel}>Return</Text>
            <Text style={[styles.dateBoxValue, selectedReturn && styles.dateBoxValueSelected]}>
              {formatDate(selectedReturn)}
            </Text>
          </TouchableOpacity>
          
          {getNights() > 0 && (
            <View style={styles.nightsBadge}>
              <Text style={styles.nightsText}>{getNights()} nights</Text>
            </View>
          )}
        </View>

        {/* Weekday Headers */}
        <View style={styles.weekdayHeader}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <Text key={day} style={styles.weekdayText}>{day}</Text>
          ))}
        </View>

        {/* Calendar */}
        <ScrollView 
          style={styles.calendarScroll}
          contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
          showsVerticalScrollIndicator={false}
        >
          {months.map((month, monthIndex) => (
            <View key={monthIndex} style={styles.monthContainer}>
              <Text style={styles.monthTitle}>
                {month.date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </Text>
              <View style={styles.daysGrid}>
                {month.days.map((day, dayIndex) => {
                  if (!day) {
                    return <View key={`empty-${dayIndex}`} style={styles.dayCell} />;
                  }
                  
                  const selected = isDateSelected(day);
                  const inRange = isDateInRange(day);
                  const disabled = isDateDisabled(day);
                  
                  return (
                    <TouchableOpacity
                      key={day.toISOString()}
                      style={[
                        styles.dayCell,
                        inRange && styles.dayCellInRange,
                        selected === 'departure' && styles.dayCellDeparture,
                        selected === 'return' && styles.dayCellReturn,
                      ]}
                      onPress={() => !disabled && handleDayPress(day)}
                      disabled={disabled}
                      activeOpacity={0.7}
                    >
                      <Text style={[
                        styles.dayText,
                        disabled && styles.dayTextDisabled,
                        (selected || inRange) && styles.dayTextSelected,
                      ]}>
                        {day.getDate()}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Confirm Button */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
          <TouchableOpacity
            style={[styles.confirmButton, !canConfirm && styles.confirmButtonDisabled]}
            onPress={handleConfirm}
            disabled={!canConfirm}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={canConfirm ? [colors.primary, colors.primaryDark] : [colors.gray300, colors.gray400]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.confirmButtonGradient}
            >
              <Calendar size={20} color={colors.white} />
              <Text style={styles.confirmButtonText}>
                {canConfirm ? `Confirm ${getNights()} Nights` : 'Select Dates'}
              </Text>
            </LinearGradient>
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
  selectionSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  dateBox: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  dateBoxActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '08',
  },
  dateBoxLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  dateBoxValue: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
  },
  dateBoxValueSelected: {
    color: colors.textPrimary,
  },
  nightsBadge: {
    backgroundColor: colors.primary + '15',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  nightsText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
  },
  weekdayHeader: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.gray50,
  },
  weekdayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
  },
  calendarScroll: {
    flex: 1,
  },
  monthContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  monthTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
  dayCellDeparture: {
    backgroundColor: colors.primary,
    borderTopLeftRadius: borderRadius.full,
    borderBottomLeftRadius: borderRadius.full,
  },
  dayCellReturn: {
    backgroundColor: colors.primary,
    borderTopRightRadius: borderRadius.full,
    borderBottomRightRadius: borderRadius.full,
  },
  dayText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  dayTextDisabled: {
    color: colors.gray300,
  },
  dayTextSelected: {
    color: colors.white,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
  },
  confirmButton: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  confirmButtonDisabled: {
    opacity: 0.7,
  },
  confirmButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  confirmButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
});
