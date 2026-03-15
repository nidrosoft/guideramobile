/**
 * MANUAL CAR STEP
 * 
 * Step 3 in manual import flow - User enters car rental details.
 * Collects: Confirmation code, car company, pickup date
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { Calendar, InfoCircle } from 'iconsax-react-native';
import { spacing, typography, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { StepComponentProps } from '../../types/import-flow.types';

export default function ManualCarStep({ onNext }: StepComponentProps) {
  const { colors: tc } = useTheme();
  const [carCompany, setCarCompany] = useState('');
  const [pickupLocation, setPickupLocation] = useState('');
  const [pickupDate, setPickupDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [confirmationCode, setConfirmationCode] = useState('');

  const canContinue = carCompany.trim() && pickupDate.trim() && returnDate.trim();

  const handleContinue = () => {
    if (canContinue) {
      onNext({
        carCompany,
        pickupLocation: pickupLocation || undefined,
        confirmationCode: confirmationCode || undefined,
        dates: {
          start: new Date(pickupDate),
          end: new Date(returnDate),
        },
      });
    }
  };

  const inputStyle = [styles.input, { backgroundColor: tc.bgSunken || tc.bgElevated, borderColor: tc.borderSubtle, color: tc.textPrimary }];

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
      <Text style={[styles.title, { color: tc.textPrimary }]}>Car Rental Details</Text>
      <Text style={[styles.description, { color: tc.textSecondary }]}>
        Enter your car rental information. Fields marked * are required.
      </Text>

      {/* Rental Company */}
      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: tc.textPrimary }]}>Rental Company *</Text>
        <TextInput
          style={inputStyle}
          placeholder="Hertz, Enterprise, etc."
          placeholderTextColor={tc.textTertiary}
          value={carCompany}
          onChangeText={setCarCompany}
          autoCapitalize="words"
          autoCorrect={false}
        />
      </View>

      {/* Pickup Location */}
      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: tc.textPrimary }]}>Pickup Location</Text>
        <TextInput
          style={inputStyle}
          placeholder="LAX Airport, Tokyo Station, etc."
          placeholderTextColor={tc.textTertiary}
          value={pickupLocation}
          onChangeText={setPickupLocation}
          autoCapitalize="words"
          autoCorrect={false}
        />
      </View>

      {/* Pickup + Return dates */}
      <View style={styles.row}>
        <View style={[styles.inputGroup, { flex: 1 }]}>
          <Text style={[styles.label, { color: tc.textPrimary }]}>Pickup Date *</Text>
          <View style={[styles.dateInput, { backgroundColor: tc.bgSunken || tc.bgElevated, borderColor: tc.borderSubtle }]}>
            <TextInput
              style={[styles.dateTextInput, { color: tc.textPrimary }]}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={tc.textTertiary}
              value={pickupDate}
              onChangeText={setPickupDate}
              autoCorrect={false}
            />
            <Calendar size={18} color={tc.primary} variant="Bold" />
          </View>
        </View>
        <View style={[styles.inputGroup, { flex: 1 }]}>
          <Text style={[styles.label, { color: tc.textPrimary }]}>Return Date *</Text>
          <View style={[styles.dateInput, { backgroundColor: tc.bgSunken || tc.bgElevated, borderColor: tc.borderSubtle }]}>
            <TextInput
              style={[styles.dateTextInput, { color: tc.textPrimary }]}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={tc.textTertiary}
              value={returnDate}
              onChangeText={setReturnDate}
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
          style={inputStyle}
          placeholder="CAR123456 (optional)"
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
          You can find these details in your rental confirmation email or on the company's website.
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
          <Text style={styles.continueButtonText}>Add Car Rental</Text>
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
