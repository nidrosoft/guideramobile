/**
 * WHO SECTION
 * 
 * Guest counter with Adults, Children, Infants, and Pets.
 * Each category has increment/decrement buttons.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Add, Minus } from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { spacing, typography } from '@/styles';
import { useTheme } from '@/context/ThemeContext';

interface GuestCounts {
  adults: number;
  children: number;
  infants: number;
  pets: number;
}

interface WhoSectionProps {
  guests: GuestCounts;
  onUpdateGuests: (guests: GuestCounts) => void;
}

interface GuestRowProps {
  title: string;
  subtitle: string;
  count: number;
  onIncrement: () => void;
  onDecrement: () => void;
  minValue?: number;
  maxValue?: number;
}

function GuestRow({
  title,
  subtitle,
  count,
  onIncrement,
  onDecrement,
  minValue = 0,
  maxValue = 16,
}: GuestRowProps) {
  const { colors: themeColors } = useTheme();

  const handleIncrement = () => {
    if (count < maxValue) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onIncrement();
    }
  };

  const handleDecrement = () => {
    if (count > minValue) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onDecrement();
    }
  };

  return (
    <View style={[styles.guestRow, { borderBottomColor: themeColors.borderSubtle }]}>
      <View style={styles.guestInfo}>
        <Text style={[styles.guestTitle, { color: themeColors.textPrimary }]}>
          {title}
        </Text>
        <Text style={[styles.guestSubtitle, { color: themeColors.textSecondary }]}>
          {subtitle}
        </Text>
      </View>
      <View style={styles.counterContainer}>
        <TouchableOpacity
          style={[
            styles.counterButton,
            { borderColor: count <= minValue ? themeColors.gray200 : themeColors.gray400 },
          ]}
          onPress={handleDecrement}
          disabled={count <= minValue}
          activeOpacity={0.7}
        >
          <Minus 
            size={16} 
            color={count <= minValue ? themeColors.gray300 : themeColors.textSecondary} 
          />
        </TouchableOpacity>
        <Text style={[styles.countText, { color: themeColors.textPrimary }]}>
          {count}
        </Text>
        <TouchableOpacity
          style={[
            styles.counterButton,
            { borderColor: count >= maxValue ? themeColors.gray200 : themeColors.gray400 },
          ]}
          onPress={handleIncrement}
          disabled={count >= maxValue}
          activeOpacity={0.7}
        >
          <Add 
            size={16} 
            color={count >= maxValue ? themeColors.gray300 : themeColors.textSecondary} 
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function WhoSection({
  guests,
  onUpdateGuests,
}: WhoSectionProps) {
  const { colors: themeColors } = useTheme();

  const updateCount = (key: keyof GuestCounts, delta: number) => {
    onUpdateGuests({
      ...guests,
      [key]: guests[key] + delta,
    });
  };

  return (
    <View style={styles.container}>
      <GuestRow
        title="Adults"
        subtitle="Ages 13 or above"
        count={guests.adults}
        onIncrement={() => updateCount('adults', 1)}
        onDecrement={() => updateCount('adults', -1)}
      />
      <GuestRow
        title="Children"
        subtitle="Ages 2 – 12"
        count={guests.children}
        onIncrement={() => updateCount('children', 1)}
        onDecrement={() => updateCount('children', -1)}
      />
      <GuestRow
        title="Infants"
        subtitle="Under 2"
        count={guests.infants}
        onIncrement={() => updateCount('infants', 1)}
        onDecrement={() => updateCount('infants', -1)}
        maxValue={5}
      />
      <View style={styles.lastRow}>
        <GuestRow
          title="Pets"
          subtitle="Bringing a service animal?"
          count={guests.pets}
          onIncrement={() => updateCount('pets', 1)}
          onDecrement={() => updateCount('pets', -1)}
          maxValue={5}
        />
      </View>
      <TouchableOpacity activeOpacity={0.7}>
        <Text style={[styles.serviceAnimalLink, { color: themeColors.textSecondary }]}>
          Bringing a service animal?
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  guestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
  },
  guestInfo: {
    flex: 1,
  },
  guestTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
  },
  guestSubtitle: {
    fontSize: typography.fontSize.sm,
    marginTop: 2,
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  counterButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    minWidth: 24,
    textAlign: 'center',
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  serviceAnimalLink: {
    fontSize: typography.fontSize.sm,
    textDecorationLine: 'underline',
    marginTop: spacing.sm,
  },
});
