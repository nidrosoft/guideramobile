/**
 * EMAIL PROVIDER STEP
 * 
 * Step 3 in email import flow - User selects their email provider.
 * Options: Gmail, Outlook, Yahoo, Other Provider
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors, spacing, typography } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { StepComponentProps } from '../../types/import-flow.types';
import OptionCard from '../../components/shared/OptionCard';

export default function EmailProviderStep({ onNext }: StepComponentProps) {
  return (
    <ScrollView 
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.content}
    >
      <Text style={styles.title}>Select Email Provider</Text>
      <Text style={styles.description}>
        Choose your email provider to connect your account
      </Text>

      <View style={styles.options}>
        <OptionCard
          icon={
            <Text style={styles.providerIcon}>G</Text>
          }
          iconBackground="#EA4335"
          title="Gmail"
          description="Connect your Google account to import bookings from Gmail"
          onPress={() => onNext({ emailProvider: 'gmail' })}
        />

        <OptionCard
          icon={
            <Text style={styles.providerIcon}>O</Text>
          }
          iconBackground="#0078D4"
          title="Outlook"
          description="Connect your Microsoft account to import bookings from Outlook"
          onPress={() => onNext({ emailProvider: 'outlook' })}
        />

        <OptionCard
          icon={
            <Text style={styles.providerIcon}>Y!</Text>
          }
          iconBackground="#6001D2"
          title="Yahoo"
          description="Connect your Yahoo account to import bookings from Yahoo Mail"
          onPress={() => onNext({ emailProvider: 'yahoo' })}
        />

        <OptionCard
          icon={
            <Text style={styles.providerIcon}>@</Text>
          }
          iconBackground={colors.gray600}
          title="Other Provider"
          description="Enter your email credentials manually for other providers"
          onPress={() => onNext({ emailProvider: 'other' })}
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
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  description: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.xl,
  },
  options: {
    gap: 0, // Gap handled by OptionCard marginBottom
  },
  providerIcon: {
    fontSize: 24,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
});
