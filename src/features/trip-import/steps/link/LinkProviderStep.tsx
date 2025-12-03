/**
 * LINK PROVIDER STEP
 * 
 * Step 2 in link import flow - User selects their travel booking platform.
 * Options: Expedia, Booking.com, Airbnb, TripAdvisor
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors, spacing, typography } from '@/styles';
import { StepComponentProps } from '../../types/import-flow.types';
import OptionCard from '../../components/shared/OptionCard';

export default function LinkProviderStep({ onNext }: StepComponentProps) {
  return (
    <ScrollView 
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.content}
    >
      <Text style={styles.title}>Select Travel Platform</Text>
      <Text style={styles.description}>
        Choose your travel booking platform to import your trips
      </Text>

      <View style={styles.options}>
        <OptionCard
          icon={
            <Text style={styles.providerIcon}>E</Text>
          }
          iconBackground="#FFCC00"
          title="Expedia"
          description="Import trips from your Expedia account including flights, hotels, and car rentals"
          onPress={() => onNext({ linkProvider: 'expedia' })}
        />

        <OptionCard
          icon={
            <Text style={styles.providerIcon}>B</Text>
          }
          iconBackground="#003580"
          title="Booking.com"
          description="Connect your Booking.com account to import hotel and accommodation bookings"
          onPress={() => onNext({ linkProvider: 'booking' })}
        />

        <OptionCard
          icon={
            <Text style={styles.providerIcon}>A</Text>
          }
          iconBackground="#FF5A5F"
          title="Airbnb"
          description="Import your Airbnb reservations and experiences automatically"
          onPress={() => onNext({ linkProvider: 'airbnb' })}
        />

        <OptionCard
          icon={
            <Text style={styles.providerIcon}>T</Text>
          }
          iconBackground="#00AF87"
          title="TripAdvisor"
          description="Connect TripAdvisor to import saved trips and bookings"
          onPress={() => onNext({ linkProvider: 'tripadvisor' })}
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
    paddingTop: spacing.xl,
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
