/**
 * CAR WHERE SECTION
 * 
 * Car-specific location selection for the unified search overlay.
 * Handles pickup/return location with same-return toggle.
 * Opens bottom sheet pickers for location selection.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { Location, ArrowSwapVertical } from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { spacing, typography, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { Location as LocationType } from '@/features/booking/types/booking.types';

// Re-use the car flow's LocationPickerSheet
import LocationPickerSheet from '@/features/booking/flows/car/sheets/LocationPickerSheet';

export interface CarLocationData {
  pickupLocation: LocationType | null;
  returnLocation: LocationType | null;
  sameReturnLocation: boolean;
}

interface CarWhereSectionProps {
  pickupLocation: LocationType | null;
  returnLocation: LocationType | null;
  sameReturnLocation: boolean;
  onPickupSelect: (location: LocationType) => void;
  onReturnSelect: (location: LocationType) => void;
  onSameReturnToggle: (value: boolean) => void;
}

type ActiveSheet = 'pickup' | 'return' | null;

export default function CarWhereSection({
  pickupLocation,
  returnLocation,
  sameReturnLocation,
  onPickupSelect,
  onReturnSelect,
  onSameReturnToggle,
}: CarWhereSectionProps) {
  const { colors: themeColors } = useTheme();
  const [activeSheet, setActiveSheet] = useState<ActiveSheet>(null);

  const handlePickupSelect = useCallback((location: LocationType) => {
    onPickupSelect(location);
    setActiveSheet(null);
  }, [onPickupSelect]);

  const handleReturnSelect = useCallback((location: LocationType) => {
    onReturnSelect(location);
    setActiveSheet(null);
  }, [onReturnSelect]);

  return (
    <View style={styles.container}>
      {/* Pickup Location */}
      <TouchableOpacity
        style={[
          styles.locationField,
          {
            backgroundColor: themeColors.bgCard,
            borderColor: themeColors.borderSubtle,
            borderWidth: 1,
          },
        ]}
        onPress={() => setActiveSheet('pickup')}
        activeOpacity={0.8}
      >
        <View style={[styles.locationIcon, { backgroundColor: `${themeColors.primary}15` }]}>
          <Location size={16} color={themeColors.primary} variant="Bold" />
        </View>
        <View style={styles.locationContent}>
          <Text style={[styles.locationLabel, { color: themeColors.textSecondary }]}>
            Pickup Location
          </Text>
          <Text
            style={[
              styles.locationValue,
              { color: pickupLocation ? themeColors.textPrimary : themeColors.gray400 },
            ]}
            numberOfLines={1}
          >
            {pickupLocation ? pickupLocation.name : 'Select pickup location'}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Same Return Toggle */}
      <View style={[styles.toggleRow, { borderColor: themeColors.borderSubtle }]}>
        <Text style={[styles.toggleLabel, { color: themeColors.textPrimary }]}>
          Return to same location
        </Text>
        <Switch
          value={sameReturnLocation}
          onValueChange={(value) => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onSameReturnToggle(value);
          }}
          trackColor={{ false: themeColors.gray300, true: `${themeColors.primary}50` }}
          thumbColor={sameReturnLocation ? themeColors.primary : themeColors.gray400}
        />
      </View>

      {/* Return Location (if different) */}
      {!sameReturnLocation && (
        <TouchableOpacity
          style={[
            styles.locationField,
            {
              backgroundColor: themeColors.bgCard,
              borderColor: themeColors.borderSubtle,
              borderWidth: 1,
            },
          ]}
          onPress={() => setActiveSheet('return')}
          activeOpacity={0.8}
        >
          <View style={[styles.locationIcon, { backgroundColor: `${themeColors.success}15` }]}>
            <Location size={16} color={themeColors.success} variant="Bold" />
          </View>
          <View style={styles.locationContent}>
            <Text style={[styles.locationLabel, { color: themeColors.textSecondary }]}>
              Return Location
            </Text>
            <Text
              style={[
                styles.locationValue,
                { color: returnLocation ? themeColors.textPrimary : themeColors.gray400 },
              ]}
              numberOfLines={1}
            >
              {returnLocation ? returnLocation.name : 'Select return location'}
            </Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Location Picker Sheets */}
      <LocationPickerSheet
        visible={activeSheet === 'pickup'}
        onClose={() => setActiveSheet(null)}
        onSelect={handlePickupSelect}
        title="Pickup Location"
      />

      <LocationPickerSheet
        visible={activeSheet === 'return'}
        onClose={() => setActiveSheet(null)}
        onSelect={handleReturnSelect}
        title="Return Location"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: spacing.xs,
  },
  locationField: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  locationIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  locationContent: {
    flex: 1,
  },
  locationLabel: {
    fontSize: typography.fontSize.xs,
    marginBottom: 1,
  },
  locationValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  toggleLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
});
