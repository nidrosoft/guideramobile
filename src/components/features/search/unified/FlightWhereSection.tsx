/**
 * FLIGHT WHERE SECTION
 * 
 * Flight-specific location selection with:
 * - Trip type toggle (Round-trip, One-way, Multi-city)
 * - Origin/Destination fields with bottom sheet picker
 * - Swap button for round-trip/one-way
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { 
  Airplane, 
  ArrowSwapVertical,
  Location,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { spacing, typography } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import UnifiedAirportSheet, { Airport } from './UnifiedAirportSheet';

export type TripType = 'one-way' | 'round-trip' | 'multi-city';
export type { Airport };

interface FlightWhereSectionProps {
  tripType: TripType;
  origin: Airport | null;
  destination: Airport | null;
  onTripTypeChange: (type: TripType) => void;
  onOriginSelect: (airport: Airport) => void;
  onDestinationSelect: (airport: Airport) => void;
  onSwap: () => void;
}

type ActiveSheet = 'origin' | 'destination' | null;

export default function FlightWhereSection({
  tripType,
  origin,
  destination,
  onTripTypeChange,
  onOriginSelect,
  onDestinationSelect,
  onSwap,
}: FlightWhereSectionProps) {
  const { colors: themeColors } = useTheme();
  const [activeSheet, setActiveSheet] = useState<ActiveSheet>(null);

  const handleSwap = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSwap();
  }, [onSwap]);

  const handleOriginSelect = useCallback((airport: Airport) => {
    onOriginSelect(airport);
    setActiveSheet(null);
  }, [onOriginSelect]);

  const handleDestinationSelect = useCallback((airport: Airport) => {
    onDestinationSelect(airport);
    setActiveSheet(null);
  }, [onDestinationSelect]);

  const tripTypes: { type: TripType; label: string }[] = [
    { type: 'round-trip', label: 'Round-trip' },
    { type: 'one-way', label: 'One-way' },
    { type: 'multi-city', label: 'Multi-city' },
  ];

  return (
    <View style={styles.container}>
      {/* Trip Type Toggle */}
      <View style={[styles.tripTypeContainer, { backgroundColor: themeColors.bgCard }]}>
        {tripTypes.map((item) => (
          <TouchableOpacity
            key={item.type}
            style={[
              styles.tripTypeTab,
              tripType === item.type && { backgroundColor: themeColors.bgElevated },
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onTripTypeChange(item.type);
            }}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.tripTypeText,
                { color: themeColors.textSecondary },
                tripType === item.type && { color: themeColors.textPrimary },
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

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
                { color: origin ? themeColors.textPrimary : themeColors.gray400 }
              ]}
              numberOfLines={1}
            >
              {origin ? `${origin.city} (${origin.code})` : 'Select departure city'}
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
                { color: destination ? themeColors.textPrimary : themeColors.gray400 }
              ]}
              numberOfLines={1}
            >
              {destination ? `${destination.city} (${destination.code})` : 'Select arrival city'}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Airport Picker Sheets */}
      <UnifiedAirportSheet
        visible={activeSheet === 'origin'}
        title="Flight from"
        onClose={() => setActiveSheet(null)}
        onSelect={handleOriginSelect}
        selectedAirport={origin}
      />

      <UnifiedAirportSheet
        visible={activeSheet === 'destination'}
        title="Flight to"
        onClose={() => setActiveSheet(null)}
        onSelect={handleDestinationSelect}
        selectedAirport={destination}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tripTypeContainer: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 4,
    marginBottom: spacing.md,
  },
  tripTypeTab: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: 12,
    alignItems: 'center',
  },
  tripTypeText: {
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
