/**
 * MANUAL RESULT STEP
 * 
 * Step 5 in manual import flow - Display fetched booking details.
 * User can review and confirm the booking information.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Airplane, Building, Car, Calendar, Location, TickCircle } from 'iconsax-react-native';
import { colors, spacing, typography, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { StepComponentProps } from '../../types/import-flow.types';

// Mock booking data based on type
const getMockBooking = (type: string, data: any) => {
  if (type === 'flight') {
    return {
      icon: Airplane,
      title: `${data.airline || 'Airline'} ${data.flightNumber || 'Flight'}`,
      details: [
        { label: 'Confirmation', value: data.confirmationCode || 'N/A' },
        { label: 'Departure', value: 'San Francisco (SFO)' },
        { label: 'Arrival', value: 'New York (JFK)' },
        { label: 'Date', value: 'Dec 15, 2024 • 10:30 AM' },
        { label: 'Duration', value: '5h 30m' },
      ],
    };
  } else if (type === 'hotel') {
    return {
      icon: Building,
      title: data.hotelName || 'Hotel Reservation',
      details: [
        { label: 'Confirmation', value: data.confirmationCode || 'N/A' },
        { label: 'Location', value: 'Paris, France' },
        { label: 'Check-in', value: 'Dec 15, 2024 • 3:00 PM' },
        { label: 'Check-out', value: 'Dec 20, 2024 • 11:00 AM' },
        { label: 'Nights', value: '5 nights' },
      ],
    };
  } else if (type === 'car') {
    return {
      icon: Car,
      title: `${data.carCompany || 'Car Rental'}`,
      details: [
        { label: 'Confirmation', value: data.confirmationCode || 'N/A' },
        { label: 'Vehicle', value: 'Compact SUV' },
        { label: 'Pickup', value: 'LAX Airport • Dec 15, 2024' },
        { label: 'Return', value: 'LAX Airport • Dec 20, 2024' },
        { label: 'Duration', value: '5 days' },
      ],
    };
  }
  return { icon: Airplane, title: 'Booking', details: [] };
};

export default function ManualResultStep({ onNext, data }: StepComponentProps) {
  const type = data.manualType || 'flight';
  const booking = getMockBooking(type, data);
  const Icon = booking.icon;

  return (
    <ScrollView 
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.content}
    >
      <View style={styles.successBadge}>
        <TickCircle size={24} color={colors.success} variant="Bold" />
        <Text style={styles.successText}>Booking Found!</Text>
      </View>

      <Text style={styles.title}>Review Your Booking</Text>
      <Text style={styles.description}>
        Confirm the details below are correct
      </Text>

      {/* Booking Card */}
      <View style={styles.bookingCard}>
        <View style={styles.bookingHeader}>
          <View style={styles.iconContainer}>
            <Icon size={28} color={colors.primary} variant="Bold" />
          </View>
          <Text style={styles.bookingTitle}>{booking.title}</Text>
        </View>

        <View style={styles.detailsList}>
          {booking.details.map((detail, index) => (
            <View key={index} style={styles.detailRow}>
              <Text style={styles.detailLabel}>{detail.label}</Text>
              <Text style={styles.detailValue}>{detail.value}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Buttons */}
      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={styles.confirmButton}
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
