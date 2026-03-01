/**
 * SCAN RESULT STEP
 * 
 * Step 4 in scan import flow - Display extracted booking details.
 * User reviews and confirms the scanned information.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { TickCircle, Airplane, Calendar, Clock } from 'iconsax-react-native';
import { colors, spacing, typography, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { StepComponentProps } from '../../types/import-flow.types';

export default function ScanResultStep({ onNext, data }: StepComponentProps) {
  const booking = data.scannedBooking || {};

  const handleConfirm = () => {
    onNext();
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Success Header */}
        <View style={styles.successHeader}>
          <View style={styles.iconContainer}>
            <TickCircle size={48} color={colors.success} variant="Bold" />
          </View>
          <Text style={styles.title}>Booking Details Found!</Text>
          <Text style={styles.description}>
            We've extracted the following information from your ticket
          </Text>
        </View>

        {/* Booking Details Card */}
        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Confirmation Code</Text>
            <Text style={styles.detailValue}>{booking.confirmationCode}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Airplane size={20} color={colors.primary} variant="Bold" />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Flight</Text>
              <Text style={styles.detailValue}>
                {booking.airline} • {booking.flightNumber}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Route</Text>
            <Text style={styles.detailValue}>
              {booking.from} → {booking.to}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Calendar size={20} color={colors.primary} variant="Bold" />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Date</Text>
              <Text style={styles.detailValue}>{booking.date}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Clock size={20} color={colors.primary} variant="Bold" />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Departure Time</Text>
              <Text style={styles.detailValue}>{booking.time}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Fixed Footer Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.confirmButton}
          onPress={handleConfirm}
        >
          <Text style={styles.confirmButtonText}>Confirm & Add to Trip</Text>
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
  detailsCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.gray200,
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
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
});
