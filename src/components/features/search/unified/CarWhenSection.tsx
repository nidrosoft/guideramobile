/**
 * CAR WHEN SECTION
 * 
 * Car-specific date and time selection for the unified search overlay.
 * Handles pickup and return date/time using the existing DateTimePickerSheet.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Calendar, Clock } from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { spacing, typography, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';

// Re-use the car flow's DateTimePickerSheet
import DateTimePickerSheet from '@/features/booking/flows/car/sheets/DateTimePickerSheet';

interface CarWhenSectionProps {
  pickupDate: Date | null;
  pickupTime: string;
  returnDate: Date | null;
  returnTime: string;
  onPickupDateTimeSelect: (date: Date, time: string) => void;
  onReturnDateTimeSelect: (date: Date, time: string) => void;
}

type ActiveSheet = 'pickup' | 'return' | null;

export default function CarWhenSection({
  pickupDate,
  pickupTime,
  returnDate,
  returnTime,
  onPickupDateTimeSelect,
  onReturnDateTimeSelect,
}: CarWhenSectionProps) {
  const { colors: themeColors } = useTheme();
  const [activeSheet, setActiveSheet] = useState<ActiveSheet>(null);

  const formatDate = (d: Date | null): string => {
    if (!d) return 'Select date';
    const dateObj = d instanceof Date ? d : new Date(d);
    if (isNaN(dateObj.getTime())) return 'Select date';
    return dateObj.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (t: string): string => {
    const [hours, minutes] = t.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const handlePickupSelect = (date: Date, time: string) => {
    onPickupDateTimeSelect(date, time);
    setActiveSheet(null);
  };

  const handleReturnSelect = (date: Date, time: string) => {
    onReturnDateTimeSelect(date, time);
    setActiveSheet(null);
  };

  return (
    <View style={styles.container}>
      {/* Pickup Date & Time */}
      <Text style={[styles.sectionLabel, { color: themeColors.textSecondary }]}>
        PICKUP
      </Text>
      <TouchableOpacity
        style={[
          styles.dateTimeRow,
          {
            backgroundColor: themeColors.bgCard,
            borderColor: themeColors.borderSubtle,
            borderWidth: 1,
          },
        ]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setActiveSheet('pickup');
        }}
        activeOpacity={0.8}
      >
        <View style={styles.dateSection}>
          <Calendar size={18} color={themeColors.primary} />
          <Text
            style={[
              styles.dateTimeText,
              { color: pickupDate ? themeColors.textPrimary : themeColors.gray400 },
            ]}
          >
            {formatDate(pickupDate)}
          </Text>
        </View>
        <View style={[styles.divider, { backgroundColor: themeColors.borderSubtle }]} />
        <View style={styles.timeSection}>
          <Clock size={18} color={themeColors.primary} />
          <Text style={[styles.dateTimeText, { color: themeColors.textPrimary }]}>
            {formatTime(pickupTime)}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Return Date & Time */}
      <Text style={[styles.sectionLabel, { color: themeColors.textSecondary }]}>
        RETURN
      </Text>
      <TouchableOpacity
        style={[
          styles.dateTimeRow,
          {
            backgroundColor: themeColors.bgCard,
            borderColor: themeColors.borderSubtle,
            borderWidth: 1,
          },
        ]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setActiveSheet('return');
        }}
        activeOpacity={0.8}
      >
        <View style={styles.dateSection}>
          <Calendar size={18} color={themeColors.success} />
          <Text
            style={[
              styles.dateTimeText,
              { color: returnDate ? themeColors.textPrimary : themeColors.gray400 },
            ]}
          >
            {formatDate(returnDate)}
          </Text>
        </View>
        <View style={[styles.divider, { backgroundColor: themeColors.borderSubtle }]} />
        <View style={styles.timeSection}>
          <Clock size={18} color={themeColors.success} />
          <Text style={[styles.dateTimeText, { color: themeColors.textPrimary }]}>
            {formatTime(returnTime)}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Date Time Picker Sheets */}
      <DateTimePickerSheet
        visible={activeSheet === 'pickup'}
        onClose={() => setActiveSheet(null)}
        onSelect={handlePickupSelect}
        selectedDate={pickupDate}
        selectedTime={pickupTime}
        minDate={new Date()}
        title="Pickup Date & Time"
      />

      <DateTimePickerSheet
        visible={activeSheet === 'return'}
        onClose={() => setActiveSheet(null)}
        onSelect={handleReturnSelect}
        selectedDate={returnDate}
        selectedTime={returnTime}
        minDate={pickupDate}
        title="Return Date & Time"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sectionLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  dateSection: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  timeSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  divider: {
    width: 1,
    height: 24,
    marginHorizontal: spacing.sm,
  },
  dateTimeText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
});
