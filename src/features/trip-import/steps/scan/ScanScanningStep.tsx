/**
 * SCAN SCANNING STEP
 * 
 * Step 3 in scan import flow - Processing scanned data.
 * Shows loading state while extracting booking information.
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { colors, spacing, typography } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { StepComponentProps } from '../../types/import-flow.types';

export default function ScanScanningStep({ onNext, data }: StepComponentProps) {
  useEffect(() => {
    // Simulate processing
    const timer = setTimeout(() => {
      // Mock booking data based on scanned type
      const mockBooking = {
        type: data.scannedData?.type || 'flight',
        confirmationCode: data.scannedData?.code || 'ABC123',
        airline: 'American Airlines',
        flightNumber: 'AA1234',
        from: 'Los Angeles (LAX)',
        to: 'New York (JFK)',
        date: '2024-12-25',
        time: '10:30 AM',
      };
      
      onNext({ scannedBooking: mockBooking });
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.title}>Processing Your Ticket</Text>
        <Text style={styles.description}>
          Extracting booking details from your scanned document...
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginTop: spacing.xl,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  description: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
