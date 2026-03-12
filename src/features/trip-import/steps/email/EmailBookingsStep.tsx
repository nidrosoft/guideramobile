/**
 * EMAIL BOOKINGS STEP
 * 
 * Step 7 in email import flow - Display found bookings for selection.
 * Shows real detected trips from the scan job.
 * User can select which trips/bookings to import.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Airplane, Building, Car, TickCircle, Bus, Ship, DocumentText, Warning2 } from 'iconsax-react-native';
import { colors, spacing, typography, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { StepComponentProps } from '../../types/import-flow.types';
import { tripImportEngine, type NormalizedTrip, type NormalizedBooking } from '@/services/trip/trip-import-engine.service';

const CATEGORY_ICONS: Record<string, any> = {
  flight: Airplane,
  hotel: Building,
  car: Car,
  train: Bus,
  cruise: Ship,
  other: DocumentText,
};

export default function EmailBookingsStep({ onNext, data }: StepComponentProps) {
  const { colors: tc, isDark } = useTheme();
  const [selectedTripIds, setSelectedTripIds] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);

  const detectedTrips: NormalizedTrip[] = data.detectedTrips || [];
  const totalBookings = detectedTrips.reduce((sum, t) => sum + (t.segments?.length || 0), 0);

  // Handle scan errors
  if (data.scanStatus === 'failed' || data.scanError) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Warning2 size={48} color={tc.error} variant="Bold" />
          <Text style={[styles.title, { color: tc.textPrimary }]}>Scan Failed</Text>
          <Text style={[styles.description, { color: tc.textSecondary }]}>
            {data.scanError || 'Unable to scan your email. Please check your connection and try again.'}
          </Text>
          <TouchableOpacity
            style={[styles.continueButton, { backgroundColor: tc.primary }]}
            onPress={() => onNext()}
          >
            <Text style={[styles.continueButtonText, { color: tc.white }]}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Handle no bookings found
  if (detectedTrips.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <DocumentText size={48} color={tc.textTertiary} variant="Bold" />
          <Text style={[styles.title, { color: tc.textPrimary }]}>No Bookings Found</Text>
          <Text style={[styles.description, { color: tc.textSecondary }]}>
            We didn't find any travel bookings in your recent emails. Try entering your trip details manually instead.
          </Text>
          <TouchableOpacity
            style={[styles.continueButton, { backgroundColor: tc.primary }]}
            onPress={() => onNext()}
          >
            <Text style={[styles.continueButtonText, { color: tc.white }]}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const toggleTrip = (externalId: string) => {
    setSelectedTripIds(prev =>
      prev.includes(externalId)
        ? prev.filter(id => id !== externalId)
        : [...prev, externalId]
    );
  };

  const selectAll = () => {
    if (selectedTripIds.length === detectedTrips.length) {
      setSelectedTripIds([]);
    } else {
      setSelectedTripIds(detectedTrips.map(t => t.externalId));
    }
  };

  const handleImport = async () => {
    if (selectedTripIds.length === 0 || !data.scanJobId) return;

    setIsImporting(true);
    try {
      const selectedTrips = selectedTripIds.map(id => ({ externalId: id }));
      const result = await tripImportEngine.importBookings(data.scanJobId, selectedTrips);

      onNext({
        importResult: result,
        selectedBookings: result.trips,
      });
    } catch (error: any) {
      console.error('Import error:', error);
      onNext({
        importResult: { imported: false, error: error.message },
        selectedBookings: [],
      });
    } finally {
      setIsImporting(false);
    }
  };

  const selectedBookingCount = detectedTrips
    .filter(t => selectedTripIds.includes(t.externalId))
    .reduce((sum, t) => sum + (t.segments?.length || 0), 0);

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: tc.textPrimary }]}>
        Found {detectedTrips.length} Trip{detectedTrips.length !== 1 ? 's' : ''}
      </Text>
      <Text style={[styles.description, { color: tc.textSecondary }]}>
        {totalBookings} booking{totalBookings !== 1 ? 's' : ''} detected. Select which trips to import.
      </Text>

      {/* Select All */}
      <TouchableOpacity style={styles.selectAllRow} onPress={selectAll}>
        <Text style={[styles.selectAllText, { color: tc.primary }]}>
          {selectedTripIds.length === detectedTrips.length ? 'Deselect All' : 'Select All'}
        </Text>
      </TouchableOpacity>

      <ScrollView 
        style={styles.bookingsList}
        showsVerticalScrollIndicator={false}
      >
        {detectedTrips.map((trip) => {
          const isSelected = selectedTripIds.includes(trip.externalId);
          const display = tripImportEngine.formatTripForDisplay(trip);

          return (
            <TouchableOpacity
              key={trip.externalId}
              style={[
                styles.bookingCard,
                { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle },
                isSelected && { backgroundColor: tc.primary + '08', borderColor: tc.primary },
              ]}
              onPress={() => toggleTrip(trip.externalId)}
              activeOpacity={0.7}
            >
              {/* Trip header */}
              <View style={styles.tripHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.bookingTitle, { color: tc.textPrimary }, isSelected && { color: tc.primary }]}>
                    {display.title}
                  </Text>
                  <Text style={[styles.bookingDetails, { color: tc.textSecondary }]}>
                    {display.destination} • {display.dateRange}
                  </Text>
                </View>
                <View style={[styles.checkbox, { borderColor: tc.borderSubtle }, isSelected && { borderColor: tc.primary }]}>
                  {isSelected && <TickCircle size={24} color={tc.primary} variant="Bold" />}
                </View>
              </View>

              {/* Segments preview */}
              {trip.segments && trip.segments.length > 0 && (
                <View style={[styles.segmentsContainer, { borderTopColor: tc.borderSubtle }]}>
                  {trip.segments.slice(0, 4).map((segment, idx) => {
                    const Icon = CATEGORY_ICONS[segment.category] || DocumentText;
                    const segDisplay = tripImportEngine.formatBookingForDisplay(segment);
                    return (
                      <View key={segment.externalId || idx} style={styles.segmentRow}>
                        <Icon size={16} color={tc.textTertiary} variant="Bold" />
                        <Text style={[styles.segmentText, { color: tc.textSecondary }]} numberOfLines={1}>
                          {segDisplay.title}
                        </Text>
                        {segDisplay.price ? (
                          <Text style={[styles.segmentPrice, { color: tc.textTertiary }]}>{segDisplay.price}</Text>
                        ) : null}
                      </View>
                    );
                  })}
                  {trip.segments.length > 4 && (
                    <Text style={[styles.moreSegments, { color: tc.textTertiary }]}>
                      +{trip.segments.length - 4} more
                    </Text>
                  )}
                </View>
              )}

              <Text style={[styles.bookingCount, { color: tc.textTertiary }]}>
                {display.bookingCount}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { borderTopColor: tc.borderSubtle }]}>
        <Text style={[styles.selectedCount, { color: tc.textSecondary }]}>
          {selectedTripIds.length} trip{selectedTripIds.length !== 1 ? 's' : ''} selected ({selectedBookingCount} bookings)
        </Text>
        <TouchableOpacity
          style={[
            styles.continueButton,
            { backgroundColor: tc.primary },
            (selectedTripIds.length === 0 || isImporting) && { backgroundColor: tc.borderSubtle },
          ]}
          onPress={handleImport}
          disabled={selectedTripIds.length === 0 || isImporting}
        >
          {isImporting ? (
            <ActivityIndicator color={tc.white} />
          ) : (
            <Text style={[styles.continueButtonText, { color: tc.white }]}>
              Import {selectedTripIds.length > 0 ? `(${selectedTripIds.length})` : 'Trips'}
            </Text>
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
  bookingsList: {
    flex: 1,
    marginBottom: spacing.lg,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl * 2,
    gap: spacing.md,
  },
  selectAllRow: {
    alignItems: 'flex-end',
    marginBottom: spacing.sm,
  },
  selectAllText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  bookingCard: {
    borderRadius: borderRadius['2xl'],
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1.5,
  },
  tripHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bookingTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    marginBottom: 2,
  },
  bookingDetails: {
    fontSize: typography.fontSize.sm,
    marginTop: 2,
  },
  segmentsContainer: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    gap: 6,
  },
  segmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  segmentText: {
    flex: 1,
    fontSize: typography.fontSize.xs,
  },
  segmentPrice: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  },
  moreSegments: {
    fontSize: typography.fontSize.xs,
    fontStyle: 'italic',
    marginTop: 2,
  },
  bookingCount: {
    fontSize: typography.fontSize.xs,
    marginTop: spacing.sm,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
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
