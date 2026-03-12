/**
 * SCAN RESULT STEP
 * 
 * Step 4 in scan import flow - Display real OCR-extracted booking details.
 * User reviews and confirms, then imports into a trip.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { TickCircle, Airplane, Calendar, Clock, Building, Car, Bus, Warning2, Location } from 'iconsax-react-native';
import { colors, spacing, typography, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { StepComponentProps } from '../../types/import-flow.types';
import { tripImportEngine } from '@/services/trip/trip-import-engine.service';

const CATEGORY_ICONS: Record<string, any> = {
  flight: Airplane, hotel: Building, car: Car, train: Bus,
};

export default function ScanResultStep({ onNext, data }: StepComponentProps) {
  const { colors: tc } = useTheme();
  const { profile } = useAuth();
  const [isImporting, setIsImporting] = useState(false);

  const booking = data.scannedBooking;

  // Error state
  if (!booking || data.scanError) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Warning2 size={48} color={tc.error} variant="Bold" />
          <Text style={[styles.title, { color: tc.textPrimary }]}>Scan Failed</Text>
          <Text style={[styles.description, { color: tc.textSecondary }]}>
            {data.scanError || 'Could not extract booking information. Please try again with a clearer image.'}
          </Text>
          <TouchableOpacity style={[styles.confirmButton, { backgroundColor: tc.primary }]} onPress={() => onNext()}>
            <Text style={[styles.confirmButtonText, { color: tc.white }]}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const Icon = CATEGORY_ICONS[booking.category] || Airplane;
  const display = tripImportEngine.formatBookingForDisplay(booking);

  const handleConfirm = async () => {
    if (!profile?.id) return;
    setIsImporting(true);
    try {
      const result = await tripImportEngine.importScannedBooking(booking, profile.id);
      onNext({ importResult: result });
    } catch (error: any) {
      console.error('Import error:', error);
      onNext({ importResult: { tripId: null, error: error.message } });
    } finally {
      setIsImporting(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Not detected';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    } catch { return dateStr; }
  };

  const formatTime = (dateStr?: string) => {
    if (!dateStr || !dateStr.includes('T')) return null;
    try {
      return new Date(dateStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } catch { return null; }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Success Header */}
        <View style={styles.successHeader}>
          <View style={styles.iconContainer}>
            <TickCircle size={48} color="#22C55E" variant="Bold" />
          </View>
          <Text style={[styles.title, { color: tc.textPrimary }]}>Booking Details Found!</Text>
          <Text style={[styles.description, { color: tc.textSecondary }]}>
            We extracted the following from your {booking.category || 'travel'} document
          </Text>
          {booking.confidence && (
            <Text style={[styles.confidenceBadge, { color: booking.confidence > 0.7 ? '#22C55E' : '#F59E0B' }]}>
              {Math.round(booking.confidence * 100)}% confidence
            </Text>
          )}
        </View>

        {/* Booking Details Card */}
        <View style={[styles.detailsCard, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle }]}>
          {booking.confirmationNumber && (
            <>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: tc.textSecondary }]}>Confirmation Code</Text>
                <Text style={[styles.detailValue, { color: tc.textPrimary }]}>{booking.confirmationNumber}</Text>
              </View>
              <View style={[styles.divider, { backgroundColor: tc.borderSubtle }]} />
            </>
          )}

          <View style={styles.detailRow}>
            <Icon size={20} color={tc.primary} variant="Bold" />
            <View style={styles.detailContent}>
              <Text style={[styles.detailLabel, { color: tc.textSecondary }]}>{booking.category?.charAt(0).toUpperCase() + booking.category?.slice(1) || 'Booking'}</Text>
              <Text style={[styles.detailValue, { color: tc.textPrimary }]}>{booking.title}</Text>
            </View>
          </View>

          {(booking.startLocation?.name || booking.endLocation?.name) && (
            <>
              <View style={[styles.divider, { backgroundColor: tc.borderSubtle }]} />
              <View style={styles.detailRow}>
                <Location size={20} color={tc.primary} variant="Bold" />
                <View style={styles.detailContent}>
                  <Text style={[styles.detailLabel, { color: tc.textSecondary }]}>Route</Text>
                  <Text style={[styles.detailValue, { color: tc.textPrimary }]}>
                    {booking.startLocation?.name || booking.startLocation?.code || '?'} → {booking.endLocation?.name || booking.endLocation?.code || '?'}
                  </Text>
                </View>
              </View>
            </>
          )}

          <View style={[styles.divider, { backgroundColor: tc.borderSubtle }]} />
          <View style={styles.detailRow}>
            <Calendar size={20} color={tc.primary} variant="Bold" />
            <View style={styles.detailContent}>
              <Text style={[styles.detailLabel, { color: tc.textSecondary }]}>Date</Text>
              <Text style={[styles.detailValue, { color: tc.textPrimary }]}>{formatDate(booking.startDate)}</Text>
            </View>
          </View>

          {formatTime(booking.startDate) && (
            <>
              <View style={[styles.divider, { backgroundColor: tc.borderSubtle }]} />
              <View style={styles.detailRow}>
                <Clock size={20} color={tc.primary} variant="Bold" />
                <View style={styles.detailContent}>
                  <Text style={[styles.detailLabel, { color: tc.textSecondary }]}>Time</Text>
                  <Text style={[styles.detailValue, { color: tc.textPrimary }]}>{formatTime(booking.startDate)}</Text>
                </View>
              </View>
            </>
          )}

          {booking.details?.seatNumber && (
            <>
              <View style={[styles.divider, { backgroundColor: tc.borderSubtle }]} />
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: tc.textSecondary }]}>Seat</Text>
                <Text style={[styles.detailValue, { color: tc.textPrimary }]}>{booking.details.seatNumber}</Text>
              </View>
            </>
          )}

          {booking.pricing?.total && (
            <>
              <View style={[styles.divider, { backgroundColor: tc.borderSubtle }]} />
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: tc.textSecondary }]}>Price</Text>
                <Text style={[styles.detailValue, { color: tc.textPrimary }]}>{booking.pricing.currency || '$'}{booking.pricing.total}</Text>
              </View>
            </>
          )}
        </View>
      </ScrollView>

      {/* Fixed Footer Button */}
      <View style={[styles.footer, { borderTopColor: tc.borderSubtle }]}>
        <TouchableOpacity
          style={[styles.confirmButton, { backgroundColor: tc.primary }, isImporting && { opacity: 0.6 }]}
          onPress={handleConfirm}
          disabled={isImporting}
        >
          {isImporting ? (
            <ActivityIndicator color={tc.white} />
          ) : (
            <Text style={[styles.confirmButtonText, { color: tc.white }]}>Confirm & Add to Trip</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  successHeader: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  iconContainer: {
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  description: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  confidenceBadge: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    marginTop: spacing.xs,
  },
  detailsCard: {
    borderRadius: borderRadius['2xl'],
    padding: spacing.lg,
    borderWidth: 1,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.gray200,
    marginVertical: spacing.xs,
  },
  footer: {
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
  },
  confirmButton: {
    backgroundColor: colors.primary,
    height: 52,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
});
