/**
 * PACKAGE WHERE SECTION
 * 
 * Package-specific location selection for the unified search overlay.
 * Handles package type selection + origin/destination with location picker sheets.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {
  Location,
  Airplane,
  Building,
  Car,
  Map1,
  Star1,
  ArrowSwapVertical,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { spacing, typography, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { Location as LocationType } from '@/features/booking/types/booking.types';
import { PACKAGE_TEMPLATES, PackageTemplate } from '@/features/booking/types/package.types';

// Re-use the package flow's LocationPickerSheet
import LocationPickerSheet from '@/features/booking/flows/package/sheets/LocationPickerSheet';

// Package type icon mapping
const PACKAGE_ICONS: Record<string, React.ComponentType<any>> = {
  package: Airplane,
  car: Car,
  map: Map1,
  star: Star1,
  settings: Building,
};

interface PackageWhereSectionProps {
  packageType: PackageTemplate;
  origin: LocationType | null;
  destination: LocationType | null;
  onPackageTypeChange: (type: PackageTemplate) => void;
  onOriginSelect: (location: LocationType) => void;
  onDestinationSelect: (location: LocationType) => void;
}

type ActiveSheet = 'origin' | 'destination' | null;

export default function PackageWhereSection({
  packageType,
  origin,
  destination,
  onPackageTypeChange,
  onOriginSelect,
  onDestinationSelect,
}: PackageWhereSectionProps) {
  const { colors: themeColors } = useTheme();
  const [activeSheet, setActiveSheet] = useState<ActiveSheet>(null);

  const handleOriginSelect = useCallback((location: LocationType) => {
    onOriginSelect(location);
    setActiveSheet(null);
  }, [onOriginSelect]);

  const handleDestinationSelect = useCallback((location: LocationType) => {
    onDestinationSelect(location);
    setActiveSheet(null);
  }, [onDestinationSelect]);

  const handleSwap = useCallback(() => {
    if (origin && destination) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onOriginSelect(destination);
      onDestinationSelect(origin);
    }
  }, [origin, destination, onOriginSelect, onDestinationSelect]);

  return (
    <View style={styles.container}>
      {/* Package Type Toggle */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.packageTypesRow}
      >
        {PACKAGE_TEMPLATES.filter(t => t.type !== 'custom').map((template) => {
          const isSelected = packageType === template.type;
          const Icon = PACKAGE_ICONS[template.icon] || Airplane;

          return (
            <TouchableOpacity
              key={template.type}
              style={[
                styles.packageTypeChip,
                { borderColor: themeColors.borderSubtle, backgroundColor: themeColors.bgCard },
                isSelected && { borderColor: themeColors.primary, backgroundColor: `${themeColors.primary}15` },
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onPackageTypeChange(template.type);
              }}
              activeOpacity={0.8}
            >
              <Icon
                size={16}
                color={isSelected ? themeColors.primary : themeColors.textSecondary}
                variant={isSelected ? 'Bold' : 'Linear'}
              />
              <Text
                style={[
                  styles.packageTypeChipText,
                  { color: themeColors.textSecondary },
                  isSelected && { color: themeColors.primary },
                ]}
                numberOfLines={1}
              >
                {template.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Location Fields */}
      <View style={styles.locationFieldsContainer}>
        {/* Origin Field */}
        <TouchableOpacity
          style={[
            styles.locationField,
            {
              backgroundColor: themeColors.bgCard,
              borderColor: themeColors.borderSubtle,
              borderWidth: 1,
            },
          ]}
          onPress={() => setActiveSheet('origin')}
          activeOpacity={0.8}
        >
          <View style={[styles.locationIcon, { backgroundColor: `${themeColors.primary}15` }]}>
            <Airplane size={16} color={themeColors.primary} variant="Bold" />
          </View>
          <View style={styles.locationContent}>
            <Text style={[styles.locationLabel, { color: themeColors.textSecondary }]}>
              From
            </Text>
            <Text
              style={[
                styles.locationValue,
                { color: origin ? themeColors.textPrimary : themeColors.gray400 },
              ]}
              numberOfLines={1}
            >
              {origin ? `${origin.name} (${origin.code})` : 'Select origin city'}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Swap Button */}
        <TouchableOpacity
          style={[styles.swapButton, { backgroundColor: themeColors.textPrimary }]}
          onPress={handleSwap}
          activeOpacity={0.7}
        >
          <ArrowSwapVertical size={18} color={themeColors.white} />
        </TouchableOpacity>

        {/* Destination Field */}
        <TouchableOpacity
          style={[
            styles.locationField,
            {
              backgroundColor: themeColors.bgCard,
              borderColor: themeColors.borderSubtle,
              borderWidth: 1,
            },
          ]}
          onPress={() => setActiveSheet('destination')}
          activeOpacity={0.8}
        >
          <View style={[styles.locationIcon, { backgroundColor: `${themeColors.error}15` }]}>
            <Location size={16} color={themeColors.error} variant="Bold" />
          </View>
          <View style={styles.locationContent}>
            <Text style={[styles.locationLabel, { color: themeColors.textSecondary }]}>
              To
            </Text>
            <Text
              style={[
                styles.locationValue,
                { color: destination ? themeColors.textPrimary : themeColors.gray400 },
              ]}
              numberOfLines={1}
            >
              {destination ? `${destination.name} (${destination.code})` : 'Select destination'}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Location Picker Sheets */}
      <LocationPickerSheet
        visible={activeSheet === 'origin'}
        onClose={() => setActiveSheet(null)}
        onSelect={handleOriginSelect}
        selected={origin}
        title="Select Origin"
        type="origin"
      />

      <LocationPickerSheet
        visible={activeSheet === 'destination'}
        onClose={() => setActiveSheet(null)}
        onSelect={handleDestinationSelect}
        selected={destination}
        title="Select Destination"
        type="destination"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  packageTypesRow: {
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  packageTypeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    gap: spacing.xs,
  },
  packageTypeChipText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  locationFieldsContainer: {
    position: 'relative',
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
  swapButton: {
    position: 'absolute',
    right: spacing.md,
    top: '50%',
    marginTop: -16,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 10,
  },
});
