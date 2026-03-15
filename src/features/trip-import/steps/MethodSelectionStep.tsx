/**
 * METHOD SELECTION STEP
 * 
 * First step in import flow - user selects how they want to import their trip.
 * Options: Email, Manual Entry, Scan Ticket
 * (Link Travel Accounts removed — email import captures all OTA bookings)
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Sms, DocumentText, Scan } from 'iconsax-react-native';
import { spacing, typography } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { StepComponentProps } from '../types/import-flow.types';
import OptionCard from '../components/shared/OptionCard';

export default function MethodSelectionStep({ onNext }: StepComponentProps) {
  const { colors: tc } = useTheme();

  return (
    <ScrollView 
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.content}
    >
      <Text style={[styles.title, { color: tc.textPrimary }]}>How would you like to import?</Text>
      <Text style={[styles.description, { color: tc.textSecondary }]}>
        Choose the method that works best for you. We'll guide you through the process.
      </Text>

      <View style={styles.options}>
        <OptionCard
          icon={<Scan size={22} color={tc.primary} variant="Bold" />}
          iconBackground={tc.primary + '12'}
          title="Scan or Upload Ticket"
          description="Take a photo or upload a screenshot of your boarding pass, hotel voucher, or booking confirmation."
          onPress={() => onNext({}, 'scan')}
        />

        <OptionCard
          icon={<Sms size={22} color={tc.info} variant="Bold" />}
          iconBackground={tc.info + '12'}
          title="Import via Email"
          description="Connect your email to automatically find and import all your travel bookings."
          onPress={() => onNext({}, 'email')}
        />

        <OptionCard
          icon={<DocumentText size={22} color="#F59E0B" variant="Bold" />}
          iconBackground={'#F59E0B12'}
          title="Enter Manually"
          description="Add your flight, hotel, or car rental details by hand. Great when you have all the info ready."
          onPress={() => onNext({}, 'manual')}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.xs,
  },
  description: {
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  options: {
    gap: spacing.md,
  },
});
