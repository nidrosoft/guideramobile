/**
 * LINK TRIPS STEP
 * 
 * Step 6 in link import flow - Display real detected trips for selection.
 * Uses the same scan job data as the email flow.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Location, Calendar, TickCircle, Warning2, DocumentText } from 'iconsax-react-native';
import { colors, spacing, typography, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { StepComponentProps } from '../../types/import-flow.types';
import { tripImportEngine, type NormalizedTrip } from '@/services/trip/trip-import-engine.service';

export default function LinkTripsStep({ onNext, data }: StepComponentProps) {
  const { colors: tc } = useTheme();
  const [selectedTrips, setSelectedTrips] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);

  const detectedTrips: NormalizedTrip[] = data.detectedTrips || [];

  if (data.scanStatus === 'failed' || data.scanError) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Warning2 size={48} color={tc.error} variant="Bold" />
        <Text style={[styles.title, { color: tc.textPrimary, textAlign: 'center', marginTop: spacing.md }]}>Import Failed</Text>
        <Text style={[styles.description, { color: tc.textSecondary, textAlign: 'center' }]}>{data.scanError || 'Unable to fetch trips.'}</Text>
        <TouchableOpacity style={[styles.continueButton, { backgroundColor: tc.primary }]} onPress={() => onNext()}>
          <Text style={[styles.continueButtonText, { color: tc.white }]}>Done</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (detectedTrips.length === 0) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <DocumentText size={48} color={tc.textTertiary} variant="Bold" />
        <Text style={[styles.title, { color: tc.textPrimary, textAlign: 'center', marginTop: spacing.md }]}>No Trips Found</Text>
        <Text style={[styles.description, { color: tc.textSecondary, textAlign: 'center' }]}>No travel bookings were found. Try another import method.</Text>
        <TouchableOpacity style={[styles.continueButton, { backgroundColor: tc.primary }]} onPress={() => onNext()}>
          <Text style={[styles.continueButtonText, { color: tc.white }]}>Done</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const toggleTrip = (id: string) => {
    setSelectedTrips(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);
  };

  const handleImport = async () => {
    if (selectedTrips.length === 0 || !data.scanJobId) return;
    setIsImporting(true);
    try {
      const selected = selectedTrips.map(id => ({ externalId: id }));
      const result = await tripImportEngine.importBookings(data.scanJobId, selected);
      onNext({ importResult: result, selectedTrips: result.trips });
    } catch (error: any) {
      onNext({ importResult: { imported: false, error: error.message }, selectedTrips: [] });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: tc.textPrimary }]}>Found {detectedTrips.length} Trips</Text>
      <Text style={[styles.description, { color: tc.textSecondary }]}>Select the trips you'd like to import</Text>

      <ScrollView style={styles.tripsList} showsVerticalScrollIndicator={false}>
        {detectedTrips.map((trip) => {
          const isSelected = selectedTrips.includes(trip.externalId);
          const display = tripImportEngine.formatTripForDisplay(trip);

          return (
            <TouchableOpacity
              key={trip.externalId}
              style={[styles.tripCard, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle }, isSelected && { backgroundColor: tc.primary + '08', borderColor: tc.primary }]}
              onPress={() => toggleTrip(trip.externalId)}
              activeOpacity={0.7}
            >
              <View style={styles.tripInfo}>
                <Text style={[styles.tripTitle, { color: tc.textPrimary }, isSelected && { color: tc.primary }]}>{display.title}</Text>
                <View style={styles.tripDetail}>
                  <Location size={16} color={tc.textTertiary} variant="Bold" />
                  <Text style={[styles.tripDetailText, { color: tc.textSecondary }]}>{display.destination}</Text>
                </View>
                <View style={styles.tripDetail}>
                  <Calendar size={16} color={tc.textTertiary} variant="Bold" />
                  <Text style={[styles.tripDetailText, { color: tc.textSecondary }]}>{display.dateRange}</Text>
                </View>
                <Text style={[styles.bookingsCount, { color: tc.textTertiary }]}>{display.bookingCount}</Text>
              </View>
              <View style={[styles.checkbox, { borderColor: tc.borderSubtle }, isSelected && { borderColor: tc.primary }]}>
                {isSelected && <TickCircle size={24} color={tc.primary} variant="Bold" />}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: tc.borderSubtle }]}>
        <Text style={[styles.selectedCount, { color: tc.textSecondary }]}>{selectedTrips.length} selected</Text>
        <TouchableOpacity
          style={[styles.continueButton, { backgroundColor: tc.primary }, (selectedTrips.length === 0 || isImporting) && { backgroundColor: tc.borderSubtle }]}
          onPress={handleImport}
          disabled={selectedTrips.length === 0 || isImporting}
        >
          {isImporting ? <ActivityIndicator color={tc.white} /> : (
            <Text style={[styles.continueButtonText, { color: tc.white }]}>Import {selectedTrips.length > 0 ? `(${selectedTrips.length})` : 'Trips'}</Text>
          )}
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
    borderRadius: borderRadius['2xl'],
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1.5,
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
