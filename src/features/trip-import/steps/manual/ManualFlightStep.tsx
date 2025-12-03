/**
 * MANUAL FLIGHT STEP
 * 
 * Step 3 in manual import flow - User enters flight details.
 * Collects: Confirmation code, airline, flight number, date
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { Calendar, InfoCircle } from 'iconsax-react-native';
import { colors, spacing, typography, borderRadius } from '@/styles';
import { StepComponentProps } from '../../types/import-flow.types';

export default function ManualFlightStep({ onNext }: StepComponentProps) {
  const [confirmationCode, setConfirmationCode] = useState('');
  const [airline, setAirline] = useState('');
  const [flightNumber, setFlightNumber] = useState('');
  const [date, setDate] = useState('');

  const canContinue = confirmationCode.trim().length >= 6 && airline.trim() && flightNumber.trim();

  const handleContinue = () => {
    if (canContinue) {
      onNext({
        confirmationCode,
        airline,
        flightNumber,
        dates: date ? { start: new Date(date), end: new Date(date) } : undefined,
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
        <Text style={styles.title}>Enter Flight Details</Text>
        <Text style={styles.description}>
          Provide your flight information to fetch booking details
        </Text>

      {/* Confirmation Code */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Confirmation Code *</Text>
        <TextInput
          style={styles.input}
          placeholder="ABC123"
          placeholderTextColor={colors.gray400}
          value={confirmationCode}
          onChangeText={setConfirmationCode}
          autoCapitalize="characters"
          autoCorrect={false}
        />
        <Text style={styles.hint}>6-character booking reference</Text>
      </View>

      {/* Airline */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Airline *</Text>
        <TextInput
          style={styles.input}
          placeholder="American Airlines"
          placeholderTextColor={colors.gray400}
          value={airline}
          onChangeText={setAirline}
          autoCapitalize="words"
          autoCorrect={false}
        />
      </View>

      {/* Flight Number */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Flight Number *</Text>
        <TextInput
          style={styles.input}
          placeholder="AA1234"
          placeholderTextColor={colors.gray400}
          value={flightNumber}
          onChangeText={setFlightNumber}
          autoCapitalize="characters"
          autoCorrect={false}
        />
      </View>

      {/* Flight Date (Optional) */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Flight Date (Optional)</Text>
        <View style={styles.dateInput}>
          <TextInput
            style={styles.dateTextInput}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.gray400}
            value={date}
            onChangeText={setDate}
            autoCorrect={false}
          />
          <Calendar size={20} color={colors.primary} variant="Bold" />
        </View>
        <Text style={styles.hint}>Helps narrow down your booking</Text>
      </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <InfoCircle size={20} color={colors.primary} variant="Bold" />
          <Text style={styles.infoText}>
            You can find these details in your booking confirmation email or on your airline's website.
          </Text>
        </View>
      </ScrollView>

      {/* Fixed Footer Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.continueButton, !canContinue && styles.continueButtonDisabled]}
          onPress={handleContinue}
          disabled={!canContinue}
        >
          <Text style={styles.continueButtonText}>Fetch Flight Details</Text>
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
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  description: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.xl,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.gray50,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray50,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  dateTextInput: {
    flex: 1,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
  hint: {
    fontSize: typography.fontSize.xs,
    color: colors.gray500,
    marginTop: spacing.xs,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: `${colors.primary}10`,
    padding: spacing.md,
    borderRadius: 12,
    gap: spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  footer: {
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
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
