/**
 * MANUAL FLIGHT STEP
 * 
 * Step 3 in manual import flow - User enters flight details.
 * Fields match what the trip card displays: airline, flight number,
 * route (from → to), departure/return dates, cabin class.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { Calendar, InfoCircle } from 'iconsax-react-native';
import { spacing, typography, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { StepComponentProps } from '../../types/import-flow.types';

const CABIN_OPTIONS = ['Economy', 'Premium Economy', 'Business', 'First'];

export default function ManualFlightStep({ onNext }: StepComponentProps) {
  const { colors: tc } = useTheme();
  const [airline, setAirline] = useState('');
  const [flightNumber, setFlightNumber] = useState('');
  const [fromAirport, setFromAirport] = useState('');
  const [toAirport, setToAirport] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [cabinClass, setCabinClass] = useState('Economy');
  const [confirmationCode, setConfirmationCode] = useState('');

  const canContinue = airline.trim() && flightNumber.trim() && departureDate.trim() && returnDate.trim();

  const handleContinue = () => {
    if (canContinue) {
      onNext({
        airline,
        flightNumber,
        fromAirport,
        toAirport,
        cabinClass,
        confirmationCode: confirmationCode || undefined,
        dates: {
          start: new Date(departureDate),
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
        <Text style={[styles.title, { color: tc.textPrimary }]}>Flight Details</Text>
        <Text style={[styles.description, { color: tc.textSecondary }]}>
          Enter your flight information. Fields marked * are required.
        </Text>

        {/* Airline + Flight Number row */}
        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={[styles.label, { color: tc.textPrimary }]}>Airline *</Text>
            <TextInput
              style={inputStyle}
              placeholder="Thai Airways"
              placeholderTextColor={tc.textTertiary}
              value={airline}
              onChangeText={setAirline}
              autoCapitalize="words"
              autoCorrect={false}
            />
          </View>
          <View style={[styles.inputGroup, { width: 120 }]}>
            <Text style={[styles.label, { color: tc.textPrimary }]}>Flight # *</Text>
            <TextInput
              style={inputStyle}
              placeholder="TG0695"
              placeholderTextColor={tc.textTertiary}
              value={flightNumber}
              onChangeText={setFlightNumber}
              autoCapitalize="characters"
              autoCorrect={false}
            />
          </View>
        </View>

        {/* Route: From → To */}
        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={[styles.label, { color: tc.textPrimary }]}>From (Airport Code)</Text>
            <TextInput
              style={inputStyle}
              placeholder="LAX"
              placeholderTextColor={tc.textTertiary}
              value={fromAirport}
              onChangeText={setFromAirport}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={4}
            />
          </View>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={[styles.label, { color: tc.textPrimary }]}>To (Airport Code)</Text>
            <TextInput
              style={inputStyle}
              placeholder="BKK"
              placeholderTextColor={tc.textTertiary}
              value={toAirport}
              onChangeText={setToAirport}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={4}
            />
          </View>
        </View>

        {/* Departure + Return dates */}
        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={[styles.label, { color: tc.textPrimary }]}>Departure *</Text>
            <View style={[styles.dateInput, { backgroundColor: tc.bgSunken || tc.bgElevated, borderColor: tc.borderSubtle }]}>
              <TextInput
                style={[styles.dateTextInput, { color: tc.textPrimary }]}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={tc.textTertiary}
                value={departureDate}
                onChangeText={setDepartureDate}
                autoCorrect={false}
              />
              <Calendar size={18} color={tc.primary} variant="Bold" />
            </View>
          </View>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={[styles.label, { color: tc.textPrimary }]}>Return *</Text>
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

        {/* Cabin Class */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: tc.textPrimary }]}>Cabin Class</Text>
          <View style={styles.cabinRow}>
            {CABIN_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[
                  styles.cabinPill,
                  { backgroundColor: tc.bgSunken || tc.bgElevated, borderColor: tc.borderSubtle },
                  cabinClass === opt && { backgroundColor: tc.primary + '15', borderColor: tc.primary },
                ]}
                onPress={() => setCabinClass(opt)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.cabinText,
                  { color: tc.textSecondary },
                  cabinClass === opt && { color: tc.primary, fontWeight: '700' },
                ]}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Confirmation Code (optional) */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: tc.textPrimary }]}>Booking Reference</Text>
          <TextInput
            style={inputStyle}
            placeholder="ABC123 (optional)"
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
            You can find these details in your booking confirmation email or on your airline's website.
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
          <Text style={styles.continueButtonText}>Add Flight</Text>
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
  cabinRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  cabinPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  cabinText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '500',
  },
});
