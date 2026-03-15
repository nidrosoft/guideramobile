/**
 * ACTIVITY DATE PICKER
 *
 * Date chips (today → +5 days) + Flexible/Specific time toggle.
 * If specific: shows a time picker.
 * Modular component for the Create Activity flow.
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Calendar, Clock } from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { spacing, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';

interface ActivityDatePickerProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  isFlexibleTime: boolean;
  onFlexibleToggle: (flexible: boolean) => void;
  selectedTime: Date;
  onTimeChange: (time: Date) => void;
}

export default function ActivityDatePicker({
  selectedDate,
  onDateChange,
  isFlexibleTime,
  onFlexibleToggle,
  selectedTime,
  onTimeChange,
}: ActivityDatePickerProps) {
  const { colors: tc } = useTheme();
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Generate next 14 days
  const dateChips = useMemo(() => {
    const chips: { date: Date; dayName: string; dayNum: number; monthLabel: string; isToday: boolean }[] = [];
    const now = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() + i);
      d.setHours(0, 0, 0, 0);
      chips.push({
        date: d,
        dayName: i === 0 ? 'Today' : i === 1 ? 'Tmrw' : d.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNum: d.getDate(),
        monthLabel: d.toLocaleDateString('en-US', { month: 'short' }),
        isToday: i === 0,
      });
    }
    return chips;
  }, []);

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const formatTime = (date: Date) =>
    date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <View>
      {/* Date Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.dateChipsScroll}
      >
        {dateChips.map((chip, i) => {
          const isActive = isSameDay(selectedDate, chip.date);
          return (
            <TouchableOpacity
              key={i}
              style={[
                styles.dateChip,
                { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle },
                isActive && { backgroundColor: tc.primary, borderColor: tc.primary },
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onDateChange(chip.date);
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.dateChipDay, { color: isActive ? '#FFFFFF' : tc.textSecondary }]}>
                {chip.dayName}
              </Text>
              <Text style={[styles.dateChipNum, { color: isActive ? '#FFFFFF' : tc.textPrimary }]}>
                {chip.dayNum}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Flexible / Specific Time */}
      <View style={styles.timeToggleRow}>
        <TouchableOpacity
          style={[
            styles.timeCard,
            { backgroundColor: tc.bgElevated, borderColor: isFlexibleTime ? tc.primary : tc.borderSubtle },
          ]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onFlexibleToggle(true);
          }}
          activeOpacity={0.7}
        >
          <Calendar size={22} color={isFlexibleTime ? tc.primary : tc.textTertiary} variant="Bold" />
          <Text style={[styles.timeCardTitle, { color: isFlexibleTime ? tc.primary : tc.textPrimary }]}>
            Flexible time
          </Text>
          <Text style={[styles.timeCardSub, { color: tc.textSecondary }]}>
            Anytime during the day
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.timeCard,
            { backgroundColor: tc.bgElevated, borderColor: !isFlexibleTime ? tc.primary : tc.borderSubtle },
          ]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onFlexibleToggle(false);
            if (Platform.OS === 'android') setShowTimePicker(true);
          }}
          activeOpacity={0.7}
        >
          <Clock size={22} color={!isFlexibleTime ? tc.primary : tc.textTertiary} variant="Bold" />
          <Text style={[styles.timeCardTitle, { color: !isFlexibleTime ? tc.primary : tc.textPrimary }]}>
            {!isFlexibleTime ? formatTime(selectedTime) : 'Set specific time'}
          </Text>
          <Text style={[styles.timeCardSub, { color: tc.textSecondary }]}>
            Choose exact time
          </Text>
        </TouchableOpacity>
      </View>

      {/* Time Picker */}
      {!isFlexibleTime && (
        <View style={[styles.timePickerContainer, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle }]}>
          <Text style={[styles.timePickerLabel, { color: tc.textSecondary }]}>Pick a time</Text>
          <DateTimePicker
            value={selectedTime}
            mode="time"
            display="spinner"
            onChange={(_, date) => {
              if (Platform.OS === 'android') setShowTimePicker(false);
              if (date) onTimeChange(date);
            }}
            minuteInterval={15}
            style={styles.timePicker}
            textColor={tc.textPrimary}
          />
        </View>
      )}

      <Text style={[styles.hint, { color: tc.textTertiary }]}>
        Activity will be visible on map until midnight
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  dateChipsScroll: {
    gap: 10,
    paddingBottom: spacing.md,
  },
  dateChip: {
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    minWidth: 64,
  },
  dateChipDay: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  dateChipNum: {
    fontSize: 18,
    fontWeight: '700',
  },
  timeToggleRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  timeCard: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    gap: 4,
  },
  timeCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  timeCardSub: {
    fontSize: 12,
  },
  timePickerContainer: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  timePickerLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  timePicker: {
    height: 150,
  },
  hint: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
});
