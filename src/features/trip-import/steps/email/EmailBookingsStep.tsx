/**
 * EMAIL BOOKINGS STEP
 * 
 * Step 7 in email import flow - Display found bookings for selection.
 * User can select which bookings to import.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Airplane, Building, Car, TickCircle } from 'iconsax-react-native';
import { colors, spacing, typography, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { StepComponentProps } from '../../types/import-flow.types';

// Mock booking data
const MOCK_BOOKINGS = [
  {
    id: '1',
    type: 'flight',
    title: 'Flight to Paris',
    details: 'Air France • AF 1234',
    date: 'Dec 15, 2024',
    icon: Airplane,
  },
  {
    id: '2',
    type: 'hotel',
    title: 'Hotel Le Marais',
    details: '3 nights • Paris, France',
    date: 'Dec 15-18, 2024',
    icon: Building,
  },
  {
    id: '3',
    type: 'car',
    title: 'Car Rental',
    details: 'Hertz • Compact SUV',
    date: 'Dec 15-18, 2024',
    icon: Car,
  },
];

export default function EmailBookingsStep({ onNext }: StepComponentProps) {
  const [selectedBookings, setSelectedBookings] = useState<string[]>([]);

  const toggleBooking = (id: string) => {
    setSelectedBookings(prev =>
      prev.includes(id)
        ? prev.filter(bookingId => bookingId !== id)
        : [...prev, id]
    );
  };

  const handleContinue = () => {
    const bookings = MOCK_BOOKINGS.filter(b => selectedBookings.includes(b.id));
    onNext({ selectedBookings: bookings });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Found {MOCK_BOOKINGS.length} Bookings</Text>
      <Text style={styles.description}>
        Select the bookings you'd like to import to your trip
      </Text>

      <ScrollView 
        style={styles.bookingsList}
        showsVerticalScrollIndicator={false}
      >
        {MOCK_BOOKINGS.map((booking) => {
          const isSelected = selectedBookings.includes(booking.id);
          const Icon = booking.icon;
          
          return (
            <TouchableOpacity
              key={booking.id}
              style={[styles.bookingCard, isSelected && styles.bookingCardSelected]}
              onPress={() => toggleBooking(booking.id)}
              activeOpacity={0.7}
            >
              <View style={styles.bookingIcon}>
                <Icon 
                  size={24} 
                  color={isSelected ? colors.primary : colors.textPrimary} 
                  variant="Bold" 
                />
              </View>
              
              <View style={styles.bookingInfo}>
                <Text style={[styles.bookingTitle, isSelected && styles.bookingTitleSelected]}>
                  {booking.title}
                </Text>
                <Text style={styles.bookingDetails}>{booking.details}</Text>
                <Text style={styles.bookingDate}>{booking.date}</Text>
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
          {selectedBookings.length} selected
        </Text>
        <TouchableOpacity
          style={[styles.continueButton, selectedBookings.length === 0 && styles.continueButtonDisabled]}
          onPress={handleContinue}
          disabled={selectedBookings.length === 0}
        >
          <Text style={styles.continueButtonText}>
            Import {selectedBookings.length > 0 ? `(${selectedBookings.length})` : 'Bookings'}
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
  bookingsList: {
    flex: 1,
    marginBottom: spacing.lg,
  },
  bookingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: colors.gray200,
  },
  bookingCardSelected: {
    backgroundColor: '#F5F3FF',
    borderColor: colors.primary,
  },
  bookingIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  bookingInfo: {
    flex: 1,
  },
  bookingTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  bookingTitleSelected: {
    color: colors.primary,
  },
  bookingDetails: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  bookingDate: {
    fontSize: typography.fontSize.xs,
    color: colors.gray500,
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
