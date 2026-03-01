/**
 * MULTI-CITY SECTION
 * 
 * Multi-city flight selection with multiple legs.
 * Each leg has origin, destination, and date.
 * Includes trip type toggle at the top.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Add } from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { spacing, typography } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import FlightLegCard, { FlightLeg } from './FlightLegCard';
import UnifiedAirportSheet, { Airport } from './UnifiedAirportSheet';
import UnifiedDateSheet from './UnifiedDateSheet';
import { TripType } from './FlightWhereSection';

interface MultiCitySectionProps {
  legs: FlightLeg[];
  onLegsChange: (legs: FlightLeg[]) => void;
  tripType: TripType;
  onTripTypeChange: (type: TripType) => void;
}

type EditingField = {
  legIndex: number;
  field: 'origin' | 'destination' | 'date';
} | null;

export default function MultiCitySection({
  legs,
  onLegsChange,
  tripType,
  onTripTypeChange,
}: MultiCitySectionProps) {
  const { colors: themeColors } = useTheme();
  const [editingField, setEditingField] = useState<EditingField>(null);

  const tripTypes: { type: TripType; label: string }[] = [
    { type: 'round-trip', label: 'Round-trip' },
    { type: 'one-way', label: 'One-way' },
    { type: 'multi-city', label: 'Multi-city' },
  ];

  const handleAddLeg = useCallback(() => {
    if (legs.length >= 5) return; // Max 5 legs
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newLeg: FlightLeg = {
      id: `leg-${Date.now()}`,
      origin: null,
      destination: null,
      date: null,
    };
    onLegsChange([...legs, newLeg]);
  }, [legs, onLegsChange]);

  const handleRemoveLeg = useCallback((index: number) => {
    if (legs.length <= 2) return; // Min 2 legs
    const newLegs = legs.filter((_, i) => i !== index);
    onLegsChange(newLegs);
  }, [legs, onLegsChange]);

  const handleSelectAirport = useCallback((airport: Airport) => {
    if (!editingField || editingField.field === 'date') return;
    
    const newLegs = [...legs];
    const leg = newLegs[editingField.legIndex];
    
    if (editingField.field === 'origin') {
      leg.origin = { code: airport.code, city: airport.city };
    } else {
      leg.destination = { code: airport.code, city: airport.city };
    }
    
    onLegsChange(newLegs);
    setEditingField(null);
  }, [editingField, legs, onLegsChange]);

  const handleSelectDate = useCallback((date: Date) => {
    if (!editingField || editingField.field !== 'date') return;
    
    const newLegs = [...legs];
    newLegs[editingField.legIndex].date = date;
    
    onLegsChange(newLegs);
    setEditingField(null);
  }, [editingField, legs, onLegsChange]);

  const getSheetTitle = (): string => {
    if (!editingField) return '';
    const legNum = editingField.legIndex + 1;
    if (editingField.field === 'origin') return `Flight ${legNum} - From`;
    if (editingField.field === 'destination') return `Flight ${legNum} - To`;
    return `Flight ${legNum} - Date`;
  };

  return (
    <View style={styles.container}>
      {/* Trip Type Toggle - Always visible */}
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

      <ScrollView 
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
      >
        {legs.map((leg, index) => (
          <FlightLegCard
            key={leg.id}
            leg={leg}
            index={index}
            totalLegs={legs.length}
            onPressOrigin={() => setEditingField({ legIndex: index, field: 'origin' })}
            onPressDestination={() => setEditingField({ legIndex: index, field: 'destination' })}
            onPressDate={() => setEditingField({ legIndex: index, field: 'date' })}
            onRemove={() => handleRemoveLeg(index)}
            canRemove={legs.length > 2}
          />
        ))}

        {/* Add Flight Button */}
        {legs.length < 5 && (
          <TouchableOpacity
            style={[styles.addButton, { borderColor: themeColors.primary }]}
            onPress={handleAddLeg}
            activeOpacity={0.7}
          >
            <Add size={20} color={themeColors.primary} />
            <Text style={[styles.addButtonText, { color: themeColors.primary }]}>
              Add another flight
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Airport Picker Sheet */}
      <UnifiedAirportSheet
        visible={editingField !== null && editingField.field !== 'date'}
        title={getSheetTitle()}
        onClose={() => setEditingField(null)}
        onSelect={handleSelectAirport}
        selectedAirport={
          editingField && editingField.field !== 'date'
            ? editingField.field === 'origin'
              ? legs[editingField.legIndex]?.origin 
                ? { ...legs[editingField.legIndex].origin!, name: '', country: '' }
                : null
              : legs[editingField.legIndex]?.destination
                ? { ...legs[editingField.legIndex].destination!, name: '', country: '' }
                : null
            : null
        }
      />

      {/* Date Picker Sheet */}
      <UnifiedDateSheet
        visible={editingField !== null && editingField.field === 'date'}
        title={getSheetTitle()}
        onClose={() => setEditingField(null)}
        onSelect={handleSelectDate}
        selectedDate={
          editingField?.field === 'date' 
            ? legs[editingField.legIndex]?.date 
            : null
        }
        minDate={
          editingField?.field === 'date' && editingField.legIndex > 0
            ? legs[editingField.legIndex - 1]?.date || undefined
            : undefined
        }
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    marginTop: spacing.sm,
  },
  addButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
});
