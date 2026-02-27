/**
 * FLIGHT LEG CARD
 * 
 * Single flight leg for multi-city trips.
 * Shows From → To → Date in a compact card format.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Airplane, Calendar, CloseCircle } from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { spacing, typography } from '@/styles';
import { useTheme } from '@/context/ThemeContext';

export interface FlightLeg {
  id: string;
  origin: { code: string; city: string } | null;
  destination: { code: string; city: string } | null;
  date: Date | null;
}

interface FlightLegCardProps {
  leg: FlightLeg;
  index: number;
  totalLegs: number;
  onPressOrigin: () => void;
  onPressDestination: () => void;
  onPressDate: () => void;
  onRemove?: () => void;
  canRemove: boolean;
}

export default function FlightLegCard({
  leg,
  index,
  totalLegs,
  onPressOrigin,
  onPressDestination,
  onPressDate,
  onRemove,
  canRemove,
}: FlightLegCardProps) {
  const { colors: themeColors } = useTheme();

  const formatDate = (date: Date | null): string => {
    if (!date) return 'Select date';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleRemove = () => {
    if (onRemove) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onRemove();
    }
  };

  // First flight: icon points right (departure)
  // Last flight: icon points left (return/arrival direction)
  // Middle flights: icon points right
  const isLastFlight = index === totalLegs - 1 && totalLegs > 1;
  const iconRotation = isLastFlight ? '180deg' : '0deg';

  return (
    <View style={[styles.container, { borderColor: themeColors.gray200 }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.legTitle, { color: themeColors.textSecondary }]}>
          FLIGHT {index + 1}
        </Text>
        {canRemove && (
          <TouchableOpacity onPress={handleRemove} activeOpacity={0.7}>
            <CloseCircle size={20} color={themeColors.gray400} />
          </TouchableOpacity>
        )}
      </View>

      {/* Route Row */}
      <View style={styles.routeRow}>
        {/* Origin */}
        <TouchableOpacity 
          style={styles.locationButton}
          onPress={onPressOrigin}
          activeOpacity={0.7}
        >
          <View style={{ transform: [{ rotate: iconRotation }] }}>
            <Airplane 
              size={16} 
              color={themeColors.primary} 
              style={{ transform: [{ rotate: '90deg' }] }}
            />
          </View>
          <Text 
            style={[
              styles.locationText, 
              { color: leg.origin ? themeColors.textPrimary : themeColors.gray400 }
            ]}
            numberOfLines={1}
          >
            {leg.origin?.code || 'From'}
          </Text>
        </TouchableOpacity>

        {/* Arrow */}
        <Text style={[styles.arrow, { color: themeColors.textSecondary }]}>→</Text>

        {/* Destination */}
        <TouchableOpacity 
          style={styles.locationButton}
          onPress={onPressDestination}
          activeOpacity={0.7}
        >
          <Text 
            style={[
              styles.locationText, 
              { color: leg.destination ? themeColors.textPrimary : themeColors.gray400 }
            ]}
            numberOfLines={1}
          >
            {leg.destination?.code || 'To'}
          </Text>
        </TouchableOpacity>

        {/* Date - Black background with white icon and white text */}
        <TouchableOpacity 
          style={[styles.dateButton, { backgroundColor: themeColors.textPrimary }]}
          onPress={onPressDate}
          activeOpacity={0.7}
        >
          <Calendar size={14} color={themeColors.white} />
          <Text 
            style={[
              styles.dateText, 
              { color: leg.date ? themeColors.white : themeColors.gray400 }
            ]}
          >
            {formatDate(leg.date)}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  legTitle: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  locationText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
  arrow: {
    fontSize: typography.fontSize.base,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 8,
  },
  dateText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
});
