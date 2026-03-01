/**
 * WHEN SECTION
 * 
 * Calendar date picker with tabs for Dates/Months/Flexible.
 * Shows a scrollable calendar view.
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { spacing, typography, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';

type DateMode = 'dates' | 'months' | 'flexible';

interface WhenSectionProps {
  startDate: Date | null;
  endDate: Date | null;
  onSelectDates: (start: Date | null, end: Date | null) => void;
  singleDateOnly?: boolean; // For one-way trips - only select departure date
}

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function WhenSection({
  startDate,
  endDate,
  onSelectDates,
  singleDateOnly = false,
}: WhenSectionProps) {
  const { colors: themeColors } = useTheme();
  const [mode, setMode] = useState<DateMode>('dates');
  const [selectedStart, setSelectedStart] = useState<Date | null>(startDate);
  const [selectedEnd, setSelectedEnd] = useState<Date | null>(endDate);

  // Generate calendar months (current + next 6 months)
  const calendarMonths = useMemo(() => {
    const months = [];
    const today = new Date();
    for (let i = 0; i < 6; i++) {
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

  const isDateSelected = (date: Date) => {
    if (!selectedStart) return false;
    if (selectedStart && !selectedEnd) {
      return date.toDateString() === selectedStart.toDateString();
    }
    return date >= selectedStart && date <= (selectedEnd || selectedStart);
  };

  const isDateStart = (date: Date) => {
    return selectedStart && date.toDateString() === selectedStart.toDateString();
  };

  const isDateEnd = (date: Date) => {
    return selectedEnd && date.toDateString() === selectedEnd.toDateString();
  };

  const isDatePast = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const handleDatePress = (date: Date) => {
    if (isDatePast(date)) return;

    // Single date mode (one-way trips) - just select the date
    if (singleDateOnly) {
      setSelectedStart(date);
      setSelectedEnd(null);
      onSelectDates(date, null);
      return;
    }

    // Range mode (round-trip) - select start and end dates
    if (!selectedStart || (selectedStart && selectedEnd)) {
      setSelectedStart(date);
      setSelectedEnd(null);
      onSelectDates(date, null);
    } else {
      if (date < selectedStart) {
        setSelectedStart(date);
        setSelectedEnd(selectedStart);
        onSelectDates(date, selectedStart);
      } else {
        setSelectedEnd(date);
        onSelectDates(selectedStart, date);
      }
    }
  };

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
      const isPast = isDatePast(date);
      const isSelected = isDateSelected(date);
      const isStart = isDateStart(date);
      const isEnd = isDateEnd(date);

      days.push(
        <TouchableOpacity
          key={day}
          style={styles.dayCell}
          onPress={() => handleDatePress(date)}
          disabled={isPast}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.dayInner,
              isSelected && !isStart && !isEnd && { backgroundColor: themeColors.primary + '20' },
              (isStart || isEnd) && { backgroundColor: themeColors.primary },
            ]}
          >
            <Text
              style={[
                styles.dayText,
                { color: themeColors.textPrimary },
                isPast && { color: themeColors.gray300 },
                (isStart || isEnd) && { color: '#FFFFFF' },
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
          {DAYS.map((day, index) => (
            <View key={index} style={styles.dayCell}>
              <Text style={[styles.dayHeaderText, { color: themeColors.textSecondary }]}>
                {day}
              </Text>
            </View>
          ))}
        </View>
        <View style={styles.daysGrid}>{days}</View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Mode Tabs */}
      <View style={[styles.tabsContainer, { backgroundColor: themeColors.bgCard }]}>
        {(['dates', 'months', 'flexible'] as DateMode[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tab,
              mode === tab && { backgroundColor: themeColors.bgElevated },
            ]}
            onPress={() => setMode(tab)}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.tabText,
                { color: themeColors.textSecondary },
                mode === tab && { color: themeColors.textPrimary },
              ]}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Calendar */}
      {mode === 'dates' && (
        <ScrollView 
          style={styles.calendarScroll}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
        >
          {calendarMonths.map((m) => renderCalendarMonth(m.year, m.month, m.name))}
        </ScrollView>
      )}

      {mode === 'months' && (
        <View style={styles.monthsGrid}>
          {MONTHS.map((month, index) => (
            <TouchableOpacity
              key={month}
              style={[styles.monthChip, { borderColor: themeColors.gray200 }]}
              activeOpacity={0.7}
            >
              <Text style={[styles.monthChipText, { color: themeColors.textPrimary }]}>
                {month.slice(0, 3)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {mode === 'flexible' && (
        <View style={styles.flexibleContainer}>
          <Text style={[styles.flexibleText, { color: themeColors.textSecondary }]}>
            Stay for a weekend, week, or month
          </Text>
        </View>
      )}

      {/* Flexibility Options */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.flexibilityScroll}
        contentContainerStyle={styles.flexibilityContent}
      >
        {['Exact dates', '± 1 day', '± 2 days', '± 3 days', '± 7 days'].map((option) => (
          <TouchableOpacity
            key={option}
            style={[styles.flexibilityChip, { borderColor: themeColors.gray300 }]}
            activeOpacity={0.7}
          >
            <Text style={[styles.flexibilityText, { color: themeColors.textPrimary }]}>
              {option}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 4,
    marginBottom: spacing.md,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: 12,
    alignItems: 'center',
  },
  tabText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  calendarScroll: {
    maxHeight: 300,
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
  monthsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  monthChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 16,
    borderWidth: 1,
  },
  monthChipText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  flexibleContainer: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  flexibleText: {
    fontSize: typography.fontSize.base,
  },
  flexibilityScroll: {
    marginTop: spacing.md,
  },
  flexibilityContent: {
    gap: spacing.sm,
  },
  flexibilityChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 16,
    borderWidth: 1,
  },
  flexibilityText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
});
