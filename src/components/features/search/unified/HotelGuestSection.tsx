/**
 * HOTEL GUEST SECTION
 * 
 * Hotel-specific guest/room selection for the unified search overlay.
 * Handles rooms, adults, and children counts.
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Add, Minus, People, Home2 } from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, typography, borderRadius } from '@/styles';

export interface HotelGuestCount {
  rooms: number;
  adults: number;
  children: number;
}

interface HotelGuestSectionProps {
  guests: HotelGuestCount;
  onGuestsChange: (guests: HotelGuestCount) => void;
}

interface CounterRowProps {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  value: number;
  min: number;
  max: number;
  onIncrement: () => void;
  onDecrement: () => void;
}

function CounterRow({
  icon,
  label,
  sublabel,
  value,
  min,
  max,
  onIncrement,
  onDecrement,
}: CounterRowProps) {
  const canDecrement = value > min;
  const canIncrement = value < max;

  return (
    <View style={styles.counterRow}>
      <View style={styles.counterInfo}>
        {icon}
        <View style={styles.counterLabels}>
          <Text style={styles.counterLabel}>{label}</Text>
          {sublabel && <Text style={styles.counterSublabel}>{sublabel}</Text>}
        </View>
      </View>
      
      <View style={styles.counterControls}>
        <TouchableOpacity
          style={[styles.counterButton, !canDecrement && styles.counterButtonDisabled]}
          onPress={() => {
            if (canDecrement) {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onDecrement();
            }
          }}
          disabled={!canDecrement}
          activeOpacity={0.7}
        >
          <Minus size={18} color={canDecrement ? colors.textPrimary : colors.gray300} />
        </TouchableOpacity>
        
        <Text style={styles.counterValue}>{value}</Text>
        
        <TouchableOpacity
          style={[styles.counterButton, !canIncrement && styles.counterButtonDisabled]}
          onPress={() => {
            if (canIncrement) {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onIncrement();
            }
          }}
          disabled={!canIncrement}
          activeOpacity={0.7}
        >
          <Add size={18} color={canIncrement ? colors.textPrimary : colors.gray300} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function HotelGuestSection({
  guests,
  onGuestsChange,
}: HotelGuestSectionProps) {
  const handleRoomsChange = useCallback((delta: number) => {
    const newRooms = Math.max(1, Math.min(8, guests.rooms + delta));
    // Ensure at least 1 adult per room
    const minAdults = newRooms;
    const newAdults = Math.max(minAdults, guests.adults);
    onGuestsChange({ ...guests, rooms: newRooms, adults: newAdults });
  }, [guests, onGuestsChange]);

  const handleAdultsChange = useCallback((delta: number) => {
    // Minimum adults = number of rooms (at least 1 per room)
    const minAdults = guests.rooms;
    const newAdults = Math.max(minAdults, Math.min(16, guests.adults + delta));
    onGuestsChange({ ...guests, adults: newAdults });
  }, [guests, onGuestsChange]);

  const handleChildrenChange = useCallback((delta: number) => {
    const newChildren = Math.max(0, Math.min(8, guests.children + delta));
    onGuestsChange({ ...guests, children: newChildren });
  }, [guests, onGuestsChange]);

  return (
    <View style={styles.container}>
      <CounterRow
        icon={<Home2 size={22} color={colors.primary} variant="Bold" />}
        label="Rooms"
        value={guests.rooms}
        min={1}
        max={8}
        onIncrement={() => handleRoomsChange(1)}
        onDecrement={() => handleRoomsChange(-1)}
      />
      
      <View style={styles.divider} />
      
      <CounterRow
        icon={<People size={22} color={colors.primary} variant="Bold" />}
        label="Adults"
        sublabel="Age 18+"
        value={guests.adults}
        min={guests.rooms}
        max={16}
        onIncrement={() => handleAdultsChange(1)}
        onDecrement={() => handleAdultsChange(-1)}
      />
      
      <View style={styles.divider} />
      
      <CounterRow
        icon={<People size={22} color={colors.primary} variant="Outline" />}
        label="Children"
        sublabel="Age 0-17"
        value={guests.children}
        min={0}
        max={8}
        onIncrement={() => handleChildrenChange(1)}
        onDecrement={() => handleChildrenChange(-1)}
      />

      {/* Summary */}
      <View style={styles.summary}>
        <Text style={styles.summaryText}>
          {guests.rooms} room{guests.rooms > 1 ? 's' : ''} • {guests.adults} adult{guests.adults > 1 ? 's' : ''}
          {guests.children > 0 ? ` • ${guests.children} child${guests.children > 1 ? 'ren' : ''}` : ''}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.sm,
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  counterInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  counterLabels: {
    gap: 2,
  },
  counterLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  counterSublabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  counterControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  counterButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.gray300,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  counterButtonDisabled: {
    borderColor: colors.gray200,
    backgroundColor: colors.gray50,
  },
  counterValue: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    minWidth: 24,
    textAlign: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: colors.gray100,
  },
  summary: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
    alignItems: 'center',
  },
  summaryText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },
});
