/**
 * MANUAL RESULT STEP
 * 
 * Step 5 in manual import flow - Display processed booking details.
 * User reviews the real data they entered and confirms to create the trip.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Airplane, Building, Car, TickCircle, TicketStar } from 'iconsax-react-native';
import { colors, spacing, typography, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { StepComponentProps } from '../../types/import-flow.types';

const TYPE_ICONS: Record<string, any> = {
  flight: Airplane,
  hotel: Building,
  car: Car,
  activity: TicketStar,
};

export default function ManualResultStep({ onNext, data }: StepComponentProps) {
  const { colors: tc } = useTheme();
  const type = data.manualType || 'flight';
  const booking = data.confirmedBooking || { title: 'Booking', details: [] };
  const Icon = TYPE_ICONS[type] || Airplane;

  return (
    <ScrollView 
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.content}
    >
      <View style={styles.successBadge}>
        <TickCircle size={24} color={tc.success} variant="Bold" />
        <Text style={[styles.successText, { color: tc.success }]}>Details Ready</Text>
      </View>

      <Text style={[styles.title, { color: tc.textPrimary }]}>Review Your Booking</Text>
      <Text style={[styles.description, { color: tc.textSecondary }]}>
        Confirm the details below are correct
      </Text>

      {/* Booking Card */}
      <View style={[styles.bookingCard, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle }]}>
        <View style={[styles.bookingHeader, { borderBottomColor: tc.borderSubtle }]}>
          <View style={[styles.iconContainer, { backgroundColor: tc.primary + '15' }]}>
            <Icon size={28} color={tc.primary} variant="Bold" />
          </View>
          <Text style={[styles.bookingTitle, { color: tc.textPrimary }]}>{booking.title}</Text>
        </View>

        <View style={styles.detailsList}>
          {booking.details.map((detail: { label: string; value: string }, index: number) => (
            <View key={index} style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: tc.textSecondary }]}>{detail.label}</Text>
              <Text style={[styles.detailValue, { color: tc.textPrimary }]}>{detail.value}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Buttons */}
      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={[styles.confirmButton, { backgroundColor: tc.primary }]}
          onPress={() => onNext({ confirmedBooking: booking })}
        >
          <Text style={styles.confirmButtonText}>Add to Trip</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
  },
  successBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  successText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.success,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  description: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.xl,
  },
  bookingCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.gray200,
    marginBottom: spacing.xl,
  },
  bookingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: `${colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  bookingTitle: {
    flex: 1,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  detailsList: {
    gap: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },
  detailValue: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.semibold,
    textAlign: 'right',
    flex: 1,
    marginLeft: spacing.md,
  },
  buttonsContainer: {
    gap: spacing.md,
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
