/**
 * MANUAL HOTEL STEP
 * 
 * Step 3 in manual import flow - User enters hotel details.
 * Collects: Confirmation code, hotel name, check-in date
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { Calendar, InfoCircle } from 'iconsax-react-native';
import { colors, spacing, typography, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { StepComponentProps } from '../../types/import-flow.types';

export default function ManualHotelStep({ onNext }: StepComponentProps) {
  const [confirmationCode, setConfirmationCode] = useState('');
  const [hotelName, setHotelName] = useState('');
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');

  const canContinue = confirmationCode.trim().length >= 6 && hotelName.trim();

  const handleContinue = () => {
    if (canContinue) {
      onNext({
        confirmationCode,
        hotelName,
        dates: checkInDate && checkOutDate ? {
          start: new Date(checkInDate),
          end: new Date(checkOutDate),
        } : undefined,
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
        <Text style={styles.title}>Enter Hotel Details</Text>
      <Text style={styles.description}>
        Provide your hotel reservation information to fetch booking details
      </Text>

      {/* Confirmation Code */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Confirmation Number *</Text>
        <TextInput
          style={styles.input}
          placeholder="HTL123456"
          placeholderTextColor={colors.gray400}
          value={confirmationCode}
          onChangeText={setConfirmationCode}
          autoCapitalize="characters"
          autoCorrect={false}
        />
        <Text style={styles.hint}>Hotel booking confirmation number</Text>
      </View>

      {/* Hotel Name */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Hotel Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="Hilton Garden Inn"
          placeholderTextColor={colors.gray400}
          value={hotelName}
          onChangeText={setHotelName}
          autoCapitalize="words"
          autoCorrect={false}
        />
      </View>

      {/* Check-in Date */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Check-in Date (Optional)</Text>
        <View style={styles.dateInput}>
          <TextInput
            style={styles.dateTextInput}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.gray400}
            value={checkInDate}
            onChangeText={setCheckInDate}
            autoCorrect={false}
          />
          <Calendar size={20} color={colors.primary} variant="Bold" />
        </View>
      </View>

      {/* Check-out Date */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Check-out Date (Optional)</Text>
        <View style={styles.dateInput}>
          <TextInput
            style={styles.dateTextInput}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.gray400}
            value={checkOutDate}
            onChangeText={setCheckOutDate}
            autoCorrect={false}
          />
          <Calendar size={20} color={colors.primary} variant="Bold" />
        </View>
        <Text style={styles.hint}>Helps verify your reservation</Text>
      </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <InfoCircle size={20} color={colors.primary} variant="Bold" />
          <Text style={styles.infoText}>
            Check your booking confirmation email for these details. Most hotels send this immediately after booking.
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
          <Text style={styles.continueButtonText}>Fetch Hotel Details</Text>
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
