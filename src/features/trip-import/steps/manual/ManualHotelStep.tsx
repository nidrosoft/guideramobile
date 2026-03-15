/**
 * MANUAL HOTEL STEP
 * 
 * Step 3 in manual import flow - User enters hotel details.
 * Collects: Confirmation code, hotel name, check-in date
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { Calendar, InfoCircle } from 'iconsax-react-native';
import { spacing, typography, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { StepComponentProps } from '../../types/import-flow.types';

export default function ManualHotelStep({ onNext }: StepComponentProps) {
  const { colors: tc } = useTheme();
  const [hotelName, setHotelName] = useState('');
  const [hotelCity, setHotelCity] = useState('');
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [confirmationCode, setConfirmationCode] = useState('');

  const canContinue = hotelName.trim() && checkInDate.trim() && checkOutDate.trim();

  const handleContinue = () => {
    if (canContinue) {
      onNext({
        hotelName,
        hotelCity: hotelCity || undefined,
        confirmationCode: confirmationCode || undefined,
        dates: {
          start: new Date(checkInDate),
          end: new Date(checkOutDate),
        },
      });
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={[styles.title, { color: tc.textPrimary }]}>Hotel Details</Text>
      <Text style={[styles.description, { color: tc.textSecondary }]}>
        Enter your hotel information. Fields marked * are required.
      </Text>

      {/* Hotel Name */}
      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: tc.textPrimary }]}>Hotel Name *</Text>
        <TextInput
          style={[styles.input, { backgroundColor: tc.bgSunken || tc.bgElevated, borderColor: tc.borderSubtle, color: tc.textPrimary }]}
          placeholder="Hilton Garden Inn"
          placeholderTextColor={tc.textTertiary}
          value={hotelName}
          onChangeText={setHotelName}
          autoCapitalize="words"
          autoCorrect={false}
        />
      </View>

      {/* City / Location */}
      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: tc.textPrimary }]}>City / Location</Text>
        <TextInput
          style={[styles.input, { backgroundColor: tc.bgSunken || tc.bgElevated, borderColor: tc.borderSubtle, color: tc.textPrimary }]}
          placeholder="Tokyo, Japan"
          placeholderTextColor={tc.textTertiary}
          value={hotelCity}
          onChangeText={setHotelCity}
          autoCapitalize="words"
          autoCorrect={false}
        />
      </View>

      {/* Check-in + Check-out row */}
      <View style={styles.row}>
        <View style={[styles.inputGroup, { flex: 1 }]}>
          <Text style={[styles.label, { color: tc.textPrimary }]}>Check-in *</Text>
          <View style={[styles.dateInput, { backgroundColor: tc.bgSunken || tc.bgElevated, borderColor: tc.borderSubtle }]}>
            <TextInput
              style={[styles.dateTextInput, { color: tc.textPrimary }]}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={tc.textTertiary}
              value={checkInDate}
              onChangeText={setCheckInDate}
              autoCorrect={false}
            />
            <Calendar size={18} color={tc.primary} variant="Bold" />
          </View>
        </View>
        <View style={[styles.inputGroup, { flex: 1 }]}>
          <Text style={[styles.label, { color: tc.textPrimary }]}>Check-out *</Text>
          <View style={[styles.dateInput, { backgroundColor: tc.bgSunken || tc.bgElevated, borderColor: tc.borderSubtle }]}>
            <TextInput
              style={[styles.dateTextInput, { color: tc.textPrimary }]}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={tc.textTertiary}
              value={checkOutDate}
              onChangeText={setCheckOutDate}
              autoCorrect={false}
            />
            <Calendar size={18} color={tc.primary} variant="Bold" />
          </View>
        </View>
      </View>

      {/* Confirmation Number (optional) */}
      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: tc.textPrimary }]}>Booking Reference</Text>
        <TextInput
          style={[styles.input, { backgroundColor: tc.bgSunken || tc.bgElevated, borderColor: tc.borderSubtle, color: tc.textPrimary }]}
          placeholder="HTL123456 (optional)"
          placeholderTextColor={tc.textTertiary}
          value={confirmationCode}
          onChangeText={setConfirmationCode}
          autoCapitalize="characters"
          autoCorrect={false}
        />
      </View>

        {/* Info Box */}
        <View style={[styles.infoBox, { backgroundColor: tc.primary + '10' }]}>
          <InfoCircle size={20} color={tc.primary} variant="Bold" />
          <Text style={[styles.infoText, { color: tc.textSecondary }]}>
            Check your booking confirmation email for these details.
          </Text>
        </View>
      </ScrollView>

      {/* Fixed Footer Button */}
      <View style={[styles.footer, { borderTopColor: tc.borderSubtle }]}>
        <TouchableOpacity
          style={[styles.continueButton, { backgroundColor: tc.primary }, !canContinue && { backgroundColor: tc.textTertiary + '40' }]}
          onPress={handleContinue}
          disabled={!canContinue}
        >
          <Text style={styles.continueButtonText}>Add Hotel</Text>
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
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.xs,
  },
  description: {
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    marginBottom: spacing.xl,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.sm,
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: typography.fontSize.base,
    borderWidth: 1,
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderWidth: 1,
  },
  dateTextInput: {
    flex: 1,
    fontSize: typography.fontSize.base,
  },
  hint: {
    fontSize: typography.fontSize.xs,
    marginTop: spacing.xs,
  },
  infoBox: {
    flexDirection: 'row',
    padding: spacing.md,
    borderRadius: 12,
    gap: spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
  },
  footer: {
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    borderTopWidth: 1,
  },
  continueButton: {
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: '#FFFFFF',
  },
});
