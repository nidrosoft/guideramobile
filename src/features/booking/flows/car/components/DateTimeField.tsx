/**
 * DATE TIME FIELD COMPONENT
 * 
 * Displays date and time for pickup/return.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Calendar, Clock } from 'iconsax-react-native';
import { colors, spacing, typography, borderRadius } from '@/styles';

interface DateTimeFieldProps {
  label: string;
  date: Date | null;
  time: string;
  onDatePress: () => void;
  onTimePress: () => void;
  variant?: 'pickup' | 'return';
}

export default function DateTimeField({
  label,
  date,
  time,
  onDatePress,
  onTimePress,
  variant = 'pickup',
}: DateTimeFieldProps) {
  const iconColor = variant === 'pickup' ? colors.primary : colors.success;

  const formatDate = (d: Date | null): string => {
    if (!d) return 'Select date';
    const dateObj = d instanceof Date ? d : new Date(d);
    if (isNaN(dateObj.getTime())) return 'Select date';
    return dateObj.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatTime = (t: string): string => {
    const [hours, minutes] = t.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        <TouchableOpacity 
          style={[styles.field, styles.dateField]} 
          onPress={onDatePress}
          activeOpacity={0.7}
        >
          <Calendar size={18} color={iconColor} />
          <Text style={[styles.value, !date && styles.placeholder]}>
            {formatDate(date)}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.field, styles.timeField]} 
          onPress={onTimePress}
          activeOpacity={0.7}
        >
          <Clock size={18} color={iconColor} />
          <Text style={styles.value}>{formatTime(time)}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    gap: spacing.sm,
  },
  dateField: {
    flex: 1.5,
  },
  timeField: {
    flex: 1,
  },
  value: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  placeholder: {
    color: colors.gray400,
    fontWeight: typography.fontWeight.regular,
  },
});
