/**
 * LINK TRIPS STEP
 * 
 * Step 6 in link import flow - Display found trips for selection.
 * User can select which trips to import.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Location, Calendar, TickCircle } from 'iconsax-react-native';
import { colors, spacing, typography, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { StepComponentProps } from '../../types/import-flow.types';

// Mock trip data
const MOCK_TRIPS = [
  {
    id: '1',
    title: 'Paris Adventure',
    destination: 'Paris, France',
    dates: 'Dec 15-20, 2024',
    bookings: 3,
  },
  {
    id: '2',
    title: 'Tokyo Exploration',
    destination: 'Tokyo, Japan',
    dates: 'Jan 10-18, 2025',
    bookings: 5,
  },
  {
    id: '3',
    title: 'New York Business Trip',
    destination: 'New York, USA',
    dates: 'Feb 5-8, 2025',
    bookings: 2,
  },
];

export default function LinkTripsStep({ onNext }: StepComponentProps) {
  const [selectedTrips, setSelectedTrips] = useState<string[]>([]);

  const toggleTrip = (id: string) => {
    setSelectedTrips(prev =>
      prev.includes(id)
        ? prev.filter(tripId => tripId !== id)
        : [...prev, id]
    );
  };

  const handleContinue = () => {
    const trips = MOCK_TRIPS.filter(t => selectedTrips.includes(t.id));
    onNext({ selectedTrips: trips });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Found {MOCK_TRIPS.length} Trips</Text>
      <Text style={styles.description}>
        Select the trips you'd like to import
      </Text>

      <ScrollView 
        style={styles.tripsList}
        showsVerticalScrollIndicator={false}
      >
        {MOCK_TRIPS.map((trip) => {
          const isSelected = selectedTrips.includes(trip.id);
          
          return (
            <TouchableOpacity
              key={trip.id}
              style={[styles.tripCard, isSelected && styles.tripCardSelected]}
              onPress={() => toggleTrip(trip.id)}
              activeOpacity={0.7}
            >
              <View style={styles.tripInfo}>
                <Text style={[styles.tripTitle, isSelected && styles.tripTitleSelected]}>
                  {trip.title}
                </Text>
                
                <View style={styles.tripDetail}>
                  <Location size={16} color={colors.gray500} variant="Bold" />
                  <Text style={styles.tripDetailText}>{trip.destination}</Text>
                </View>
                
                <View style={styles.tripDetail}>
                  <Calendar size={16} color={colors.gray500} variant="Bold" />
                  <Text style={styles.tripDetailText}>{trip.dates}</Text>
                </View>
                
                <Text style={styles.bookingsCount}>
                  {trip.bookings} booking{trip.bookings !== 1 ? 's' : ''}
                </Text>
              </View>

              <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                {isSelected && (
                  <TickCircle size={24} color={colors.primary} variant="Bold" />
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.selectedCount}>
          {selectedTrips.length} selected
        </Text>
        <TouchableOpacity
          style={[styles.continueButton, selectedTrips.length === 0 && styles.continueButtonDisabled]}
          onPress={handleContinue}
          disabled={selectedTrips.length === 0}
        >
          <Text style={styles.continueButtonText}>
            Import {selectedTrips.length > 0 ? `(${selectedTrips.length})` : 'Trips'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: spacing.xl,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  description: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  tripsList: {
    flex: 1,
    marginBottom: spacing.lg,
  },
  tripCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: colors.gray200,
  },
  tripCardSelected: {
    backgroundColor: '#F5F3FF',
    borderColor: colors.primary,
  },
  tripInfo: {
    flex: 1,
  },
  tripTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  tripTitleSelected: {
    color: colors.primary,
  },
  tripDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 4,
  },
  tripDetailText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  bookingsCount: {
    fontSize: typography.fontSize.xs,
    color: colors.gray500,
    marginTop: 4,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.gray300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    borderColor: colors.primary,
  },
  footer: {
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
  },
  selectedCount: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  continueButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    alignItems: 'center',
  },
  continueButtonDisabled: {
    backgroundColor: colors.gray300,
  },
  continueButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
});
