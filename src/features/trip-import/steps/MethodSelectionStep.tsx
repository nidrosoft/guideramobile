/**
 * METHOD SELECTION STEP
 * 
 * First step in import flow - user selects how they want to import their trip.
 * Options: Email, Link, Manual Entry, Confirmation Code
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Sms, Link2, DocumentText, Scan } from 'iconsax-react-native';
import { colors, spacing, typography } from '@/styles';
import { StepComponentProps } from '../types/import-flow.types';
import OptionCard from '../components/shared/OptionCard';

export default function MethodSelectionStep({ onNext }: StepComponentProps) {
  return (
    <ScrollView 
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.content}
    >
      <Text style={styles.title}>How would you like to import?</Text>
      <Text style={styles.description}>
        Choose the method that works best for you. We'll guide you through the process.
      </Text>

      <View style={styles.options}>
        <OptionCard
          icon={<Sms size={20} color={colors.primary} variant="Bold" />}
          iconBackground={colors.white}
          title="Import via Email"
          description="Forward your booking confirmation emails to your unique Guidera email"
          onPress={() => onNext({}, 'email')}
        />

        <OptionCard
          icon={<Link2 size={20} color="#3B82F6" variant="Bold" />}
          iconBackground={colors.white}
          title="Link Travel Accounts"
          description="Connect your Expedia, Booking.com, or other travel accounts to sync your bookings."
          onPress={() => onNext({}, 'link')}
        />

        <OptionCard
          icon={<DocumentText size={20} color="#10B981" variant="Bold" />}
          iconBackground={colors.white}
          title="Enter Manually"
          description="Add your travel details manually. Start typing and we'll suggest common options."
          onPress={() => onNext({}, 'manual')}
        />

        <OptionCard
          icon={<Scan size={20} color="#F59E0B" variant="Bold" />}
          iconBackground={colors.white}
          title="Scan Your Ticket"
          description="Scan your flight ticket, hotel voucher, or booking QR code to automatically fetch details"
          onPress={() => onNext({}, 'scan')}
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
    gap: 0, // Gap is handled by OptionCard marginBottom
  },
});
