/**
 * MANUAL TYPE STEP
 * 
 * Step 2 in manual import flow - User selects booking type.
 * Options: Flight, Hotel, Car Rental, Activity
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Airplane, Building, Car, TicketStar } from 'iconsax-react-native';
import { colors, spacing, typography } from '@/styles';
import { StepComponentProps } from '../../types/import-flow.types';
import OptionCard from '../../components/shared/OptionCard';

export default function ManualTypeStep({ onNext }: StepComponentProps) {
  return (
    <ScrollView 
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.content}
    >
      <Text style={styles.title}>What would you like to add?</Text>
      <Text style={styles.description}>
        Select the type of booking you want to enter manually
      </Text>

      <View style={styles.options}>
        <OptionCard
          icon={<Airplane size={28} color={colors.white} variant="Bold" />}
          iconBackground="#4A90E2"
          title="Flight"
          description="Enter flight details like confirmation code, airline, and flight number"
          onPress={() => onNext({ manualType: 'flight' })}
        />

        <OptionCard
          icon={<Building size={28} color={colors.white} variant="Bold" />}
          iconBackground="#E94B3C"
          title="Hotel"
          description="Add hotel reservation with confirmation number and check-in details"
          onPress={() => onNext({ manualType: 'hotel' })}
        />

        <OptionCard
          icon={<Car size={28} color={colors.white} variant="Bold" />}
          iconBackground="#F5A623"
          title="Car Rental"
          description="Enter car rental confirmation and pickup information"
          onPress={() => onNext({ manualType: 'car' })}
        />

        <OptionCard
          icon={<TicketStar size={28} color={colors.white} variant="Bold" />}
          iconBackground="#7B61FF"
          title="Activity"
          description="Add tours, experiences, or other activities to your trip"
          onPress={() => onNext({ manualType: 'activity' })}
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
});
