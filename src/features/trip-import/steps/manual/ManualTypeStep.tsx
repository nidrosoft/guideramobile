/**
 * MANUAL TYPE STEP
 * 
 * Step 2 in manual import flow - User selects booking type.
 * Options: Flight, Hotel, Car Rental, Activity
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Airplane, Building, Car, TicketStar } from 'iconsax-react-native';
import { spacing, typography } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { StepComponentProps } from '../../types/import-flow.types';
import OptionCard from '../../components/shared/OptionCard';

export default function ManualTypeStep({ onNext }: StepComponentProps) {
  const { colors: tc } = useTheme();

  return (
    <ScrollView 
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.content}
    >
      <Text style={[styles.title, { color: tc.textPrimary }]}>What would you like to add?</Text>
      <Text style={[styles.description, { color: tc.textSecondary }]}>
        Select the type of booking you want to enter manually.
      </Text>

      <View style={styles.options}>
        <OptionCard
          icon={<Airplane size={22} color={tc.primary} variant="Bold" />}
          iconBackground={tc.primary + '12'}
          title="Flight"
          description="Enter flight details like confirmation code, airline, and flight number."
          onPress={() => onNext({ manualType: 'flight' })}
        />

        <OptionCard
          icon={<Building size={22} color={tc.success} variant="Bold" />}
          iconBackground={tc.success + '12'}
          title="Hotel"
          description="Add hotel reservation with confirmation number and check-in details."
          onPress={() => onNext({ manualType: 'hotel' })}
        />

        <OptionCard
          icon={<Car size={22} color="#F59E0B" variant="Bold" />}
          iconBackground={'#F59E0B12'}
          title="Car Rental"
          description="Enter car rental confirmation and pickup information."
          onPress={() => onNext({ manualType: 'car' })}
        />

        <OptionCard
          icon={<TicketStar size={22} color={tc.purple || '#8B5CF6'} variant="Bold" />}
          iconBackground={(tc.purple || '#8B5CF6') + '12'}
          title="Activity"
          description="Add tours, experiences, or other activities to your trip."
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
